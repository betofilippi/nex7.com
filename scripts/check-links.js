#!/usr/bin/env node

/**
 * Link Checker for NEX7 Documentation
 * 
 * Scans documentation files for broken links and validates them
 * Supports both local and external link checking
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

class LinkChecker {
  constructor(options = {}) {
    this.options = {
      baseDir: './docs',
      extensions: ['.md', '.mdx'],
      checkExternal: true,
      timeout: 5000,
      maxRetries: 2,
      ignorePatterns: [
        'localhost',
        '127.0.0.1',
        'example.com',
        'your-domain.com',
        'your-email@',
        'mailto:'
      ],
      ...options
    };
    
    this.results = {
      totalFiles: 0,
      totalLinks: 0,
      brokenLinks: [],
      externalLinks: [],
      internalLinks: []
    };
    
    this.cache = new Map(); // Cache for external link checks
  }

  // Find all documentation files
  findDocFiles(dir) {
    const files = [];
    
    if (!fs.existsSync(dir)) {
      console.warn(`Directory not found: ${dir}`);
      return files;
    }
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.findDocFiles(fullPath));
      } else if (this.options.extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  // Extract links from markdown content
  extractLinks(content, filePath) {
    const links = [];
    
    // Markdown link patterns
    const patterns = [
      // [text](url)
      /\[([^\]]*)\]\(([^)]+)\)/g,
      // <url>
      /<(https?:\/\/[^>]+)>/g,
      // Reference links [text]: url
      /^\[([^\]]+)\]:\s*(.+)$/gm
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const url = match[2] || match[1];
        if (url && !this.shouldIgnoreLink(url)) {
          links.push({
            text: match[1] || url,
            url: url.trim(),
            line: this.getLineNumber(content, match.index),
            file: filePath
          });
        }
      }
    });

    return links;
  }

  // Get line number for a character index
  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  // Check if link should be ignored
  shouldIgnoreLink(url) {
    return this.options.ignorePatterns.some(pattern => 
      url.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  // Validate internal link (local file or anchor)
  async validateInternalLink(link) {
    const { url, file } = link;
    
    // Handle anchor links
    if (url.startsWith('#')) {
      return this.validateAnchorLink(link);
    }
    
    // Handle relative paths
    let targetPath;
    if (url.startsWith('/')) {
      // Absolute path from project root
      targetPath = path.join(process.cwd(), url.substring(1));
    } else {
      // Relative path from current file
      const currentDir = path.dirname(file);
      targetPath = path.resolve(currentDir, url);
    }
    
    // Check if file exists
    try {
      if (fs.existsSync(targetPath)) {
        const stat = fs.statSync(targetPath);
        if (stat.isFile()) {
          return { valid: true };
        } else if (stat.isDirectory()) {
          // Check for index file
          const indexFiles = ['index.md', 'README.md', 'index.html'];
          for (const indexFile of indexFiles) {
            if (fs.existsSync(path.join(targetPath, indexFile))) {
              return { valid: true };
            }
          }
          return { valid: false, error: 'Directory without index file' };
        }
      }
      return { valid: false, error: 'File not found' };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Validate anchor link within current file
  validateAnchorLink(link) {
    const { url, file } = link;
    const anchor = url.substring(1).toLowerCase();
    
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      // Look for matching headers
      for (const line of lines) {
        const headerMatch = line.match(/^#+\s+(.+)$/);
        if (headerMatch) {
          const headerAnchor = this.generateAnchor(headerMatch[1]);
          if (headerAnchor === anchor) {
            return { valid: true };
          }
        }
      }
      
      return { valid: false, error: 'Anchor not found' };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Generate anchor from header text (GitHub-style)
  generateAnchor(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Validate external link
  async validateExternalLink(link) {
    const { url } = link;
    
    // Check cache first
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }
    
    try {
      const parsedUrl = new URL(url);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const result = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout'));
        }, this.options.timeout);
        
        const req = client.request({
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          path: parsedUrl.pathname + parsedUrl.search,
          method: 'HEAD',
          headers: {
            'User-Agent': 'NEX7-LinkChecker/1.0'
          }
        }, (res) => {
          clearTimeout(timeout);
          
          if (res.statusCode >= 200 && res.statusCode < 400) {
            resolve({ valid: true, statusCode: res.statusCode });
          } else if (res.statusCode >= 300 && res.statusCode < 400) {
            // Follow redirects
            const location = res.headers.location;
            if (location) {
              resolve({ valid: true, statusCode: res.statusCode, redirectTo: location });
            } else {
              resolve({ valid: false, error: `HTTP ${res.statusCode}`, statusCode: res.statusCode });
            }
          } else {
            resolve({ valid: false, error: `HTTP ${res.statusCode}`, statusCode: res.statusCode });
          }
        });
        
        req.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
        
        req.setTimeout(this.options.timeout, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
        
        req.end();
      });
      
      // Cache the result
      this.cache.set(url, result);
      return result;
      
    } catch (error) {
      const result = { valid: false, error: error.message };
      this.cache.set(url, result);
      return result;
    }
  }

  // Check all links in a file
  async checkFile(filePath) {
    console.log(`Checking: ${filePath}`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const links = this.extractLinks(content, filePath);
      
      this.results.totalLinks += links.length;
      
      for (const link of links) {
        let result;
        
        if (this.isExternalLink(link.url)) {
          this.results.externalLinks.push(link);
          if (this.options.checkExternal) {
            result = await this.validateExternalLink(link);
          } else {
            continue; // Skip external links if not checking them
          }
        } else {
          this.results.internalLinks.push(link);
          result = await this.validateInternalLink(link);
        }
        
        if (!result.valid) {
          this.results.brokenLinks.push({
            ...link,
            error: result.error,
            statusCode: result.statusCode
          });
        }
        
        // Add small delay to avoid overwhelming servers
        if (this.isExternalLink(link.url)) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error.message);
    }
  }

  // Check if URL is external
  isExternalLink(url) {
    return url.startsWith('http://') || url.startsWith('https://');
  }

  // Run link checking on all files
  async run() {
    const startTime = Date.now();
    console.log('🔍 Starting link check...\n');
    
    const files = this.findDocFiles(this.options.baseDir);
    this.results.totalFiles = files.length;
    
    if (files.length === 0) {
      console.log('No documentation files found.');
      return this.results;
    }
    
    console.log(`Found ${files.length} documentation files`);
    
    if (!this.options.checkExternal) {
      console.log('⚠️  External link checking disabled');
    }
    
    console.log('');
    
    // Check files
    for (const file of files) {
      await this.checkFile(file);
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Print results
    this.printResults(duration);
    
    return this.results;
  }

  // Print check results
  printResults(duration) {
    console.log('\n📊 Link Check Results');
    console.log('='.repeat(50));
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`📁 Files checked: ${this.results.totalFiles}`);
    console.log(`🔗 Total links: ${this.results.totalLinks}`);
    console.log(`🏠 Internal links: ${this.results.internalLinks.length}`);
    console.log(`🌐 External links: ${this.results.externalLinks.length}`);
    console.log(`❌ Broken links: ${this.results.brokenLinks.length}`);
    
    if (this.results.brokenLinks.length > 0) {
      console.log('\n💥 Broken Links Found:');
      console.log('-'.repeat(50));
      
      this.results.brokenLinks.forEach((link, index) => {
        console.log(`${index + 1}. ${link.file}:${link.line}`);
        console.log(`   Text: "${link.text}"`);
        console.log(`   URL: ${link.url}`);
        console.log(`   Error: ${link.error}`);
        if (link.statusCode) {
          console.log(`   Status: ${link.statusCode}`);
        }
        console.log('');
      });
      
      console.log('❌ Link check FAILED');
      process.exit(1);
    } else {
      console.log('\n✅ All links are valid!');
    }
  }

  // Generate JSON report
  generateReport(outputFile = 'link-check-report.json') {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: this.results.totalFiles,
        totalLinks: this.results.totalLinks,
        brokenLinks: this.results.brokenLinks.length,
        internalLinks: this.results.internalLinks.length,
        externalLinks: this.results.externalLinks.length
      },
      brokenLinks: this.results.brokenLinks,
      allLinks: {
        internal: this.results.internalLinks,
        external: this.results.externalLinks
      }
    };
    
    fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to: ${outputFile}`);
  }
}

// CLI interface
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--base-dir':
      case '-d':
        options.baseDir = args[++i];
        break;
      case '--no-external':
        options.checkExternal = false;
        break;
      case '--timeout':
      case '-t':
        options.timeout = parseInt(args[++i]);
        break;
      case '--report':
      case '-r':
        options.generateReport = true;
        options.reportFile = args[i + 1] && !args[i + 1].startsWith('-') ? args[++i] : 'link-check-report.json';
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: node check-links.js [options]

Options:
  -d, --base-dir <dir>    Base directory to scan (default: ./docs)
  --no-external           Skip external link checking
  -t, --timeout <ms>      Timeout for external requests (default: 5000)
  -r, --report [file]     Generate JSON report (default: link-check-report.json)
  -h, --help              Show this help message

Examples:
  node check-links.js
  node check-links.js --base-dir ./documentation --no-external
  node check-links.js --timeout 10000 --report custom-report.json
        `);
        process.exit(0);
        break;
    }
  }

  return options;
}

// Run if called directly
if (require.main === module) {
  async function main() {
    const options = parseArgs();
    const checker = new LinkChecker(options);
    
    try {
      const results = await checker.run();
      
      if (options.generateReport) {
        checker.generateReport(options.reportFile);
      }
      
    } catch (error) {
      console.error('Link check failed:', error.message);
      process.exit(1);
    }
  }
  
  main();
}

module.exports = LinkChecker;