#!/usr/bin/env node

/**
 * NEX7 Code Analysis Script
 * Proactively analyzes TypeScript/ESLint issues before Vercel deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  rootDir: process.cwd(),
  srcDir: path.join(process.cwd(), 'src'),
  extensions: ['.ts', '.tsx'],
  excludeDirs: ['node_modules', '.next', 'dist', 'build', '.git'],
  maxErrors: 50,
  autoFix: process.argv.includes('--fix')
};

class CodeAnalyzer {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.fixes = [];
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '🔍',
      success: '✅', 
      warning: '⚠️',
      error: '❌',
      fix: '🔧'
    }[type] || '•';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async analyze() {
    this.log('Starting NEX7 code analysis...', 'info');
    
    try {
      // 1. TypeScript compilation check
      await this.checkTypeScript();
      
      // 2. ESLint analysis
      await this.checkESLint();
      
      // 3. React hooks analysis
      await this.checkReactHooks();
      
      // 4. Common patterns analysis
      await this.checkCommonPatterns();
      
      // 5. Generate report
      this.generateReport();
      
      // 6. Apply fixes if requested
      if (config.autoFix && this.fixes.length > 0) {
        await this.applyFixes();
      }
      
    } catch (error) {
      this.log(`Analysis failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async checkTypeScript() {
    this.log('Checking TypeScript compilation...', 'info');
    
    try {
      // Run tsc with no emit to check for errors
      execSync('npx tsc --noEmit --project tsconfig.json', { 
        stdio: 'pipe', 
        cwd: config.rootDir,
        encoding: 'utf8'
      });
      this.log('TypeScript compilation: OK', 'success');
    } catch (error) {
      const output = error.stdout || error.stderr || '';
      const tsErrors = this.parseTSOutput(output);
      this.errors.push(...tsErrors);
      this.log(`Found ${tsErrors.length} TypeScript errors`, 'error');
    }
  }

  async checkESLint() {
    this.log('Running ESLint analysis...', 'info');
    
    try {
      const output = execSync('npx eslint src/ --ext .ts,.tsx --format json', {
        stdio: 'pipe',
        cwd: config.rootDir,
        encoding: 'utf8'
      });
      
      const results = JSON.parse(output);
      const eslintIssues = this.parseESLintOutput(results);
      this.errors.push(...eslintIssues.errors);
      this.warnings.push(...eslintIssues.warnings);
      
      this.log(`ESLint: ${eslintIssues.errors.length} errors, ${eslintIssues.warnings.length} warnings`, 
        eslintIssues.errors.length > 0 ? 'warning' : 'success');
        
    } catch (error) {
      // ESLint exits with non-zero when it finds issues
      if (error.stdout) {
        try {
          const results = JSON.parse(error.stdout);
          const eslintIssues = this.parseESLintOutput(results);
          this.errors.push(...eslintIssues.errors);
          this.warnings.push(...eslintIssues.warnings);
        } catch (parseError) {
          this.log(`ESLint parsing error: ${parseError.message}`, 'error');
        }
      }
    }
  }

  async checkReactHooks() {
    this.log('Analyzing React hooks usage...', 'info');
    
    const files = this.getTypeScriptFiles();
    let hookIssues = 0;
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const issues = this.analyzeHooksInFile(file, content);
      hookIssues += issues.length;
      this.warnings.push(...issues);
    }
    
    this.log(`React hooks analysis: ${hookIssues} potential issues found`, 
      hookIssues > 0 ? 'warning' : 'success');
  }

  async checkCommonPatterns() {
    this.log('Checking for common anti-patterns...', 'info');
    
    const files = this.getTypeScriptFiles();
    let patternIssues = 0;
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const issues = this.analyzeCommonPatterns(file, content);
      patternIssues += issues.length;
      this.warnings.push(...issues);
      
      // Generate fixes for common issues
      const fixes = this.generateCommonFixes(file, content, issues);
      this.fixes.push(...fixes);
    }
    
    this.log(`Common patterns: ${patternIssues} issues found`, 
      patternIssues > 0 ? 'warning' : 'success');
  }

  parseTSOutput(output) {
    const errors = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('error TS')) {
        const match = line.match(/(.+\.tsx?)\((\d+),(\d+)\): error TS(\d+): (.+)/);
        if (match) {
          errors.push({
            type: 'typescript',
            file: match[1],
            line: parseInt(match[2]),
            column: parseInt(match[3]),
            code: match[4],
            message: match[5],
            severity: 'error'
          });
        }
      }
    }
    
    return errors;
  }

  parseESLintOutput(results) {
    const errors = [];
    const warnings = [];
    
    for (const result of results) {
      for (const message of result.messages) {
        const issue = {
          type: 'eslint',
          file: result.filePath,
          line: message.line,
          column: message.column,
          rule: message.ruleId,
          message: message.message,
          severity: message.severity === 2 ? 'error' : 'warning'
        };
        
        if (message.severity === 2) {
          errors.push(issue);
        } else {
          warnings.push(issue);
        }
      }
    }
    
    return { errors, warnings };
  }

  analyzeHooksInFile(filePath, content) {
    const issues = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Check for useEffect without dependencies
      if (line.includes('useEffect') && !line.includes('[') && !lines[index + 1]?.includes('[')) {
        issues.push({
          type: 'react-hooks',
          file: filePath,
          line: index + 1,
          message: 'useEffect missing dependency array',
          severity: 'warning',
          rule: 'react-hooks/exhaustive-deps'
        });
      }
      
      // Check for functions in useEffect dependencies that need useCallback
      if (line.includes('useEffect') && line.includes('[')) {
        const depMatch = line.match(/\[([^\]]+)\]/);
        if (depMatch && depMatch[1].includes('fetch') && !content.includes('useCallback')) {
          issues.push({
            type: 'react-hooks',
            file: filePath,
            line: index + 1,
            message: 'Function in dependency array should use useCallback',
            severity: 'warning',
            rule: 'react-hooks/exhaustive-deps'
          });
        }
      }
    });
    
    return issues;
  }

  analyzeCommonPatterns(filePath, content) {
    const issues = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Check for unused variables
      if (line.match(/^\s*const\s+(\w+)\s*=/)) {
        const varMatch = line.match(/^\s*const\s+(\w+)\s*=/);
        if (varMatch && !content.includes(varMatch[1] + '.') && !content.includes(varMatch[1] + ' ') && !content.includes(varMatch[1] + ')')) {
          issues.push({
            type: 'unused-variable',
            file: filePath,
            line: index + 1,
            message: `Variable '${varMatch[1]}' is defined but never used`,
            severity: 'warning',
            variable: varMatch[1]
          });
        }
      }
      
      // Check for any types
      if (line.includes(': any') || line.includes('<any>')) {
        issues.push({
          type: 'any-type',
          file: filePath,
          line: index + 1,
          message: 'Unexpected any. Specify a different type',
          severity: 'warning',
          rule: '@typescript-eslint/no-explicit-any'
        });
      }
      
      // Check for console.log (should be removed in production)
      if (line.includes('console.log') && !line.includes('// eslint-disable')) {
        issues.push({
          type: 'console-log',
          file: filePath,
          line: index + 1,
          message: 'Unexpected console.log statement',
          severity: 'info'
        });
      }
    });
    
    return issues;
  }

  generateCommonFixes(filePath, content, issues) {
    const fixes = [];
    
    for (const issue of issues) {
      if (issue.type === 'unused-variable' && issue.variable) {
        fixes.push({
          file: filePath,
          type: 'prefix-underscore',
          description: `Prefix unused variable '${issue.variable}' with underscore`,
          line: issue.line,
          oldText: issue.variable,
          newText: `_${issue.variable}`
        });
      }
    }
    
    return fixes;
  }

  getTypeScriptFiles() {
    const files = [];
    
    const scanDir = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !config.excludeDirs.includes(item)) {
          scanDir(fullPath);
        } else if (stat.isFile() && config.extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    };
    
    scanDir(config.srcDir);
    return files;
  }

  generateReport() {
    const duration = Date.now() - this.startTime;
    const totalIssues = this.errors.length + this.warnings.length;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 NEX7 CODE ANALYSIS REPORT');
    console.log('='.repeat(60));
    console.log(`⏱️  Analysis time: ${duration}ms`);
    console.log(`📁 Files analyzed: ${this.getTypeScriptFiles().length}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`🔧 Auto-fixes available: ${this.fixes.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n🚨 CRITICAL ERRORS (will block deployment):');
      this.errors.slice(0, 10).forEach(error => {
        const relativeFile = path.relative(config.rootDir, error.file);
        console.log(`   ${relativeFile}:${error.line}:${error.column} - ${error.message}`);
      });
      
      if (this.errors.length > 10) {
        console.log(`   ... and ${this.errors.length - 10} more errors`);
      }
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.slice(0, 5).forEach(warning => {
        const relativeFile = path.relative(config.rootDir, warning.file);
        console.log(`   ${relativeFile}:${warning.line} - ${warning.message}`);
      });
      
      if (this.warnings.length > 5) {
        console.log(`   ... and ${this.warnings.length - 5} more warnings`);
      }
    }
    
    if (this.fixes.length > 0) {
      console.log('\n🔧 AVAILABLE AUTO-FIXES:');
      this.fixes.forEach(fix => {
        const relativeFile = path.relative(config.rootDir, fix.file);
        console.log(`   ${relativeFile}:${fix.line} - ${fix.description}`);
      });
      console.log('\n   Run with --fix to apply these automatically');
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (this.errors.length > 0) {
      console.log('❌ Analysis completed with errors. Deployment may fail.');
      process.exit(1);
    } else if (this.warnings.length > 0) {
      console.log('⚠️  Analysis completed with warnings. Review recommended.');
      process.exit(0);
    } else {
      console.log('✅ Analysis completed successfully. Ready for deployment!');
      process.exit(0);
    }
  }

  async applyFixes() {
    this.log('Applying automatic fixes...', 'fix');
    
    for (const fix of this.fixes) {
      try {
        const content = fs.readFileSync(fix.file, 'utf8');
        const lines = content.split('\n');
        
        if (fix.type === 'prefix-underscore') {
          lines[fix.line - 1] = lines[fix.line - 1].replace(
            new RegExp(`\\b${fix.oldText}\\b`, 'g'), 
            fix.newText
          );
          
          fs.writeFileSync(fix.file, lines.join('\n'));
          this.log(`Applied fix: ${fix.description}`, 'success');
        }
      } catch (error) {
        this.log(`Failed to apply fix: ${fix.description} - ${error.message}`, 'error');
      }
    }
  }
}

// Main execution
if (require.main === module) {
  const analyzer = new CodeAnalyzer();
  analyzer.analyze().catch(error => {
    console.error('Analysis failed:', error);
    process.exit(1);
  });
}

module.exports = CodeAnalyzer;