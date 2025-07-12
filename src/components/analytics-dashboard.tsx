'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  Activity, 
  Brain, 
  Zap, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  Download
} from 'lucide-react';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { analyticsTracker } from '@/lib/analytics/analytics-tracker';
import { AnalyticsMetrics, AIUsageMetrics } from '@/lib/analytics/types';
import { format, subDays } from 'date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

type TimeRange = '7d' | '30d' | '90d' | '1y';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

function MetricCard({ title, value, change, icon, trend = 'neutral' }: MetricCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className={`text-xs ${getTrendColor()}`}>
            {change >= 0 ? '+' : ''}{change}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [aiMetrics, setAiMetrics] = useState<AIUsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, getTimeRangeDays(timeRange));
      
      const filters = { startDate, endDate };
      
      const userMetrics = analyticsTracker.getMetrics(filters);
      const aiUsageMetrics = analyticsTracker.getAIMetrics(filters);
      
      setMetrics(userMetrics);
      setAiMetrics(aiUsageMetrics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRangeDays = (range: TimeRange): number => {
    switch (range) {
      case '7d':
        return 7;
      case '30d':
        return 30;
      case '90d':
        return 90;
      case '1y':
        return 365;
      default:
        return 30;
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const generateChartData = () => {
    const endDate = new Date();
    const days = getTimeRangeDays(timeRange);
    const labels = [];
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(endDate, i);
      labels.push(format(date, 'MMM dd'));
      data.push(Math.floor(Math.random() * 100) + 20); // Mock data
    }

    return {
      labels,
      datasets: [
        {
          label: 'Page Views',
          data,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
        },
      ],
    };
  };

  const aiUsageChartData = {
    labels: Object.keys(aiMetrics?.modelUsage || {}),
    datasets: [
      {
        label: 'Requests',
        data: Object.values(aiMetrics?.modelUsage || {}),
        backgroundColor: [
          '#8b5cf6',
          '#a855f7',
          '#c084fc',
          '#d8b4fe',
          '#e9d5ff',
        ],
      },
    ],
  };

  const downloadReport = async (format: 'csv' | 'pdf') => {
    // In a real implementation, this would call the report generator
    console.log(`Downloading ${format} report`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => downloadReport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Activity</TabsTrigger>
          <TabsTrigger value="ai">AI Usage</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Users"
              value={formatNumber(metrics?.totalUsers || 0)}
              change={12}
              trend="up"
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Active Sessions"
              value={formatNumber(metrics?.totalSessions || 0)}
              change={8}
              trend="up"
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="AI Requests"
              value={formatNumber(aiMetrics?.totalRequests || 0)}
              change={-3}
              trend="down"
              icon={<Brain className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Avg Response Time"
              value={`${Math.round(aiMetrics?.avgResponseTime || 0)}ms`}
              change={5}
              trend="down"
              icon={<Zap className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Page Views Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <Line 
                  data={generateChartData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                  height={300}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Model Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <Doughnut 
                  data={aiUsageChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                  height={300}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Page Views"
              value={formatNumber(metrics?.pageViews || 0)}
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Unique Page Views"
              value={formatNumber(metrics?.uniquePageViews || 0)}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Avg Session Duration"
              value={formatDuration(metrics?.avgSessionDuration || 0)}
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Bounce Rate"
              value={`${Math.round((metrics?.bounceRate || 0) * 100)}%`}
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Activity Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <Line 
                data={generateChartData()} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
                height={400}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Requests"
              value={formatNumber(aiMetrics?.totalRequests || 0)}
              icon={<Brain className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Total Tokens"
              value={formatNumber(aiMetrics?.totalTokens || 0)}
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Error Rate"
              value={`${Math.round((aiMetrics?.errorRate || 0) * 100)}%`}
              icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Avg Response Time"
              value={`${Math.round(aiMetrics?.avgResponseTime || 0)}ms`}
              icon={<Zap className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Model Usage Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <Pie 
                  data={aiUsageChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                  height={300}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <Bar 
                  data={{
                    labels: Object.keys(aiMetrics?.categoryUsage || {}),
                    datasets: [
                      {
                        label: 'Requests',
                        data: Object.values(aiMetrics?.categoryUsage || {}),
                        backgroundColor: 'rgba(168, 85, 247, 0.5)',
                        borderColor: 'rgba(168, 85, 247, 1)',
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                  height={300}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Uptime"
              value="99.9%"
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Avg Load Time"
              value="250ms"
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Error Rate"
              value="0.1%"
              icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
            />
            <MetricCard
              title="Throughput"
              value="1.2K/min"
              icon={<Zap className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Performance monitoring dashboard would show detailed metrics here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}