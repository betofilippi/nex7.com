import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';

// API Key configuration
const API_KEY_SECRET = new TextEncoder().encode(
  process.env.API_KEY_SECRET || process.env.JWT_SECRET || 'api-key-secret-change-in-production'
);

const API_KEY_PREFIX = 'nex7_';
const API_KEY_LENGTH = 32;
const API_KEY_HEADER = 'X-API-Key';
const API_KEY_QUERY_PARAM = 'apiKey';

// API Key permissions
export enum ApiKeyPermission {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  ADMIN = 'admin',
}

// API Key scopes
export enum ApiKeyScope {
  USER = 'user',
  PROJECTS = 'projects',
  ANALYTICS = 'analytics',
  INTEGRATIONS = 'integrations',
  WEBHOOKS = 'webhooks',
  ALL = '*',
}

// API Key interface
export interface ApiKey {
  id: string;
  key: string; // The actual API key (only shown once)
  hashedKey: string; // Stored in database
  name: string;
  description?: string;
  userId: string;
  permissions: ApiKeyPermission[];
  scopes: ApiKeyScope[];
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

// API Key creation options
export interface CreateApiKeyOptions {
  name: string;
  description?: string;
  userId: string;
  permissions?: ApiKeyPermission[];
  scopes?: ApiKeyScope[];
  expiresIn?: number; // Days until expiration
  metadata?: Record<string, any>;
}

// API Key validation result
export interface ApiKeyValidationResult {
  valid: boolean;
  apiKey?: Omit<ApiKey, 'key' | 'hashedKey'>;
  error?: string;
}

// Generate a new API key
export function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(API_KEY_LENGTH);
  const key = randomBytes.toString('base64url');
  return `${API_KEY_PREFIX}${key}`;
}

// Hash API key for storage
export function hashApiKey(apiKey: string): string {
  return crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');
}

// Create a new API key
export async function createApiKey(options: CreateApiKeyOptions): Promise<ApiKey> {
  const apiKey = generateApiKey();
  const hashedKey = hashApiKey(apiKey);
  
  const now = new Date();
  const expiresAt = options.expiresIn 
    ? new Date(now.getTime() + options.expiresIn * 24 * 60 * 60 * 1000)
    : undefined;
  
  const keyData: ApiKey = {
    id: crypto.randomUUID(),
    key: apiKey,
    hashedKey,
    name: options.name,
    description: options.description,
    userId: options.userId,
    permissions: options.permissions || [ApiKeyPermission.READ],
    scopes: options.scopes || [ApiKeyScope.USER],
    expiresAt,
    lastUsedAt: undefined,
    createdAt: now,
    updatedAt: now,
    metadata: options.metadata,
  };
  
  // In production, save to database
  // For now, return the key data
  return keyData;
}

// Validate API key
export async function validateApiKey(apiKey: string): Promise<ApiKeyValidationResult> {
  // Check format
  if (!apiKey || !apiKey.startsWith(API_KEY_PREFIX)) {
    return { valid: false, error: 'Invalid API key format' };
  }
  
  const hashedKey = hashApiKey(apiKey);
  
  // In production, look up in database by hashedKey
  // For now, simulate validation
  
  // Check if expired
  // Check if revoked
  // Update lastUsedAt
  
  return {
    valid: true,
    apiKey: {
      id: 'example-id',
      name: 'Example API Key',
      userId: 'user-id',
      permissions: [ApiKeyPermission.READ],
      scopes: [ApiKeyScope.USER],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}

// Extract API key from request
export function extractApiKey(request: NextRequest): string | null {
  // Check header first
  const headerKey = request.headers.get(API_KEY_HEADER);
  if (headerKey) {
    return headerKey;
  }
  
  // Check Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const key = authHeader.substring(7);
    if (key.startsWith(API_KEY_PREFIX)) {
      return key;
    }
  }
  
  // Check query parameter
  const queryKey = request.nextUrl.searchParams.get(API_KEY_QUERY_PARAM);
  if (queryKey) {
    return queryKey;
  }
  
  return null;
}

// Check if API key has permission
export function hasPermission(
  apiKey: Omit<ApiKey, 'key' | 'hashedKey'>,
  requiredPermission: ApiKeyPermission
): boolean {
  return apiKey.permissions.includes(requiredPermission) || 
         apiKey.permissions.includes(ApiKeyPermission.ADMIN);
}

// Check if API key has scope
export function hasScope(
  apiKey: Omit<ApiKey, 'key' | 'hashedKey'>,
  requiredScope: ApiKeyScope
): boolean {
  return apiKey.scopes.includes(requiredScope) || 
         apiKey.scopes.includes(ApiKeyScope.ALL);
}

// API Key middleware
export function apiKeyAuth(options?: {
  requiredPermissions?: ApiKeyPermission[];
  requiredScopes?: ApiKeyScope[];
  optional?: boolean;
}) {
  return async function middleware(
    request: NextRequest,
    handler: (req: NextRequest, apiKey?: Omit<ApiKey, 'key' | 'hashedKey'>) => Promise<Response>
  ): Promise<Response> {
    const apiKey = extractApiKey(request);
    
    if (!apiKey) {
      if (options?.optional) {
        return handler(request);
      }
      return new Response(
        JSON.stringify({ error: 'API key required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const validation = await validateApiKey(apiKey);
    
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error || 'Invalid API key' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check permissions
    if (options?.requiredPermissions) {
      const hasAllPermissions = options.requiredPermissions.every(
        perm => hasPermission(validation.apiKey!, perm)
      );
      if (!hasAllPermissions) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Check scopes
    if (options?.requiredScopes) {
      const hasAllScopes = options.requiredScopes.every(
        scope => hasScope(validation.apiKey!, scope)
      );
      if (!hasAllScopes) {
        return new Response(
          JSON.stringify({ error: 'Insufficient scopes' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    return handler(request, validation.apiKey);
  };
}

// API Key management functions
export interface ApiKeyManager {
  create(options: CreateApiKeyOptions): Promise<ApiKey>;
  validate(apiKey: string): Promise<ApiKeyValidationResult>;
  revoke(apiKeyId: string, userId: string): Promise<boolean>;
  list(userId: string): Promise<Omit<ApiKey, 'key' | 'hashedKey'>[]>;
  update(apiKeyId: string, userId: string, updates: Partial<CreateApiKeyOptions>): Promise<boolean>;
  rotate(apiKeyId: string, userId: string): Promise<ApiKey>;
}

// In-memory API key manager (for development)
export class InMemoryApiKeyManager implements ApiKeyManager {
  private keys: Map<string, ApiKey> = new Map();
  private keysByHash: Map<string, string> = new Map(); // hashedKey -> id
  
  async create(options: CreateApiKeyOptions): Promise<ApiKey> {
    const apiKey = await createApiKey(options);
    this.keys.set(apiKey.id, apiKey);
    this.keysByHash.set(apiKey.hashedKey, apiKey.id);
    return apiKey;
  }
  
  async validate(apiKey: string): Promise<ApiKeyValidationResult> {
    const hashedKey = hashApiKey(apiKey);
    const keyId = this.keysByHash.get(hashedKey);
    
    if (!keyId) {
      return { valid: false, error: 'API key not found' };
    }
    
    const keyData = this.keys.get(keyId);
    if (!keyData) {
      return { valid: false, error: 'API key not found' };
    }
    
    // Check expiration
    if (keyData.expiresAt && keyData.expiresAt < new Date()) {
      return { valid: false, error: 'API key expired' };
    }
    
    // Update last used
    keyData.lastUsedAt = new Date();
    
    const { key, hashedKey: _, ...apiKeyInfo } = keyData;
    return { valid: true, apiKey: apiKeyInfo };
  }
  
  async revoke(apiKeyId: string, userId: string): Promise<boolean> {
    const keyData = this.keys.get(apiKeyId);
    if (!keyData || keyData.userId !== userId) {
      return false;
    }
    
    this.keys.delete(apiKeyId);
    this.keysByHash.delete(keyData.hashedKey);
    return true;
  }
  
  async list(userId: string): Promise<Omit<ApiKey, 'key' | 'hashedKey'>[]> {
    const userKeys: Omit<ApiKey, 'key' | 'hashedKey'>[] = [];
    
    for (const keyData of this.keys.values()) {
      if (keyData.userId === userId) {
        const { key, hashedKey, ...apiKeyInfo } = keyData;
        userKeys.push(apiKeyInfo);
      }
    }
    
    return userKeys;
  }
  
  async update(
    apiKeyId: string, 
    userId: string, 
    updates: Partial<CreateApiKeyOptions>
  ): Promise<boolean> {
    const keyData = this.keys.get(apiKeyId);
    if (!keyData || keyData.userId !== userId) {
      return false;
    }
    
    // Update allowed fields
    if (updates.name) keyData.name = updates.name;
    if (updates.description !== undefined) keyData.description = updates.description;
    if (updates.permissions) keyData.permissions = updates.permissions;
    if (updates.scopes) keyData.scopes = updates.scopes;
    if (updates.metadata) keyData.metadata = updates.metadata;
    
    keyData.updatedAt = new Date();
    
    return true;
  }
  
  async rotate(apiKeyId: string, userId: string): Promise<ApiKey> {
    const oldKeyData = this.keys.get(apiKeyId);
    if (!oldKeyData || oldKeyData.userId !== userId) {
      throw new Error('API key not found');
    }
    
    // Create new key with same settings
    const newKey = await this.create({
      name: oldKeyData.name,
      description: oldKeyData.description,
      userId: oldKeyData.userId,
      permissions: oldKeyData.permissions,
      scopes: oldKeyData.scopes,
      metadata: { ...oldKeyData.metadata, rotatedFrom: apiKeyId },
    });
    
    // Revoke old key
    await this.revoke(apiKeyId, userId);
    
    return newKey;
  }
}

// Global API key manager
let apiKeyManager: ApiKeyManager;

export function initializeApiKeyManager(manager?: ApiKeyManager): void {
  apiKeyManager = manager || new InMemoryApiKeyManager();
}

export function getApiKeyManager(): ApiKeyManager {
  if (!apiKeyManager) {
    initializeApiKeyManager();
  }
  return apiKeyManager;
}