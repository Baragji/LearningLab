#!/usr/bin/env node

/**
 * This script finds all usages of specified UI components in the codebase.
 * It helps identify where components need to be migrated.
 * 
 * Usage:
 *   node scripts/find-component-usage.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Components to search for
const componentsToFind = [
  {
    name: 'Button (packages/ui)',
    importPattern: "import .*\\{ Button \\}.*from ['|\"]@learninglab/ui['|\"]",
    usagePattern: "<Button[\\s>]"
  },
  {
    name: 'AppButton (apps/web)',
    importPattern: "import .*\\{ AppButton \\}.*from ['|\"]@/components/ui/AppButton['|\"]",
    usagePattern: "<AppButton[\\s>]"
  },
  {
    name: 'Input (apps/web)',
    importPattern: "import .*\\{ Input \\}.*from ['|\"]@/components/ui/input['|\"]",
    usagePattern: "<Input[\\s>]"
  },
  {
    name: 'Checkbox (apps/web)',
    importPattern: "import .*\\{ Checkbox \\}.*from ['|\"]@/components/ui/checkbox['|\"]",
    usagePattern: "<Checkbox[\\s>]"
  },
  {
    name: 'Select (apps/web)',
    importPattern: "import .*\\{ Select[^}]*\\}.*from ['|\"]@/components/ui/select['|\"]",
    usagePattern: "<Select[\\s>]"
  }
];

// Directories to search
const searchDirs = [
  'apps/web/src',
  'apps/web/pages',
  'apps/web/app',
];

// Function to search for a pattern in files
function searchPattern(pattern, directory) {
  try {
    const result = execSync(`grep -r "${pattern}" ${directory} --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js"`, { encoding: 'utf8' });
    return result.trim().split('\n').filter(line => line);
  } catch (error) {
    // grep returns exit code 1 if no matches found
    if (error.status === 1) {
      return [];
    }
    console.error(`Error searching for pattern: ${error.message}`);
    return [];
  }
}

// Main function
function findComponentUsage() {
  console.log('Searching for UI component usage...\n');

  componentsToFind.forEach(component => {
    console.log(`\n=== ${component.name} ===`);
    
    // Find imports
    console.log('\nImports:');
    let totalImports = 0;
    
    searchDirs.forEach(dir => {
      const imports = searchPattern(component.importPattern, dir);
      if (imports.length > 0) {
        console.log(`\n  In ${dir}:`);
        imports.forEach(line => console.log(`    ${line}`));
        totalImports += imports.length;
      }
    });
    
    if (totalImports === 0) {
      console.log('  No imports found.');
    } else {
      console.log(`\n  Total imports: ${totalImports}`);
    }
    
    // Find usages
    console.log('\nUsages:');
    let totalUsages = 0;
    
    searchDirs.forEach(dir => {
      const usages = searchPattern(component.usagePattern, dir);
      if (usages.length > 0) {
        console.log(`\n  In ${dir}:`);
        usages.forEach(line => console.log(`    ${line}`));
        totalUsages += usages.length;
      }
    });
    
    if (totalUsages === 0) {
      console.log('  No usages found.');
    } else {
      console.log(`\n  Total usages: ${totalUsages}`);
    }
  });

  console.log('\n=== Summary ===');
  componentsToFind.forEach(component => {
    let totalImports = 0;
    let totalUsages = 0;
    
    searchDirs.forEach(dir => {
      totalImports += searchPattern(component.importPattern, dir).length;
      totalUsages += searchPattern(component.usagePattern, dir).length;
    });
    
    console.log(`${component.name}: ${totalImports} imports, ${totalUsages} usages`);
  });
}

// Run the main function
findComponentUsage();