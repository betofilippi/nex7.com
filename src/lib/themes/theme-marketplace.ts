import { ThemeMarketplaceItem, ThemeConfig } from './types';

export interface MarketplaceFilters {
  search?: string;
  category?: string;
  featured?: boolean;
  sortBy?: 'downloads' | 'rating' | 'updated' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export class ThemeMarketplace {
  private apiUrl: string;

  constructor(apiUrl: string = '/api/v1/themes/marketplace') {
    this.apiUrl = apiUrl;
  }

  async searchThemes(filters: MarketplaceFilters = {}): Promise<ThemeMarketplaceItem[]> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.featured !== undefined) params.append('featured', filters.featured.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await fetch(`${this.apiUrl}/search?${params}`);
    if (!response.ok) {
      throw new Error('Failed to search marketplace');
    }

    return response.json();
  }

  async getTheme(themeId: string): Promise<ThemeMarketplaceItem> {
    const response = await fetch(`${this.apiUrl}/${themeId}`);
    if (!response.ok) {
      throw new Error('Theme not found');
    }

    return response.json();
  }

  async getFeaturedThemes(): Promise<ThemeMarketplaceItem[]> {
    return this.searchThemes({ featured: true });
  }

  async getCategories(): Promise<string[]> {
    const response = await fetch(`${this.apiUrl}/categories`);
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    return response.json();
  }

  async downloadTheme(themeId: string): Promise<ThemeConfig> {
    const response = await fetch(`${this.apiUrl}/${themeId}/download`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to download theme');
    }

    return response.json();
  }

  async submitReview(themeId: string, rating: number, comment: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/${themeId}/reviews`, {
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

  async reportTheme(themeId: string, reason: string, details: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/${themeId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason, details }),
    });

    if (!response.ok) {
      throw new Error('Failed to report theme');
    }
  }

  async publishTheme(theme: ThemeConfig, metadata: {
    categories: string[];
    screenshots?: string[];
    description?: string;
  }): Promise<ThemeMarketplaceItem> {
    const response = await fetch(`${this.apiUrl}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ theme, metadata }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to publish theme');
    }

    return response.json();
  }

  async updateTheme(themeId: string, updates: {
    theme?: ThemeConfig;
    metadata?: {
      categories?: string[];
      screenshots?: string[];
      description?: string;
    };
  }): Promise<ThemeMarketplaceItem> {
    const response = await fetch(`${this.apiUrl}/${themeId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update theme');
    }

    return response.json();
  }

  async unpublishTheme(themeId: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/${themeId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to unpublish theme');
    }
  }
}