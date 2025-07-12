import { 
  AnalyticsReport, 
  AnalyticsFilter, 
  AnalyticsMetrics,
  AIUsageMetrics,
  PerformanceMetrics,
  ChartData 
} from './types';
import { analyticsTracker } from './analytics-tracker';
import { format } from 'date-fns';

export class ReportGenerator {
  async generateReport(report: AnalyticsReport): Promise<any> {
    const data = await this.collectData(report);
    
    switch (report.format) {
      case 'json':
        return this.generateJSONReport(data, report);
      case 'csv':
        return this.generateCSVReport(data, report);
      case 'pdf':
        return this.generatePDFReport(data, report);
      default:
        throw new Error(`Unsupported format: ${report.format}`);
    }
  }

  private async collectData(report: AnalyticsReport): Promise<any> {
    const { type, filters, metrics } = report;
    
    switch (type) {
      case 'user-activity':
        return this.collectUserActivityData(filters, metrics);
      case 'ai-usage':
        return this.collectAIUsageData(filters, metrics);
      case 'performance':
        return this.collectPerformanceData(filters, metrics);
      case 'custom':
        return this.collectCustomData(filters, metrics);
      default:
        throw new Error(`Unsupported report type: ${type}`);
    }
  }

  private collectUserActivityData(filters: AnalyticsFilter, metrics: string[]): any {
    const analyticsMetrics = analyticsTracker.getMetrics(filters);
    const events = analyticsTracker.getEvents(filters);
    
    return {
      metrics: this.filterMetrics(analyticsMetrics, metrics),
      events: events.slice(0, 1000), // Limit for performance
      chartData: this.generateUserActivityCharts(events, filters),
    };
  }

  private collectAIUsageData(filters: AnalyticsFilter, metrics: string[]): any {
    const aiMetrics = analyticsTracker.getAIMetrics(filters);
    const events = analyticsTracker.getEvents({ ...filters, category: 'ai' });
    
    return {
      metrics: this.filterMetrics(aiMetrics, metrics),
      events: events.slice(0, 1000),
      chartData: this.generateAIUsageCharts(events, filters),
    };
  }

  private collectPerformanceData(filters: AnalyticsFilter, metrics: string[]): any {
    const events = analyticsTracker.getEvents({ ...filters, category: 'performance' });
    
    // Calculate performance metrics from events
    const performanceMetrics = this.calculatePerformanceMetrics(events);
    
    return {
      metrics: this.filterMetrics(performanceMetrics, metrics),
      events: events.slice(0, 1000),
      chartData: this.generatePerformanceCharts(events, filters),
    };
  }

  private collectCustomData(filters: AnalyticsFilter, metrics: string[]): any {
    const events = analyticsTracker.getEvents(filters);
    
    return {
      events: events.slice(0, 1000),
      aggregatedData: this.aggregateCustomData(events, metrics),
    };
  }

  private filterMetrics(allMetrics: any, requestedMetrics: string[]): any {
    if (requestedMetrics.length === 0) return allMetrics;
    
    const filtered: any = {};
    requestedMetrics.forEach(metric => {
      if (metric in allMetrics) {
        filtered[metric] = allMetrics[metric];
      }
    });
    
    return filtered;
  }

  private generateUserActivityCharts(events: any[], filters: AnalyticsFilter): ChartData[] {
    const pageViews = events.filter(e => e.name === 'page_view');
    
    // Daily page views chart
    const dailyViews = this.groupEventsByDay(pageViews, filters);
    const pageViewsChart: ChartData = {
      labels: Object.keys(dailyViews),
      datasets: [{
        label: 'Page Views',
        data: Object.values(dailyViews),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      }],
    };

    // Top pages chart
    const pageUrls = pageViews.map(e => e.properties.url || 'Unknown');
    const urlCounts = this.countOccurrences(pageUrls);
    const topPages = Object.entries(urlCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    const topPagesChart: ChartData = {
      labels: topPages.map(([url]) => this.shortenUrl(url)),
      datasets: [{
        label: 'Page Views',
        data: topPages.map(([,count]) => count),
        backgroundColor: [
          '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
          '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9'
        ],
      }],
    };

    return [pageViewsChart, topPagesChart];
  }

  private generateAIUsageCharts(events: any[], filters: AnalyticsFilter): ChartData[] {
    // Requests over time
    const dailyRequests = this.groupEventsByDay(events, filters);
    const requestsChart: ChartData = {
      labels: Object.keys(dailyRequests),
      datasets: [{
        label: 'AI Requests',
        data: Object.values(dailyRequests),
        backgroundColor: 'rgba(168, 85, 247, 0.5)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 2,
      }],
    };

    // Model usage
    const models = events.map(e => e.properties.model || 'Unknown');
    const modelCounts = this.countOccurrences(models);
    const modelChart: ChartData = {
      labels: Object.keys(modelCounts),
      datasets: [{
        label: 'Requests',
        data: Object.values(modelCounts),
        backgroundColor: [
          '#8b5cf6', '#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff'
        ],
      }],
    };

    return [requestsChart, modelChart];
  }

  private generatePerformanceCharts(events: any[], filters: AnalyticsFilter): ChartData[] {
    // Response times over time
    const dailyResponseTimes = this.groupEventsByDay(events, filters, 'avg');
    const responseTimeChart: ChartData = {
      labels: Object.keys(dailyResponseTimes),
      datasets: [{
        label: 'Avg Response Time (ms)',
        data: Object.values(dailyResponseTimes),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
      }],
    };

    return [responseTimeChart];
  }

  private groupEventsByDay(events: any[], filters: AnalyticsFilter, aggregation: 'count' | 'avg' = 'count'): Record<string, number> {
    const grouped: Record<string, number[]> = {};
    
    events.forEach(event => {
      const date = format(new Date(event.timestamp), 'yyyy-MM-dd');
      if (!grouped[date]) grouped[date] = [];
      
      if (aggregation === 'avg') {
        const value = event.properties.responseTime || event.properties.loadTime || 0;
        grouped[date].push(value);
      } else {
        grouped[date].push(1);
      }
    });

    const result: Record<string, number> = {};
    Object.entries(grouped).forEach(([date, values]) => {
      if (aggregation === 'avg') {
        result[date] = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
      } else {
        result[date] = values.length;
      }
    });

    return result;
  }

  private countOccurrences(items: string[]): Record<string, number> {
    return items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private shortenUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } catch {
      return url.length > 30 ? url.slice(0, 30) + '...' : url;
    }
  }

  private calculatePerformanceMetrics(events: any[]): PerformanceMetrics {
    const loadTimes = events.map(e => e.properties.loadTime || 0).filter(t => t > 0);
    const responseTimes = events.map(e => e.properties.responseTime || 0).filter(t => t > 0);
    const errors = events.filter(e => e.properties.error);

    return {
      avgLoadTime: loadTimes.length > 0 ? loadTimes.reduce((sum, t) => sum + t, 0) / loadTimes.length : 0,
      avgResponseTime: responseTimes.length > 0 ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length : 0,
      errorRate: events.length > 0 ? errors.length / events.length : 0,
      uptime: 99.9, // Would be calculated from monitoring data
      throughput: events.length,
      memoryUsage: 0, // Would come from system metrics
      cpuUsage: 0, // Would come from system metrics
      dbResponseTime: 0, // Would come from database metrics
    };
  }

  private aggregateCustomData(events: any[], metrics: string[]): any {
    // Custom aggregation logic based on requested metrics
    const aggregated: any = {};
    
    metrics.forEach(metric => {
      switch (metric) {
        case 'event_count':
          aggregated.eventCount = events.length;
          break;
        case 'unique_users':
          aggregated.uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean)).size;
          break;
        case 'avg_session_duration':
          // Would calculate from session data
          break;
        default:
          // Custom metric calculation
          break;
      }
    });

    return aggregated;
  }

  private generateJSONReport(data: any, report: AnalyticsReport): string {
    const reportData = {
      reportId: report.id,
      reportName: report.name,
      type: report.type,
      filters: report.filters,
      generatedAt: new Date().toISOString(),
      data,
    };

    return JSON.stringify(reportData, null, 2);
  }

  private generateCSVReport(data: any, report: AnalyticsReport): string {
    let csv = `Report: ${report.name}\n`;
    csv += `Generated: ${new Date().toISOString()}\n\n`;

    // Add metrics
    if (data.metrics) {
      csv += 'Metrics\n';
      Object.entries(data.metrics).forEach(([key, value]) => {
        csv += `${key},${value}\n`;
      });
      csv += '\n';
    }

    // Add events
    if (data.events && data.events.length > 0) {
      csv += 'Events\n';
      const headers = Object.keys(data.events[0]);
      csv += headers.join(',') + '\n';
      
      data.events.forEach((event: any) => {
        const row = headers.map(header => {
          const value = event[header];
          if (typeof value === 'object') {
            return JSON.stringify(value).replace(/,/g, ';');
          }
          return value || '';
        });
        csv += row.join(',') + '\n';
      });
    }

    return csv;
  }

  private async generatePDFReport(data: any, report: AnalyticsReport): Promise<string> {
    // In a real implementation, you would use a PDF generation library
    // For now, return a placeholder
    return `PDF report generation not implemented. Report: ${report.name}`;
  }

  async scheduleReport(report: AnalyticsReport): Promise<void> {
    if (!report.schedule) return;

    // In a real implementation, this would integrate with a job scheduler
    console.log(`Scheduling report ${report.name} for ${report.schedule.frequency} at ${report.schedule.time}`);
    
    // Set up interval or cron job
    // This is a simplified example
    const intervalMs = this.getIntervalMs(report.schedule.frequency);
    
    setInterval(async () => {
      try {
        const generatedReport = await this.generateReport(report);
        
        if (report.schedule?.email) {
          await this.emailReport(generatedReport, report);
        }
        
        // Update last generated timestamp
        report.lastGenerated = new Date();
      } catch (error) {
        console.error(`Failed to generate scheduled report ${report.name}:`, error);
      }
    }, intervalMs);
  }

  private getIntervalMs(frequency: string): number {
    switch (frequency) {
      case 'daily':
        return 24 * 60 * 60 * 1000;
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000;
      case 'monthly':
        return 30 * 24 * 60 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000;
    }
  }

  private async emailReport(reportData: string, report: AnalyticsReport): Promise<void> {
    // In a real implementation, this would use the email service
    console.log(`Emailing report ${report.name} to ${report.schedule?.email}`);
  }
}

export const reportGenerator = new ReportGenerator();