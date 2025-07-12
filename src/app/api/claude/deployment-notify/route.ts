import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { kv } from '@vercel/kv';
import { claudeWebhookLimiter, getClientIdentifier } from '@/lib/rate-limiter';
import { validateClaudeRequest, createSecurityErrorResponse } from '@/lib/security/middleware';

// Store deployment errors for Claude to analyze
const DEPLOYMENT_ERROR_KEY = 'deployment-errors';
const CLAUDE_WEBHOOK_SECRET = process.env.CLAUDE_WEBHOOK_SECRET || '';

interface DeploymentError {
  id: string;
  timestamp: string;
  projectName: string;
  deploymentId: string;
  deploymentUrl?: string;
  errorType: string;
  errorMessage: string;
  errorDetails: any;
  buildLogs?: string[];
  gitCommit?: string;
  gitBranch?: string;
  status: 'pending' | 'analyzing' | 'fixing' | 'resolved' | 'failed';
  attempts: number;
  lastAttemptAt?: string;
  resolution?: {
    fixApplied: string;
    commitHash?: string;
    success: boolean;
  };
}

// Verify webhook signature if configured
function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!CLAUDE_WEBHOOK_SECRET) return true;
  
  const hash = crypto
    .createHmac('sha256', CLAUDE_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  return `sha256=${hash}` === signature;
}

// Analyze error type from logs
function analyzeErrorType(logs: string[], error: any): string {
  const logText = logs.join('\n');
  
  if (logText.includes('Type error:') || error?.message?.includes('Type error')) {
    return 'typescript';
  }
  if (logText.includes('Cannot find module') || logText.includes('Module not found')) {
    return 'missing-module';
  }
  if (logText.includes('ESLint')) {
    return 'eslint';
  }
  if (logText.includes('npm ERR!') || logText.includes('npm error')) {
    return 'npm-install';
  }
  if (logText.includes('Build failed')) {
    return 'build-failure';
  }
  if (logText.includes('out of memory')) {
    return 'memory-limit';
  }
  
  return 'unknown';
}

// Extract error details from logs
function extractErrorDetails(logs: string[]): {
  files: string[];
  lineNumbers: number[];
  errorMessages: string[];
} {
  const files = new Set<string>();
  const lineNumbers = new Set<number>();
  const errorMessages = new Set<string>();
  
  logs.forEach(log => {
    // Extract file paths
    const fileMatches = log.match(/([./][\w/-]+\.(ts|tsx|js|jsx))/g);
    if (fileMatches) {
      fileMatches.forEach(file => files.add(file));
    }
    
    // Extract line numbers
    const lineMatches = log.match(/:(\d+):/g);
    if (lineMatches) {
      lineMatches.forEach(match => {
        const num = parseInt(match.replace(/:/g, ''));
        if (!isNaN(num)) lineNumbers.add(num);
      });
    }
    
    // Extract error messages
    if (log.includes('error:') || log.includes('Error:')) {
      errorMessages.add(log);
    }
  });
  
  return {
    files: Array.from(files),
    lineNumbers: Array.from(lineNumbers).sort((a, b) => a - b),
    errorMessages: Array.from(errorMessages).slice(0, 10) // Limit to 10 messages
  };
}

export async function POST(request: NextRequest) {
  try {
    // Validate request
    const validation = validateClaudeRequest(request, false); // Webhooks may not have auth header
    if (!validation.valid) {
      return createSecurityErrorResponse(validation.error || 'Invalid request', 400);
    }
    
    // Apply rate limiting
    const clientId = getClientIdentifier(request);
    const rateLimitResult = await claudeWebhookLimiter.checkLimit(clientId, true);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter
        },
        {
          status: 429,
          headers: claudeWebhookLimiter.generateHeaders(rateLimitResult.info, rateLimitResult.retryAfter)
        }
      );
    }
    const signature = request.headers.get('x-webhook-signature');
    const body = await request.text();
    
    // Verify signature
    if (signature && !verifyWebhookSignature(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    const payload = JSON.parse(body);
    
    // Handle different webhook sources (Vercel, GitHub Actions, etc.)
    let deploymentError: DeploymentError;
    
    if (payload.type === 'deployment.error' || payload.type === 'deployment.failed') {
      // Vercel webhook format
      const errorDetails = extractErrorDetails(payload.payload.logs || []);
      
      deploymentError = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        projectName: payload.payload.project?.name || 'nex7',
        deploymentId: payload.payload.deployment?.id || payload.payload.deploymentId,
        deploymentUrl: payload.payload.deployment?.url,
        errorType: analyzeErrorType(payload.payload.logs || [], payload.payload.error),
        errorMessage: payload.payload.error?.message || 'Deployment failed',
        errorDetails: errorDetails,
        buildLogs: payload.payload.logs?.slice(-100), // Last 100 log lines
        gitCommit: payload.payload.deployment?.meta?.githubCommitSha,
        gitBranch: payload.payload.deployment?.meta?.githubCommitRef,
        status: 'pending',
        attempts: 0
      };
    } else if (payload.source === 'github-actions') {
      // GitHub Actions format
      const errorDetails = extractErrorDetails(payload.logs || []);
      
      deploymentError = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        projectName: payload.projectName || 'nex7',
        deploymentId: payload.runId,
        errorType: analyzeErrorType(payload.logs || [], payload.error),
        errorMessage: payload.error || 'Build failed',
        errorDetails: errorDetails,
        buildLogs: payload.logs?.slice(-100),
        gitCommit: payload.commit,
        gitBranch: payload.branch,
        status: 'pending',
        attempts: 0
      };
    } else {
      return NextResponse.json(
        { error: 'Unknown webhook format' },
        { status: 400 }
      );
    }
    
    // Store error for processing
    try {
      // Try to use Vercel KV if available
      await kv.lpush(DEPLOYMENT_ERROR_KEY, deploymentError);
      await kv.expire(DEPLOYMENT_ERROR_KEY, 86400); // 24 hours
    } catch (kvError) {
      // Fallback to in-memory storage or file system
      const fs = await import('fs/promises');
      const errorFile = '/tmp/deployment-errors.json';
      
      let errors: DeploymentError[] = [];
      try {
        const existing = await fs.readFile(errorFile, 'utf-8');
        errors = JSON.parse(existing);
      } catch {}
      
      errors.unshift(deploymentError);
      errors = errors.slice(0, 100); // Keep last 100 errors
      
      await fs.writeFile(errorFile, JSON.stringify(errors, null, 2));
    }
    
    // Log for monitoring
    console.log('📥 Deployment error received:', {
      id: deploymentError.id,
      type: deploymentError.errorType,
      project: deploymentError.projectName,
      message: deploymentError.errorMessage
    });
    
    // Trigger analysis if auto-fix is enabled
    if (process.env.CLAUDE_AUTO_FIX_ENABLED === 'true') {
      // Queue for processing
      setTimeout(() => {
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/claude/analyze-error`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
          },
          body: JSON.stringify({ errorId: deploymentError.id })
        }).catch(console.error);
      }, 5000); // Wait 5 seconds before analysis
    }
    
    return NextResponse.json(
      {
        success: true,
        errorId: deploymentError.id,
        message: 'Deployment error recorded for analysis'
      },
      {
        headers: claudeWebhookLimiter.generateHeaders(rateLimitResult.info)
      }
    );
    
  } catch (error) {
    console.error('Error processing deployment notification:', error);
    return NextResponse.json(
      { error: 'Failed to process notification' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve pending errors for analysis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '10');
    
    let errors: DeploymentError[] = [];
    
    try {
      // Try Vercel KV first
      const allErrors = await kv.lrange<DeploymentError>(DEPLOYMENT_ERROR_KEY, 0, -1);
      errors = allErrors.filter(e => e.status === status).slice(0, limit);
    } catch {
      // Fallback to file system
      const fs = await import('fs/promises');
      const errorFile = '/tmp/deployment-errors.json';
      
      try {
        const data = await fs.readFile(errorFile, 'utf-8');
        const allErrors = JSON.parse(data) as DeploymentError[];
        errors = allErrors.filter(e => e.status === status).slice(0, limit);
      } catch {}
    }
    
    return NextResponse.json({
      errors,
      count: errors.length,
      status
    });
    
  } catch (error) {
    console.error('Error retrieving deployment errors:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve errors' },
      { status: 500 }
    );
  }
}