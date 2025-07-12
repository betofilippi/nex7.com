import { NextRequest } from 'next/server';
import crypto from 'crypto';

// Audit event types
export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'auth.login.success',
  LOGIN_FAILURE = 'auth.login.failure',
  LOGOUT = 'auth.logout',
  PASSWORD_RESET_REQUEST = 'auth.password_reset.request',
  PASSWORD_RESET_SUCCESS = 'auth.password_reset.success',
  PASSWORD_CHANGE = 'auth.password.change',
  
  // User management
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_ROLE_CHANGED = 'user.role.changed',
  
  // Data access
  DATA_ACCESS = 'data.access',
  DATA_EXPORT = 'data.export',
  DATA_IMPORT = 'data.import',
  
  // Security events
  PERMISSION_DENIED = 'security.permission.denied',
  RATE_LIMIT_EXCEEDED = 'security.rate_limit.exceeded',
  SUSPICIOUS_ACTIVITY = 'security.suspicious.activity',
  API_KEY_CREATED = 'security.api_key.created',
  API_KEY_REVOKED = 'security.api_key.revoked',
  
  // System events
  CONFIG_CHANGED = 'system.config.changed',
  SERVICE_STARTED = 'system.service.started',
  SERVICE_STOPPED = 'system.service.stopped',
  
  // Integration events
  WEBHOOK_SENT = 'integration.webhook.sent',
  WEBHOOK_FAILED = 'integration.webhook.failed',
  API_CALL = 'integration.api.call',
}

// Audit log entry
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  resourceId?: string;
  action?: string;
  result: 'success' | 'failure';
  metadata?: Record<string, any>;
  errorMessage?: string;
  duration?: number; // in milliseconds
}

// Audit logger interface
export interface IAuditLogger {
  log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void>;
  query(filters: AuditQueryFilters): Promise<AuditLogEntry[]>;
  cleanup(olderThanDays: number): Promise<number>;
}

// Query filters for audit logs
export interface AuditQueryFilters {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  eventType?: AuditEventType | AuditEventType[];
  resource?: string;
  result?: 'success' | 'failure';
  limit?: number;
  offset?: number;
}

// In-memory audit logger (for development/testing)
export class InMemoryAuditLogger implements IAuditLogger {
  private logs: AuditLogEntry[] = [];
  private maxLogs: number = 10000;
  
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const logEntry: AuditLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    
    this.logs.unshift(logEntry);
    
    // Trim logs if exceeds max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }
  
  async query(filters: AuditQueryFilters): Promise<AuditLogEntry[]> {
    let results = [...this.logs];
    
    // Apply filters
    if (filters.startDate) {
      results = results.filter(log => log.timestamp >= filters.startDate!);
    }
    if (filters.endDate) {
      results = results.filter(log => log.timestamp <= filters.endDate!);
    }
    if (filters.userId) {
      results = results.filter(log => log.userId === filters.userId);
    }
    if (filters.eventType) {
      const types = Array.isArray(filters.eventType) ? filters.eventType : [filters.eventType];
      results = results.filter(log => types.includes(log.eventType));
    }
    if (filters.resource) {
      results = results.filter(log => log.resource === filters.resource);
    }
    if (filters.result) {
      results = results.filter(log => log.result === filters.result);
    }
    
    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 100;
    results = results.slice(offset, offset + limit);
    
    return results;
  }
  
  async cleanup(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const originalLength = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp > cutoffDate);
    
    return originalLength - this.logs.length;
  }
}

// File-based audit logger (for production)
export class FileAuditLogger implements IAuditLogger {
  private logDir: string;
  private currentFile: string;
  
  constructor(logDir: string = './logs/audit') {
    this.logDir = logDir;
    this.currentFile = this.getLogFileName();
  }
  
  private getLogFileName(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${this.logDir}/audit-${year}-${month}-${day}.jsonl`;
  }
  
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const logEntry: AuditLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    
    // In production, write to file or send to logging service
    // For now, just console.log
    console.log('[AUDIT]', JSON.stringify(logEntry));
  }
  
  async query(filters: AuditQueryFilters): Promise<AuditLogEntry[]> {
    // In production, read from files or query logging service
    // For now, return empty array
    return [];
  }
  
  async cleanup(olderThanDays: number): Promise<number> {
    // In production, delete old log files
    // For now, return 0
    return 0;
  }
}

// Global audit logger instance
let auditLogger: IAuditLogger;

// Initialize audit logger
export function initializeAuditLogger(logger?: IAuditLogger): void {
  if (logger) {
    auditLogger = logger;
  } else {
    // Use in-memory logger for development, file logger for production
    auditLogger = process.env.NODE_ENV === 'production' 
      ? new FileAuditLogger() 
      : new InMemoryAuditLogger();
  }
}

// Get audit logger instance
export function getAuditLogger(): IAuditLogger {
  if (!auditLogger) {
    initializeAuditLogger();
  }
  return auditLogger;
}

// Helper functions for common audit scenarios
export async function auditLogin(
  userId: string,
  email: string,
  ipAddress: string,
  userAgent: string,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  await getAuditLogger().log({
    eventType: success ? AuditEventType.LOGIN_SUCCESS : AuditEventType.LOGIN_FAILURE,
    userId: success ? userId : undefined,
    userEmail: email,
    ipAddress,
    userAgent,
    result: success ? 'success' : 'failure',
    errorMessage,
  });
}

export async function auditDataAccess(
  userId: string,
  resource: string,
  resourceId: string,
  action: string,
  metadata?: Record<string, any>
): Promise<void> {
  await getAuditLogger().log({
    eventType: AuditEventType.DATA_ACCESS,
    userId,
    resource,
    resourceId,
    action,
    result: 'success',
    metadata,
  });
}

export async function auditSecurityEvent(
  eventType: AuditEventType,
  userId?: string,
  ipAddress?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await getAuditLogger().log({
    eventType,
    userId,
    ipAddress,
    result: 'failure',
    metadata,
  });
}

// Middleware for automatic audit logging
export function auditMiddleware(options?: {
  excludePaths?: string[];
  includeBody?: boolean;
  includeHeaders?: boolean;
}) {
  const excludePaths = options?.excludePaths || ['/api/health', '/api/metrics'];
  
  return async function middleware(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<Response>
  ): Promise<Response> {
    const startTime = Date.now();
    const path = request.nextUrl.pathname;
    
    // Skip excluded paths
    if (excludePaths.some(p => path.startsWith(p))) {
      return handler(request);
    }
    
    // Extract request info
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // TODO: Extract user info from JWT token
    const userId = undefined;
    
    let response: Response;
    let error: Error | undefined;
    
    try {
      response = await handler(request);
    } catch (e) {
      error = e as Error;
      throw e;
    } finally {
      const duration = Date.now() - startTime;
      const metadata: Record<string, any> = {
        method: request.method,
        path,
        duration,
        statusCode: error ? 500 : response!.status,
      };
      
      if (options?.includeHeaders) {
        metadata.headers = Object.fromEntries(request.headers.entries());
      }
      
      // Log API call
      await getAuditLogger().log({
        eventType: AuditEventType.API_CALL,
        userId,
        ipAddress,
        userAgent,
        resource: path,
        action: request.method,
        result: error || response!.status >= 400 ? 'failure' : 'success',
        metadata,
        errorMessage: error?.message,
        duration,
      });
    }
    
    return response!;
  };
}

// Audit log viewer/exporter utilities
export async function exportAuditLogs(
  filters: AuditQueryFilters,
  format: 'json' | 'csv' = 'json'
): Promise<string> {
  const logs = await getAuditLogger().query(filters);
  
  if (format === 'json') {
    return JSON.stringify(logs, null, 2);
  }
  
  // CSV format
  const headers = [
    'id', 'timestamp', 'eventType', 'userId', 'userEmail',
    'ipAddress', 'userAgent', 'resource', 'resourceId',
    'action', 'result', 'errorMessage', 'duration'
  ];
  
  const rows = logs.map(log => [
    log.id,
    log.timestamp.toISOString(),
    log.eventType,
    log.userId || '',
    log.userEmail || '',
    log.ipAddress || '',
    log.userAgent || '',
    log.resource || '',
    log.resourceId || '',
    log.action || '',
    log.result,
    log.errorMessage || '',
    log.duration?.toString() || ''
  ]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csv;
}