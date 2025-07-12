'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import {
  GitBranch,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  MoreVertical,
  GitCommit,
  Calendar,
  TrendingUp,
  User,
} from 'lucide-react';
import { VercelDeployment } from '../../lib/vercel/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface DeploymentHistoryProps {
  projectId?: string;
  limit?: number;
  onDeploymentClick?: (deployment: VercelDeployment) => void;
  showChart?: boolean;
}

const statusIcons = {
  BUILDING: RefreshCw,
  ERROR: XCircle,
  INITIALIZING: Clock,
  QUEUED: Clock,
  READY: CheckCircle,
  CANCELED: XCircle,
};

const statusColors = {
  BUILDING: 'text-blue-500',
  ERROR: 'text-red-500',
  INITIALIZING: 'text-yellow-500',
  QUEUED: 'text-gray-500',
  READY: 'text-green-500',
  CANCELED: 'text-gray-500',
};

export default function DeploymentHistory({ 
  projectId,
  limit = 10,
  onDeploymentClick,
  showChart = true
}: DeploymentHistoryProps) {
  const [deployments, setDeployments] = useState<VercelDeployment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDeployments = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (projectId) params.append('projectId', projectId);

      const response = await fetch(`/api/vercel/deployments?${params}`);
      if (!response.ok) throw new Error('Failed to fetch deployments');

      const data = await response.json();
      setDeployments(data.deployments);
    } catch (error) {
      console.error('Error fetching deployments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId, limit]);

  useEffect(() => {
    fetchDeployments();
  }, [projectId, limit, fetchDeployments]);

  const getRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  const getDuration = (deployment: VercelDeployment) => {
    if (!deployment.buildingAt) return '-';
    const end = deployment.ready || Date.now();
    const duration = end - deployment.buildingAt;
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const handleRedeploy = async (deployment: VercelDeployment) => {
    try {
      const response = await fetch('/api/vercel/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'redeploy',
          deploymentId: deployment.uid,
          name: deployment.name,
        }),
      });

      if (response.ok) {
        fetchDeployments(true);
      }
    } catch (error) {
      console.error('Error redeploying:', error);
    }
  };

  // Calculate deployment success rate for chart
  const successRate = deployments.length > 0
    ? (deployments.filter(d => d.state === 'READY').length / deployments.length) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <CardTitle className="text-lg">Deployment History</CardTitle>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => fetchDeployments(true)}
            disabled={refreshing}
            className="h-8 w-8"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showChart && deployments.length > 0 ? (
          <div className="mb-6 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Success Rate</span>
              </div>
              <span className="text-2xl font-bold">{successRate.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${successRate}%` }}
              />
            </div>
          </div>
        ) : null}

        <ScrollArea className="h-[400px] pr-4">
          {loading && !deployments.length ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : deployments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No deployments found
            </div>
          ) : (
            <div className="space-y-3">
              {deployments.map((deployment) => {
                const StatusIcon = statusIcons[deployment.state];
                const statusColor = statusColors[deployment.state];

                return (
                  <div
                    key={deployment.uid}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => onDeploymentClick?.(deployment)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StatusIcon 
                          className={`h-4 w-4 ${statusColor} ${deployment.state === 'BUILDING' ? 'animate-spin' : ''}`} 
                        />
                        <Badge variant={deployment.state === 'READY' ? 'default' : 'secondary'}>
                          {deployment.state}
                        </Badge>
                        <span className="font-mono text-sm text-muted-foreground">
                          #{deployment.uid.slice(0, 7)}
                        </span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {deployment.url ? (
                            <DropdownMenuItem asChild>
                              <a 
                                href={`https://${deployment.url}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Preview
                              </a>
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleRedeploy(deployment);
                          }}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Redeploy
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{getRelativeTime(deployment.createdAt)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{getDuration(deployment)}</span>
                      </div>

                      {deployment.meta?.githubCommitRef ? (
                        <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                          <GitBranch className="h-3 w-3" />
                          <span>{String(deployment.meta.githubCommitRef)}</span>
                          {deployment.meta?.githubCommitSha ? (
                            <>
                              <GitCommit className="h-3 w-3" />
                              <span className="font-mono">
                                {String(deployment.meta.githubCommitSha).slice(0, 7)}
                              </span>
                            </>
                          ) : null}
                        </div>
                      ) : null}

                      {deployment.creator ? (
                        <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                          <User className="h-3 w-3" />
                          <span>{deployment.creator.username || deployment.creator.email}</span>
                        </div>
                      ) : null}
                    </div>

                    {deployment.state === 'ERROR' && deployment.aliasError ? (
                      <div className="mt-2 p-2 rounded bg-destructive/10 text-xs">
                        <p className="text-destructive">{deployment.aliasError.message}</p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}