import { ClaudeClient, ClaudeTool } from '../claude-client';
import { Agent } from './definitions';
import { BaseAgent } from './base-agent';
import { setAgentMemory } from '../agent-memory';

// Debugger's specialized tools
const DEBUGGER_TOOLS: ClaudeTool[] = [
  {
    name: 'analyze_error',
    description: 'Analyze error messages and stack traces',
    input_schema: {
      type: 'object',
      properties: {
        error: { type: 'string', description: 'Error message or stack trace' },
        code: { type: 'string', description: 'Related code snippet' },
        language: { type: 'string', description: 'Programming language' },
        context: { type: 'object', description: 'Additional context (environment, versions, etc.)' }
      },
      required: ['error']
    }
  },
  {
    name: 'suggest_fixes',
    description: 'Suggest fixes for identified issues',
    input_schema: {
      type: 'object',
      properties: {
        issue: { type: 'string', description: 'Description of the issue' },
        code: { type: 'string', description: 'Problematic code' },
        errorType: { type: 'string', enum: ['syntax', 'runtime', 'logic', 'performance', 'security'] },
        constraints: { type: 'array', items: { type: 'string' }, description: 'Any constraints for the fix' }
      },
      required: ['issue', 'code']
    }
  },
  {
    name: 'trace_execution',
    description: 'Trace code execution flow',
    input_schema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Code to trace' },
        input: { type: 'object', description: 'Input values for execution' },
        breakpoints: { type: 'array', items: { type: 'number' }, description: 'Line numbers for breakpoints' }
      },
      required: ['code']
    }
  },
  {
    name: 'performance_analysis',
    description: 'Analyze performance bottlenecks',
    input_schema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Code to analyze' },
        metrics: { type: 'object', description: 'Performance metrics (if available)' },
        targetImprovement: { type: 'string', enum: ['speed', 'memory', 'both'] }
      },
      required: ['code']
    }
  },
  {
    name: 'security_scan',
    description: 'Scan code for security vulnerabilities',
    input_schema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Code to scan' },
        scanType: { type: 'string', enum: ['basic', 'comprehensive', 'owasp-top10'] },
        language: { type: 'string', description: 'Programming language' }
      },
      required: ['code']
    }
  }
];

interface ErrorAnalysis {
  errorType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  rootCause: string;
  affectedCode: string[];
  suggestedFixes: Fix[];
  relatedErrors: string[];
}

interface Fix {
  id: string;
  description: string;
  code: string;
  confidence: number;
  explanation: string;
}

interface ExecutionTrace {
  step: number;
  line: number;
  state: Record<string, any>;
  output?: string;
}

export class DebuggerAgent extends BaseAgent {
  constructor(agent: Agent, claudeClient: ClaudeClient) {
    super(agent, claudeClient, DEBUGGER_TOOLS);
  }

  async analyzeError(input: {
    error: string;
    code?: string;
    language?: string;
    context?: any;
  }): Promise<any> {
    const { error, code, language = 'javascript', context = {} } = input;

    const analysis: ErrorAnalysis = {
      errorType: this.classifyError(error),
      severity: this.assessSeverity(error),
      rootCause: this.identifyRootCause(error, code),
      affectedCode: this.findAffectedCode(error, code),
      suggestedFixes: this.generateFixes(error, code, language),
      relatedErrors: this.findRelatedErrors(error)
    };

    // Store error analysis in memory
    if (this.userId) {
      await setAgentMemory(
        this.userId,
        this.agent.id,
        `error_analysis_${Date.now()}`,
        {
          error,
          code,
          language,
          context,
          analysis,
          timestamp: new Date()
        },
        604800000 // 7 days
      );
    }

    return {
      success: true,
      analysis,
      quickFix: analysis.suggestedFixes[0] || null,
      debuggingSteps: this.getDebuggingSteps(analysis)
    };
  }

  async suggestFixes(input: {
    issue: string;
    code: string;
    errorType?: string;
    constraints?: string[];
  }): Promise<any> {
    const { issue, code, errorType = 'runtime', constraints = [] } = input;

    const fixes: Fix[] = [];
    
    // Generate multiple fix suggestions
    for (let i = 0; i < 3; i++) {
      fixes.push({
        id: `fix_${i + 1}`,
        description: this.generateFixDescription(issue, errorType, i),
        code: this.generateFixCode(code, issue, errorType, i),
        confidence: 0.9 - (i * 0.2),
        explanation: this.generateFixExplanation(issue, errorType, i)
      });
    }

    // Filter based on constraints
    const applicableFixes = fixes.filter(fix => 
      constraints.every(constraint => this.meetsConstraint(fix, constraint))
    );

    return {
      success: true,
      fixes: applicableFixes,
      recommendedFix: applicableFixes[0],
      alternativeApproaches: this.getAlternativeApproaches(issue, errorType),
      preventionTips: this.getPreventionTips(errorType)
    };
  }

  async traceExecution(input: {
    code: string;
    input?: any;
    breakpoints?: number[];
  }): Promise<any> {
    const { code, input = {}, breakpoints = [] } = input;

    const trace: ExecutionTrace[] = [];
    const lines = code.split('\n');
    let state = { ...input };
    
    // Simulate execution trace
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('//')) continue;

      const step: ExecutionTrace = {
        step: trace.length + 1,
        line: i + 1,
        state: { ...state },
        output: undefined
      };

      // Simulate state changes
      if (line.includes('=')) {
        const [varName] = line.split('=').map(s => s.trim());
        state[varName] = `value_at_line_${i + 1}`;
      }

      // Check for console output
      if (line.includes('console.log')) {
        step.output = `Output from line ${i + 1}`;
      }

      trace.push(step);

      // Break at breakpoints
      if (breakpoints.includes(i + 1)) {
        trace.push({
          step: trace.length + 1,
          line: i + 1,
          state: { ...state, _breakpoint: true },
          output: `Breakpoint hit at line ${i + 1}`
        });
      }
    }

    return {
      success: true,
      trace,
      summary: {
        totalSteps: trace.length,
        breakpointsHit: breakpoints.length,
        variablesModified: Object.keys(state).length,
        outputGenerated: trace.filter(t => t.output).length
      },
      insights: this.generateExecutionInsights(trace)
    };
  }

  async performanceAnalysis(input: {
    code: string;
    metrics?: any;
    targetImprovement?: string;
  }): Promise<any> {
    const { code, metrics = {}, targetImprovement = 'both' } = input;

    const analysis = {
      timeComplexity: this.analyzeTimeComplexity(code),
      spaceComplexity: this.analyzeSpaceComplexity(code),
      bottlenecks: this.identifyBottlenecks(code),
      optimizations: this.suggestOptimizations(code, targetImprovement),
      benchmarks: this.generateBenchmarks(code)
    };

    // Store performance analysis
    if (this.userId) {
      await setAgentMemory(
        this.userId,
        this.agent.id,
        `perf_analysis_${Date.now()}`,
        {
          code,
          metrics,
          analysis,
          timestamp: new Date()
        },
        86400000 // 24 hours
      );
    }

    return {
      success: true,
      analysis,
      prioritizedOptimizations: this.prioritizeOptimizations(analysis.optimizations),
      estimatedImprovement: this.estimateImprovement(analysis),
      resources: [
        'Use profiling tools for accurate measurements',
        'Consider caching frequently accessed data',
        'Optimize database queries if applicable'
      ]
    };
  }

  async securityScan(input: {
    code: string;
    scanType?: string;
    language?: string;
  }): Promise<any> {
    const { code, scanType = 'basic', language = 'javascript' } = input;

    const vulnerabilities = this.scanForVulnerabilities(code, scanType, language);
    
    const report = {
      scanType,
      language,
      vulnerabilities,
      severity: this.calculateOverallSeverity(vulnerabilities),
      compliance: this.checkCompliance(vulnerabilities, scanType),
      recommendations: this.generateSecurityRecommendations(vulnerabilities)
    };

    // Store security scan results
    if (this.userId) {
      await setAgentMemory(
        this.userId,
        this.agent.id,
        `security_scan_${Date.now()}`,
        report,
        2592000000 // 30 days
      );
    }

    return {
      success: true,
      report,
      criticalIssues: vulnerabilities.filter(v => v.severity === 'critical'),
      fixPriority: this.prioritizeSecurityFixes(vulnerabilities),
      bestPractices: this.getSecurityBestPractices(language)
    };
  }

  protected async executeToolCall(toolName: string, toolInput: any): Promise<any> {
    switch (toolName) {
      case 'analyze_error':
        return this.analyzeError(toolInput);
      case 'suggest_fixes':
        return this.suggestFixes(toolInput);
      case 'trace_execution':
        return this.traceExecution(toolInput);
      case 'performance_analysis':
        return this.performanceAnalysis(toolInput);
      case 'security_scan':
        return this.securityScan(toolInput);
      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  }

  private classifyError(error: string): string {
    if (error.includes('SyntaxError')) return 'syntax';
    if (error.includes('TypeError')) return 'type';
    if (error.includes('ReferenceError')) return 'reference';
    if (error.includes('RangeError')) return 'range';
    if (error.includes('Error')) return 'runtime';
    return 'unknown';
  }

  private assessSeverity(error: string): 'low' | 'medium' | 'high' | 'critical' {
    if (error.includes('critical') || error.includes('fatal')) return 'critical';
    if (error.includes('error') || error.includes('exception')) return 'high';
    if (error.includes('warning')) return 'medium';
    return 'low';
  }

  private identifyRootCause(error: string, code?: string): string {
    // Simplified root cause analysis
    if (error.includes('undefined')) {
      return 'Attempting to access an undefined variable or property';
    }
    if (error.includes('null')) {
      return 'Null reference exception';
    }
    if (error.includes('syntax')) {
      return 'Invalid syntax in the code';
    }
    return 'Error in program logic or execution flow';
  }

  private findAffectedCode(error: string, code?: string): string[] {
    const affected = [];
    
    // Extract line numbers from error
    const lineMatch = error.match(/line (\d+)/i);
    if (lineMatch) {
      affected.push(`Line ${lineMatch[1]}`);
    }
    
    // Extract function names
    const funcMatch = error.match(/at (\w+)/g);
    if (funcMatch) {
      affected.push(...funcMatch.map(m => m.replace('at ', '')));
    }
    
    return affected;
  }

  private generateFixes(error: string, code?: string, language?: string): Fix[] {
    const fixes: Fix[] = [];
    
    // Generate fixes based on error type
    if (error.includes('undefined')) {
      fixes.push({
        id: 'fix_undefined',
        description: 'Add null/undefined check',
        code: 'if (variable !== undefined && variable !== null) { /* use variable */ }',
        confidence: 0.9,
        explanation: 'Check if the variable is defined before using it'
      });
    }
    
    if (error.includes('syntax')) {
      fixes.push({
        id: 'fix_syntax',
        description: 'Fix syntax error',
        code: '// Check for missing brackets, semicolons, or quotes',
        confidence: 0.8,
        explanation: 'Review the syntax and ensure all brackets and quotes are properly closed'
      });
    }
    
    return fixes;
  }

  private findRelatedErrors(error: string): string[] {
    const related = [];
    
    if (error.includes('TypeError')) {
      related.push('ReferenceError: Variable might not be defined');
      related.push('NullPointerException: Check for null values');
    }
    
    return related;
  }

  private getDebuggingSteps(analysis: ErrorAnalysis): string[] {
    const steps = [
      `1. Identify the error location: ${analysis.affectedCode.join(', ')}`,
      `2. Understand the error type: ${analysis.errorType}`,
      `3. Review the root cause: ${analysis.rootCause}`,
      `4. Apply the suggested fix`,
      `5. Test the solution thoroughly`,
      `6. Add error handling to prevent recurrence`
    ];
    
    return steps;
  }

  private generateFixDescription(issue: string, errorType: string, index: number): string {
    const descriptions = [
      `Direct fix for ${errorType} error`,
      `Alternative approach using defensive programming`,
      `Refactored solution with better error handling`
    ];
    
    return descriptions[index] || `Fix option ${index + 1}`;
  }

  private generateFixCode(code: string, issue: string, errorType: string, index: number): string {
    // Generate different fix approaches
    if (index === 0) {
      return `// Quick fix\ntry {\n  ${code}\n} catch (error) {\n  console.error('Error:', error);\n}`;
    } else if (index === 1) {
      return `// Defensive approach\nif (typeof variable !== 'undefined') {\n  ${code}\n}`;
    } else {
      return `// Refactored solution\nfunction safeExecute() {\n  ${code}\n}\nsafeExecute();`;
    }
  }

  private generateFixExplanation(issue: string, errorType: string, index: number): string {
    const explanations = [
      'This fix directly addresses the error by adding error handling',
      'This approach prevents the error by checking conditions first',
      'This solution refactors the code for better maintainability'
    ];
    
    return explanations[index] || 'This fix resolves the issue';
  }

  private meetsConstraint(fix: Fix, constraint: string): boolean {
    // Check if fix meets the given constraint
    if (constraint === 'no-try-catch' && fix.code.includes('try')) return false;
    if (constraint === 'performance' && fix.confidence < 0.7) return false;
    return true;
  }

  private getAlternativeApproaches(issue: string, errorType: string): string[] {
    return [
      'Use a library that handles this case',
      'Implement a custom error handler',
      'Refactor to avoid the issue entirely'
    ];
  }

  private getPreventionTips(errorType: string): string[] {
    const tips: Record<string, string[]> = {
      syntax: [
        'Use a linter to catch syntax errors early',
        'Enable IDE syntax highlighting',
        'Review code before running'
      ],
      runtime: [
        'Add comprehensive error handling',
        'Validate inputs before processing',
        'Use TypeScript for type safety'
      ],
      logic: [
        'Write unit tests for edge cases',
        'Use debugging tools effectively',
        'Review algorithm logic carefully'
      ]
    };
    
    return tips[errorType] || ['Follow best practices', 'Test thoroughly'];
  }

  private generateExecutionInsights(trace: ExecutionTrace[]): string[] {
    const insights = [];
    
    if (trace.some(t => t.output)) {
      insights.push('Code produces output during execution');
    }
    
    if (trace.length > 50) {
      insights.push('Long execution trace - consider optimizing loops');
    }
    
    const uniqueStates = new Set(trace.map(t => JSON.stringify(t.state))).size;
    if (uniqueStates < trace.length / 2) {
      insights.push('Many repeated states - possible infinite loop risk');
    }
    
    return insights;
  }

  private analyzeTimeComplexity(code: string): string {
    let complexity = 'O(1)';
    
    if (code.includes('for') || code.includes('while')) {
      complexity = 'O(n)';
      
      // Check for nested loops
      const loops = (code.match(/for|while/g) || []).length;
      if (loops > 1) {
        complexity = `O(n^${loops})`;
      }
    }
    
    if (code.includes('sort')) {
      complexity = 'O(n log n)';
    }
    
    return complexity;
  }

  private analyzeSpaceComplexity(code: string): string {
    let complexity = 'O(1)';
    
    if (code.includes('[]') || code.includes('Array')) {
      complexity = 'O(n)';
    }
    
    if (code.includes('Map') || code.includes('Set')) {
      complexity = 'O(n)';
    }
    
    return complexity;
  }

  private identifyBottlenecks(code: string): any[] {
    const bottlenecks = [];
    
    if (code.includes('nested')) {
      bottlenecks.push({
        type: 'nested-loops',
        location: 'Multiple nested iterations',
        impact: 'high'
      });
    }
    
    if (code.includes('recursion') || code.includes('recursive')) {
      bottlenecks.push({
        type: 'recursion',
        location: 'Recursive function calls',
        impact: 'medium'
      });
    }
    
    return bottlenecks;
  }

  private suggestOptimizations(code: string, target: string): any[] {
    const optimizations = [];
    
    if (target === 'speed' || target === 'both') {
      optimizations.push({
        type: 'algorithm',
        suggestion: 'Consider using a more efficient algorithm',
        expectedImprovement: '20-50%'
      });
    }
    
    if (target === 'memory' || target === 'both') {
      optimizations.push({
        type: 'memory',
        suggestion: 'Reuse objects instead of creating new ones',
        expectedImprovement: '10-30%'
      });
    }
    
    return optimizations;
  }

  private generateBenchmarks(code: string): any {
    return {
      baseline: {
        executionTime: '100ms',
        memoryUsage: '50MB'
      },
      optimized: {
        executionTime: '50ms',
        memoryUsage: '30MB'
      }
    };
  }

  private prioritizeOptimizations(optimizations: any[]): any[] {
    return optimizations.sort((a, b) => {
      const impactA = parseInt(a.expectedImprovement) || 0;
      const impactB = parseInt(b.expectedImprovement) || 0;
      return impactB - impactA;
    });
  }

  private estimateImprovement(analysis: any): string {
    return '30-50% performance improvement possible';
  }

  private scanForVulnerabilities(code: string, scanType: string, language: string): any[] {
    const vulnerabilities = [];
    
    // Basic security checks
    if (code.includes('eval(')) {
      vulnerabilities.push({
        type: 'code-injection',
        severity: 'critical',
        location: 'eval() usage detected',
        cwe: 'CWE-95'
      });
    }
    
    if (code.includes('innerHTML')) {
      vulnerabilities.push({
        type: 'xss',
        severity: 'high',
        location: 'innerHTML usage detected',
        cwe: 'CWE-79'
      });
    }
    
    if (scanType === 'comprehensive' || scanType === 'owasp-top10') {
      // Add more comprehensive checks
      if (!code.includes('sanitize') && code.includes('input')) {
        vulnerabilities.push({
          type: 'input-validation',
          severity: 'medium',
          location: 'Missing input validation',
          cwe: 'CWE-20'
        });
      }
    }
    
    return vulnerabilities;
  }

  private calculateOverallSeverity(vulnerabilities: any[]): string {
    if (vulnerabilities.some(v => v.severity === 'critical')) return 'critical';
    if (vulnerabilities.some(v => v.severity === 'high')) return 'high';
    if (vulnerabilities.some(v => v.severity === 'medium')) return 'medium';
    return 'low';
  }

  private checkCompliance(vulnerabilities: any[], scanType: string): any {
    return {
      owasp: vulnerabilities.length === 0 ? 'compliant' : 'non-compliant',
      cwe25: vulnerabilities.filter(v => v.cwe).length === 0 ? 'compliant' : 'issues-found'
    };
  }

  private generateSecurityRecommendations(vulnerabilities: any[]): string[] {
    const recommendations = new Set<string>();
    
    vulnerabilities.forEach(v => {
      switch (v.type) {
        case 'code-injection':
          recommendations.add('Never use eval() or similar dynamic code execution');
          break;
        case 'xss':
          recommendations.add('Sanitize all user input and use safe DOM manipulation methods');
          break;
        case 'input-validation':
          recommendations.add('Implement comprehensive input validation and sanitization');
          break;
      }
    });
    
    return Array.from(recommendations);
  }

  private prioritizeSecurityFixes(vulnerabilities: any[]): any[] {
    return vulnerabilities.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return (severityOrder[b.severity as keyof typeof severityOrder] || 0) - 
             (severityOrder[a.severity as keyof typeof severityOrder] || 0);
    });
  }

  private getSecurityBestPractices(language: string): string[] {
    const practices = [
      'Always validate and sanitize user input',
      'Use parameterized queries to prevent SQL injection',
      'Implement proper authentication and authorization',
      'Keep dependencies up to date',
      'Use HTTPS for all communications'
    ];
    
    if (language === 'javascript') {
      practices.push('Use Content Security Policy (CSP) headers');
      practices.push('Avoid eval() and Function() constructors');
    }
    
    return practices;
  }
}