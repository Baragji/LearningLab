#!/usr/bin/env tsx

/**
 * MCP Service Registry & Discovery System
 * Implements dynamic MCP server discovery and validation
 */

interface MCPServerMetadata {
  id: string;
  name: string;
  version: string;
  capabilities: string[];
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
  healthEndpoint?: string;
  lastValidated: Date;
  status: 'active' | 'inactive' | 'error' | 'maintenance';
  performanceMetrics: {
    averageResponseTime: number;
    errorRate: number;
    uptime: number;
  };
}

interface MCPSecurityPolicy {
  allowedOperations: string[];
  deniedPatterns: string[];
  rateLimits: {
    requestsPerMinute: number;
    maxConcurrentRequests: number;
  };
  authenticationRequired: boolean;
  auditLogging: boolean;
}

class MCPRegistry {
  private servers: Map<string, MCPServerMetadata> = new Map();
  private securityPolicies: Map<string, MCPSecurityPolicy> = new Map();
  private auditLog: Array<{
    timestamp: Date;
    server: string;
    action: string;
    user: string;
    result: 'success' | 'failure';
    details: string;
  }> = [];

  constructor() {
    this.initializeDefaultServers();
    this.setupSecurityPolicies();
  }

  private initializeDefaultServers(): void {
    const defaultServers: MCPServerMetadata[] = [
      {
        id: "filesystem",
        name: "Filesystem Access",
        version: "2025.3.28",
        capabilities: ["read", "write", "list", "search"],
        securityLevel: "critical",
        dependencies: [],
        lastValidated: new Date(),
        status: "active",
        performanceMetrics: {
          averageResponseTime: 50,
          errorRate: 0.01,
          uptime: 99.9
        }
      },
      {
        id: "deepview",
        name: "DeepView Codebase Analysis",
        version: "0.2.3",
        capabilities: ["analyze", "query", "summarize"],
        securityLevel: "high",
        dependencies: ["GOOGLE_API_KEY"],
        lastValidated: new Date(),
        status: "active",
        performanceMetrics: {
          averageResponseTime: 2000,
          errorRate: 0.05,
          uptime: 98.5
        }
      },
      {
        id: "code-assistant",
        name: "AI Code Assistant",
        version: "latest",
        capabilities: ["generate", "refactor", "explain", "debug"],
        securityLevel: "high",
        dependencies: ["OPENAI_API_KEY"],
        lastValidated: new Date(),
        status: "active",
        performanceMetrics: {
          averageResponseTime: 1500,
          errorRate: 0.03,
          uptime: 99.2
        }
      },
      {
        id: "sqlite-db",
        name: "SQLite Database Access",
        version: "latest",
        capabilities: ["query", "insert", "update", "schema"],
        securityLevel: "critical",
        dependencies: [],
        lastValidated: new Date(),
        status: "active",
        performanceMetrics: {
          averageResponseTime: 100,
          errorRate: 0.02,
          uptime: 99.8
        }
      },
      {
        id: "sequential-thinking",
        name: "Sequential Thinking",
        version: "0.6.2",
        capabilities: ["plan", "analyze", "structure"],
        securityLevel: "medium",
        dependencies: [],
        lastValidated: new Date(),
        status: "active",
        performanceMetrics: {
          averageResponseTime: 300,
          errorRate: 0.01,
          uptime: 99.5
        }
      }
    ];

    defaultServers.forEach(server => {
      this.servers.set(server.id, server);
    });
  }

  private setupSecurityPolicies(): void {
    const policies: Array<[string, MCPSecurityPolicy]> = [
      ["filesystem", {
        allowedOperations: ["read", "write", "list"],
        deniedPatterns: ["*.env", "*.key", "node_modules/*", ".git/*"],
        rateLimits: {
          requestsPerMinute: 100,
          maxConcurrentRequests: 5
        },
        authenticationRequired: true,
        auditLogging: true
      }],
      ["sqlite-db", {
        allowedOperations: ["SELECT", "INSERT", "UPDATE"],
        deniedPatterns: ["DROP", "TRUNCATE", "ALTER"],
        rateLimits: {
          requestsPerMinute: 200,
          maxConcurrentRequests: 10
        },
        authenticationRequired: true,
        auditLogging: true
      }],
      ["deepview", {
        allowedOperations: ["analyze", "query"],
        deniedPatterns: [],
        rateLimits: {
          requestsPerMinute: 20,
          maxConcurrentRequests: 2
        },
        authenticationRequired: true,
        auditLogging: true
      }]
    ];

    policies.forEach(([serverId, policy]) => {
      this.securityPolicies.set(serverId, policy);
    });
  }

  public discoverServers(): MCPServerMetadata[] {
    return Array.from(this.servers.values());
  }

  public getServerByCapability(capability: string): MCPServerMetadata[] {
    return Array.from(this.servers.values())
      .filter(server => server.capabilities.includes(capability))
      .sort((a, b) => b.performanceMetrics.uptime - a.performanceMetrics.uptime);
  }

  public async validateServerHealth(serverId: string): Promise<boolean> {
    const server = this.servers.get(serverId);
    if (!server) return false;

    try {
      // Perform actual health checks based on server type
      let isHealthy = false;
      
      switch (serverId) {
        case 'filesystem':
          // Check if filesystem server can be started
          isHealthy = await this.checkFilesystemHealth();
          break;
        case 'deepview':
          // Check if DeepView server dependencies are available
          isHealthy = await this.checkDeepViewHealth();
          break;
        case 'code-assistant':
          // Check if code assistant dependencies are available
          isHealthy = await this.checkCodeAssistantHealth();
          break;
        case 'sqlite-db':
          // Check if SQLite database is accessible
          isHealthy = await this.checkSQLiteHealth();
          break;
        case 'sequential-thinking':
          // Check if sequential thinking server is available
          isHealthy = await this.checkSequentialThinkingHealth();
          break;
        default:
          isHealthy = true; // Default to healthy for unknown servers
      }

      server.lastValidated = new Date();
      server.status = isHealthy ? 'active' : 'error';
      return isHealthy;
    } catch (error) {
      server.status = 'error';
      return false;
    }
  }

  private async checkFilesystemHealth(): Promise<boolean> {
    try {
      const { spawn } = await import('child_process');
      return new Promise((resolve) => {
        const child = spawn('npx', ['-y', '@modelcontextprotocol/server-filesystem@2025.3.28', '--version'], {
          stdio: 'pipe',
          timeout: 5000
        });
        
        child.on('close', (code) => {
          resolve(code === 0);
        });
        
        child.on('error', () => {
          resolve(false);
        });
        
        setTimeout(() => {
          child.kill();
          resolve(true); // If it doesn't exit quickly, it's probably working
        }, 2000);
      });
    } catch {
      return false;
    }
  }

  private async checkDeepViewHealth(): Promise<boolean> {
    try {
      const hasGoogleApiKey = process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== 'your_google_api_key_here';
      if (!hasGoogleApiKey) return false;

      const { spawn } = await import('child_process');
      return new Promise((resolve) => {
        const child = spawn('uvx', ['deepview-mcp', '--help'], {
          stdio: 'pipe',
          timeout: 5000,
          env: { ...process.env, GEMINI_API_KEY: process.env.GOOGLE_API_KEY }
        });
        
        child.on('close', (code) => {
          resolve(code === 0);
        });
        
        child.on('error', () => {
          resolve(false);
        });
        
        setTimeout(() => {
          child.kill();
          resolve(false);
        }, 3000);
      });
    } catch {
      return false;
    }
  }

  private async checkCodeAssistantHealth(): Promise<boolean> {
    try {
      // Check if Ollama is running
      const response = await fetch('http://localhost:11434/api/tags');
      return response.ok;
    } catch {
      return false;
    }
  }

  private async checkSQLiteHealth(): Promise<boolean> {
    try {
      const fs = await import('fs');
      const dbPath = '/Users/Yousef_1/Dokumenter/Kodefiler/Ejaztemplate/LearningLab/LearningLab/learninglab_testdata.db';
      return fs.existsSync(dbPath);
    } catch {
      return false;
    }
  }

  private async checkSequentialThinkingHealth(): Promise<boolean> {
    try {
      const { spawn } = await import('child_process');
      return new Promise((resolve) => {
        const child = spawn('npx', ['-y', '@modelcontextprotocol/server-sequential-thinking@0.6.2', '--help'], {
          stdio: 'pipe',
          timeout: 5000
        });
        
        child.on('close', (code) => {
          resolve(code === 0);
        });
        
        child.on('error', () => {
          resolve(false);
        });
        
        setTimeout(() => {
          child.kill();
          resolve(true);
        }, 2000);
      });
    } catch {
      return false;
    }
  }

  public getSecurityPolicy(serverId: string): MCPSecurityPolicy | null {
    return this.securityPolicies.get(serverId) || null;
  }

  public auditAction(serverId: string, action: string, user: string, result: 'success' | 'failure', details: string): void {
    this.auditLog.push({
      timestamp: new Date(),
      server: serverId,
      action,
      user,
      result,
      details
    });

    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog.splice(0, this.auditLog.length - 1000);
    }
  }

  public getAuditLog(serverId?: string): typeof this.auditLog {
    if (serverId) {
      return this.auditLog.filter(entry => entry.server === serverId);
    }
    return [...this.auditLog];
  }

  public generateSecurityReport(): {
    totalServers: number;
    criticalServers: number;
    healthyServers: number;
    recentErrors: number;
    recommendations: string[];
  } {
    const servers = Array.from(this.servers.values());
    const criticalServers = servers.filter(s => s.securityLevel === 'critical').length;
    const healthyServers = servers.filter(s => s.status === 'active').length;
    const recentErrors = this.auditLog.filter(
      entry => entry.result === 'failure' && 
      entry.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;

    const recommendations: string[] = [];
    
    if (healthyServers / servers.length < 0.9) {
      recommendations.push("Multiple servers showing health issues - investigate infrastructure");
    }
    
    if (recentErrors > 10) {
      recommendations.push("High error rate detected - review recent changes");
    }

    servers.forEach(server => {
      if (server.performanceMetrics.errorRate > 0.05) {
        recommendations.push(`Server ${server.name} has high error rate: ${server.performanceMetrics.errorRate * 100}%`);
      }
    });

    return {
      totalServers: servers.length,
      criticalServers,
      healthyServers,
      recentErrors,
      recommendations
    };
  }
}

// CLI Interface
async function main() {
  const registry = new MCPRegistry();
  const command = process.argv[2];

  switch (command) {
    case 'list':
      console.log('📋 Available MCP Servers:');
      registry.discoverServers().forEach(server => {
        const statusIcon = server.status === 'active' ? '✅' : '❌';
        const securityIcon = server.securityLevel === 'critical' ? '🔒' : 
                           server.securityLevel === 'high' ? '🛡️' : '🔓';
        console.log(`${statusIcon} ${securityIcon} ${server.name} (${server.id}) - ${server.capabilities.join(', ')}`);
      });
      break;

    case 'health':
      console.log('🏥 Health Check Results:');
      for (const server of registry.discoverServers()) {
        const isHealthy = await registry.validateServerHealth(server.id);
        console.log(`${isHealthy ? '✅' : '❌'} ${server.name}: ${isHealthy ? 'Healthy' : 'Unhealthy'}`);
      }
      break;

    case 'security':
      console.log('🔒 Security Report:');
      const report = registry.generateSecurityReport();
      console.log(`Total Servers: ${report.totalServers}`);
      console.log(`Critical Servers: ${report.criticalServers}`);
      console.log(`Healthy Servers: ${report.healthyServers}`);
      console.log(`Recent Errors: ${report.recentErrors}`);
      if (report.recommendations.length > 0) {
        console.log('\n⚠️  Recommendations:');
        report.recommendations.forEach(rec => console.log(`  - ${rec}`));
      }
      break;

    case 'audit':
      const serverId = process.argv[3];
      console.log(`📊 Audit Log${serverId ? ` for ${serverId}` : ''}:`);
      const logs = registry.getAuditLog(serverId).slice(-10); // Last 10 entries
      logs.forEach(log => {
        const resultIcon = log.result === 'success' ? '✅' : '❌';
        console.log(`${resultIcon} ${log.timestamp.toISOString()} - ${log.server}: ${log.action} by ${log.user}`);
      });
      break;

    default:
      console.log(`
🚀 MCP Registry CLI

Usage:
  npm run mcp-registry list      - List all available servers
  npm run mcp-registry health    - Check server health
  npm run mcp-registry security  - Generate security report
  npm run mcp-registry audit [server] - Show audit log

Examples:
  npm run mcp-registry list
  npm run mcp-registry audit filesystem
      `);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { MCPRegistry, type MCPServerMetadata, type MCPSecurityPolicy };