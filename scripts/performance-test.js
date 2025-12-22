#!/usr/bin/env node

/**
 * Performance Testing Script for Bio Sculpture Ecommerce
 * 
 * Tests:
 * - Build performance
 * - API endpoint response times
 * - Page load performance
 * - Memory usage
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const autocannon = require('autocannon');

// Configuration
// Check for dev server on 3001, otherwise use 3000
const PORT = process.env.PORT || (process.env.NODE_ENV === 'development' ? '3001' : '3000');
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const API_BASE = `${BASE_URL}/api`;
const CONCURRENT_CONNECTIONS = 10;
const DURATION = 10; // seconds
const REQUESTS_PER_SECOND = 50;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

// Test results storage
const results = {
  build: null,
  api: {},
  pages: {},
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
  },
};

/**
 * Test 1: Build Performance
 */
async function testBuildPerformance() {
  logSection('📦 Testing Build Performance');
  
  try {
    const startTime = Date.now();
    log('Running Next.js build...', 'yellow');
    
    execSync('npm run build', {
      stdio: 'pipe',
      cwd: process.cwd(),
    });
    
    const buildTime = (Date.now() - startTime) / 1000;
    results.build = {
      time: buildTime,
      status: 'success',
    };
    
    log(`✅ Build completed in ${buildTime.toFixed(2)}s`, 'green');
    
    // Check build output size
    const buildDir = path.join(process.cwd(), '.next');
    if (fs.existsSync(buildDir)) {
      const stats = getDirectorySize(buildDir);
      results.build.size = stats;
      log(`📊 Build size: ${formatBytes(stats.size)}`, 'blue');
    }
    
    results.summary.totalTests++;
    results.summary.passed++;
  } catch (error) {
    results.build = {
      status: 'failed',
      error: error.message,
    };
    log(`❌ Build failed: ${error.message}`, 'red');
    results.summary.totalTests++;
    results.summary.failed++;
  }
}

/**
 * Test 2: API Endpoint Performance
 */
async function testAPIEndpoints() {
  logSection('🔌 Testing API Endpoints');
  
  // Key API endpoints to test
  const endpoints = [
    { path: '/products', method: 'GET', name: 'Get Products' },
    { path: '/categories', method: 'GET', name: 'Get Categories' },
    { path: '/cart', method: 'GET', name: 'Get Cart' },
    { path: '/orders', method: 'GET', name: 'Get Orders' },
    { path: '/analytics', method: 'GET', name: 'Analytics' },
  ];
  
  for (const endpoint of endpoints) {
    try {
      log(`\nTesting ${endpoint.name} (${endpoint.path})...`, 'yellow');
      
      const apiUrl = global.API_BASE || API_BASE;
      const instance = autocannon({
        url: `${apiUrl}${endpoint.path}`,
        connections: CONCURRENT_CONNECTIONS,
        duration: DURATION,
        requestsPerSecond: REQUESTS_PER_SECOND,
        method: endpoint.method,
      });
      
      const result = await instance;
      
      const avgLatency = result.latency.mean;
      const p99Latency = result.latency.p99;
      const requests = result.requests.total;
      const throughput = result.throughput.mean;
      const errors = result.errors;
      
      results.api[endpoint.path] = {
        name: endpoint.name,
        avgLatency,
        p99Latency,
        requests,
        throughput,
        errors,
        status: errors > 0 ? 'warning' : 'success',
      };
      
      if (errors > 0) {
        log(`⚠️  ${endpoint.name}: ${errors} errors`, 'yellow');
        results.summary.warnings++;
      } else {
        log(`✅ ${endpoint.name}: ${avgLatency.toFixed(2)}ms avg, ${p99Latency.toFixed(2)}ms p99`, 'green');
      }
      
      log(`   Requests: ${requests}, Throughput: ${formatBytes(throughput)}/s`, 'blue');
      
      results.summary.totalTests++;
      if (errors === 0) {
        results.summary.passed++;
      }
    } catch (error) {
      log(`❌ ${endpoint.name} failed: ${error.message}`, 'red');
      results.api[endpoint.path] = {
        name: endpoint.name,
        status: 'failed',
        error: error.message,
      };
      results.summary.totalTests++;
      results.summary.failed++;
    }
  }
}

/**
 * Test 3: Page Load Performance
 */
async function testPageLoad() {
  logSection('📄 Testing Page Load Performance');
  
  const pages = [
    { path: '/', name: 'Home' },
    { path: '/products', name: 'Products' },
    { path: '/cart', name: 'Cart' },
    { path: '/about', name: 'About' },
  ];
  
  const http = require('http');
  const url = require('url');
  
  for (const page of pages) {
    try {
      log(`\nTesting ${page.name} (${page.path})...`, 'yellow');
      
      const startTime = Date.now();
      const baseUrl = global.BASE_URL || BASE_URL;
      const pageUrl = url.parse(`${baseUrl}${page.path}`);
      
      const loadTime = await new Promise((resolve, reject) => {
        const options = {
          hostname: pageUrl.hostname,
          port: pageUrl.port || 80,
          path: pageUrl.path,
          method: 'GET',
          timeout: 10000,
        };
        
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            const loadTime = Date.now() - startTime;
            const contentLength = res.headers['content-length'];
            
            if (res.statusCode >= 200 && res.statusCode < 400) {
              results.pages[page.path] = {
                name: page.name,
                loadTime,
                status: res.statusCode,
                size: contentLength ? parseInt(contentLength) : data.length,
                statusText: 'success',
              };
              
              log(`✅ ${page.name}: ${loadTime}ms`, 'green');
              const size = contentLength ? parseInt(contentLength) : data.length;
              log(`   Size: ${formatBytes(size)}`, 'blue');
              
              results.summary.totalTests++;
              results.summary.passed++;
              resolve(loadTime);
            } else {
              reject(new Error(`HTTP ${res.statusCode}`));
            }
          });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
        
        req.end();
      });
    } catch (error) {
      log(`❌ ${page.name} failed: ${error.message}`, 'red');
      results.pages[page.path] = {
        name: page.name,
        status: 'failed',
        error: error.message,
      };
      results.summary.totalTests++;
      results.summary.failed++;
    }
  }
}

/**
 * Test 4: Memory Usage
 */
async function testMemoryUsage() {
  logSection('💾 Testing Memory Usage');
  
  const memUsage = process.memoryUsage();
  results.memory = {
    heapUsed: memUsage.heapUsed,
    heapTotal: memUsage.heapTotal,
    external: memUsage.external,
    rss: memUsage.rss,
  };
  
  log(`Heap Used: ${formatBytes(memUsage.heapUsed)}`, 'blue');
  log(`Heap Total: ${formatBytes(memUsage.heapTotal)}`, 'blue');
  log(`RSS: ${formatBytes(memUsage.rss)}`, 'blue');
}

/**
 * Generate Performance Report
 */
function generateReport() {
  logSection('📊 Performance Test Report');
  
  console.log('\n' + '-'.repeat(60));
  log('Build Performance', 'cyan');
  console.log('-'.repeat(60));
  if (results.build) {
    if (results.build.status === 'success') {
      log(`Build Time: ${results.build.time.toFixed(2)}s`, 'green');
      if (results.build.size) {
        log(`Build Size: ${formatBytes(results.build.size.size)}`, 'blue');
      }
    } else {
      log(`Build Status: ${results.build.status}`, 'red');
    }
  }
  
  console.log('\n' + '-'.repeat(60));
  log('API Endpoint Performance', 'cyan');
  console.log('-'.repeat(60));
  Object.values(results.api).forEach((endpoint) => {
    if (endpoint.status === 'success' || endpoint.status === 'warning') {
      const statusIcon = endpoint.status === 'success' ? '✅' : '⚠️';
      log(`${statusIcon} ${endpoint.name}:`, endpoint.status === 'success' ? 'green' : 'yellow');
      log(`   Avg Latency: ${endpoint.avgLatency.toFixed(2)}ms`, 'blue');
      log(`   P99 Latency: ${endpoint.p99Latency.toFixed(2)}ms`, 'blue');
      log(`   Requests: ${endpoint.requests}`, 'blue');
      log(`   Throughput: ${formatBytes(endpoint.throughput)}/s`, 'blue');
      if (endpoint.errors > 0) {
        log(`   Errors: ${endpoint.errors}`, 'yellow');
      }
    } else {
      log(`❌ ${endpoint.name}: ${endpoint.error}`, 'red');
    }
  });
  
  console.log('\n' + '-'.repeat(60));
  log('Page Load Performance', 'cyan');
  console.log('-'.repeat(60));
  Object.values(results.pages).forEach((page) => {
    if (page.statusText === 'success') {
      log(`✅ ${page.name}: ${page.loadTime}ms`, 'green');
      if (page.size) {
        log(`   Size: ${formatBytes(page.size)}`, 'blue');
      }
    } else {
      log(`❌ ${page.name}: ${page.error}`, 'red');
    }
  });
  
  console.log('\n' + '-'.repeat(60));
  log('Test Summary', 'cyan');
  console.log('-'.repeat(60));
  log(`Total Tests: ${results.summary.totalTests}`, 'blue');
  log(`Passed: ${results.summary.passed}`, 'green');
  log(`Failed: ${results.summary.failed}`, results.summary.failed > 0 ? 'red' : 'green');
  log(`Warnings: ${results.summary.warnings}`, results.summary.warnings > 0 ? 'yellow' : 'green');
  
  // Performance thresholds
  console.log('\n' + '-'.repeat(60));
  log('Performance Thresholds', 'cyan');
  console.log('-'.repeat(60));
  
  const apiThresholds = {
    good: 200, // ms
    acceptable: 500, // ms
  };
  
  Object.values(results.api).forEach((endpoint) => {
    if (endpoint.avgLatency) {
      let status = '❌ Poor';
      let color = 'red';
      if (endpoint.avgLatency < apiThresholds.good) {
        status = '✅ Good';
        color = 'green';
      } else if (endpoint.avgLatency < apiThresholds.acceptable) {
        status = '⚠️  Acceptable';
        color = 'yellow';
      }
      log(`${endpoint.name}: ${status} (${endpoint.avgLatency.toFixed(2)}ms)`, color);
    }
  });
  
  // Save report to file
  const reportPath = path.join(process.cwd(), 'performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  log(`\n📄 Full report saved to: ${reportPath}`, 'cyan');
}

// Helper functions
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function getDirectorySize(dirPath) {
  let totalSize = 0;
  let fileCount = 0;
  
  function calculateSize(currentPath) {
    const files = fs.readdirSync(currentPath);
    
    files.forEach((file) => {
      const filePath = path.join(currentPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        calculateSize(filePath);
      } else {
        totalSize += stats.size;
        fileCount++;
      }
    });
  }
  
  calculateSize(dirPath);
  return { size: totalSize, files: fileCount };
}

// Check if server is running and detect the correct port
async function checkServer() {
  const http = require('http');
  const url = require('url');
  
  // Try both common ports
  const portsToTry = [3001, 3000];
  
  for (const testPort of portsToTry) {
    try {
      const testUrl = `http://localhost:${testPort}`;
      const parsedUrl = url.parse(testUrl);
      
      const isRunning = await new Promise((resolve) => {
        const options = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          path: '/',
          method: 'GET',
          timeout: 3000,
        };
        
        const req = http.request(options, (res) => {
          resolve(res.statusCode >= 200 && res.statusCode < 500);
        });
        
        req.on('error', () => resolve(false));
        req.on('timeout', () => {
          req.destroy();
          resolve(false);
        });
        
        req.end();
      });
      
      if (isRunning) {
        // Update BASE_URL to use the detected port
        const detectedUrl = `http://localhost:${testPort}`;
        log(`✅ Server detected on port ${testPort}`, 'green');
        return { running: true, url: detectedUrl, port: testPort };
      }
    } catch (error) {
      // Continue to next port
    }
  }
  
  return { running: false, url: null, port: null };
}

// Main execution
async function main() {
  log('\n🚀 Starting Performance Tests', 'bright');
  
  // Check if server is running and detect port
  log('\nChecking if server is running...', 'yellow');
  const serverInfo = await checkServer();
  
  let actualBaseUrl = BASE_URL;
  let actualApiBase = API_BASE;
  
  if (serverInfo.running) {
    actualBaseUrl = serverInfo.url;
    actualApiBase = `${serverInfo.url}/api`;
    log(`Using detected server: ${actualBaseUrl}`, 'blue');
  } else {
    log('⚠️  Server is not running on ports 3000 or 3001.', 'yellow');
    log('Some tests will be skipped. Starting build test only...', 'yellow');
    log('To run full tests, start server with: npm run dev', 'yellow');
  }
  
  // Update global URLs for API and page tests
  global.BASE_URL = actualBaseUrl;
  global.API_BASE = actualApiBase;
  
  try {
    // Run tests
    await testBuildPerformance();
    
    if (serverInfo.running) {
      await testAPIEndpoints();
      await testPageLoad();
    } else {
      log('\n⚠️  Skipping API and page load tests (server not running)', 'yellow');
    }
    
    await testMemoryUsage();
    
    // Generate report
    generateReport();
    
    log('\n✅ Performance tests completed!', 'green');
    
    // Exit with appropriate code
    process.exit(results.summary.failed > 0 ? 1 : 0);
  } catch (error) {
    log(`\n❌ Performance tests failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { main, testBuildPerformance, testAPIEndpoints, testPageLoad };

