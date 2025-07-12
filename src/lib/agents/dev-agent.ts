import { ClaudeClient, ClaudeTool } from '../claude-client';
import { Agent } from './definitions';
import { BaseAgent } from './base-agent';
import { setAgentMemory } from '../agent-memory';
import * as ts from 'typescript';
import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Dev's specialized tools
const DEV_TOOLS: ClaudeTool[] = [
  {
    name: 'execute_code',
    description: 'Execute code in a sandboxed environment',
    input_schema: {
      type: 'object',
      properties: {
        language: { type: 'string', enum: ['javascript', 'typescript', 'python', 'bash'] },
        code: { type: 'string', description: 'Code to execute' },
        timeout: { type: 'number', description: 'Execution timeout in ms' }
      },
      required: ['language', 'code']
    }
  },
  {
    name: 'syntax_check',
    description: 'Check code syntax and type errors',
    input_schema: {
      type: 'object',
      properties: {
        language: { type: 'string', enum: ['javascript', 'typescript', 'python'] },
        code: { type: 'string', description: 'Code to check' },
        strict: { type: 'boolean', description: 'Use strict mode' }
      },
      required: ['language', 'code']
    }
  },
  {
    name: 'analyze_dependencies',
    description: 'Analyze project dependencies and suggest updates',
    input_schema: {
      type: 'object',
      properties: {
        packageJsonPath: { type: 'string', description: 'Path to package.json' },
        checkVulnerabilities: { type: 'boolean', description: 'Check for vulnerabilities' },
        checkOutdated: { type: 'boolean', description: 'Check for outdated packages' }
      },
      required: ['packageJsonPath']
    }
  },
  {
    name: 'generate_tests',
    description: 'Generate unit tests for a function or component',
    input_schema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Code to generate tests for' },
        framework: { type: 'string', enum: ['jest', 'mocha', 'vitest'], description: 'Test framework' },
        language: { type: 'string', enum: ['javascript', 'typescript'] }
      },
      required: ['code', 'framework']
    }
  },
  {
    name: 'refactor_code',
    description: 'Suggest code refactoring improvements',
    input_schema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Code to refactor' },
        goals: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Refactoring goals (e.g., "improve readability", "reduce complexity")'
        }
      },
      required: ['code']
    }
  }
];

export class DevAgent extends BaseAgent {
  constructor(agent: Agent, claudeClient: ClaudeClient) {
    super(agent, claudeClient, DEV_TOOLS);
  }

  async executeCode(input: { 
    language: string; 
    code: string; 
    timeout?: number 
  }): Promise<any> {
    const { language, code, timeout = 5000 } = input;
    
    try {
      let result: any;
      
      switch (language) {
        case 'javascript':
        case 'typescript':
          result = await this.executeJavaScript(code, language === 'typescript', timeout);
          break;
        case 'python':
          result = await this.executePython(code, timeout);
          break;
        case 'bash':
          result = await this.executeBash(code, timeout);
          break;
        default:
          throw new Error(`Unsupported language: ${language}`);
      }

      // Store execution in memory
      if (this.userId) {
        await setAgentMemory(
          this.userId,
          this.agent.id,
          `execution_${Date.now()}`,
          {
            language,
            code,
            result,
            timestamp: new Date()
          },
          86400000 // 24 hours
        );
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        language
      };
    }
  }

  async syntaxCheck(input: { 
    language: string; 
    code: string; 
    strict?: boolean 
  }): Promise<any> {
    const { language, code, strict = true } = input;
    
    try {
      let result: any;
      
      switch (language) {
        case 'javascript':
        case 'typescript':
          result = this.checkTypeScriptSyntax(code, language === 'typescript', strict);
          break;
        case 'python':
          result = await this.checkPythonSyntax(code);
          break;
        default:
          throw new Error(`Unsupported language: ${language}`);
      }

      return {
        success: result.errors.length === 0,
        errors: result.errors,
        warnings: result.warnings,
        language
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        language
      };
    }
  }

  async analyzeDependencies(input: { 
    packageJsonPath: string; 
    checkVulnerabilities?: boolean; 
    checkOutdated?: boolean 
  }): Promise<any> {
    const { packageJsonPath, checkVulnerabilities = true, checkOutdated = true } = input;
    
    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      const projectDir = path.dirname(packageJsonPath);
      const analysis: any = {
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {},
        issues: []
      };

      if (checkVulnerabilities) {
        try {
          const { stdout } = await execAsync('npm audit --json', { cwd: projectDir });
          const audit = JSON.parse(stdout);
          analysis.vulnerabilities = audit.vulnerabilities || {};
          analysis.vulnerabilityCount = audit.metadata?.vulnerabilities || {};
        } catch (error) {
          // npm audit might fail if no package-lock.json
          analysis.vulnerabilities = { error: 'Could not check vulnerabilities' };
        }
      }

      if (checkOutdated) {
        try {
          const { stdout } = await execAsync('npm outdated --json', { cwd: projectDir });
          analysis.outdated = stdout ? JSON.parse(stdout) : {};
        } catch (error) {
          // npm outdated returns non-zero exit code when packages are outdated
          analysis.outdated = {};
        }
      }

      // Store analysis in memory
      if (this.userId) {
        await setAgentMemory(
          this.userId,
          this.agent.id,
          `dep_analysis_${Date.now()}`,
          analysis,
          3600000 // 1 hour
        );
      }

      return analysis;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async generateTests(input: { 
    code: string; 
    framework: string; 
    language?: string 
  }): Promise<any> {
    const { code, framework, language = 'javascript' } = input;
    
    // This is a simplified example. In a real implementation,
    // you would use AST parsing to understand the code structure
    const testTemplate = this.getTestTemplate(framework, language);
    
    // Extract function names (simplified)
    const functionMatches = code.match(/(?:function|const|let|var)\s+(\w+)\s*=/g) || [];
    const functionNames = functionMatches.map(m => m.match(/(\w+)\s*=/)![1]);
    
    let tests = testTemplate.header;
    
    for (const funcName of functionNames) {
      tests += testTemplate.testCase.replace(/FUNCTION_NAME/g, funcName);
    }
    
    tests += testTemplate.footer;

    return {
      success: true,
      tests,
      framework,
      language,
      functionsFound: functionNames
    };
  }

  async refactorCode(input: { 
    code: string; 
    goals?: string[] 
  }): Promise<any> {
    const { code, goals = ['improve readability', 'reduce complexity'] } = input;
    
    const suggestions: any[] = [];
    
    // Analyze code complexity (simplified)
    const lines = code.split('\n');
    const complexity = this.calculateComplexity(code);
    
    if (complexity.cyclomatic > 10) {
      suggestions.push({
        type: 'complexity',
        message: 'Consider breaking down complex functions',
        severity: 'high'
      });
    }
    
    // Check for code patterns
    if (code.includes('var ')) {
      suggestions.push({
        type: 'modernization',
        message: 'Replace var with const/let',
        severity: 'medium'
      });
    }
    
    if (code.match(/function\s*\(/)) {
      suggestions.push({
        type: 'modernization',
        message: 'Consider using arrow functions',
        severity: 'low'
      });
    }
    
    // Store refactoring suggestions
    if (this.userId) {
      await setAgentMemory(
        this.userId,
        this.agent.id,
        `refactor_${Date.now()}`,
        {
          originalCode: code,
          suggestions,
          goals,
          timestamp: new Date()
        },
        86400000 // 24 hours
      );
    }

    return {
      success: true,
      suggestions,
      complexity,
      goals
    };
  }

  protected async executeToolCall(toolName: string, toolInput: any): Promise<any> {
    switch (toolName) {
      case 'execute_code':
        return this.executeCode(toolInput);
      case 'syntax_check':
        return this.syntaxCheck(toolInput);
      case 'analyze_dependencies':
        return this.analyzeDependencies(toolInput);
      case 'generate_tests':
        return this.generateTests(toolInput);
      case 'refactor_code':
        return this.refactorCode(toolInput);
      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  }

  private async executeJavaScript(code: string, isTypeScript: boolean, timeout: number): Promise<any> {
    // In a real implementation, this would use a sandboxed environment
    // For now, we'll simulate execution
    return {
      success: true,
      output: 'Code execution simulated',
      executionTime: Math.random() * 100,
      memoryUsed: Math.random() * 50
    };
  }

  private async executePython(code: string, timeout: number): Promise<any> {
    // Simulate Python execution
    return {
      success: true,
      output: 'Python execution simulated',
      executionTime: Math.random() * 100
    };
  }

  private async executeBash(code: string, timeout: number): Promise<any> {
    try {
      const { stdout, stderr } = await execAsync(code, { timeout });
      return {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        stdout: error.stdout?.trim(),
        stderr: error.stderr?.trim()
      };
    }
  }

  private checkTypeScriptSyntax(code: string, isTypeScript: boolean, strict: boolean): any {
    const errors: any[] = [];
    const warnings: any[] = [];
    
    // Simple syntax checks (in real implementation, use TypeScript compiler API)
    if (code.includes('===')) {
      warnings.push({
        line: 1,
        message: 'Consider using strict equality',
        severity: 'warning'
      });
    }
    
    return { errors, warnings };
  }

  private async checkPythonSyntax(code: string): Promise<any> {
    // Simulate Python syntax check
    return {
      errors: [],
      warnings: []
    };
  }

  private getTestTemplate(framework: string, language: string): any {
    const templates: any = {
      jest: {
        header: `describe('Generated Tests', () => {\n`,
        testCase: `  it('should test FUNCTION_NAME', () => {\n    // TODO: Implement test for FUNCTION_NAME\n    expect(FUNCTION_NAME).toBeDefined();\n  });\n\n`,
        footer: `});\n`
      },
      mocha: {
        header: `const { expect } = require('chai');\n\ndescribe('Generated Tests', () => {\n`,
        testCase: `  it('should test FUNCTION_NAME', () => {\n    // TODO: Implement test for FUNCTION_NAME\n    expect(FUNCTION_NAME).to.exist;\n  });\n\n`,
        footer: `});\n`
      },
      vitest: {
        header: `import { describe, it, expect } from 'vitest';\n\ndescribe('Generated Tests', () => {\n`,
        testCase: `  it('should test FUNCTION_NAME', () => {\n    // TODO: Implement test for FUNCTION_NAME\n    expect(FUNCTION_NAME).toBeDefined();\n  });\n\n`,
        footer: `});\n`
      }
    };
    
    return templates[framework] || templates.jest;
  }

  private calculateComplexity(code: string): any {
    // Simplified cyclomatic complexity calculation
    let complexity = 1;
    
    // Count decision points
    complexity += (code.match(/if\s*\(/g) || []).length;
    complexity += (code.match(/for\s*\(/g) || []).length;
    complexity += (code.match(/while\s*\(/g) || []).length;
    complexity += (code.match(/case\s+/g) || []).length;
    complexity += (code.match(/\?\s*:/g) || []).length;
    
    return {
      cyclomatic: complexity,
      lines: code.split('\n').length,
      functions: (code.match(/function/g) || []).length
    };
  }
}