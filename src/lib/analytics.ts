interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  userAgent?: string;
}

class Analytics {
  private queue: AnalyticsEvent[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private batchSize = 10;
  private flushInterval = 5000; // 5 seconds
  private endpoint = '/api/analytics';
  private isEnabled = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.startBatchFlush();
      this.setupPerformanceObserver();
      this.setupWebVitals();
    }
  }

  track(event: string, properties?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.queue.push({
      name: event,
      properties: {
        ...properties,
        timestamp: Date.now(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      },
    });

    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  trackPerformance(name: string, value: number, rating: 'good' | 'needs-improvement' | 'poor'): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      rating,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };

    this.performanceMetrics.push(metric);
    this.track('performance_metric', metric);
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      if (typeof fetch !== 'undefined') {
        await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ events }),
        });
      }
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      // Re-queue events for retry
      this.queue.unshift(...events);
    }
  }

  private startBatchFlush(): void {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  private setupPerformanceObserver(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    // Long Task Observer
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackPerformance(
            'long_task',
            entry.duration,
            entry.duration > 50 ? 'poor' : 'good'
          );
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      console.warn('Long task observer not supported');
    }

    // Resource Timing Observer
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          const duration = resource.responseEnd - resource.requestStart;
          
          this.track('resource_timing', {
            name: resource.name,
            duration,
            size: resource.transferSize,
            type: this.getResourceType(resource.name),
          });
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (e) {
      console.warn('Resource observer not supported');
    }

    // Navigation Timing
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const nav = entry as PerformanceNavigationTiming;
          
          this.trackPerformance(
            'page_load_time',
            nav.loadEventEnd - nav.navigationStart,
            nav.loadEventEnd - nav.navigationStart < 2000 ? 'good' : 'poor'
          );

          this.trackPerformance(
            'dom_content_loaded',
            nav.domContentLoadedEventEnd - nav.navigationStart,
            nav.domContentLoadedEventEnd - nav.navigationStart < 1500 ? 'good' : 'poor'
          );
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
    } catch (e) {
      console.warn('Navigation observer not supported');
    }
  }

  private setupWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    this.observeWebVital('largest-contentful-paint', (entry: any) => {
      const value = entry.renderTime || entry.loadTime;
      this.trackPerformance(
        'lcp',
        value,
        value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor'
      );
    });

    // First Input Delay (FID)
    this.observeWebVital('first-input', (entry: any) => {
      const value = entry.processingStart - entry.startTime;
      this.trackPerformance(
        'fid',
        value,
        value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor'
      );
    });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    this.observeWebVital('layout-shift', (entry: any) => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
        this.trackPerformance(
          'cls',
          clsValue,
          clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor'
        );
      }
    });
  }

  private observeWebVital(type: string, callback: (entry: any) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          callback(entry);
        }
      });
      observer.observe({ type, buffered: true });
    } catch (e) {
      console.warn(`${type} observer not supported`);
    }
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.webp') || url.includes('.avif')) return 'image';
    if (url.includes('.woff') || url.includes('.ttf')) return 'font';
    return 'other';
  }

  // Public methods for manual tracking
  startTiming(name: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.track('custom_timing', { name, duration });
    };
  }

  trackPageView(page: string): void {
    this.track('page_view', { page });
  }

  trackUserAction(action: string, properties?: Record<string, any>): void {
    this.track('user_action', { action, ...properties });
  }

  trackError(error: Error, context?: Record<string, any>): void {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context,
    });
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.performanceMetrics];
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }
}

// Global analytics instance
export const analytics = new Analytics();

// React hook for analytics
export const useAnalytics = () => {
  return {
    track: analytics.track.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics),
    startTiming: analytics.startTiming.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackUserAction: analytics.trackUserAction.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    getMetrics: analytics.getMetrics.bind(analytics),
  };
};