import { PluginPermission } from './types';
import { toast } from '@/components/ui/use-toast';
import crypto from 'crypto';

export class PluginAPI {
  private permissions: Set<PluginPermission>;

  constructor(permissions: PluginPermission[]) {
    this.permissions = new Set(permissions);
  }

  get version() {
    return '1.0.0';
  }

  get data() {
    return {
      read: async (key: string): Promise<any> => {
        this.checkPermission(PluginPermission.READ_DATA);
        // In production, this would connect to your actual data layer
        const data = localStorage.getItem(`plugin:data:${key}`);
        return data ? JSON.parse(data) : null;
      },
      write: async (key: string, value: any): Promise<void> => {
        this.checkPermission(PluginPermission.WRITE_DATA);
        localStorage.setItem(`plugin:data:${key}`, JSON.stringify(value));
      },
      delete: async (key: string): Promise<void> => {
        this.checkPermission(PluginPermission.WRITE_DATA);
        localStorage.removeItem(`plugin:data:${key}`);
      },
    };
  }

  get ui() {
    return {
      showNotification: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
        this.checkPermission(PluginPermission.NOTIFICATIONS);
        const variant = type === 'error' ? 'destructive' : 'default';
        toast({
          title: message,
          variant,
        });
      },
      showModal: (content: any) => {
        this.checkPermission(PluginPermission.MODIFY_UI);
        // This would integrate with your modal system
        console.log('Show modal:', content);
      },
      registerComponent: (name: string, component: any) => {
        this.checkPermission(PluginPermission.MODIFY_UI);
        // This would register the component in your component registry
        console.log('Register component:', name, component);
      },
      registerPage: (path: string, component: any) => {
        this.checkPermission(PluginPermission.MODIFY_UI);
        // This would register a new route in your routing system
        console.log('Register page:', path, component);
      },
    };
  }

  get http() {
    return {
      fetch: async (url: string, options?: RequestInit): Promise<Response> => {
        this.checkPermission(PluginPermission.NETWORK_ACCESS);
        // Add CORS proxy in production
        return fetch(url, options);
      },
    };
  }

  get utils() {
    return {
      generateId: (): string => {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      },
      hash: (data: string): string => {
        return crypto.createHash('sha256').update(data).digest('hex');
      },
      encrypt: (data: string, key: string): string => {
        // Simple XOR encryption for demo (use proper encryption in production)
        let result = '';
        for (let i = 0; i < data.length; i++) {
          result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return btoa(result);
      },
      decrypt: (data: string, key: string): string => {
        // Simple XOR decryption for demo (use proper encryption in production)
        const decoded = atob(data);
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
          result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
      },
    };
  }

  private checkPermission(permission: PluginPermission): void {
    if (!this.permissions.has(permission)) {
      throw new Error(`Permission denied: ${permission}`);
    }
  }
}