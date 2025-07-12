import { NextRequest, NextResponse } from 'next/server';
import { WorkflowMarketplace } from '@/lib/marketplace/workflow-marketplace';

const marketplace = WorkflowMarketplace.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflow = marketplace.getWorkflow(params.id);
    
    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ workflow });
  } catch (error) {
    console.error('Marketplace API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action, userId } = body;
    
    if (action === 'download') {
      if (!userId) {
        return NextResponse.json(
          { error: 'UserId is required for download' },
          { status: 400 }
        );
      }
      
      const workflow = marketplace.downloadWorkflow(params.id, userId);
      
      if (!workflow) {
        return NextResponse.json(
          { error: 'Workflow not found or not available for download' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ workflow });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Marketplace API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}