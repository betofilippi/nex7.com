'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Activity, Clock, AlertTriangle, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useToast } from '../../hooks/use-toast';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface BuildLog {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: string;
}

interface PerformanceMetric {
  timestamp: string;
  cpu: number;
  memory: number;
  buildTime: number;
  bundleSize: number;
}

interface DeploymentRecord {
  id: string;
  timestamp: string;
  version: string;
  status: 'success' | 'failed' | 'rollback';
  duration: number;
  triggeredBy: string;
  changes: number;
}

interface DeploymentMonitorProps {
  deploymentId?: string;
  onErrorDetected?: (error: unknown) => void;
  className?: string;
}

const DeploymentMonitor: React.FC<DeploymentMonitorProps> = ({
  deploymentId: _deploymentId,
  onErrorDetected,
  className
}) => {
  const { toast } = useToast();
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<BuildLog[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [deploymentHistory, setDeploymentHistory] = useState<DeploymentRecord[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [selectedTab, setSelectedTab] = useState('logs');

  // Simulate real-time logs
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const logTypes: BuildLog['level'][] = ['info', 'success', 'warning', 'error'];
      const messages = [
        'Building application bundle...',
        'Running test suite...',
        'Optimizing images...',
        'Compiling TypeScript files...',
        'Generating static pages...',
        'Deploying to production...',
      ];

      const newLog: BuildLog = {
        timestamp: new Date().toISOString(),
        level: logTypes[Math.floor(Math.random() * logTypes.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        details: Math.random() > 0.5 ? `Details: ${Math.random().toString(36).substring(7)}` : undefined
      };

      setLogs(prev => [...prev.slice(-100), newLog]);

      if (newLog.level === 'error' && onErrorDetected) {
        onErrorDetected(newLog);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive, onErrorDetected]);

  // Simulate performance metrics
  useEffect(() => {
    const interval = setInterval(() => {
      const newMetric: PerformanceMetric = {
        timestamp: new Date().toISOString(),
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        buildTime: 30 + Math.random() * 60,
        bundleSize: 1000 + Math.random() * 500
      };

      setMetrics(prev => [...prev.slice(-20), newMetric]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLogColor = (level: BuildLog['level']) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      default: return 'text-gray-300';
    }
  };

  const formatLogMessage = (log: BuildLog) => {
    const time = new Date(log.timestamp).toLocaleTimeString();
    return (
      <div className="font-mono text-sm">
        <span className="text-gray-500">[{time}]</span>
        <span className={cn("ml-2", getLogColor(log.level))}> [{log.level.toUpperCase()}]</span>
        <span className="ml-2 text-gray-200">{log.message}</span>
        {log.details && (
          <div className="ml-16 text-gray-400 text-xs">{log.details}</div>
        )}
      </div>
    );
  };

  const performanceChartData = {
    labels: metrics.map(m => new Date(m.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'CPU Usage (%)',
        data: metrics.map(m => m.cpu),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Memory Usage (%)',
        data: metrics.map(m => m.memory),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const buildTimeChartData = {
    labels: metrics.map(m => new Date(m.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Build Time (s)',
        data: metrics.map(m => m.buildTime),
        backgroundColor: 'rgba(147, 51, 234, 0.5)',
        borderColor: 'rgb(147, 51, 234)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'rgb(156, 163, 175)'
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)'
        },
        ticks: {
          color: 'rgb(156, 163, 175)'
        }
      },
      y: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)'
        },
        ticks: {
          color: 'rgb(156, 163, 175)'
        }
      }
    }
  };

  const analyzeBuildErrors = async () => {
    const errors = logs.filter(log => log.level === 'error');
    if (errors.length === 0) {
      toast({
        title: "No errors found",
        description: "The build is running smoothly!"
      });
      return;
    }

    // Here you would integrate with Claude API
    toast({
      title: "Analyzing errors with Claude...",
      description: `Found ${errors.length} errors. Generating solutions...`
    });
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-100">Deployment Monitor</h2>
        <div className="flex gap-2">
          <Button
            variant={isLive ? "default" : "outline"}
            size="sm"
            onClick={() => setIsLive(!isLive)}
          >
            <Activity className={cn("w-4 h-4 mr-2", isLive && "animate-pulse")} />
            {isLive ? 'Live' : 'Paused'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={analyzeBuildErrors}
          >
            <Zap className="w-4 h-4 mr-2" />
            Analyze Errors
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="logs">Build Logs</TabsTrigger>
          <TabsTrigger value="metrics">Performance</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Build Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-100">
                <Terminal className="w-5 h-5" />
                Build Output
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black rounded-lg p-4 h-96 overflow-y-auto">
                <AnimatePresence>
                  {logs.map((log, index) => (
                    <motion.div
                      key={`${log.timestamp}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {formatLogMessage(log)}
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={logsEndRef} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-100">System Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Line data={performanceChartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-100">Build Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <Bar data={buildTimeChartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metrics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Avg CPU', value: '45%', trend: 'up', icon: TrendingUp },
              { label: 'Avg Memory', value: '62%', trend: 'down', icon: TrendingDown },
              { label: 'Build Time', value: '58s', trend: 'down', icon: Clock },
              { label: 'Bundle Size', value: '1.2MB', trend: 'up', icon: AlertTriangle }
            ].map((metric) => (
              <Card key={metric.label} className="bg-gray-900 border-gray-800">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-400">{metric.label}</p>
                      <p className="text-2xl font-bold text-gray-100">{metric.value}</p>
                    </div>
                    <metric.icon className={cn(
                      "w-5 h-5",
                      metric.trend === 'up' ? 'text-green-500' : 'text-red-500'
                    )} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Deployment History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-100">Recent Deployments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deploymentHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No deployment history available
                  </div>
                ) : (
                  deploymentHistory.map((deployment) => (
                    <div
                      key={deployment.id}
                      className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          deployment.status === 'success' && "bg-green-500",
                          deployment.status === 'failed' && "bg-red-500",
                          deployment.status === 'rollback' && "bg-yellow-500"
                        )} />
                        <div>
                          <p className="font-medium text-gray-100">{deployment.version}</p>
                          <p className="text-sm text-gray-400">
                            {new Date(deployment.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Duration: {deployment.duration}s</p>
                        <p className="text-xs text-gray-500">by {deployment.triggeredBy}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeploymentMonitor;