import crypto from 'crypto';
import { NextRequest } from 'next/server';

// Webhook configuration
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'webhook-secret-change-in-production';
const SIGNATURE_HEADER = 'X-Webhook-Signature';
const TIMESTAMP_HEADER = 'X-Webhook-Timestamp';
const EVENT_TYPE_HEADER = 'X-Webhook-Event';
const WEBHOOK_ID_HEADER = 'X-Webhook-Id';
const SIGNATURE_VERSION = 'v1';
const TIMESTAMP_TOLERANCE = 5 * 60 * 1000; // 5 minutes

// Webhook event types
export enum WebhookEventType {
  // User events
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  
  // Project events
  PROJECT_CREATED = 'project.created',
  PROJECT_UPDATED = 'project.updated',
  PROJECT_DELETED = 'project.deleted',
  
  // Integration events
  INTEGRATION_CONNECTED = 'integration.connected',
  INTEGRATION_DISCONNECTED = 'integration.disconnected',
  INTEGRATION_ERROR = 'integration.error',
  
  // System events
  SYSTEM_ALERT = 'system.alert',
  SYSTEM_UPDATE = 'system.update',
}

// Webhook payload
export interface WebhookPayload {
  id: string;
  timestamp: string;
  event: WebhookEventType;
  data: any;
  metadata?: Record<string, any>;
}

// Webhook configuration
export interface WebhookConfig {
  url: string;
  secret: string;
  events: WebhookEventType[];
  active: boolean;
  headers?: Record<string, string>;
  retryConfig?: {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
  };
}

// Generate webhook signature
export function generateWebhookSignature(
  payload: string,
  secret: string,
  timestamp: number
): string {
  const signatureBase = `${SIGNATURE_VERSION}:${timestamp}:${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureBase)
    .digest('hex');
  
  return `${SIGNATURE_VERSION}=${signature}`;
}

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp: number
): boolean {
  // Check timestamp tolerance
  const now = Date.now();
  if (Math.abs(now - timestamp) > TIMESTAMP_TOLERANCE) {
    return false;
  }
  
  // Generate expected signature
  const expectedSignature = generateWebhookSignature(payload, secret, timestamp);
  
  // Constant-time comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Create webhook payload
export function createWebhookPayload(
  event: WebhookEventType,
  data: any,
  metadata?: Record<string, any>
): WebhookPayload {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    event,
    data,
    metadata,
  };
}

// Send webhook
export async function sendWebhook(
  config: WebhookConfig,
  payload: WebhookPayload
): Promise<{ success: boolean; error?: string; response?: any }> {
  try {
    const payloadString = JSON.stringify(payload);
    const timestamp = Date.now();
    const signature = generateWebhookSignature(payloadString, config.secret, timestamp);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      [SIGNATURE_HEADER]: signature,
      [TIMESTAMP_HEADER]: timestamp.toString(),
      [EVENT_TYPE_HEADER]: payload.event,
      [WEBHOOK_ID_HEADER]: payload.id,
      ...config.headers,
    };
    
    const response = await fetch(config.url, {
      method: 'POST',
      headers,
      body: payloadString,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }
    
    const responseData = await response.json().catch(() => null);
    return {
      success: true,
      response: responseData,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Webhook retry logic
export async function sendWebhookWithRetry(
  config: WebhookConfig,
  payload: WebhookPayload
): Promise<{ success: boolean; attempts: number; error?: string }> {
  const retryConfig = config.retryConfig || {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
  };
  
  let attempts = 0;
  let delay = retryConfig.initialDelay;
  
  while (attempts < retryConfig.maxAttempts) {
    attempts++;
    
    const result = await sendWebhook(config, payload);
    
    if (result.success) {
      return { success: true, attempts };
    }
    
    // Don't retry on client errors (4xx)
    if (result.error?.startsWith('HTTP 4')) {
      return { success: false, attempts, error: result.error };
    }
    
    // Wait before retrying
    if (attempts < retryConfig.maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * retryConfig.backoffMultiplier, retryConfig.maxDelay);
    }
  }
  
  return {
    success: false,
    attempts,
    error: 'Max retry attempts exceeded',
  };
}

// Webhook verification middleware
export function webhookVerification(secret?: string) {
  return async function middleware(
    request: NextRequest,
    handler: (req: NextRequest, payload: any) => Promise<Response>
  ): Promise<Response> {
    const signature = request.headers.get(SIGNATURE_HEADER);
    const timestamp = request.headers.get(TIMESTAMP_HEADER);
    const eventType = request.headers.get(EVENT_TYPE_HEADER);
    
    if (!signature || !timestamp) {
      return new Response(
        JSON.stringify({ error: 'Missing webhook signature or timestamp' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const timestampNum = parseInt(timestamp);
    if (isNaN(timestampNum)) {
      return new Response(
        JSON.stringify({ error: 'Invalid timestamp' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get raw body
    const body = await request.text();
    
    // Verify signature
    const webhookSecret = secret || WEBHOOK_SECRET;
    const isValid = verifyWebhookSignature(body, signature, webhookSecret, timestampNum);
    
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse payload
    let payload: any;
    try {
      payload = JSON.parse(body);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return handler(request, payload);
  };
}

// Webhook manager
export interface WebhookManager {
  register(userId: string, config: WebhookConfig): Promise<string>;
  unregister(userId: string, webhookId: string): Promise<boolean>;
  list(userId: string): Promise<Array<WebhookConfig & { id: string }>>;
  update(userId: string, webhookId: string, config: Partial<WebhookConfig>): Promise<boolean>;
  send(event: WebhookEventType, data: any, metadata?: Record<string, any>): Promise<void>;
}

// In-memory webhook manager (for development)
export class InMemoryWebhookManager implements WebhookManager {
  private webhooks: Map<string, WebhookConfig & { id: string; userId: string }> = new Map();
  
  async register(userId: string, config: WebhookConfig): Promise<string> {
    const id = crypto.randomUUID();
    this.webhooks.set(id, { ...config, id, userId });
    return id;
  }
  
  async unregister(userId: string, webhookId: string): Promise<boolean> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook || webhook.userId !== userId) {
      return false;
    }
    
    this.webhooks.delete(webhookId);
    return true;
  }
  
  async list(userId: string): Promise<Array<WebhookConfig & { id: string }>> {
    const userWebhooks: Array<WebhookConfig & { id: string }> = [];
    
    for (const webhook of this.webhooks.values()) {
      if (webhook.userId === userId) {
        const { userId: _, ...config } = webhook;
        userWebhooks.push(config);
      }
    }
    
    return userWebhooks;
  }
  
  async update(
    userId: string,
    webhookId: string,
    updates: Partial<WebhookConfig>
  ): Promise<boolean> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook || webhook.userId !== userId) {
      return false;
    }
    
    Object.assign(webhook, updates);
    return true;
  }
  
  async send(
    event: WebhookEventType,
    data: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    const payload = createWebhookPayload(event, data, metadata);
    
    // Send to all active webhooks that subscribe to this event
    const promises: Promise<any>[] = [];
    
    for (const webhook of this.webhooks.values()) {
      if (webhook.active && webhook.events.includes(event)) {
        promises.push(
          sendWebhookWithRetry(webhook, payload).catch(error => {
            console.error(`Failed to send webhook ${webhook.id}:`, error);
          })
        );
      }
    }
    
    await Promise.all(promises);
  }
}

// Global webhook manager
let webhookManager: WebhookManager;

export function initializeWebhookManager(manager?: WebhookManager): void {
  webhookManager = manager || new InMemoryWebhookManager();
}

export function getWebhookManager(): WebhookManager {
  if (!webhookManager) {
    initializeWebhookManager();
  }
  return webhookManager;
}

// Webhook testing utilities
export function createTestWebhookPayload(
  event: WebhookEventType = WebhookEventType.USER_CREATED
): WebhookPayload {
  return createWebhookPayload(event, {
    id: 'test-123',
    email: 'test@example.com',
    name: 'Test User',
  }, {
    source: 'test',
    version: '1.0.0',
  });
}

export function simulateWebhookRequest(
  payload: WebhookPayload,
  secret: string = WEBHOOK_SECRET
): Request {
  const payloadString = JSON.stringify(payload);
  const timestamp = Date.now();
  const signature = generateWebhookSignature(payloadString, secret, timestamp);
  
  return new Request('http://localhost/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [SIGNATURE_HEADER]: signature,
      [TIMESTAMP_HEADER]: timestamp.toString(),
      [EVENT_TYPE_HEADER]: payload.event,
      [WEBHOOK_ID_HEADER]: payload.id,
    },
    body: payloadString,
  });
}