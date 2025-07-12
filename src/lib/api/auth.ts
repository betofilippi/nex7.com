import { NextRequest } from 'next/server';
import crypto from 'crypto';

export interface APIKey {
  id: string;
  key: string;
  name: string;
  userId: string;
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
  permissions: string[];
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
}

export class APIKeyManager {
  private keys: Map<string, APIKey> = new Map();
  private storageKey = 'nex7:api-keys';

  constructor() {
    this.loadFromStorage();
  }

  generateAPIKey(): string {
    const prefix = 'nex7_';
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return `${prefix}${randomBytes}`;
  }

  async createAPIKey(
    userId: string,
    name: string,
    tier: APIKey['tier'] = 'free',
    permissions: string[] = [],
    expiresAt?: Date
  ): Promise<APIKey> {
    const key = this.generateAPIKey();
    const apiKey: APIKey = {
      id: crypto.randomUUID(),
      key,
      name,
      userId,
      tier,
      permissions,
      createdAt: new Date(),
      expiresAt,
    };

    this.keys.set(key, apiKey);
    this.saveToStorage();

    return apiKey;
  }

  async validateAPIKey(key: string): Promise<APIKey | null> {
    const apiKey = this.keys.get(key);
    
    if (!apiKey) {
      return null;
    }

    // Check if expired
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      return null;
    }

    // Update last used
    apiKey.lastUsedAt = new Date();
    this.saveToStorage();

    return apiKey;
  }

  async revokeAPIKey(key: string): Promise<void> {
    this.keys.delete(key);
    this.saveToStorage();
  }

  async getUserAPIKeys(userId: string): Promise<APIKey[]> {
    return Array.from(this.keys.values()).filter(k => k.userId === userId);
  }

  async rotateAPIKey(oldKey: string): Promise<APIKey | null> {
    const oldApiKey = this.keys.get(oldKey);
    if (!oldApiKey) {
      return null;
    }

    // Create new key with same properties
    const newApiKey = await this.createAPIKey(
      oldApiKey.userId,
      oldApiKey.name,
      oldApiKey.tier,
      oldApiKey.permissions,
      oldApiKey.expiresAt
    );

    // Revoke old key
    await this.revokeAPIKey(oldKey);

    return newApiKey;
  }

  hasPermission(apiKey: APIKey, permission: string): boolean {
    return apiKey.permissions.includes(permission) || apiKey.permissions.includes('*');
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const keys = JSON.parse(data);
        this.keys = new Map(
          keys.map((k: APIKey) => [
            k.key,
            {
              ...k,
              createdAt: new Date(k.createdAt),
              lastUsedAt: k.lastUsedAt ? new Date(k.lastUsedAt) : undefined,
              expiresAt: k.expiresAt ? new Date(k.expiresAt) : undefined,
            },
          ])
        );
      }
    } catch (error) {
      console.error('Error loading API keys from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const keys = Array.from(this.keys.values());
      localStorage.setItem(this.storageKey, JSON.stringify(keys));
    } catch (error) {
      console.error('Error saving API keys to storage:', error);
    }
  }
}

// Middleware helper
export async function authenticateAPIRequest(
  request: NextRequest,
  manager: APIKeyManager
): Promise<{ success: boolean; apiKey?: APIKey; error?: string }> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return {
      success: false,
      error: 'Missing Authorization header',
    };
  }

  const [type, key] = authHeader.split(' ');
  
  if (type !== 'Bearer' || !key) {
    return {
      success: false,
      error: 'Invalid Authorization format. Use: Bearer YOUR_API_KEY',
    };
  }

  const apiKey = await manager.validateAPIKey(key);
  
  if (!apiKey) {
    return {
      success: false,
      error: 'Invalid or expired API key',
    };
  }

  return {
    success: true,
    apiKey,
  };
}

// Permission constants
export const APIPermissions = {
  // Project permissions
  PROJECT_READ: 'project:read',
  PROJECT_WRITE: 'project:write',
  PROJECT_DELETE: 'project:delete',
  
  // AI permissions
  AI_CHAT: 'ai:chat',
  AI_GENERATE: 'ai:generate',
  AI_ANALYZE: 'ai:analyze',
  
  // Data permissions
  DATA_READ: 'data:read',
  DATA_WRITE: 'data:write',
  DATA_EXPORT: 'data:export',
  
  // User permissions
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  
  // Analytics permissions
  ANALYTICS_READ: 'analytics:read',
  
  // Admin permissions
  ADMIN_ALL: '*',
};