import { Plugin, PluginManifest, PluginContext, PluginPermission } from './types';
import { PluginSandbox } from './plugin-sandbox';
import { PluginRegistry } from './plugin-registry';
import { PluginAPI } from './plugin-api';
import { PluginStorage } from './plugin-storage';
import { EventEmitter } from 'events';

export class PluginLoader {
  private registry: PluginRegistry;
  private sandboxes: Map<string, PluginSandbox> = new Map();
  private contexts: Map<string, PluginContext> = new Map();
  private eventEmitter = new EventEmitter();

  constructor(registry: PluginRegistry) {
    this.registry = registry;
  }

  async loadPlugin(pluginId: string): Promise<void> {
    const plugin = await this.registry.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (plugin.status === 'active') {
      return; // Already loaded
    }

    try {
      // Validate permissions
      this.validatePermissions(plugin.manifest.permissions);

      // Create plugin context
      const context = this.createContext(plugin);
      this.contexts.set(pluginId, context);

      // Create and initialize sandbox
      const sandbox = new PluginSandbox(plugin.manifest.permissions);
      this.sandboxes.set(pluginId, sandbox);

      // Load plugin code
      const code = await this.fetchPluginCode(plugin.manifest.main);
      
      // Execute in sandbox
      await sandbox.execute(code, context);

      // Run onActivate hook if defined
      if (plugin.manifest.hooks?.onActivate) {
        await sandbox.executeHook(plugin.manifest.hooks.onActivate, context);
      }

      // Update plugin status
      await this.registry.updatePluginStatus(pluginId, 'active');

      this.eventEmitter.emit('plugin:loaded', { pluginId });
    } catch (error) {
      await this.registry.updatePluginStatus(pluginId, 'error', error.message);
      throw error;
    }
  }

  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = await this.registry.getPlugin(pluginId);
    if (!plugin || plugin.status !== 'active') {
      return;
    }

    try {
      const sandbox = this.sandboxes.get(pluginId);
      const context = this.contexts.get(pluginId);

      // Run onDeactivate hook if defined
      if (plugin.manifest.hooks?.onDeactivate && sandbox && context) {
        await sandbox.executeHook(plugin.manifest.hooks.onDeactivate, context);
      }

      // Cleanup sandbox
      if (sandbox) {
        await sandbox.destroy();
        this.sandboxes.delete(pluginId);
      }

      // Cleanup context
      if (context) {
        await context.storage.clear();
        this.contexts.delete(pluginId);
      }

      // Update plugin status
      await this.registry.updatePluginStatus(pluginId, 'inactive');

      this.eventEmitter.emit('plugin:unloaded', { pluginId });
    } catch (error) {
      console.error(`Error unloading plugin ${pluginId}:`, error);
      throw error;
    }
  }

  async reloadPlugin(pluginId: string): Promise<void> {
    await this.unloadPlugin(pluginId);
    await this.loadPlugin(pluginId);
  }

  async installPlugin(manifest: PluginManifest, code: string): Promise<Plugin> {
    // Validate manifest
    this.validateManifest(manifest);

    // Check dependencies
    await this.checkDependencies(manifest);

    // Install plugin
    const plugin = await this.registry.installPlugin(manifest);

    try {
      // Save plugin code
      await this.savePluginCode(manifest.id, manifest.main, code);

      // Run onInstall hook if defined
      if (manifest.hooks?.onInstall) {
        const context = this.createContext(plugin);
        const sandbox = new PluginSandbox(manifest.permissions);
        await sandbox.executeHook(manifest.hooks.onInstall, context);
        await sandbox.destroy();
      }

      this.eventEmitter.emit('plugin:installed', { pluginId: manifest.id });
      return plugin;
    } catch (error) {
      // Rollback installation on error
      await this.registry.uninstallPlugin(manifest.id);
      throw error;
    }
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    const plugin = await this.registry.getPlugin(pluginId);
    if (!plugin) {
      return;
    }

    // Unload if active
    if (plugin.status === 'active') {
      await this.unloadPlugin(pluginId);
    }

    try {
      // Run onUninstall hook if defined
      if (plugin.manifest.hooks?.onUninstall) {
        const context = this.createContext(plugin);
        const sandbox = new PluginSandbox(plugin.manifest.permissions);
        await sandbox.executeHook(plugin.manifest.hooks.onUninstall, context);
        await sandbox.destroy();
      }

      // Remove plugin code
      await this.removePluginCode(pluginId);

      // Uninstall from registry
      await this.registry.uninstallPlugin(pluginId);

      this.eventEmitter.emit('plugin:uninstalled', { pluginId });
    } catch (error) {
      console.error(`Error uninstalling plugin ${pluginId}:`, error);
      throw error;
    }
  }

  private validateManifest(manifest: PluginManifest): void {
    if (!manifest.id || !manifest.name || !manifest.version || !manifest.main) {
      throw new Error('Invalid plugin manifest: missing required fields');
    }

    if (!manifest.permissions || manifest.permissions.length === 0) {
      throw new Error('Plugin must declare required permissions');
    }

    // Validate version format
    if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
      throw new Error('Invalid version format. Use semantic versioning (e.g., 1.0.0)');
    }
  }

  private validatePermissions(permissions: PluginPermission[]): void {
    const dangerousPermissions = [
      PluginPermission.EXECUTE_CODE,
      PluginPermission.ACCESS_FILESYSTEM,
    ];

    const hasDangerous = permissions.some(p => dangerousPermissions.includes(p));
    if (hasDangerous) {
      // In production, you might want to require additional confirmation
      console.warn('Plugin requires dangerous permissions:', permissions);
    }
  }

  private async checkDependencies(manifest: PluginManifest): Promise<void> {
    if (!manifest.dependencies) return;

    for (const [dep, version] of Object.entries(manifest.dependencies)) {
      const installed = await this.registry.getPlugin(dep);
      if (!installed) {
        throw new Error(`Missing dependency: ${dep}`);
      }

      // Simple version check (you might want to use a proper semver library)
      if (installed.manifest.version < version) {
        throw new Error(`Dependency ${dep} requires version ${version} or higher`);
      }
    }
  }

  private createContext(plugin: Plugin): PluginContext {
    const api = new PluginAPI(plugin.manifest.permissions);
    const storage = new PluginStorage(plugin.manifest.id);
    
    const events = {
      on: (event: string, handler: (...args: any[]) => void) => this.eventEmitter.on(`${plugin.manifest.id}:${event}`, handler),
      off: (event: string, handler: (...args: any[]) => void) => this.eventEmitter.off(`${plugin.manifest.id}:${event}`, handler),
      emit: (event: string, data?: any) => this.eventEmitter.emit(`${plugin.manifest.id}:${event}`, data),
      once: (event: string, handler: (...args: any[]) => void) => this.eventEmitter.once(`${plugin.manifest.id}:${event}`, handler),
    };

    const logger = {
      log: (...args: any[]) => console.log(`[${plugin.manifest.id}]`, ...args),
      info: (...args: any[]) => console.info(`[${plugin.manifest.id}]`, ...args),
      warn: (...args: any[]) => console.warn(`[${plugin.manifest.id}]`, ...args),
      error: (...args: any[]) => console.error(`[${plugin.manifest.id}]`, ...args),
      debug: (...args: any[]) => console.debug(`[${plugin.manifest.id}]`, ...args),
    };

    return {
      api,
      config: plugin.config || {},
      storage,
      events,
      logger,
    };
  }

  private async fetchPluginCode(mainFile: string): Promise<string> {
    // In production, this would fetch from a CDN or plugin repository
    // For now, we'll simulate loading from local storage
    const code = localStorage.getItem(`plugin:code:${mainFile}`);
    if (!code) {
      throw new Error(`Plugin code not found: ${mainFile}`);
    }
    return code;
  }

  private async savePluginCode(pluginId: string, mainFile: string, code: string): Promise<void> {
    // In production, this would save to a proper storage system
    localStorage.setItem(`plugin:code:${pluginId}:${mainFile}`, code);
  }

  private async removePluginCode(pluginId: string): Promise<void> {
    // Remove all code associated with the plugin
    const keys = Object.keys(localStorage).filter(key => key.startsWith(`plugin:code:${pluginId}:`));
    keys.forEach(key => localStorage.removeItem(key));
  }

  on(event: string, handler: (...args: any[]) => void): void {
    this.eventEmitter.on(event, handler);
  }

  off(event: string, handler: (...args: any[]) => void): void {
    this.eventEmitter.off(event, handler);
  }
}