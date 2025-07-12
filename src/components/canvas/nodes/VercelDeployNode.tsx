'use client';

import React, { useContext, useEffect, useState } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { VercelNodeData } from '../types';
import { CanvasContext } from '../CanvasContext';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import {
  Cloud,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  MoreVertical,
  Edit,
  Copy,
  Trash,
  Globe,
  GitBranch,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';

interface VercelDeployNodeData extends VercelNodeData {
  deploymentId?: string;
  status?: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  url?: string;
  branch?: string;
}

const statusConfig = {
  BUILDING: { icon: RefreshCw, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'Building' },
  ERROR: { icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'Error' },
  INITIALIZING: { icon: Clock, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', label: 'Initializing' },
  QUEUED: { icon: Clock, color: 'text-gray-500', bgColor: 'bg-gray-500/10', label: 'Queued' },
  READY: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-500/10', label: 'Ready' },
  CANCELED: { icon: XCircle, color: 'text-gray-500', bgColor: 'bg-gray-500/10', label: 'Canceled' },
};

const VercelDeployNode: React.FC<NodeProps<VercelDeployNodeData>> = ({ data, selected }) => {
  const context = useContext(CanvasContext);
  const [isLoading, setIsLoading] = useState(false);
  const status = data.status || 'QUEUED';
  const StatusIcon = statusConfig[status].icon;

  // Simulate status updates for demo
  useEffect(() => {
    if (data.deploymentId && status === 'BUILDING') {
      const timer = setTimeout(() => {
        // In a real app, this would poll the API
        console.log('Checking deployment status...');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [data.deploymentId, status]);

  const handleDeploy = async () => {
    setIsLoading(true);
    // Simulate deployment
    setTimeout(() => {
      setIsLoading(false);
      console.log('Deployment started');
    }, 1000);
  };

  return (
    <Card className={`w-80 ${selected ? 'ring-2 ring-primary' : ''} bg-background/95 backdrop-blur`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-black">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">{data.label || 'Vercel Deploy'}</h3>
              <p className="text-xs text-muted-foreground">{data.projectName || 'No project'}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => context?.onEdit?.(data.id!)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => context?.onDuplicate?.(data.id!)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => context?.onDelete?.(data.id!)}
                className="text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status */}
        <div className={`flex items-center gap-2 p-2 rounded-lg mb-3 ${statusConfig[status].bgColor}`}>
          <StatusIcon className={`w-4 h-4 ${statusConfig[status].color} ${status === 'BUILDING' ? 'animate-spin' : ''}`} />
          <span className={`text-sm font-medium ${statusConfig[status].color}`}>
            {statusConfig[status].label}
          </span>
          {data.deploymentId && (
            <span className="text-xs text-muted-foreground ml-auto">
              #{data.deploymentId.slice(0, 7)}
            </span>
          )}
        </div>

        {/* Info */}
        {data.url && (
          <div className="flex items-center gap-2 mb-2 text-sm">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <a 
              href={`https://${data.url}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline truncate"
            >
              {data.url}
            </a>
          </div>
        )}
        
        {data.branch && (
          <div className="flex items-center gap-2 mb-3 text-sm">
            <GitBranch className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{data.branch}</span>
          </div>
        )}

        {/* Environment Badge */}
        <div className="flex items-center gap-2 mb-3">
          <Badge variant={data.environment === 'production' ? 'default' : 'secondary'}>
            {data.environment || 'preview'}
          </Badge>
          {data.domain && (
            <span className="text-xs text-muted-foreground truncate">
              {data.domain}
            </span>
          )}
        </div>

        {/* Action Button */}
        <Button
          size="sm"
          className="w-full"
          disabled={isLoading || status === 'BUILDING'}
          onClick={handleDeploy}
        >
          {isLoading || status === 'BUILDING' ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              {status === 'BUILDING' ? 'Building...' : 'Deploying...'}
            </>
          ) : (
            <>
              <Cloud className="mr-2 h-4 w-4" />
              Deploy
            </>
          )}
        </Button>
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </Card>
  );
};

export default VercelDeployNode;