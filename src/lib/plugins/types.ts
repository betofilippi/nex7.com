// Plugin System Types
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  icon?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  main: string;
  permissions: PluginPermission[];
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  config?: PluginConfig;
  hooks?: PluginHooks;
  ui?: {
    components?: Record<string, string>;
    pages?: Record<string, string>;
    styles?: string[];
  };
}

export enum PluginPermission {
  READ_DATA = 'read:data',
  WRITE_DATA = 'write:data',
  ACCESS_API = 'access:api',
  MODIFY_UI = 'modify:ui',
  EXECUTE_CODE = 'execute:code',
  ACCESS_FILESYSTEM = 'access:filesystem',
  NETWORK_ACCESS = 'network:access',
  NOTIFICATIONS = 'notifications',
  BACKGROUND_TASKS = 'background:tasks',
}

export interface PluginConfig {
  schema: Record<string, ConfigField>;
  defaults?: Record<string, any>;
}

export interface ConfigField {
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect' | 'json';
  label: string;
  description?: string;
  required?: boolean;
  default?: any;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: string; // JS expression
  };
}

export interface PluginHooks {
  onInstall?: string;
  onUninstall?: string;
  onActivate?: string;
  onDeactivate?: string;
  onConfigChange?: string;
}

export interface PluginContext {
  api: PluginAPI;
  config: Record<string, any>;
  storage: PluginStorage;
  events: PluginEventEmitter;
  logger: PluginLogger;
}

export interface PluginAPI {
  version: string;
  data: {
    read: (key: string) => Promise<any>;
    write: (key: string, value: any) => Promise<void>;
    delete: (key: string) => Promise<void>;
  };
  ui: {
    showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
    showModal: (content: any) => void;
    registerComponent: (name: string, component: any) => void;
    registerPage: (path: string, component: any) => void;
  };
  http: {
    fetch: (url: string, options?: RequestInit) => Promise<Response>;
  };
  utils: {
    generateId: () => string;
    hash: (data: string) => string;
    encrypt: (data: string, key: string) => string;
    decrypt: (data: string, key: string) => string;
  };
}

export interface PluginStorage {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<void>;
  remove: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

export interface PluginEventEmitter {
  on: (event: string, handler: Function) => void;
  off: (event: string, handler: Function) => void;
  emit: (event: string, data?: any) => void;
  once: (event: string, handler: Function) => void;
}

export interface PluginLogger {
  log: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug: (...args: any[]) => void;
}

export interface Plugin {
  manifest: PluginManifest;
  status: 'installed' | 'active' | 'inactive' | 'error';
  installedAt: Date;
  updatedAt: Date;
  config?: Record<string, any>;
  error?: string;
}

export interface PluginMarketplaceItem {
  id: string;
  manifest: PluginManifest;
  downloads: number;
  rating: number;
  reviews: number;
  featured: boolean;
  verified: boolean;
  categories: string[];
  screenshots?: string[];
  readme?: string;
  changelog?: string;
  publishedAt: Date;
  updatedAt: Date;
}