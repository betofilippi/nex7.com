import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { claudeExecuteLimiter, getClientIdentifier } from '@/lib/rate-limiter';
import { validateClaudeRequest, createSecurityErrorResponse, sanitizeCommand, isPathSafe } from '@/lib/security/middleware';

const execAsync = promisify(exec);

// Security: Only allow specific commands
const ALLOWED_COMMANDS = [
  'git', 'npm', 'npx', 'node', 'cat', 'echo', 'pwd', 'ls'
];

const ALLOWED_NPM_SCRIPTS = [
  'install', 'ci', 'build', 'lint', 'lint:fix', 'type-check', 'test'
];

interface FixCommand {
  type: 'file-edit' | 'command' | 'git' | 'npm';
  action: string;
  target?: string;
  content?: string;
  options?: any;
}

interface FixRequest {
  errorId: string;
  commands: FixCommand[];
  description: string;
  reasoning: string;
}

// Validate command safety
function isCommandSafe(command: string): boolean {
  const parts = command.trim().split(' ');
  const baseCommand = parts[0];
  
  // Check if base command is allowed
  if (!ALLOWED_COMMANDS.includes(baseCommand)) {
    return false;
  }
  
  // Additional checks for specific commands
  if (baseCommand === 'git') {
    // Only allow safe git operations
    const allowedGitCommands = ['add', 'commit', 'push', 'status', 'diff', 'log'];
    if (!allowedGitCommands.includes(parts[1])) {
      return false;
    }
  }
  
  if (baseCommand === 'npm' && parts[1] === 'run') {
    // Check if npm script is allowed
    if (!ALLOWED_NPM_SCRIPTS.includes(parts[2])) {
      return false;
    }
  }
  
  // Prevent dangerous patterns
  const dangerousPatterns = [
    /rm\s+-rf/,
    /sudo/,
    /chmod\s+777/,
    /\|/,  // No pipes for now
    />/,   // No redirects
    /</,   // No input redirects
    /;/,   // No command chaining
    /&&/,  // No conditional execution
    /\|\|/ // No conditional execution
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(command));
}

// Execute a file edit
async function executeFileEdit(command: FixCommand): Promise<{ success: boolean; message: string }> {
  try {
    if (!command.target || !command.content) {
      return { success: false, message: 'Missing target or content for file edit' };
    }
    
    const filePath = path.join(process.cwd(), command.target);
    
    // Security: Ensure we're within project directory
    if (!isPathSafe(command.target, process.cwd())) {
      return { success: false, message: 'Invalid file path' };
    }
    
    // Check if file exists
    const exists = await fs.access(filePath).then(() => true).catch(() => false);
    
    if (command.action === 'create' && exists) {
      return { success: false, message: 'File already exists' };
    }
    
    if (command.action === 'edit' && !exists) {
      return { success: false, message: 'File does not exist' };
    }
    
    if (command.action === 'append') {
      const currentContent = exists ? await fs.readFile(filePath, 'utf-8') : '';
      await fs.writeFile(filePath, currentContent + command.content);
    } else {
      await fs.writeFile(filePath, command.content);
    }
    
    return { success: true, message: `File ${command.action} successful: ${command.target}` };
  } catch (error) {
    return { 
      success: false, 
      message: `File edit failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

// Execute a shell command
async function executeCommand(command: FixCommand): Promise<{ success: boolean; message: string; output?: string }> {
  try {
    if (!command.action) {
      return { success: false, message: 'No command provided' };
    }
    
    // Sanitize command
    const sanitized = sanitizeCommand(command.action);
    if (!isCommandSafe(sanitized)) {
      return { success: false, message: 'Invalid or unsafe command' };
    }
    
    const { stdout, stderr } = await execAsync(command.action, {
      cwd: process.cwd(),
      timeout: 60000, // 1 minute timeout
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
    
    return {
      success: true,
      message: `Command executed: ${command.action}`,
      output: stdout || stderr
    };
  } catch (error) {
    return {
      success: false,
      message: `Command failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// Execute git operations
async function executeGit(command: FixCommand): Promise<{ success: boolean; message: string }> {
  try {
    const gitCommands: Record<string, string> = {
      'add-all': 'git add .',
      'commit': `git commit -m "${command.options?.message || 'Auto-fix: Resolve deployment errors'}"`,
      'push': 'git push',
      'status': 'git status --porcelain'
    };
    
    const gitCommand = gitCommands[command.action] || command.action;
    
    if (!isCommandSafe(gitCommand)) {
      return { success: false, message: 'Invalid git command' };
    }
    
    const { stdout } = await execAsync(gitCommand, { cwd: process.cwd() });
    
    return {
      success: true,
      message: `Git ${command.action} completed: ${stdout}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Git operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate request
    const validation = validateClaudeRequest(request, true);
    if (!validation.valid) {
      return createSecurityErrorResponse(validation.error || 'Invalid request', 400);
    }
    
    // Apply rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await claudeExecuteLimiter.checkLimit(clientId, true);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter
        },
        {
          status: 429,
          headers: claudeExecuteLimiter.generateHeaders(rateLimitResult.info, rateLimitResult.retryAfter)
        }
      );
    }
    
    // Verify internal API key
    const authHeader = request.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '');
    
    if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const fixRequest: FixRequest = await request.json();
    
    if (!fixRequest.commands || fixRequest.commands.length === 0) {
      return NextResponse.json(
        { error: 'No commands provided' },
        { status: 400 }
      );
    }
    
    // Log the fix attempt
    console.log('🔧 Executing fix for error:', fixRequest.errorId);
    console.log('📝 Description:', fixRequest.description);
    console.log('💭 Reasoning:', fixRequest.reasoning);
    
    const results: Array<{ command: FixCommand; result: any }> = [];
    let allSuccess = true;
    
    // Execute commands in sequence
    for (const command of fixRequest.commands) {
      console.log(`⚡ Executing ${command.type}: ${command.action}`);
      
      let result;
      
      switch (command.type) {
        case 'file-edit':
          result = await executeFileEdit(command);
          break;
        
        case 'command':
        case 'npm':
          result = await executeCommand(command);
          break;
        
        case 'git':
          result = await executeGit(command);
          break;
        
        default:
          result = { success: false, message: 'Unknown command type' };
      }
      
      results.push({ command, result });
      
      if (!result.success) {
        allSuccess = false;
        console.error(`❌ Command failed: ${result.message}`);
        break; // Stop on first failure
      }
    }
    
    // Create summary
    const summary = {
      errorId: fixRequest.errorId,
      success: allSuccess,
      timestamp: new Date().toISOString(),
      description: fixRequest.description,
      results,
      commitHash: null as string | null
    };
    
    // If successful and git operations were performed, get commit hash
    if (allSuccess && fixRequest.commands.some(c => c.type === 'git' && c.action === 'commit')) {
      try {
        const { stdout } = await execAsync('git rev-parse HEAD');
        summary.commitHash = stdout.trim();
      } catch {}
    }
    
    // Store execution result
    const resultFile = `/tmp/fix-results-${fixRequest.errorId}.json`;
    await fs.writeFile(resultFile, JSON.stringify(summary, null, 2));
    
    return NextResponse.json(
      {
        success: allSuccess,
        summary,
        message: allSuccess 
          ? 'All fixes applied successfully' 
          : 'Some fixes failed, check results for details'
      },
      {
        headers: claudeExecuteLimiter.generateHeaders(rateLimitResult.info)
      }
    );
    
  } catch (error) {
    console.error('Error executing fixes:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute fixes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check fix status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const errorId = searchParams.get('errorId');
    
    if (!errorId) {
      return NextResponse.json(
        { error: 'Error ID required' },
        { status: 400 }
      );
    }
    
    const resultFile = `/tmp/fix-results-${errorId}.json`;
    
    try {
      const data = await fs.readFile(resultFile, 'utf-8');
      const result = JSON.parse(data);
      
      return NextResponse.json(result);
    } catch {
      return NextResponse.json(
        { error: 'No fix results found for this error' },
        { status: 404 }
      );
    }
    
  } catch (error) {
    console.error('Error retrieving fix results:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve results' },
      { status: 500 }
    );
  }
}