'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  GitBranch,
  User,
  Calendar,
} from 'lucide-react';
import { VercelDeployment } from '../../lib/vercel/client';

interface DeploymentStatusProps {
  deploymentId?: string;
  projectId?: string;
  onLogsClick?: (deploymentId: string) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const statusConfig = {
  BUILDING: { 
    icon: RefreshCw, 
    color: 'text-blue-500', 
    bgColor: 'bg-blue-500/10', 
    label: 'Building',
    progress: true 
  },
  ERROR: { 
    icon: XCircle, 
    color: 'text-red-500', 
    bgColor: 'bg-red-500/10', 
    label: 'Error',
    progress: false 
  },
  INITIALIZING: { 
    icon: Clock, 
    color: 'text-yellow-500', 
    bgColor: 'bg-yellow-500/10', 
    label: 'Initializing',
    progress: true 
  },
  QUEUED: { 
    icon: Clock, 
    color: 'text-gray-500', 
    bgColor: 'bg-gray-500/10', 
    label: 'Queued',
    progress: false 
  },
  READY: { 
    icon: CheckCircle, 
    color: 'text-green-500', 
    bgColor: 'bg-green-500/10', 
    label: 'Ready',
    progress: false 
  },
  CANCELED: { 
    icon: XCircle, 
    color: 'text-gray-500', 
    bgColor: 'bg-gray-500/10', 
    label: 'Canceled',
    progress: false 
  },
};

export default function DeploymentStatus({ 
  deploymentId, 
  projectId: _projectId,
  onLogsClick,
  autoRefresh = true,
  refreshInterval = 5000 
}: DeploymentStatusProps) {
  const [deployment, setDeployment] = useState<VercelDeployment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const fetchDeployment = useCallback(async () => {
    if (!deploymentId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/vercel/deployments?deploymentId=${deploymentId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch deployment');
      }

      const data = await response.json();
      setDeployment(data);

      // Update progress for building deployments
      if (data.state === 'BUILDING' && data.buildingAt && data.createdAt) {
        const elapsed = Date.now() - data.buildingAt;
        const estimatedDuration = 60000; // 1 minute estimate
        setProgress(Math.min((elapsed / estimatedDuration) * 100, 90));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [deploymentId]);

  useEffect(() => {
    fetchDeployment();

    if (autoRefresh && deployment?.state && ['BUILDING', 'INITIALIZING', 'QUEUED'].includes(deployment.state)) {
      const interval = setInterval(fetchDeployment, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [deploymentId, autoRefresh, refreshInterval, deployment?.state, fetchDeployment]);

  if (loading && !deployment) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!deployment) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">No deployment selected</p>
        </CardContent>
      </Card>
    );
  }

  const status = statusConfig[deployment.state];
  const StatusIcon = status.icon;
  const duration = deployment.ready && deployment.buildingAt 
    ? deployment.ready - deployment.buildingAt 
    : deployment.buildingAt 
    ? Date.now() - deployment.buildingAt 
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Deployment Status</CardTitle>
          <Badge variant="outline" className={status.bgColor}>
            <StatusIcon className={`mr-1 h-3 w-3 ${status.color} ${deployment.state === 'BUILDING' ? 'animate-spin' : ''}`} />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Deployment Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Deployment</p>
            <p className="font-mono">#{deployment.uid.slice(0, 7)}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Type</p>
            <p>{deployment.type}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Created</p>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <p>{new Date(deployment.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Duration</p>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <p>{duration > 0 ? `${Math.round(duration / 1000)}s` : '-'}</p>
            </div>
          </div>
        </div>

        {status.progress ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Build Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        ) : null}

        {deployment.creator ? (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Deployed by</span>
            <span className="font-medium">{deployment.creator.username || deployment.creator.email}</span>
          </div>
        ) : null}

        {deployment.meta?.githubCommitRef ? (
          <div className="flex items-center gap-2 text-sm">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Branch:</span>
            <span className="font-medium">{String(deployment.meta.githubCommitRef)}</span>
          </div>
        ) : null}

        <div className="flex gap-2 pt-2">
          {deployment.url && deployment.state === 'READY' ? (
            <Button size="sm" variant="outline" className="flex-1" asChild>
              <a href={`https://${deployment.url}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Preview
              </a>
            </Button>
          ) : null}
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={() => onLogsClick?.(deployment.uid)}
          >
            View Logs
          </Button>
          {deployment.inspectorUrl ? (
            <Button size="sm" variant="outline" className="flex-1" asChild>
              <a href={deployment.inspectorUrl} target="_blank" rel="noopener noreferrer">
                Inspector
              </a>
            </Button>
          ) : null}
        </div>

        {deployment.state === 'ERROR' && deployment.aliasError ? (
          <div className="p-3 rounded-lg bg-destructive/10 text-sm">
            <p className="font-medium text-destructive mb-1">Error: {deployment.aliasError.code}</p>
            <p className="text-muted-foreground">{deployment.aliasError.message}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export { DeploymentStatus };