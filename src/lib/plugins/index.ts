// Export all types (interfaces and enums)
export * from './types';

// Export classes with explicit names to avoid conflicts with interfaces
export { PluginLoader } from './plugin-loader';
export { PluginRegistry } from './plugin-registry';
export { PluginSandbox } from './plugin-sandbox';
export { PluginAPI as PluginAPIImpl } from './plugin-api';
export { PluginStorage as PluginStorageImpl } from './plugin-storage';
export { PluginMarketplace, type MarketplaceFilters } from './plugin-marketplace';

import { PluginLoader } from './plugin-loader';
import { PluginRegistry } from './plugin-registry';
import { PluginMarketplace } from './plugin-marketplace';

// Create singleton instances
const registry = new PluginRegistry();
const loader = new PluginLoader(registry);
const marketplace = new PluginMarketplace();

export const pluginSystem = {
  registry,
  loader,
  marketplace,
};