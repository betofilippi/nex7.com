import { 
  AnalyticsEvent, 
  UserSession, 
  CustomEvent,
  AnalyticsMetrics,
  AIUsageMetrics,
  PerformanceMetrics 
} from './types';
import { UAParser } from 'ua-parser-js';

export class AnalyticsTracker {
  private events: AnalyticsEvent[] = [];
  private sessions: Map<string, UserSession> = new Map();
  private currentSession: UserSession | null = null;
  private sessionId: string;
  private userId?: string;
  private storageKey = 'nex7:analytics';
  private sessionKey = 'nex7:session';
  private apiEndpoint = '/api/v1/analytics/events';

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadFromStorage();
    this.initSession();
    this.setupEventListeners();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initSession(): void {
    const userAgent = typeof window !== 'undefined' ? navigator.userAgent : '';
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    this.currentSession = {
      id: this.sessionId,
      userId: this.userId,
      startTime: new Date(),
      pageViews: 0,
      events: 0,
      userAgent,
      device: {
        type: result.device.type as any || 'desktop',
        os: `${result.os.name} ${result.os.version}`.trim(),
        browser: `${result.browser.name} ${result.browser.version}`.trim(),
      },
    };

    this.sessions.set(this.sessionId, this.currentSession);
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Track page views
    window.addEventListener('popstate', () => {
      this.trackPageView();
    });

    // Track session end
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });

    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.endSession();
      } else {
        this.initSession();
      }
    });

    // Initial page view
    this.trackPageView();
  }

  setUserId(userId: string): void {
    this.userId = userId;
    if (this.currentSession) {
      this.currentSession.userId = userId;
    }
  }

  async track(event: CustomEvent): Promise<void> {
    const analyticsEvent: AnalyticsEvent = {
      id: this.generateId(),
      name: event.name,
      category: event.category,
      properties: event.properties || {},
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
      url: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
    };

    this.events.push(analyticsEvent);
    
    if (this.currentSession) {
      this.currentSession.events += 1;
    }

    // Send to server
    await this.sendToServer(analyticsEvent);
    
    // Save to local storage
    this.saveToStorage();
  }

  trackPageView(url?: string): void {
    if (typeof window === 'undefined') return;

    const currentUrl = url || window.location.href;
    
    this.track({
      name: 'page_view',
      category: 'navigation',
      properties: {
        url: currentUrl,
        title: document.title,
        referrer: document.referrer,
      },
    });

    if (this.currentSession) {
      this.currentSession.pageViews += 1;
    }
  }

  trackClick(element: string, properties?: Record<string, any>): void {
    this.track({
      name: 'click',
      category: 'interaction',
      properties: {
        element,
        ...properties,
      },
    });
  }

  trackAIRequest(data: {
    model: string;
    tokens: number;
    responseTime: number;
    error?: string;
    category?: string;
  }): void {
    this.track({
      name: 'ai_request',
      category: 'ai',
      properties: data,
    });
  }

  trackPerformance(data: {
    loadTime: number;
    responseTime: number;
    error?: string;
  }): void {
    this.track({
      name: 'performance',
      category: 'performance',
      properties: data,
    });
  }

  trackError(error: Error, context?: Record<string, any>): void {
    this.track({
      name: 'error',
      category: 'error',
      properties: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        ...context,
      },
    });
  }

  trackFeatureUsage(feature: string, action: string, properties?: Record<string, any>): void {
    this.track({
      name: 'feature_usage',
      category: 'feature',
      properties: {
        feature,
        action,
        ...properties,
      },
    });
  }

  private endSession(): void {
    if (!this.currentSession) return;

    this.currentSession.endTime = new Date();
    this.currentSession.duration = 
      this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime();

    this.saveToStorage();
  }

  private async sendToServer(event: AnalyticsEvent): Promise<void> {
    try {
      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      if (typeof localStorage === 'undefined') return;

      const eventsData = localStorage.getItem(this.storageKey);
      if (eventsData) {
        const events = JSON.parse(eventsData);
        this.events = events.map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp),
        }));
      }

      const sessionData = localStorage.getItem(this.sessionKey);
      if (sessionData) {
        const sessions = JSON.parse(sessionData);
        this.sessions = new Map(
          sessions.map(([id, session]: [string, any]) => [
            id,
            {
              ...session,
              startTime: new Date(session.startTime),
              endTime: session.endTime ? new Date(session.endTime) : undefined,
            },
          ])
        );
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    }
  }

  private saveToStorage(): void {
    try {
      if (typeof localStorage === 'undefined') return;

      localStorage.setItem(this.storageKey, JSON.stringify(this.events));
      
      const sessions = Array.from(this.sessions.entries());
      localStorage.setItem(this.sessionKey, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving analytics data:', error);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods for retrieving analytics data
  getEvents(filters?: {
    startDate?: Date;
    endDate?: Date;
    category?: string;
    userId?: string;
  }): AnalyticsEvent[] {
    let filteredEvents = [...this.events];

    if (filters?.startDate) {
      filteredEvents = filteredEvents.filter(e => e.timestamp >= filters.startDate!);
    }

    if (filters?.endDate) {
      filteredEvents = filteredEvents.filter(e => e.timestamp <= filters.endDate!);
    }

    if (filters?.category) {
      filteredEvents = filteredEvents.filter(e => e.category === filters.category);
    }

    if (filters?.userId) {
      filteredEvents = filteredEvents.filter(e => e.userId === filters.userId);
    }

    return filteredEvents;
  }

  getMetrics(filters?: {
    startDate?: Date;
    endDate?: Date;
  }): AnalyticsMetrics {
    const events = this.getEvents(filters);
    const sessions = Array.from(this.sessions.values());

    const pageViews = events.filter(e => e.name === 'page_view');
    const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean));
    const uniqueSessions = new Set(events.map(e => e.sessionId));

    return {
      totalUsers: uniqueUsers.size,
      activeUsers: uniqueUsers.size, // Simplified
      totalSessions: uniqueSessions.size,
      avgSessionDuration: this.calculateAvgSessionDuration(sessions),
      bounceRate: this.calculateBounceRate(sessions),
      pageViews: pageViews.length,
      uniquePageViews: new Set(pageViews.map(e => e.properties.url)).size,
      newUsers: uniqueUsers.size, // Simplified
      returningUsers: 0, // Simplified
    };
  }

  getAIMetrics(filters?: {
    startDate?: Date;
    endDate?: Date;
  }): AIUsageMetrics {
    const aiEvents = this.getEvents({ ...filters, category: 'ai' });
    
    const totalRequests = aiEvents.length;
    const totalTokens = aiEvents.reduce((sum, e) => sum + (e.properties.tokens || 0), 0);
    const responseTimes = aiEvents.map(e => e.properties.responseTime || 0);
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
    
    const errors = aiEvents.filter(e => e.properties.error);
    const errorRate = totalRequests > 0 ? errors.length / totalRequests : 0;

    const modelUsage: Record<string, number> = {};
    const categoryUsage: Record<string, number> = {};
    
    aiEvents.forEach(event => {
      const model = event.properties.model;
      const category = event.properties.category || 'unknown';
      
      if (model) {
        modelUsage[model] = (modelUsage[model] || 0) + 1;
      }
      
      categoryUsage[category] = (categoryUsage[category] || 0) + 1;
    });

    return {
      totalRequests,
      totalTokens,
      avgResponseTime,
      errorRate,
      modelUsage,
      categoryUsage,
      costByModel: {}, // Would need pricing data
      requestsByHour: this.groupEventsByHour(aiEvents),
    };
  }

  private calculateAvgSessionDuration(sessions: UserSession[]): number {
    const sessionsWithDuration = sessions.filter(s => s.duration);
    if (sessionsWithDuration.length === 0) return 0;
    
    const totalDuration = sessionsWithDuration.reduce((sum, s) => sum + s.duration!, 0);
    return totalDuration / sessionsWithDuration.length;
  }

  private calculateBounceRate(sessions: UserSession[]): number {
    if (sessions.length === 0) return 0;
    
    const bouncedSessions = sessions.filter(s => s.pageViews <= 1);
    return bouncedSessions.length / sessions.length;
  }

  private groupEventsByHour(events: AnalyticsEvent[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    events.forEach(event => {
      const hour = event.timestamp.getHours().toString().padStart(2, '0');
      grouped[hour] = (grouped[hour] || 0) + 1;
    });
    
    return grouped;
  }
}

// Global analytics tracker instance
export const analyticsTracker = new AnalyticsTracker();