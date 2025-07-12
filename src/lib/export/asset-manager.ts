import { AssetData } from './types';

export class AssetManager {
  async collectAssets(assets: AssetData[]): Promise<Record<string, string>> {
    const assetFiles: Record<string, string> = {};

    for (const asset of assets) {
      try {
        const content = await this.fetchAsset(asset);
        const fileName = this.getAssetFileName(asset);
        assetFiles[fileName] = content;
      } catch (error) {
        console.warn(`Failed to collect asset ${asset.name}:`, error);
      }
    }

    return assetFiles;
  }

  private async fetchAsset(asset: AssetData): Promise<string> {
    // If it's a data URL, extract the content
    if (asset.url.startsWith('data:')) {
      return this.extractDataURL(asset.url);
    }

    // If it's a blob URL, fetch the content
    if (asset.url.startsWith('blob:')) {
      const response = await fetch(asset.url);
      if (asset.type === 'image' || asset.type === 'video' || asset.type === 'audio') {
        const arrayBuffer = await response.arrayBuffer();
        return this.arrayBufferToBase64(arrayBuffer);
      } else {
        return await response.text();
      }
    }

    // If it's a regular URL, fetch the content
    if (asset.url.startsWith('http')) {
      const response = await fetch(asset.url);
      if (asset.type === 'image' || asset.type === 'video' || asset.type === 'audio') {
        const arrayBuffer = await response.arrayBuffer();
        return this.arrayBufferToBase64(arrayBuffer);
      } else {
        return await response.text();
      }
    }

    // If it's a local file path, handle accordingly
    throw new Error(`Cannot fetch asset from path: ${asset.url}`);
  }

  private extractDataURL(dataUrl: string): string {
    // Extract base64 content from data URL
    const base64Index = dataUrl.indexOf(';base64,');
    if (base64Index !== -1) {
      return dataUrl.substring(base64Index + 8);
    }
    
    // If it's not base64, extract the raw content
    const commaIndex = dataUrl.indexOf(',');
    if (commaIndex !== -1) {
      return dataUrl.substring(commaIndex + 1);
    }
    
    return dataUrl;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private getAssetFileName(asset: AssetData): string {
    const extension = this.getFileExtension(asset);
    const baseName = asset.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    switch (asset.type) {
      case 'image':
        return `public/images/${baseName}${extension}`;
      case 'font':
        return `public/fonts/${baseName}${extension}`;
      case 'video':
        return `public/videos/${baseName}${extension}`;
      case 'audio':
        return `public/audio/${baseName}${extension}`;
      case 'document':
        return `public/documents/${baseName}${extension}`;
      default:
        return `public/assets/${baseName}${extension}`;
    }
  }

  private getFileExtension(asset: AssetData): string {
    // Extract extension from URL or mime type
    const urlPath = asset.url.split('?')[0]; // Remove query parameters
    const extensionMatch = urlPath.match(/\.([a-zA-Z0-9]+)$/);
    
    if (extensionMatch) {
      return `.${extensionMatch[1]}`;
    }
    
    // Fallback to mime type mapping
    return this.getExtensionFromMimeType(asset.mimeType);
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExtension: Record<string, string> = {
      // Images
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/svg+xml': '.svg',
      'image/webp': '.webp',
      'image/bmp': '.bmp',
      'image/ico': '.ico',
      'image/icon': '.ico',
      'image/x-icon': '.ico',
      
      // Fonts
      'font/woff': '.woff',
      'font/woff2': '.woff2',
      'font/ttf': '.ttf',
      'font/otf': '.otf',
      'font/eot': '.eot',
      'application/font-woff': '.woff',
      'application/font-woff2': '.woff2',
      'application/x-font-ttf': '.ttf',
      'application/x-font-otf': '.otf',
      
      // Videos
      'video/mp4': '.mp4',
      'video/mpeg': '.mpeg',
      'video/quicktime': '.mov',
      'video/x-msvideo': '.avi',
      'video/webm': '.webm',
      'video/ogg': '.ogv',
      
      // Audio
      'audio/mpeg': '.mp3',
      'audio/wav': '.wav',
      'audio/ogg': '.ogg',
      'audio/webm': '.weba',
      'audio/aac': '.aac',
      'audio/flac': '.flac',
      
      // Documents
      'application/pdf': '.pdf',
      'text/plain': '.txt',
      'text/csv': '.csv',
      'application/json': '.json',
      'application/xml': '.xml',
      'text/xml': '.xml',
      'application/zip': '.zip',
      'application/x-zip-compressed': '.zip',
      
      // Web
      'text/html': '.html',
      'text/css': '.css',
      'text/javascript': '.js',
      'application/javascript': '.js',
      'application/typescript': '.ts',
    };
    
    return mimeToExtension[mimeType] || '.bin';
  }

  async optimizeAssets(assets: AssetData[]): Promise<AssetData[]> {
    const optimizedAssets: AssetData[] = [];

    for (const asset of assets) {
      try {
        const optimized = await this.optimizeAsset(asset);
        optimizedAssets.push(optimized);
      } catch (error) {
        console.warn(`Failed to optimize asset ${asset.name}:`, error);
        optimizedAssets.push(asset);
      }
    }

    return optimizedAssets;
  }

  private async optimizeAsset(asset: AssetData): Promise<AssetData> {
    // For now, return the asset as-is
    // In a real implementation, you would:
    // - Compress images
    // - Minify CSS/JS
    // - Optimize fonts
    // - Compress videos
    
    return asset;
  }

  generateAssetManifest(assets: AssetData[]): string {
    const manifest = {
      version: '1.0.0',
      assets: assets.map(asset => ({
        id: asset.id,
        name: asset.name,
        type: asset.type,
        size: asset.size,
        mimeType: asset.mimeType,
        path: this.getAssetFileName(asset),
        metadata: asset.metadata,
      })),
      totalSize: assets.reduce((total, asset) => total + asset.size, 0),
      generatedAt: new Date().toISOString(),
    };

    return JSON.stringify(manifest, null, 2);
  }

  generateAssetLoader(): string {
    return `// Asset Loader - Generated by NeX7 Export
class AssetLoader {
  private cache = new Map();
  private manifest = null;

  async loadManifest() {
    if (!this.manifest) {
      const response = await fetch('/assets/manifest.json');
      this.manifest = await response.json();
    }
    return this.manifest;
  }

  async loadAsset(id) {
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }

    const manifest = await this.loadManifest();
    const asset = manifest.assets.find(a => a.id === id);
    
    if (!asset) {
      throw new Error(\`Asset not found: \${id}\`);
    }

    const response = await fetch(asset.path);
    
    if (asset.type === 'image' || asset.type === 'video' || asset.type === 'audio') {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      this.cache.set(id, url);
      return url;
    } else {
      const content = await response.text();
      this.cache.set(id, content);
      return content;
    }
  }

  preloadAssets(ids) {
    return Promise.all(ids.map(id => this.loadAsset(id)));
  }

  clearCache() {
    // Clean up blob URLs
    for (const [id, value] of this.cache) {
      if (typeof value === 'string' && value.startsWith('blob:')) {
        URL.revokeObjectURL(value);
      }
    }
    this.cache.clear();
  }
}

export const assetLoader = new AssetLoader();`;
  }

  generateAssetTypes(assets: AssetData[]): string {
    const assetTypes = assets.map(asset => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
    }));

    let types = '// Asset Types - Generated by NeX7 Export\n\n';
    
    types += 'export interface Asset {\n';
    types += '  id: string;\n';
    types += '  name: string;\n';
    types += '  type: string;\n';
    types += '  path: string;\n';
    types += '  size: number;\n';
    types += '  mimeType: string;\n';
    types += '}\n\n';

    types += 'export const ASSETS = {\n';
    assetTypes.forEach(asset => {
      const constantName = asset.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      types += `  ${constantName}: '${asset.id}',\n`;
    });
    types += '} as const;\n\n';

    types += 'export type AssetId = typeof ASSETS[keyof typeof ASSETS];\n';

    return types;
  }
}