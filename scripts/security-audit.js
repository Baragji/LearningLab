#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Running security audit across all workspaces...\n');

const workspaces = [
  { name: 'Root', path: '.' },
  { name: 'API', path: 'apps/api' },
  { name: 'Web', path: 'apps/web' },
  { name: 'UI Package', path: 'packages/ui' },
  { name: 'Config Package', path: 'packages/config' },
  { name: 'Core Package', path: 'packages/core' },
];

const vulnerabilities = [];

// Function to run yarn audit in a directory
function runAudit(workspace) {
  console.log(`\n📦 Auditing ${workspace.name}...`);
  
  try {
    const result = execSync('yarn audit --json', {
      cwd: path.join(__dirname, '..', workspace.path),
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    // Parse JSON output line by line
    const lines = result.split('\n').filter(line => line.trim());
    let hasVulnerabilities = false;
    
    lines.forEach(line => {
      try {
        const data = JSON.parse(line);
        if (data.type === 'auditAdvisory') {
          hasVulnerabilities = true;
          vulnerabilities.push({
            workspace: workspace.name,
            advisory: data.data.advisory
          });
        }
      } catch (e) {
        // Ignore non-JSON lines
      }
    });
    
    if (!hasVulnerabilities) {
      console.log(`✅ No vulnerabilities found in ${workspace.name}`);
    }
  } catch (error) {
    // yarn audit exits with non-zero code if vulnerabilities are found
    if (error.status === 1) {
      console.log(`⚠️  Vulnerabilities found in ${workspace.name}`);
    } else {
      console.error(`❌ Error auditing ${workspace.name}:`, error.message);
    }
  }
}

// Function to update dependencies
function updateDependencies(workspace) {
  console.log(`\n🔄 Updating dependencies in ${workspace.name}...`);
  
  try {
    // Update dependencies interactively
    execSync('yarn upgrade-interactive --latest', {
      cwd: path.join(__dirname, '..', workspace.path),
      stdio: 'inherit'
    });
  } catch (error) {
    console.error(`❌ Error updating ${workspace.name}:`, error.message);
  }
}

// Main execution
async function main() {
  // First, run audit on all workspaces
  workspaces.forEach(runAudit);
  
  // Summary
  console.log('\n📊 Audit Summary:');
  console.log(`Total vulnerabilities found: ${vulnerabilities.length}`);
  
  if (vulnerabilities.length > 0) {
    console.log('\n🚨 Vulnerabilities by severity:');
    const bySeverity = vulnerabilities.reduce((acc, vuln) => {
      const severity = vuln.advisory.severity;
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(bySeverity).forEach(([severity, count]) => {
      console.log(`  ${severity}: ${count}`);
    });
    
    console.log('\n📝 Detailed vulnerability report saved to: security-audit-report.json');
    fs.writeFileSync(
      path.join(__dirname, '..', 'security-audit-report.json'),
      JSON.stringify(vulnerabilities, null, 2)
    );
    
    console.log('\n🔧 To fix vulnerabilities, run this script with --fix flag');
    console.log('   node scripts/security-audit.js --fix');
  }
  
  // If --fix flag is provided, update dependencies
  if (process.argv.includes('--fix')) {
    console.log('\n🔧 Starting dependency updates...');
    workspaces.forEach(updateDependencies);
    
    console.log('\n✅ Dependency updates complete!');
    console.log('📝 Please run tests to ensure nothing broke:');
    console.log('   yarn test');
  }
}

main().catch(console.error);