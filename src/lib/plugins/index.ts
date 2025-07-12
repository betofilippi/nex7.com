export * from './types';
export * from './plugin-loader';
export * from './plugin-registry';
export * from './plugin-sandbox';
export { PluginAPI as PluginAPIClass } from './plugin-api';
export * from './plugin-storage';
export * from './plugin-marketplace';

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