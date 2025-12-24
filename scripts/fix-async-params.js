#!/usr/bin/env node

/**
 * Script to fix Next.js 14 async params in dynamic route handlers
 * This script updates route handlers to use Promise<{ id: string }> and await params
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all route.ts files with dynamic segments
function findDynamicRoutes(dir) {
  const routes = [];
  
  function walkDir(currentPath) {
    const files = fs.readdirSync(currentPath);
    
    for (const file of files) {
      const fullPath = path.join(currentPath, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Check if directory name contains [id] or [slug] pattern
        if (file.includes('[') && file.includes(']')) {
          const routeFile = path.join(fullPath, 'route.ts');
          if (fs.existsSync(routeFile)) {
            routes.push(routeFile);
          }
        } else {
          walkDir(fullPath);
        }
      }
    }
  }
  
  walkDir(dir);
  return routes;
}

// Extract param names from file path
function extractParamNames(filePath) {
  const matches = filePath.match(/\[([^\]]+)\]/g);
  if (!matches) return [];
  return matches.map(m => m.slice(1, -1)); // Remove [ and ]
}

// Fix a single route file
function fixRouteFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Extract param names from path
  const paramNames = extractParamNames(filePath);
  if (paramNames.length === 0) return false;
  
  // Pattern 1: Fix function signature
  // { params }: { params: { id: string } } -> { params }: { params: Promise<{ id: string }> }
  const paramPattern = paramNames.map(name => `${name}: string`).join(', ');
  const oldSignature = new RegExp(
    `\\{ params \\}: \\{ params: \\{ ${paramPattern.replace(/:/g, '\\:')} \\} \\}`,
    'g'
  );
  
  // More flexible pattern
  const flexiblePattern = /\{ params \}: \{ params: \{ ([^}]+) \} \}/g;
  let changed = false;
  
  content = content.replace(flexiblePattern, (match, paramDef) => {
    // Check if it's already a Promise
    if (match.includes('Promise')) return match;
    
    changed = true;
    return `{ params }: { params: Promise<{ ${paramDef} }> }`;
  });
  
  // Pattern 2: Add await params at the start of each function
  const functionPattern = /(export async function (GET|POST|PUT|PATCH|DELETE)\s*\([^)]*\)\s*\{)/g;
  
  content = content.replace(functionPattern, (match, funcStart) => {
    // Check if params are used in this function
    if (!match.includes('params')) return match;
    
    // Check if await params already exists
    const funcBody = content.substring(content.indexOf(match));
    const nextBrace = funcBody.indexOf('{', match.length);
    const funcStartContent = funcBody.substring(0, nextBrace + 1);
    
    if (funcStartContent.includes('await params') || funcStartContent.includes('const {') && funcStartContent.includes('} = await params')) {
      return match;
    }
    
    // Extract param names from the Promise type
    const paramMatch = match.match(/Promise<\{ ([^}]+) \}>/);
    if (!paramMatch) return match;
    
    const paramDefs = paramMatch[1].split(',').map(p => p.trim());
    const paramVars = paramDefs.map(p => p.split(':')[0].trim()).join(', ');
    
    return `${funcStart}\n    const { ${paramVars} } = await params`;
  });
  
  // Pattern 3: Replace params.id, params.slug, etc. with the extracted variables
  paramNames.forEach(paramName => {
    const paramVar = paramName; // e.g., 'id' or 'slug'
    const regex = new RegExp(`params\\.${paramVar}\\b`, 'g');
    if (content.includes(`params.${paramVar}`)) {
      content = content.replace(regex, paramVar);
      changed = true;
    }
  });
  
  if (changed && content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

// Main execution
const apiDir = path.join(__dirname, '..', 'app', 'api');
const routes = findDynamicRoutes(apiDir);

console.log(`Found ${routes.length} dynamic route files`);
console.log('Fixing async params...\n');

let fixedCount = 0;
for (const route of routes) {
  if (fixRouteFile(route)) {
    fixedCount++;
  }
}

console.log(`\n✅ Fixed ${fixedCount} out of ${routes.length} files`);
console.log('Note: Some files may need manual review for complex cases.');

