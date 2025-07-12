export interface AnalyticsEvent {
  id: string;
  name: string;
  category: string;
  properties: Record<string, any>;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
  referrer?: string;
  url: string;
}

export interface UserSession {
  id: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  pageViews: number;
  events: number;
  userAgent: string;
  ip?: string;
  country?: string;
  city?: string;
  device: {
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    browser: string;
  };
}

export interface AnalyticsMetrics {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  avgSessionDuration: number;
  bounceRate: number;
  pageViews: number;
  uniquePageViews: number;
  newUsers: number;
  returningUsers: number;
}

export interface AIUsageMetrics {
  totalRequests: number;
  totalTokens: number;
  avgResponseTime: number;
  errorRate: number;
  modelUsage: Record<string, number>;
  categoryUsage: Record<string, number>;
  costByModel: Record<string, number>;
  requestsByHour: Record<string, number>;
}

export interface PerformanceMetrics {
  avgLoadTime: number;
  avgResponseTime: number;
  errorRate: number;
  uptime: number;
  throughput: number;
  memoryUsage: number;
  cpuUsage: number;
  dbResponseTime: number;
}

export interface CustomEvent {
  name: string;
  category: string;
  value?: number;
  label?: string;
  properties?: Record<string, any>;
}

export interface AnalyticsFilter {
  startDate: Date;
  endDate: Date;
  userId?: string;
  category?: string;
  device?: string;
  country?: string;
  source?: string;
}

export interface AnalyticsReport {
  id: string;
  name: string;
  description?: string;
  type: 'user-activity' | 'ai-usage' | 'performance' | 'custom';
  filters: AnalyticsFilter;
  metrics: string[];
  format: 'json' | 'csv' | 'pdf';
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    email?: string;
  };
  createdAt: Date;
  lastGenerated?: Date;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'heatmap';
  title: string;
  description?: string;
  metric?: string;
  chartType?: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  filters?: AnalyticsFilter;
  refreshRate?: number; // in seconds
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number; w: number; h: number };
}