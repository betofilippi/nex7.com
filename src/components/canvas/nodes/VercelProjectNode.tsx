'use client';

import React, { useContext, useState } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { VercelNodeData } from '../types';
import { CanvasContext } from '../CanvasContext';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Progress } from '../../ui/progress';
import {
  Folder,
  GitBranch,
  Globe,
  Settings,
  MoreVertical,
  Edit,
  Copy,
  Trash,
  ExternalLink,
  Activity,
  Package,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';

interface VercelProjectNodeData extends VercelNodeData {
  framework?: string;
  repository?: string;
  lastDeployment?: {
    status: string;
    url: string;
    timestamp: string;
  };
  analytics?: {
    visitors: number;
    pageViews: number;
  };
}

const VercelProjectNode: React.FC<NodeProps<VercelProjectNodeData>> = ({ data, selected }) => {
  const context = useContext(CanvasContext);
  const [isExpanded, setIsExpanded] = useState(false);

  const getFrameworkIcon = (framework?: string) => {
    switch (framework?.toLowerCase()) {
      case 'nextjs':
        return '▲';
      case 'react':
        return '⚛️';
      case 'vue':
        return '🟢';
      default:
        return '📦';
    }
  };

  return (
    <Card className={`w-80 ${selected ? 'ring-2 ring-primary' : ''} bg-background/95 backdrop-blur`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-black">
              <Folder className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">{data.projectName || 'Vercel Project'}</h3>
              <p className="text-xs text-muted-foreground">
                {data.framework && (
                  <span className="mr-1">{getFrameworkIcon(data.framework)}</span>
                )}
                {data.framework || 'Static'}
              </p>
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

        {/* Repository */}
        {data.repository && (
          <div className="flex items-center gap-2 mb-3 text-sm">
            <GitBranch className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground truncate">{data.repository}</span>
          </div>
        )}

        {/* Domain */}
        {data.domain && (
          <div className="flex items-center gap-2 mb-3 text-sm">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <a 
              href={`https://${data.domain}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline truncate flex items-center gap-1"
            >
              {data.domain}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Last Deployment */}
        {data.lastDeployment && (
          <div className="mb-3 p-2 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Last deployment</span>
              <Badge variant={data.lastDeployment.status === 'READY' ? 'default' : 'secondary'} className="text-xs">
                {data.lastDeployment.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {data.lastDeployment.timestamp}
            </p>
          </div>
        )}

        {/* Analytics Preview */}
        {data.analytics && isExpanded && (
          <div className="mb-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Visitors (24h)</span>
              <span className="font-medium">{data.analytics.visitors.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Page Views</span>
              <span className="font-medium">{data.analytics.pageViews.toLocaleString()}</span>
            </div>
            <Progress value={75} className="h-2" />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Activity className="mr-2 h-4 w-4" />
            {isExpanded ? 'Hide' : 'Show'} Details
          </Button>
          <Button size="sm" className="flex-1">
            <Settings className="mr-2 h-4 w-4" />
            Configure
          </Button>
        </div>
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </Card>
  );
};

export default VercelProjectNode;