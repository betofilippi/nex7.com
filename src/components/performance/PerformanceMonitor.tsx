'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { usePerformance, PerformanceMetrics } from '../../hooks/usePerformance';

interface PerformanceMonitorProps {
  showInProduction?: boolean;
}

export default function PerformanceMonitor({ showInProduction = false }: PerformanceMonitorProps) {
  const { metrics } = usePerformance();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(process.env.NODE_ENV === 'development' || showInProduction);
  }, [showInProduction]);

  if (!isVisible) return null;

  const getMetricStatus = (value: number | undefined, thresholds: [number, number]) => {
    if (value === undefined) return 'default';
    if (value <= thresholds[0]) return 'good';
    if (value <= thresholds[1]) return 'needs-improvement';
    return 'poor';
  };

  const formatMetric = (value: number | undefined, unit: string = 'ms') => {
    return value !== undefined ? `${value.toFixed(2)}${unit}` : 'N/A';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'needs-improvement': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 bg-white/95 backdrop-blur-sm border shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">LCP (Largest Contentful Paint)</span>
          <Badge className={getStatusColor(getMetricStatus(metrics.lcp, [2500, 4000]))}>
            {formatMetric(metrics.lcp)}
          </Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">FID (First Input Delay)</span>
          <Badge className={getStatusColor(getMetricStatus(metrics.fid, [100, 300]))}>
            {formatMetric(metrics.fid)}
          </Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">CLS (Cumulative Layout Shift)</span>
          <Badge className={getStatusColor(getMetricStatus(metrics.cls, [0.1, 0.25]))}>
            {formatMetric(metrics.cls, '')}
          </Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">FCP (First Contentful Paint)</span>
          <Badge className={getStatusColor(getMetricStatus(metrics.fcp, [1800, 3000]))}>
            {formatMetric(metrics.fcp)}
          </Badge>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">TTFB (Time to First Byte)</span>
          <Badge className={getStatusColor(getMetricStatus(metrics.ttfb, [800, 1800]))}>
            {formatMetric(metrics.ttfb)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}