import { Plugin, PluginManifest } from './types';

export class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();
  private storageKey = 'nex7:plugins';

  constructor() {
    this.loadFromStorage();
  }

  async installPlugin(manifest: PluginManifest): Promise<Plugin> {
    if (this.plugins.has(manifest.id)) {
      throw new Error(`Plugin ${manifest.id} is already installed`);
    }

    const plugin: Plugin = {
      manifest,
      status: 'inactive',
      installedAt: new Date(),
      updatedAt: new Date(),
    };

    this.plugins.set(manifest.id, plugin);
    this.saveToStorage();

    return plugin;
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    this.plugins.delete(pluginId);
    this.saveToStorage();
  }

  async getPlugin(pluginId: string): Promise<Plugin | undefined> {
    return this.plugins.get(pluginId);
  }

  async getAllPlugins(): Promise<Plugin[]> {
    return Array.from(this.plugins.values());
  }

  async getActivePlugins(): Promise<Plugin[]> {
    return Array.from(this.plugins.values()).filter(p => p.status === 'active');
  }

  async updatePluginStatus(pluginId: string, status: Plugin['status'], error?: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    plugin.status = status;
    plugin.updatedAt = new Date();
    if (error) {
      plugin.error = error;
    } else {
      delete plugin.error;
    }

    this.saveToStorage();
  }

  async updatePluginConfig(pluginId: string, config: Record<string, any>): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    plugin.config = config;
    plugin.updatedAt = new Date();
    this.saveToStorage();
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const plugins = JSON.parse(data);
        this.plugins = new Map(
          plugins.map((p: Plugin) => [
            p.manifest.id,
            {
              ...p,
              installedAt: new Date(p.installedAt),
              updatedAt: new Date(p.updatedAt),
            },
          ])
        );
      }
    } catch (error) {
      console.error('Error loading plugins from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const plugins = Array.from(this.plugins.values());
      localStorage.setItem(this.storageKey, JSON.stringify(plugins));
    } catch (error) {
      console.error('Error saving plugins to storage:', error);
    }
  }

  async searchPlugins(query: string): Promise<Plugin[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.plugins.values()).filter(plugin => {
      return (
        plugin.manifest.name.toLowerCase().includes(lowerQuery) ||
        plugin.manifest.description.toLowerCase().includes(lowerQuery) ||
        plugin.manifest.author.name.toLowerCase().includes(lowerQuery)
      );
    });
  }

  async getPluginsByPermission(permission: string): Promise<Plugin[]> {
    return Array.from(this.plugins.values()).filter(plugin =>
      plugin.manifest.permissions.includes(permission as any)
    );
  }

  async validatePluginUpdate(pluginId: string, newManifest: PluginManifest): Promise<boolean> {
    const currentPlugin = this.plugins.get(pluginId);
    if (!currentPlugin) {
      return false;
    }

    // Check if it's a valid update
    if (currentPlugin.manifest.id !== newManifest.id) {
      return false;
    }

    // Check version is newer (simple string comparison, should use semver in production)
    if (currentPlugin.manifest.version >= newManifest.version) {
      return false;
    }

    return true;
  }
}