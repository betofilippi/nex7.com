import { NextRequest, NextResponse } from 'next/server';
import { WorkflowMarketplace } from '@/lib/marketplace/workflow-marketplace';

const marketplace = WorkflowMarketplace.getInstance();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  try {
    const action = searchParams.get('action');
    
    switch (action) {
      case 'browse': {
        const category = searchParams.get('category') || undefined;
        const tags = searchParams.getAll('tags');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const rating = searchParams.get('rating');
        const license = searchParams.getAll('license');
        const sortBy = searchParams.get('sortBy') as any;
        const search = searchParams.get('search') || undefined;
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');
        
        const filters = {
          category,
          tags: tags.length > 0 ? tags : undefined,
          priceRange: minPrice && maxPrice ? 
            { min: parseFloat(minPrice), max: parseFloat(maxPrice) } : undefined,
          rating: rating ? parseFloat(rating) : undefined,
          license: license.length > 0 ? license : undefined,
          sortBy,
          search
        };
        
        const result = marketplace.browseWorkflows(filters, page, pageSize);
        return NextResponse.json(result);
      }
      
      case 'featured': {
        const limit = parseInt(searchParams.get('limit') || '6');
        const workflows = marketplace.getFeaturedWorkflows(limit);
        return NextResponse.json({ workflows });
      }
      
      case 'trending': {
        const limit = parseInt(searchParams.get('limit') || '6');
        const workflows = marketplace.getTrendingWorkflows(limit);
        return NextResponse.json({ workflows });
      }
      
      case 'search': {
        const query = searchParams.get('q');
        const limit = parseInt(searchParams.get('limit') || '10');
        
        if (!query) {
          return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
        }
        
        const workflows = marketplace.searchWorkflows(query, limit);
        return NextResponse.json({ workflows });
      }
      
      case 'categories': {
        const categories = marketplace.getCategories();
        return NextResponse.json({ categories });
      }
      
      case 'tags': {
        const limit = parseInt(searchParams.get('limit') || '20');
        const tags = marketplace.getPopularTags(limit);
        return NextResponse.json({ tags });
      }
      
      default: {
        // Default to browse all
        const result = marketplace.browseWorkflows();
        return NextResponse.json(result);
      }
    }
  } catch (error) {
    console.error('Marketplace API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'submit': {
        const { workflow, submittedBy, submissionNotes } = body;
        
        if (!workflow || !submittedBy) {
          return NextResponse.json(
            { error: 'Workflow and submittedBy are required' },
            { status: 400 }
          );
        }
        
        const submissionId = marketplace.submitWorkflow({
          workflow,
          submittedBy,
          submissionNotes
        });
        
        return NextResponse.json({ submissionId });
      }
      
      case 'review': {
        const { workflowId, userId, userName, rating, comment, workflowVersion } = body;
        
        if (!workflowId || !userId || !userName || !rating) {
          return NextResponse.json(
            { error: 'WorkflowId, userId, userName, and rating are required' },
            { status: 400 }
          );
        }
        
        if (rating < 1 || rating > 5) {
          return NextResponse.json(
            { error: 'Rating must be between 1 and 5' },
            { status: 400 }
          );
        }
        
        const success = marketplace.addReview(
          workflowId,
          userId,
          userName,
          rating,
          comment,
          workflowVersion
        );
        
        if (!success) {
          return NextResponse.json(
            { error: 'Workflow not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({ success: true });
      }
      
      case 'helpful': {
        const { workflowId, reviewId } = body;
        
        if (!workflowId || !reviewId) {
          return NextResponse.json(
            { error: 'WorkflowId and reviewId are required' },
            { status: 400 }
          );
        }
        
        const success = marketplace.markReviewHelpful(workflowId, reviewId);
        
        if (!success) {
          return NextResponse.json(
            { error: 'Workflow or review not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({ success: true });
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Marketplace API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}