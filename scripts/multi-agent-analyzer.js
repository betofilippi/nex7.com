#!/usr/bin/env node

/**
 * NEX7 Multi-Agent Code Analyzer
 * Uses multiple specialized agents to analyze different aspects of the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class MultiAgentAnalyzer {
  constructor() {
    this.agents = [
      new TypeScriptAgent(),
      new ReactHooksAgent(), 
      new ESLintAgent(),
      new PerformanceAgent(),
      new SecurityAgent()
    ];
    this.results = {};
    this.startTime = Date.now();
  }

  log(message, agent = 'SYSTEM', type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m', 
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    
    const timestamp = new Date().toISOString().substr(11, 8);
    const color = colors[type] || colors.info;
    console.log(`${color}[${timestamp}] ${agent}: ${message}${colors.reset}`);
  }

  async analyze() {
    this.log('🚀 Starting multi-agent code analysis...', 'SYSTEM');
    
    const files = this.getTypeScriptFiles();
    this.log(`📁 Found ${files.length} TypeScript files to analyze`, 'SYSTEM');
    
    // Run agents in parallel for better performance
    const promises = this.agents.map(agent => 
      this.runAgent(agent, files).catch(error => ({
        agent: agent.name,
        error: error.message,
        issues: []
      }))
    );
    
    const results = await Promise.all(promises);
    
    // Aggregate results
    for (const result of results) {
      this.results[result.agent] = result;
    }
    
    this.generateReport();
    this.suggestImprovements();
    
    return this.results;
  }

  async runAgent(agent, files) {
    this.log(`🔍 Running ${agent.name} analysis...`, agent.name.toUpperCase());
    const startTime = Date.now();
    
    try {
      const issues = await agent.analyze(files);
      const duration = Date.now() - startTime;
      
      this.log(`✅ Completed in ${duration}ms - Found ${issues.length} issues`, 
        agent.name.toUpperCase(), issues.length > 0 ? 'warning' : 'success');
      
      return {
        agent: agent.name,
        issues,
        duration,
        success: true
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log(`❌ Failed after ${duration}ms: ${error.message}`, 
        agent.name.toUpperCase(), 'error');
      
      return {
        agent: agent.name,
        error: error.message,
        duration,
        success: false,
        issues: []
      };
    }
  }

  getTypeScriptFiles() {
    const files = [];
    const excludeDirs = ['node_modules', '.next', 'dist', 'build', '.git'];
    
    const scanDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !excludeDirs.includes(item)) {
          scanDir(fullPath);
        } else if (stat.isFile() && /\.(ts|tsx)$/.test(item)) {
          files.push(fullPath);
        }
      }
    };
    
    scanDir(path.join(process.cwd(), 'src'));
    return files;
  }

  generateReport() {
    const totalDuration = Date.now() - this.startTime;
    const totalIssues = Object.values(this.results)
      .reduce((sum, result) => sum + (result.issues?.length || 0), 0);
    
    console.log('\n' + '='.repeat(70));
    console.log('🤖 NEX7 MULTI-AGENT ANALYSIS REPORT');
    console.log('='.repeat(70));
    console.log(`⏱️  Total analysis time: ${totalDuration}ms`);
    console.log(`🔍 Agents deployed: ${this.agents.length}`);
    console.log(`📊 Total issues found: ${totalIssues}`);
    
    for (const [agentName, result] of Object.entries(this.results)) {
      const status = result.success ? '✅' : '❌';
      const issuesCount = result.issues?.length || 0;
      const duration = result.duration || 0;
      
      console.log(`\n${status} ${agentName.toUpperCase()}`);
      console.log(`   📊 Issues: ${issuesCount}`);
      console.log(`   ⏱️  Duration: ${duration}ms`);
      
      if (result.error) {
        console.log(`   ❌ Error: ${result.error}`);
      }
      
      // Show top issues for each agent
      if (result.issues && result.issues.length > 0) {
        const topIssues = result.issues.slice(0, 3);
        for (const issue of topIssues) {
          const file = path.relative(process.cwd(), issue.file);
          console.log(`   • ${file}:${issue.line} - ${issue.message}`);
        }
        
        if (result.issues.length > 3) {
          console.log(`   ... and ${result.issues.length - 3} more issues`);
        }
      }
    }
  }

  suggestImprovements() {
    console.log('\n🎯 RECOMMENDED ACTIONS:');
    
    const allIssues = Object.values(this.results)
      .flatMap(result => result.issues || []);
    
    // Group issues by type
    const issuesByType = allIssues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {});
    
    // Prioritize by frequency
    const sortedTypes = Object.entries(issuesByType)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    if (sortedTypes.length === 0) {
      console.log('✨ No critical issues found! Code quality is excellent.');
      return;
    }
    
    sortedTypes.forEach(([type, count], index) => {
      console.log(`${index + 1}. Fix ${count} ${type} issues`);
    });
    
    console.log('\n💡 QUICK FIXES:');
    console.log('• Run: npm run analyze:fix');
    console.log('• Run: npm run lint:fix');
    console.log('• Review useEffect dependencies');
    console.log('• Add missing type annotations');
  }
}

// Specialized Agent Classes
class TypeScriptAgent {
  constructor() {
    this.name = 'typescript';
  }

  async analyze(files) {
    const issues = [];
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const fileIssues = this.analyzeFile(file, content);
      issues.push(...fileIssues);
    }
    
    return issues;
  }

  analyzeFile(filePath, content) {
    const issues = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Check for any types
      if (line.includes(': any') && !line.includes('// @ts-')) {
        issues.push({
          type: 'typescript-any',
          file: filePath,
          line: index + 1,
          message: 'Using any type - specify explicit type',
          severity: 'warning'
        });
      }
      
      // Check for @ts-ignore
      if (line.includes('@ts-ignore')) {
        issues.push({
          type: 'typescript-ignore',
          file: filePath,
          line: index + 1,
          message: '@ts-ignore used - fix underlying type issue',
          severity: 'warning'
        });
      }
      
      // Check for missing return types on functions
      if (/^(export\s+)?(async\s+)?function\s+\w+\s*\([^)]*\)\s*{/.test(line)) {
        if (!line.includes('):') && !line.includes('=> ')) {
          issues.push({
            type: 'typescript-return-type',
            file: filePath,
            line: index + 1,
            message: 'Function missing return type annotation',
            severity: 'info'
          });
        }
      }
    });
    
    return issues;
  }
}

class ReactHooksAgent {
  constructor() {
    this.name = 'react-hooks';
  }

  async analyze(files) {
    const issues = [];
    
    for (const file of files) {
      if (file.includes('.tsx') || file.includes('use') || file.includes('hook')) {
        const content = fs.readFileSync(file, 'utf8');
        const fileIssues = this.analyzeHooks(file, content);
        issues.push(...fileIssues);
      }
    }
    
    return issues;
  }

  analyzeHooks(filePath, content) {
    const issues = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Check useEffect dependencies
      if (line.trim().startsWith('useEffect(') && !line.includes('[')) {
        const nextLine = lines[index + 1];
        if (!nextLine || !nextLine.includes('[')) {
          issues.push({
            type: 'react-missing-deps',
            file: filePath,
            line: index + 1,
            message: 'useEffect missing dependency array',
            severity: 'warning'
          });
        }
      }
      
      // Check for useCallback usage
      if (line.includes('useEffect') && line.includes('[')) {
        const hasFunction = /\b(fetch|update|handle|get|post|delete|put)\w*/.test(line);
        if (hasFunction && !content.includes('useCallback')) {
          issues.push({
            type: 'react-needs-callback',
            file: filePath,
            line: index + 1,
            message: 'Consider using useCallback for function dependencies',
            severity: 'info'
          });
        }
      }
      
      // Check for useState with objects
      if (line.includes('useState') && line.includes('{')) {
        issues.push({
          type: 'react-state-object',
          file: filePath,
          line: index + 1,
          message: 'Consider using useReducer for complex state objects',
          severity: 'info'
        });
      }
    });
    
    return issues;
  }
}

class ESLintAgent {
  constructor() {
    this.name = 'eslint';
  }

  async analyze(files) {
    try {
      const output = execSync('npx eslint src/ --ext .ts,.tsx --format json', {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const results = JSON.parse(output);
      return this.parseESLintResults(results);
    } catch (error) {
      // ESLint returns non-zero exit code when issues are found
      if (error.stdout) {
        try {
          const results = JSON.parse(error.stdout);
          return this.parseESLintResults(results);
        } catch (parseError) {
          return [];
        }
      }
      return [];
    }
  }

  parseESLintResults(results) {
    const issues = [];
    
    for (const result of results) {
      for (const message of result.messages) {
        issues.push({
          type: 'eslint-' + (message.ruleId || 'unknown'),
          file: result.filePath,
          line: message.line,
          column: message.column,
          message: message.message,
          severity: message.severity === 2 ? 'error' : 'warning',
          rule: message.ruleId
        });
      }
    }
    
    return issues;
  }
}

class PerformanceAgent {
  constructor() {
    this.name = 'performance';
  }

  async analyze(files) {
    const issues = [];
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const fileIssues = this.analyzePerformance(file, content);
      issues.push(...fileIssues);
    }
    
    return issues;
  }

  analyzePerformance(filePath, content) {
    const issues = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Check for console.log in production
      if (line.includes('console.log') && !line.includes('// keep')) {
        issues.push({
          type: 'performance-console',
          file: filePath,
          line: index + 1,
          message: 'console.log should be removed for production',
          severity: 'info'
        });
      }
      
      // Check for large inline objects
      if (line.length > 200 && line.includes('{')) {
        issues.push({
          type: 'performance-large-object',
          file: filePath,
          line: index + 1,
          message: 'Large inline object - consider extracting to constant',
          severity: 'info'
        });
      }
      
      // Check for missing React.memo on components
      if (line.includes('export const') && line.includes('React.FC') && !content.includes('React.memo')) {
        issues.push({
          type: 'performance-memo',
          file: filePath,
          line: index + 1,
          message: 'Consider wrapping component with React.memo',
          severity: 'info'
        });
      }
    });
    
    return issues;
  }
}

class SecurityAgent {
  constructor() {
    this.name = 'security';
  }

  async analyze(files) {
    const issues = [];
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const fileIssues = this.analyzeSecurity(file, content);
      issues.push(...fileIssues);
    }
    
    return issues;
  }

  analyzeSecurity(filePath, content) {
    const issues = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Check for hardcoded secrets
      if (/(?:api[_-]?key|secret|token|password)\s*[:=]\s*['"][^'"]+['"]/.test(line.toLowerCase())) {
        issues.push({
          type: 'security-hardcoded-secret',
          file: filePath,
          line: index + 1,
          message: 'Potential hardcoded secret detected',
          severity: 'error'
        });
      }
      
      // Check for dangerous innerHTML usage
      if (line.includes('dangerouslySetInnerHTML')) {
        issues.push({
          type: 'security-dangerous-html',
          file: filePath,
          line: index + 1,
          message: 'dangerouslySetInnerHTML usage - ensure content is sanitized',
          severity: 'warning'
        });
      }
      
      // Check for eval usage
      if (line.includes('eval(')) {
        issues.push({
          type: 'security-eval',
          file: filePath,
          line: index + 1,
          message: 'eval() usage is dangerous and should be avoided',
          severity: 'error'
        });
      }
    });
    
    return issues;
  }
}

// Main execution
if (require.main === module) {
  const analyzer = new MultiAgentAnalyzer();
  analyzer.analyze().catch(error => {
    console.error('❌ Multi-agent analysis failed:', error);
    process.exit(1);
  });
}

module.exports = MultiAgentAnalyzer;