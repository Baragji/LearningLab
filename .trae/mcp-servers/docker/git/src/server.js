#!/usr/bin/env node

/**
 * Git MCP Server for LearningLab
 * Provides secure Git operations and repository management
 */

const express = require('express');
const cors = require('cors');
const { simpleGit } = require('simple-git');
const path = require('path');
const fs = require('fs-extra');
const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: '/logs/git-mcp.log' })
  ]
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Git configuration
const GIT_REPO_PATH = process.env.GIT_REPO_PATH || '/workspace';
const git = simpleGit(GIT_REPO_PATH);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'git-mcp',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Git status endpoint
app.get('/api/git/status', async (req, res) => {
  try {
    const status = await git.status();
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error('Git status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Git log endpoint
app.get('/api/git/log', async (req, res) => {
  try {
    const { maxCount = 10 } = req.query;
    const log = await git.log({ maxCount: parseInt(maxCount) });
    res.json({ success: true, data: log });
  } catch (error) {
    logger.error('Git log error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Git diff endpoint
app.get('/api/git/diff', async (req, res) => {
  try {
    const { file, staged } = req.query;
    let diff;
    
    if (staged === 'true') {
      diff = await git.diff(['--cached', file].filter(Boolean));
    } else {
      diff = await git.diff([file].filter(Boolean));
    }
    
    res.json({ success: true, data: diff });
  } catch (error) {
    logger.error('Git diff error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Git branches endpoint
app.get('/api/git/branches', async (req, res) => {
  try {
    const branches = await git.branch();
    res.json({ success: true, data: branches });
  } catch (error) {
    logger.error('Git branches error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Git add endpoint
app.post('/api/git/add', async (req, res) => {
  try {
    const { files } = req.body;
    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ success: false, error: 'Files array is required' });
    }
    
    await git.add(files);
    res.json({ success: true, message: 'Files added successfully' });
  } catch (error) {
    logger.error('Git add error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Git commit endpoint
app.post('/api/git/commit', async (req, res) => {
  try {
    const { message, author } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'Commit message is required' });
    }
    
    const options = { '--message': message };
    if (author) {
      options['--author'] = author;
    }
    
    const result = await git.commit(message, options);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Git commit error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Git MCP Server running on port ${PORT}`);
  logger.info(`Repository path: ${GIT_REPO_PATH}`);
  console.log(`🚀 Git MCP Server started on http://0.0.0.0:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});