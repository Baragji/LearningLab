#!/usr/bin/env node

/**
 * Node.js Sandbox MCP Server for LearningLab
 * Provides secure JavaScript/Node.js code execution environment
 */

const express = require('express');
const cors = require('cors');
const { VM } = require('vm2');
const fs = require('fs-extra');
const path = require('path');
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
    new winston.transports.File({ filename: '/logs/nodejs-sandbox.log' })
  ]
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8004;

// Configuration
const SANDBOX_TIMEOUT = parseInt(process.env.SANDBOX_TIMEOUT) || 30000; // 30 seconds
const MAX_MEMORY = process.env.MAX_MEMORY || '512m';
const ALLOWED_PACKAGES = (process.env.ALLOWED_PACKAGES || '').split(',').filter(Boolean);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'nodejs-sandbox',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    node_version: process.version
  });
});

// Code execution endpoint
app.post('/api/execute', async (req, res) => {
  try {
    const { code, timeout = SANDBOX_TIMEOUT, language = 'javascript', context = {} } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Code is required'
      });
    }
    
    logger.info(`Executing JavaScript code: ${code.substring(0, 100)}...`);
    
    // Basic security checks
    const forbiddenPatterns = [
      /require\s*\(/,
      /import\s+/,
      /process\./,
      /global\./,
      /Buffer\./,
      /fs\./,
      /child_process/,
      /cluster/,
      /worker_threads/,
      /eval\s*\(/,
      /Function\s*\(/,
      /setTimeout/,
      /setInterval/,
      /setImmediate/
    ];
    
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(code)) {
        return res.status(400).json({
          success: false,
          error: `Forbidden operation detected: ${pattern.source}`
        });
      }
    }
    
    // Create VM2 sandbox
    const vm = new VM({
      timeout: Math.min(timeout, SANDBOX_TIMEOUT),
      sandbox: {
        console: {
          log: (...args) => {
            output.push(args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
          },
          error: (...args) => {
            errors.push(args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
          },
          warn: (...args) => {
            output.push('WARN: ' + args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
          }
        },
        Math: Math,
        Date: Date,
        JSON: JSON,
        Array: Array,
        Object: Object,
        String: String,
        Number: Number,
        Boolean: Boolean,
        RegExp: RegExp,
        Error: Error,
        TypeError: TypeError,
        ReferenceError: ReferenceError,
        SyntaxError: SyntaxError,
        ...context
      },
      eval: false,
      wasm: false,
      fixAsync: true
    });
    
    const output = [];
    const errors = [];
    const startTime = Date.now();
    
    try {
      // Execute code in sandbox
      const result = vm.run(code);
      const executionTime = Date.now() - startTime;
      
      res.json({
        success: true,
        result: result,
        output: output,
        error: errors.length > 0 ? errors.join('\n') : null,
        execution_time: `${executionTime}ms`,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('Code execution error:', error);
      
      res.json({
        success: false,
        result: null,
        output: output,
        error: error.message,
        execution_time: `${executionTime}ms`,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    logger.error('Unexpected error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Package information endpoint
app.get('/api/packages', (req, res) => {
  const availablePackages = [
    { name: 'lodash', available: false, description: 'Utility library' },
    { name: 'moment', available: false, description: 'Date manipulation' },
    { name: 'axios', available: false, description: 'HTTP client' },
    { name: 'express', available: false, description: 'Web framework' },
    { name: 'cheerio', available: false, description: 'Server-side jQuery' }
  ];
  
  // Check which packages are actually available
  availablePackages.forEach(pkg => {
    try {
      require.resolve(pkg.name);
      pkg.available = true;
    } catch (e) {
      pkg.available = false;
    }
  });
  
  res.json({
    success: true,
    packages: availablePackages,
    node_version: process.version,
    timestamp: new Date().toISOString()
  });
});

// Sandbox information endpoint
app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    config: {
      timeout: SANDBOX_TIMEOUT,
      max_memory: MAX_MEMORY,
      allowed_packages: ALLOWED_PACKAGES,
      node_version: process.version,
      platform: process.platform
    },
    limits: {
      max_execution_time: `${SANDBOX_TIMEOUT}ms`,
      memory_limit: MAX_MEMORY,
      network_access: false,
      file_system_access: false,
      require_access: false
    },
    features: {
      vm2_sandbox: true,
      console_output: true,
      error_handling: true,
      timeout_protection: true
    },
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for basic functionality
app.post('/api/test', (req, res) => {
  const testCases = [
    {
      name: 'Basic arithmetic',
      code: '2 + 2',
      expected: 4
    },
    {
      name: 'String manipulation',
      code: '"Hello".toUpperCase() + " World"',
      expected: 'HELLO World'
    },
    {
      name: 'Array operations',
      code: '[1, 2, 3].map(x => x * 2)',
      expected: [2, 4, 6]
    },
    {
      name: 'Object creation',
      code: 'JSON.stringify({name: "test", value: 42})',
      expected: '{"name":"test","value":42}'
    }
  ];
  
  const results = [];
  
  testCases.forEach(testCase => {
    try {
      const vm = new VM({ timeout: 5000 });
      const result = vm.run(testCase.code);
      
      results.push({
        name: testCase.name,
        success: JSON.stringify(result) === JSON.stringify(testCase.expected),
        result: result,
        expected: testCase.expected
      });
    } catch (error) {
      results.push({
        name: testCase.name,
        success: false,
        error: error.message,
        expected: testCase.expected
      });
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  
  res.json({
    success: true,
    test_results: results,
    summary: {
      total: testCases.length,
      passed: successCount,
      failed: testCases.length - successCount
    },
    timestamp: new Date().toISOString()
  });
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
  logger.info(`Node.js Sandbox MCP Server running on port ${PORT}`);
  logger.info(`Timeout: ${SANDBOX_TIMEOUT}ms, Memory: ${MAX_MEMORY}`);
  console.log(`🚀 Node.js Sandbox MCP Server started on http://0.0.0.0:${PORT}`);
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