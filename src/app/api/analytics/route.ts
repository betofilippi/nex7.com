import { NextRequest, NextResponse } from 'next/server';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

interface AnalyticsPayload {
  events: AnalyticsEvent[];
}

export async function POST(request: NextRequest) {
  try {
    const { events }: AnalyticsPayload = await request.json();

    if (!Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Invalid payload: events must be an array' },
        { status: 400 }
      );
    }

    // In a production environment, you would send these events to your analytics service
    // Examples: Google Analytics, Mixpanel, Amplitude, etc.
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics events received:', {
        count: events.length,
        events: events.slice(0, 3), // Log first 3 events for debugging
      });
    }

    // Here you could:
    // 1. Send to external analytics service
    // 2. Store in database for custom analytics
    // 3. Forward to multiple services
    
    // Example: Store performance metrics in database
    const performanceEvents = events.filter(event => event.name === 'performance_metric');
    if (performanceEvents.length > 0 && process.env.NODE_ENV === 'production') {
      // await storePerformanceMetrics(performanceEvents);
    }

    // Example: Send errors to error tracking service
    const errorEvents = events.filter(event => event.name === 'error');
    if (errorEvents.length > 0) {
      // await sendToErrorTracking(errorEvents);
    }

    return NextResponse.json({ success: true, processed: events.length });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics events' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'analytics'
  });
}