#!/usr/bin/env node

/**
 * 🤖 Claude Auto-Fix System
 * Analyzes deployment errors and generates fixes using Claude AI
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Error fix strategies
const FIX_STRATEGIES = {
  typescript: [
    {
      pattern: /Property '(\w+)' does not exist on type/,
      fix: (match, file) => ({
        type: 'file-edit',
        action: 'edit',
        target: file,
        strategy: 'add-property-type'
      })
    },
    {
      pattern: /Cannot find name '(\w+)'/,
      fix: (match, file) => ({
        type: 'file-edit',
        action: 'edit',
        target: file,
        strategy: 'add-import-or-define'
      })
    },
    {
      pattern: /Type '(.+)' is not assignable to type '(.+)'/,
      fix: (match, file) => ({
        type: 'file-edit',
        action: 'edit',
        target: file,
        strategy: 'fix-type-mismatch'
      })
    }
  ],
  'missing-module': [
    {
      pattern: /Cannot find module '(.+)'/,
      fix: (match) => ({
        type: 'npm',
        action: `npm install ${match[1]} --save`
      })
    }
  ],
  eslint: [
    {
      pattern: /.*/,
      fix: () => ({
        type: 'npm',
        action: 'npm run lint:fix'
      })
    }
  ],
  'npm-install': [
    {
      pattern: /.*/,
      fix: () => ([
        {
          type: 'command',
          action: 'rm -rf node_modules package-lock.json'
        },
        {
          type: 'npm',
          action: 'npm install --legacy-peer-deps'
        }
      ])
    }
  ]
};

class ClaudeAutoFixer {
  constructor() {
    this.maxAttempts = 3;
    this.fixHistory = [];
  }

  async fetchDeploymentError(errorId) {
    try {
      const response = await fetch(`${APP_URL}/api/claude/deployment-notify?errorId=${errorId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch error: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching deployment error:', error);
      throw error;
    }
  }

  async analyzeWithClaude(error) {
    const prompt = `
You are an expert debugging assistant. Analyze this deployment error and provide specific fixes.

Error Type: ${error.errorType}
Error Message: ${error.errorMessage}
Project: ${error.projectName}
Git Branch: ${error.gitBranch || 'unknown'}

Error Details:
${JSON.stringify(error.errorDetails, null, 2)}

Recent Build Logs:
${error.buildLogs?.slice(-50).join('\n') || 'No logs available'}

Previous Fix Attempts: ${error.attempts}

Please analyze this error and provide:
1. Root cause analysis
2. Specific fix commands as JSON array
3. Explanation of each fix

Response format:
{
  "analysis": "Brief root cause analysis",
  "fixes": [
    {
      "type": "file-edit|command|git|npm",
      "action": "specific command or edit action",
      "target": "file path if file-edit",
      "content": "new content if file-edit",
      "reasoning": "why this fix"
    }
  ],
  "confidence": 0.0-1.0
}
`;

    try {
      const response = await this.callClaudeAPI(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Claude API error:', error);
      // Fallback to pattern-based fixes
      return this.generatePatternBasedFixes(error);
    }
  }

  async callClaudeAPI(prompt) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.3 // Lower temperature for more consistent fixes
      });

      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Length': data.length
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(body);
            if (response.error) {
              reject(new Error(response.error.message));
            } else {
              resolve(response.content[0].text);
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  generatePatternBasedFixes(error) {
    const fixes = [];
    const strategies = FIX_STRATEGIES[error.errorType] || [];

    for (const strategy of strategies) {
      for (const errorMsg of error.errorDetails.errorMessages) {
        const match = errorMsg.match(strategy.pattern);
        if (match) {
          const fix = strategy.fix(match, error.errorDetails.files[0]);
          if (Array.isArray(fix)) {
            fixes.push(...fix);
          } else {
            fixes.push(fix);
          }
        }
      }
    }

    // Default fixes if no patterns match
    if (fixes.length === 0) {
      fixes.push({
        type: 'npm',
        action: 'npm run build',
        reasoning: 'Verify build still fails'
      });
    }

    return {
      analysis: 'Pattern-based analysis (Claude unavailable)',
      fixes,
      confidence: 0.5
    };
  }

  async executeFixes(errorId, fixes, description) {
    const fixRequest = {
      errorId,
      commands: fixes,
      description,
      reasoning: fixes.map(f => f.reasoning || 'Auto-generated fix').join('; ')
    };

    try {
      const response = await fetch(`${APP_URL}/api/claude/execute-fix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${INTERNAL_API_KEY}`
        },
        body: JSON.stringify(fixRequest)
      });

      if (!response.ok) {
        throw new Error(`Fix execution failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error executing fixes:', error);
      throw error;
    }
  }

  async processError(errorId) {
    console.log(`🤖 Claude Auto-Fix starting for error: ${errorId}`);

    try {
      // Fetch error details
      const error = await this.fetchDeploymentError(errorId);
      console.log(`📋 Error type: ${error.errorType}`);
      console.log(`💬 Error message: ${error.errorMessage}`);

      // Check if already fixed
      if (error.status === 'resolved') {
        console.log('✅ Error already resolved');
        return;
      }

      // Check attempt limit
      if (error.attempts >= this.maxAttempts) {
        console.log('❌ Max fix attempts reached');
        return;
      }

      // Analyze with Claude
      console.log('🧠 Analyzing error with Claude...');
      const analysis = await this.analyzeWithClaude(error);
      
      console.log(`📊 Analysis: ${analysis.analysis}`);
      console.log(`🎯 Confidence: ${analysis.confidence}`);
      console.log(`🔧 Fixes to apply: ${analysis.fixes.length}`);

      // Execute fixes if confidence is high enough
      if (analysis.confidence >= 0.6 && analysis.fixes.length > 0) {
        console.log('⚡ Executing fixes...');
        
        const result = await this.executeFixes(
          errorId,
          analysis.fixes,
          analysis.analysis
        );

        if (result.success) {
          console.log('✅ Fixes applied successfully!');
          if (result.summary.commitHash) {
            console.log(`📦 Commit: ${result.summary.commitHash}`);
          }
        } else {
          console.log('❌ Some fixes failed');
          console.log(result.summary);
        }
      } else {
        console.log('⚠️ Low confidence or no fixes available');
        console.log('📝 Manual intervention may be required');
      }

    } catch (error) {
      console.error('💥 Auto-fix failed:', error);
    }
  }
}

// Main execution
async function main() {
  const errorId = process.argv[2];
  
  if (!errorId) {
    console.error('Usage: claude-auto-fix.js <error-id>');
    process.exit(1);
  }

  if (!ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  const fixer = new ClaudeAutoFixer();
  await fixer.processError(errorId);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = ClaudeAutoFixer;