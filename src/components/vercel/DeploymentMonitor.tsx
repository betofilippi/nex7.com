'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  GitBranch,
  Loader2,
  RefreshCw,
  XCircle,
  Zap,
  Terminal,
  Eye,
  RotateCcw
} from 'lucide-react'
import { VercelDeployment, VercelBuildLog } from '@/lib/vercel/client'
import { cn } from '@/lib/utils'

interface DeploymentMonitorProps {
  deploymentId?: string
  projectId?: string
  autoRefresh?: boolean
  showLogs?: boolean
  onDeploymentComplete?: (deployment: VercelDeployment) => void
}

interface DeploymentMetrics {
  buildDuration?: number
  totalSize?: number
  functionCount?: number
  staticFileCount?: number
}

const stateConfig = {
  BUILDING: { 
    color: 'bg-blue-500', 
    icon: Loader2, 
    text: 'Building', 
    animate: true 
  },
  ERROR: { 
    color: 'bg-red-500', 
    icon: XCircle, 
    text: 'Error', 
    animate: false 
  },
  INITIALIZING: { 
    color: 'bg-yellow-500', 
    icon: Clock, 
    text: 'Initializing', 
    animate: true 
  },
  QUEUED: { 
    color: 'bg-gray-500', 
    icon: Clock, 
    text: 'Queued', 
    animate: false 
  },
  READY: { 
    color: 'bg-green-500', 
    icon: CheckCircle2, 
    text: 'Ready', 
    animate: false 
  },
  CANCELED: { 
    color: 'bg-gray-500', 
    icon: XCircle, 
    text: 'Canceled', 
    animate: false 
  },
}

export function DeploymentMonitor({
  deploymentId,
  projectId,
  autoRefresh = true,
  showLogs = true,
  onDeploymentComplete
}: DeploymentMonitorProps) {
  const [deployment, setDeployment] = useState<VercelDeployment | null>(null)
  const [logs, setLogs] = useState<VercelBuildLog[]>([])
  const [metrics, setMetrics] = useState<DeploymentMetrics>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isStreamingLogs, setIsStreamingLogs] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const fetchDeployment = useCallback(async () => {
    if (!deploymentId) return

    try {
      const response = await fetch(`/api/vercel/deployments?deploymentId=${deploymentId}`)
      if (!response.ok) throw new Error('Failed to fetch deployment')
      
      const data = await response.json()
      setDeployment(data)

      // Calculate progress based on state
      if (data.state === 'QUEUED') setProgress(10)
      else if (data.state === 'INITIALIZING') setProgress(30)
      else if (data.state === 'BUILDING') setProgress(60)
      else if (data.state === 'READY') {
        setProgress(100)
        if (onDeploymentComplete) {
          onDeploymentComplete(data)
        }
      }
      else if (data.state === 'ERROR' || data.state === 'CANCELED') {
        setProgress(0)
      }

      // Calculate metrics
      if (data.ready && data.buildingAt) {
        setMetrics(prev => ({
          ...prev,
          buildDuration: data.ready - data.buildingAt
        }))
      }

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch deployment')
    } finally {
      setIsLoading(false)
    }
  }, [deploymentId, onDeploymentComplete])

  const streamLogs = useCallback(async () => {
    if (!deploymentId || !showLogs) return

    setIsStreamingLogs(true)
    setLogs([])

    try {
      const response = await fetch(`/api/vercel/logs?deploymentId=${deploymentId}&stream=true`)
      if (!response.ok) throw new Error('Failed to stream logs')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6))
              if (data.type === 'command' || data.type === 'stdout' || data.type === 'stderr') {
                setLogs(prev => [...prev, data])
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      console.error('Error streaming logs:', err)
    } finally {
      setIsStreamingLogs(false)
    }
  }, [deploymentId, showLogs])

  const cancelDeployment = async () => {
    if (!deploymentId) return

    try {
      const response = await fetch('/api/vercel/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', deploymentId })
      })

      if (!response.ok) throw new Error('Failed to cancel deployment')
      
      await fetchDeployment()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel deployment')
    }
  }

  const redeployDeployment = async () => {
    if (!deploymentId) return

    try {
      const response = await fetch('/api/vercel/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'redeploy', deploymentId })
      })

      if (!response.ok) throw new Error('Failed to redeploy')
      
      const data = await response.json()
      // Redirect to new deployment monitor
      window.location.href = `/dashboard/deployments/${data.id}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to redeploy')
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchDeployment()
    if (showLogs) {
      streamLogs()
    }
  }, [fetchDeployment, streamLogs, showLogs])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || !deployment) return
    if (deployment.state === 'READY' || deployment.state === 'ERROR' || deployment.state === 'CANCELED') {
      return
    }

    const interval = setInterval(fetchDeployment, 3000)
    return () => clearInterval(interval)
  }, [autoRefresh, deployment, fetchDeployment])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error && !deployment) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!deployment) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No deployment found</AlertDescription>
      </Alert>
    )
  }

  const stateInfo = stateConfig[deployment.state]
  const StateIcon = stateInfo.icon

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                Deployment Monitor
                <Badge variant="outline" className="gap-1">
                  <StateIcon className={cn(
                    "h-3 w-3",
                    stateInfo.animate && "animate-spin"
                  )} />
                  {stateInfo.text}
                </Badge>
              </CardTitle>
              <CardDescription>
                {deployment.name} • {new Date(deployment.createdAt).toLocaleString()}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {deployment.state === 'BUILDING' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelDeployment}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
              {(deployment.state === 'READY' || deployment.state === 'ERROR') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={redeployDeployment}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Redeploy
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={fetchDeployment}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress bar */}
          {deployment.state !== 'READY' && deployment.state !== 'ERROR' && deployment.state !== 'CANCELED' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Build Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Deployment info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="text-sm font-medium">{deployment.type}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Target</p>
              <p className="text-sm font-medium">
                {deployment.meta?.githubCommitRef || 'Production'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="text-sm font-medium">
                {metrics.buildDuration 
                  ? `${Math.round(metrics.buildDuration / 1000)}s`
                  : '-'
                }
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">URL</p>
              <a 
                href={`https://${deployment.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
              >
                Visit
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Error message */}
          {deployment.aliasError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {deployment.aliasError.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          {deployment.state === 'READY' && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <a 
                  href={`https://${deployment.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </a>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a 
                  href={deployment.inspectorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Activity className="mr-2 h-4 w-4" />
                  Inspect
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Build logs */}
      {showLogs && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Build Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black rounded-lg p-4 max-h-96 overflow-y-auto">
              {logs.length === 0 && isStreamingLogs && (
                <div className="text-gray-400 text-sm">
                  Waiting for logs...
                </div>
              )}
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={cn(
                    "font-mono text-sm",
                    log.type === 'stderr' && "text-red-400",
                    log.type === 'stdout' && "text-gray-300",
                    log.type === 'command' && "text-blue-400"
                  )}
                >
                  {log.payload}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}