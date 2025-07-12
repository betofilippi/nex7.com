import { WorkflowTemplate } from '@/components/canvas/types';

export interface MarketplaceWorkflow extends WorkflowTemplate {
  id: string;
  isPublic: boolean;
  price?: number;
  currency?: string;
  license: 'free' | 'mit' | 'commercial' | 'custom';
  reviews: WorkflowReview[];
  averageRating: number;
  totalDownloads: number;
  featured: boolean;
  verified: boolean;
  publishedAt: Date;
  lastUpdated: Date;
  compatibility: string[];
  screenshots?: string[];
  documentation?: string;
}

export interface WorkflowReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment?: string;
  createdAt: Date;
  helpful: number;
  workflowVersion: string;
}

export interface MarketplaceFilters {
  category?: string;
  tags?: string[];
  priceRange?: { min: number; max: number };
  rating?: number;
  license?: string[];
  sortBy?: 'downloads' | 'rating' | 'recent' | 'featured';
  search?: string;
}

export interface WorkflowSubmission {
  workflow: Omit<MarketplaceWorkflow, 'id' | 'reviews' | 'averageRating' | 'totalDownloads' | 'publishedAt'>;
  submittedBy: string;
  submissionNotes?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
}

export class WorkflowMarketplace {
  private static instance: WorkflowMarketplace;
  private workflows: Map<string, MarketplaceWorkflow> = new Map();
  private submissions: Map<string, WorkflowSubmission> = new Map();
  private userWorkflows: Map<string, string[]> = new Map(); // userId -> workflowIds
  
  static getInstance(): WorkflowMarketplace {
    if (!this.instance) {
      this.instance = new WorkflowMarketplace();
      this.instance.initializeWithSampleData();
    }
    return this.instance;
  }

  /**
   * Browse workflows with filters
   */
  browseWorkflows(
    filters: MarketplaceFilters = {},
    page: number = 1,
    pageSize: number = 20
  ): {
    workflows: MarketplaceWorkflow[];
    total: number;
    page: number;
    pageSize: number;
  } {
    let filteredWorkflows = Array.from(this.workflows.values())
      .filter(w => w.isPublic);

    // Apply filters
    if (filters.category) {
      filteredWorkflows = filteredWorkflows.filter(w => 
        w.category.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredWorkflows = filteredWorkflows.filter(w =>
        filters.tags!.some(tag => w.tags.includes(tag))
      );
    }

    if (filters.priceRange) {
      filteredWorkflows = filteredWorkflows.filter(w => {
        const price = w.price || 0;
        return price >= filters.priceRange!.min && price <= filters.priceRange!.max;
      });
    }

    if (filters.rating) {
      filteredWorkflows = filteredWorkflows.filter(w =>
        w.averageRating >= filters.rating!
      );
    }

    if (filters.license && filters.license.length > 0) {
      filteredWorkflows = filteredWorkflows.filter(w =>
        filters.license!.includes(w.license)
      );
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredWorkflows = filteredWorkflows.filter(w =>
        w.name.toLowerCase().includes(searchTerm) ||
        w.description.toLowerCase().includes(searchTerm) ||
        w.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'downloads':
        filteredWorkflows.sort((a, b) => b.totalDownloads - a.totalDownloads);
        break;
      case 'rating':
        filteredWorkflows.sort((a, b) => b.averageRating - a.averageRating);
        break;
      case 'recent':
        filteredWorkflows.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
        break;
      case 'featured':
        filteredWorkflows.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
      default:
        // Default to featured first, then by downloads
        filteredWorkflows.sort((a, b) => {
          if (a.featured !== b.featured) {
            return b.featured ? 1 : -1;
          }
          return b.totalDownloads - a.totalDownloads;
        });
    }

    // Apply pagination
    const total = filteredWorkflows.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedWorkflows = filteredWorkflows.slice(startIndex, startIndex + pageSize);

    return {
      workflows: paginatedWorkflows,
      total,
      page,
      pageSize
    };
  }

  /**
   * Get a specific workflow by ID
   */
  getWorkflow(id: string): MarketplaceWorkflow | undefined {
    return this.workflows.get(id);
  }

  /**
   * Download a workflow
   */
  downloadWorkflow(id: string, userId: string): MarketplaceWorkflow | null {
    const workflow = this.workflows.get(id);
    if (!workflow || !workflow.isPublic) {
      return null;
    }

    // Increment download count
    workflow.totalDownloads++;

    // Track user downloads (for analytics)
    const userDownloads = this.userWorkflows.get(userId) || [];
    if (!userDownloads.includes(id)) {
      userDownloads.push(id);
      this.userWorkflows.set(userId, userDownloads);
    }

    return workflow;
  }

  /**
   * Submit a workflow for review
   */
  submitWorkflow(submission: Omit<WorkflowSubmission, 'status'>): string {
    const submissionId = this.generateId();
    
    const newSubmission: WorkflowSubmission = {
      ...submission,
      status: 'pending'
    };

    this.submissions.set(submissionId, newSubmission);
    return submissionId;
  }

  /**
   * Publish a workflow (after approval)
   */
  publishWorkflow(submissionId: string): string | null {
    const submission = this.submissions.get(submissionId);
    if (!submission || submission.status !== 'approved') {
      return null;
    }

    const workflowId = this.generateId();
    const now = new Date();

    const marketplaceWorkflow: MarketplaceWorkflow = {
      ...submission.workflow,
      id: workflowId,
      reviews: [],
      averageRating: 0,
      totalDownloads: 0,
      publishedAt: now,
      lastUpdated: now
    };

    this.workflows.set(workflowId, marketplaceWorkflow);
    this.submissions.delete(submissionId);

    return workflowId;
  }

  /**
   * Add a review to a workflow
   */
  addReview(
    workflowId: string,
    userId: string,
    userName: string,
    rating: number,
    comment?: string,
    workflowVersion: string = '1.0.0'
  ): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    // Check if user already reviewed this workflow
    const existingReview = workflow.reviews.find(r => r.userId === userId);
    if (existingReview) {
      // Update existing review
      existingReview.rating = rating;
      existingReview.comment = comment;
      existingReview.createdAt = new Date();
    } else {
      // Add new review
      const review: WorkflowReview = {
        id: this.generateId(),
        userId,
        userName,
        rating,
        comment,
        createdAt: new Date(),
        helpful: 0,
        workflowVersion
      };
      
      workflow.reviews.push(review);
    }

    // Recalculate average rating
    workflow.averageRating = workflow.reviews.reduce((sum, r) => sum + r.rating, 0) / workflow.reviews.length;

    return true;
  }

  /**
   * Mark a review as helpful
   */
  markReviewHelpful(workflowId: string, reviewId: string): boolean {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) return false;

    const review = workflow.reviews.find(r => r.id === reviewId);
    if (!review) return false;

    review.helpful++;
    return true;
  }

  /**
   * Get featured workflows
   */
  getFeaturedWorkflows(limit: number = 6): MarketplaceWorkflow[] {
    return Array.from(this.workflows.values())
      .filter(w => w.featured && w.isPublic)
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, limit);
  }

  /**
   * Get trending workflows (most downloaded in last 30 days)
   */
  getTrendingWorkflows(limit: number = 6): MarketplaceWorkflow[] {
    // For this implementation, we'll use total downloads as a proxy
    // In a real system, you'd track downloads by date
    return Array.from(this.workflows.values())
      .filter(w => w.isPublic)
      .sort((a, b) => b.totalDownloads - a.totalDownloads)
      .slice(0, limit);
  }

  /**
   * Get workflows by author
   */
  getWorkflowsByAuthor(authorId: string): MarketplaceWorkflow[] {
    return Array.from(this.workflows.values())
      .filter(w => w.author === authorId && w.isPublic);
  }

  /**
   * Search workflows
   */
  searchWorkflows(query: string, limit: number = 10): MarketplaceWorkflow[] {
    const searchTerm = query.toLowerCase();
    
    return Array.from(this.workflows.values())
      .filter(w => w.isPublic)
      .filter(w =>
        w.name.toLowerCase().includes(searchTerm) ||
        w.description.toLowerCase().includes(searchTerm) ||
        w.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        w.category.toLowerCase().includes(searchTerm)
      )
      .sort((a, b) => {
        // Prioritize exact matches in name
        const aNameMatch = a.name.toLowerCase().includes(searchTerm);
        const bNameMatch = b.name.toLowerCase().includes(searchTerm);
        
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        
        // Then by rating
        return b.averageRating - a.averageRating;
      })
      .slice(0, limit);
  }

  /**
   * Get categories with workflow counts
   */
  getCategories(): Array<{ name: string; count: number }> {
    const categoryMap = new Map<string, number>();
    
    Array.from(this.workflows.values())
      .filter(w => w.isPublic)
      .forEach(w => {
        const count = categoryMap.get(w.category) || 0;
        categoryMap.set(w.category, count + 1);
      });

    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get popular tags
   */
  getPopularTags(limit: number = 20): Array<{ tag: string; count: number }> {
    const tagMap = new Map<string, number>();
    
    Array.from(this.workflows.values())
      .filter(w => w.isPublic)
      .forEach(w => {
        w.tags.forEach(tag => {
          const count = tagMap.get(tag) || 0;
          tagMap.set(tag, count + 1);
        });
      });

    return Array.from(tagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private generateId(): string {
    return `mp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeWithSampleData(): void {
    // Add some sample workflows for demonstration
    // In a real application, this would come from a database
    
    const sampleWorkflows: MarketplaceWorkflow[] = [
      {
        id: 'sample-1',
        name: 'E-commerce Order Processing',
        description: 'Complete automation for processing e-commerce orders from payment to fulfillment',
        category: 'E-commerce',
        nodes: [],
        edges: [],
        tags: ['e-commerce', 'automation', 'fulfillment', 'payment'],
        author: 'WorkflowMaster',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        isPublic: true,
        license: 'mit',
        reviews: [
          {
            id: 'review-1',
            userId: 'user-1',
            userName: 'John Doe',
            rating: 5,
            comment: 'Excellent workflow, saved us hours of manual work!',
            createdAt: new Date('2024-01-25'),
            helpful: 12,
            workflowVersion: '1.0.0'
          }
        ],
        averageRating: 4.8,
        totalDownloads: 1250,
        featured: true,
        verified: true,
        publishedAt: new Date('2024-01-20'),
        lastUpdated: new Date('2024-01-20'),
        compatibility: ['v2.0+'],
        screenshots: ['/screenshots/ecommerce-1.png'],
        documentation: 'Complete guide for setting up e-commerce order processing'
      },
      {
        id: 'sample-2',
        name: 'Social Media Analytics',
        description: 'Automated social media analytics and reporting dashboard',
        category: 'Marketing',
        nodes: [],
        edges: [],
        tags: ['social-media', 'analytics', 'reporting', 'dashboard'],
        author: 'AnalyticsGuru',
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01'),
        isPublic: true,
        price: 29.99,
        currency: 'USD',
        license: 'commercial',
        reviews: [],
        averageRating: 4.5,
        totalDownloads: 890,
        featured: false,
        verified: true,
        publishedAt: new Date('2024-02-01'),
        lastUpdated: new Date('2024-02-01'),
        compatibility: ['v2.0+'],
        documentation: 'Setup guide for social media analytics workflow'
      }
    ];

    sampleWorkflows.forEach(workflow => {
      this.workflows.set(workflow.id, workflow);
    });
  }
}