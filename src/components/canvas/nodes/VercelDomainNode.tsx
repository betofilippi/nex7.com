'use client';

import React, { useContext, useState } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { VercelNodeData } from '../types';
import { CanvasContext } from '../CanvasContext';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Input } from '../../ui/input';
import {
  Globe,
  Shield,
  AlertCircle,
  CheckCircle,
  Copy,
  MoreVertical,
  Edit,
  Trash,
  ExternalLink,
  RefreshCw,
  Link,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import {
  Alert,
  AlertDescription,
} from '../../ui/alert';

interface VercelDomainNodeData extends VercelNodeData {
  verified?: boolean;
  ssl?: boolean;
  redirect?: string;
  dnsRecords?: Array<{
    type: string;
    name: string;
    value: string;
  }>;
}

const VercelDomainNode: React.FC<NodeProps<VercelDomainNodeData>> = ({ data, selected }) => {
  const context = useContext(CanvasContext);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showDns, setShowDns] = useState(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    // Simulate verification
    setTimeout(() => {
      setIsVerifying(false);
      console.log('Domain verified');
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    console.log('Copied to clipboard:', text);
  };

  return (
    <Card className={`w-80 ${selected ? 'ring-2 ring-primary' : ''} bg-background/95 backdrop-blur`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-black">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">{data.label || 'Domain Config'}</h3>
              <p className="text-xs text-muted-foreground">Vercel Domain</p>
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

        {/* Domain */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Input 
              value={data.domain || ''} 
              placeholder="example.com"
              className="flex-1"
              readOnly
            />
            <Button size="icon" variant="ghost" onClick={() => copyToClipboard(data.domain || '')}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          {data.domain && (
            <a 
              href={`https://${data.domain}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Visit domain
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 mb-3">
          {data.verified ? (
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Verified
            </Badge>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Pending
            </Badge>
          )}
          {data.ssl && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              SSL
            </Badge>
          )}
        </div>

        {/* Redirect */}
        {data.redirect && (
          <div className="mb-3 p-2 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm">
              <Link className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Redirects to:</span>
            </div>
            <p className="text-sm font-medium truncate">{data.redirect}</p>
          </div>
        )}

        {/* DNS Records */}
        {!data.verified && showDns && data.dnsRecords && (
          <Alert className="mb-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">Add these DNS records:</p>
              {data.dnsRecords.map((record, idx) => (
                <div key={idx} className="text-xs space-y-1 mb-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-mono">{record.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-mono truncate">{record.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Value:</span>
                    <span className="font-mono truncate">{record.value}</span>
                  </div>
                </div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!data.verified && (
            <Button
              size="sm"
              className="flex-1"
              disabled={isVerifying}
              onClick={handleVerify}
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Verify
                </>
              )}
            </Button>
          )}
          <Button
            size="sm"
            variant={data.verified ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setShowDns(!showDns)}
          >
            {showDns ? 'Hide' : 'Show'} DNS
          </Button>
        </div>
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </Card>
  );
};

export default VercelDomainNode;