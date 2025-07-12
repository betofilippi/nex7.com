import { PluginMarketplaceItem, PluginManifest } from './types';

export interface MarketplaceFilters {
  category?: string;
  search?: string;
  verified?: boolean;
  featured?: boolean;
  sortBy?: 'downloads' | 'rating' | 'updated' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export class PluginMarketplace {
  private apiUrl: string;

  constructor(apiUrl: string = '/api/v1/plugins/marketplace') {
    this.apiUrl = apiUrl;
  }

  async searchPlugins(filters: MarketplaceFilters = {}): Promise<PluginMarketplaceItem[]> {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.verified !== undefined) params.append('verified', filters.verified.toString());
    if (filters.featured !== undefined) params.append('featured', filters.featured.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await fetch(`${this.apiUrl}/search?${params}`);
    if (!response.ok) {
      throw new Error('Failed to search marketplace');
    }

    return response.json();
  }

  async getPlugin(pluginId: string): Promise<PluginMarketplaceItem> {
    const response = await fetch(`${this.apiUrl}/${pluginId}`);
    if (!response.ok) {
      throw new Error('Plugin not found');
    }

    return response.json();
  }

  async getFeaturedPlugins(): Promise<PluginMarketplaceItem[]> {
    return this.searchPlugins({ featured: true });
  }

  async getCategories(): Promise<string[]> {
    const response = await fetch(`${this.apiUrl}/categories`);
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    return response.json();
  }

  async downloadPlugin(pluginId: string): Promise<{ manifest: PluginManifest; code: string }> {
    const response = await fetch(`${this.apiUrl}/${pluginId}/download`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to download plugin');
    }

    return response.json();
  }

  async submitReview(pluginId: string, rating: number, comment: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/${pluginId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rating, comment }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit review');
    }
  }

  async reportPlugin(pluginId: string, reason: string, details: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/${pluginId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason, details }),
    });

    if (!response.ok) {
      throw new Error('Failed to report plugin');
    }
  }

  async publishPlugin(manifest: PluginManifest, code: string, metadata: {
    categories: string[];
    screenshots?: string[];
    readme?: string;
    changelog?: string;
  }): Promise<PluginMarketplaceItem> {
    const formData = new FormData();
    formData.append('manifest', JSON.stringify(manifest));
    formData.append('code', code);
    formData.append('metadata', JSON.stringify(metadata));

    const response = await fetch(`${this.apiUrl}/publish`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to publish plugin');
    }

    return response.json();
  }

  async updatePlugin(pluginId: string, updates: {
    manifest?: PluginManifest;
    code?: string;
    metadata?: {
      categories?: string[];
      screenshots?: string[];
      readme?: string;
      changelog?: string;
    };
  }): Promise<PluginMarketplaceItem> {
    const response = await fetch(`${this.apiUrl}/${pluginId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update plugin');
    }

    return response.json();
  }

  async unpublishPlugin(pluginId: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/${pluginId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to unpublish plugin');
    }
  }
}