import { PluginPermission, PluginContext } from './types';

export class PluginSandbox {
  private worker: Worker | null = null;
  private permissions: Set<PluginPermission>;
  private messageHandlers: Map<string, Function> = new Map();
  private pendingCalls: Map<string, { resolve: Function; reject: Function }> = new Map();

  constructor(permissions: PluginPermission[]) {
    this.permissions = new Set(permissions);
  }

  async execute(code: string, context: PluginContext): Promise<void> {
    // Create a web worker for sandboxed execution
    const workerCode = this.createWorkerCode(code);
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);

    this.worker = new Worker(workerUrl);
    
    // Set up message handling
    this.worker.onmessage = this.handleWorkerMessage.bind(this);
    this.worker.onerror = this.handleWorkerError.bind(this);

    // Initialize the worker with context
    await this.sendToWorker('init', {
      permissions: Array.from(this.permissions),
      config: context.config,
    });

    // Execute the plugin code
    await this.sendToWorker('execute', { code });

    // Clean up
    URL.revokeObjectURL(workerUrl);
  }

  async executeHook(hookName: string, context: PluginContext): Promise<any> {
    if (!this.worker) {
      throw new Error('Sandbox not initialized');
    }

    return this.sendToWorker('executeHook', { hookName, context });
  }

  async callFunction(functionName: string, ...args: any[]): Promise<any> {
    if (!this.worker) {
      throw new Error('Sandbox not initialized');
    }

    return this.sendToWorker('callFunction', { functionName, args });
  }

  async destroy(): Promise<void> {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.messageHandlers.clear();
    this.pendingCalls.clear();
  }

  private createWorkerCode(pluginCode: string): string {
    return `
      // Sandboxed plugin execution environment
      const permissions = new Set();
      let pluginConfig = {};
      let pluginExports = {};

      // Message handling
      self.onmessage = async function(event) {
        const { id, type, data } = event.data;

        try {
          let result;

          switch (type) {
            case 'init':
              permissions.clear();
              data.permissions.forEach(p => permissions.add(p));
              pluginConfig = data.config;
              self.postMessage({ id, type: 'result', data: { success: true } });
              break;

            case 'execute':
              // Create sandboxed API
              const api = createSandboxedAPI();
              const context = createSandboxedContext(api);
              
              // Execute plugin code
              const moduleWrapper = new Function('exports', 'context', data.code);
              moduleWrapper(pluginExports, context);
              
              self.postMessage({ id, type: 'result', data: { success: true } });
              break;

            case 'executeHook':
              if (pluginExports[data.hookName]) {
                result = await pluginExports[data.hookName](data.context);
              }
              self.postMessage({ id, type: 'result', data: result });
              break;

            case 'callFunction':
              if (pluginExports[data.functionName]) {
                result = await pluginExports[data.functionName](...data.args);
              }
              self.postMessage({ id, type: 'result', data: result });
              break;

            default:
              throw new Error('Unknown message type: ' + type);
          }
        } catch (error) {
          self.postMessage({ id, type: 'error', error: error.message });
        }
      };

      function createSandboxedAPI() {
        return {
          version: '1.0.0',
          data: {
            read: async (key) => {
              if (!permissions.has('read:data')) {
                throw new Error('Permission denied: read:data');
              }
              return callHost('api.data.read', key);
            },
            write: async (key, value) => {
              if (!permissions.has('write:data')) {
                throw new Error('Permission denied: write:data');
              }
              return callHost('api.data.write', key, value);
            },
            delete: async (key) => {
              if (!permissions.has('write:data')) {
                throw new Error('Permission denied: write:data');
              }
              return callHost('api.data.delete', key);
            }
          },
          ui: {
            showNotification: (message, type) => {
              if (!permissions.has('notifications')) {
                throw new Error('Permission denied: notifications');
              }
              return callHost('api.ui.showNotification', message, type);
            },
            showModal: (content) => {
              if (!permissions.has('modify:ui')) {
                throw new Error('Permission denied: modify:ui');
              }
              return callHost('api.ui.showModal', content);
            },
            registerComponent: (name, component) => {
              if (!permissions.has('modify:ui')) {
                throw new Error('Permission denied: modify:ui');
              }
              return callHost('api.ui.registerComponent', name, component);
            },
            registerPage: (path, component) => {
              if (!permissions.has('modify:ui')) {
                throw new Error('Permission denied: modify:ui');
              }
              return callHost('api.ui.registerPage', path, component);
            }
          },
          http: {
            fetch: async (url, options) => {
              if (!permissions.has('network:access')) {
                throw new Error('Permission denied: network:access');
              }
              return callHost('api.http.fetch', url, options);
            }
          },
          utils: {
            generateId: () => callHost('api.utils.generateId'),
            hash: (data) => callHost('api.utils.hash', data),
            encrypt: (data, key) => callHost('api.utils.encrypt', data, key),
            decrypt: (data, key) => callHost('api.utils.decrypt', data, key),
          }
        };
      }

      function createSandboxedContext(api) {
        return {
          api,
          config: pluginConfig,
          storage: {
            get: (key) => callHost('storage.get', key),
            set: (key, value) => callHost('storage.set', key, value),
            remove: (key) => callHost('storage.remove', key),
            clear: () => callHost('storage.clear'),
          },
          events: {
            on: (event, handler) => callHost('events.on', event, handler.toString()),
            off: (event, handler) => callHost('events.off', event, handler.toString()),
            emit: (event, data) => callHost('events.emit', event, data),
            once: (event, handler) => callHost('events.once', event, handler.toString()),
          },
          logger: {
            log: (...args) => callHost('logger.log', ...args),
            info: (...args) => callHost('logger.info', ...args),
            warn: (...args) => callHost('logger.warn', ...args),
            error: (...args) => callHost('logger.error', ...args),
            debug: (...args) => callHost('logger.debug', ...args),
          }
        };
      }

      let callId = 0;
      const pendingCalls = new Map();

      function callHost(method, ...args) {
        return new Promise((resolve, reject) => {
          const id = ++callId;
          pendingCalls.set(id, { resolve, reject });
          self.postMessage({ id, type: 'hostCall', method, args });
        });
      }

      // Handle responses from host
      self.addEventListener('message', (event) => {
        if (event.data.type === 'hostResponse') {
          const { id, result, error } = event.data;
          const pending = pendingCalls.get(id);
          if (pending) {
            pendingCalls.delete(id);
            if (error) {
              pending.reject(new Error(error));
            } else {
              pending.resolve(result);
            }
          }
        }
      });
    `;
  }

  private handleWorkerMessage(event: MessageEvent): void {
    const { id, type, method, args, data, error } = event.data;

    if (type === 'hostCall') {
      // Handle API calls from the sandbox
      this.handleHostCall(id, method, args);
    } else if (type === 'result' || type === 'error') {
      // Handle responses to our calls
      const pending = this.pendingCalls.get(id);
      if (pending) {
        this.pendingCalls.delete(id);
        if (type === 'error') {
          pending.reject(new Error(error));
        } else {
          pending.resolve(data);
        }
      }
    }
  }

  private handleWorkerError(error: ErrorEvent): void {
    console.error('Worker error:', error);
  }

  private async handleHostCall(id: number, method: string, args: any[]): Promise<void> {
    try {
      // Route the call to the appropriate handler
      const handler = this.messageHandlers.get(method);
      if (handler) {
        const result = await handler(...args);
        this.worker?.postMessage({ id, type: 'hostResponse', result });
      } else {
        throw new Error(`Unknown method: ${method}`);
      }
    } catch (error) {
      this.worker?.postMessage({ id, type: 'hostResponse', error: error.message });
    }
  }

  private sendToWorker(type: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = Date.now() + Math.random();
      this.pendingCalls.set(id, { resolve, reject });
      this.worker?.postMessage({ id, type, data });
    });
  }

  registerHandler(method: string, handler: Function): void {
    this.messageHandlers.set(method, handler);
  }
}