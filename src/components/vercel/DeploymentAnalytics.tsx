'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3,
  Clock,
  Database,
  FileCode,
  Globe,
  Package,
  TrendingDown,
  TrendingUp,
  Zap
} from 'lucide-react'
import { VercelDeployment } from '@/lib/vercel/client'
import { cn } from '@/lib/utils'

interface DeploymentAnalyticsProps {
  projectId: string
  limit?: number
}

interface Analytics {
  averageBuildTime: number
  successRate: number
  deploymentFrequency: number
  recentTrend: 'improving' | 'stable' | 'degrading'
  mostCommonErrors: Array<{ error: string; count: number }>
  performanceMetrics: {
    fastest: number
    slowest: number
    median: number
  }
}

export function DeploymentAnalytics({ projectId, limit = 50 }: DeploymentAnalyticsProps) {
  const [deployments, setDeployments] = useState<VercelDeployment[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(
          `/api/vercel/deployments?projectId=${projectId}&limit=${limit}`
        )
        if (!response.ok) throw new Error('Failed to fetch deployments')
        
        const data = await response.json()
        const deps = data.deployments || []
        setDeployments(deps)

        // Calculate analytics
        const analytics = calculateAnalytics(deps)
        setAnalytics(analytics)
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [projectId, limit])

  const calculateAnalytics = (deps: VercelDeployment[]): Analytics => {
    // Build times
    const buildTimes = deps
      .filter(d => d.ready && d.buildingAt)
      .map(d => (d.ready! - d.buildingAt!) / 1000) // Convert to seconds

    const averageBuildTime = buildTimes.length > 0
      ? buildTimes.reduce((a, b) => a + b, 0) / buildTimes.length
      : 0

    // Success rate
    const successCount = deps.filter(d => d.state === 'READY').length
    const successRate = deps.length > 0 ? (successCount / deps.length) * 100 : 0

    // Deployment frequency (deployments per day over last 30 days)
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
    const recentDeployments = deps.filter(d => d.createdAt > thirtyDaysAgo)
    const deploymentFrequency = recentDeployments.length / 30

    // Recent trend
    const recentHalf = deps.slice(0, Math.floor(deps.length / 2))
    const olderHalf = deps.slice(Math.floor(deps.length / 2))
    const recentSuccessRate = recentHalf.filter(d => d.state === 'READY').length / recentHalf.length
    const olderSuccessRate = olderHalf.filter(d => d.state === 'READY').length / olderHalf.length
    
    let recentTrend: 'improving' | 'stable' | 'degrading' = 'stable'
    if (recentSuccessRate > olderSuccessRate + 0.1) recentTrend = 'improving'
    else if (recentSuccessRate < olderSuccessRate - 0.1) recentTrend = 'degrading'

    // Error analysis
    const errorMap = new Map<string, number>()
    deps
      .filter(d => d.state === 'ERROR' && d.aliasError)
      .forEach(d => {
        const error = d.aliasError!.code
        errorMap.set(error, (errorMap.get(error) || 0) + 1)
      })
    
    const mostCommonErrors = Array.from(errorMap.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Performance metrics
    const sortedBuildTimes = [...buildTimes].sort((a, b) => a - b)
    const performanceMetrics = {
      fastest: sortedBuildTimes[0] || 0,
      slowest: sortedBuildTimes[sortedBuildTimes.length - 1] || 0,
      median: sortedBuildTimes[Math.floor(sortedBuildTimes.length / 2)] || 0,
    }

    return {
      averageBuildTime,
      successRate,
      deploymentFrequency,
      recentTrend,
      mostCommonErrors,
      performanceMetrics,
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!analytics) return null

  const trendIcon = {
    improving: TrendingUp,
    stable: BarChart3,
    degrading: TrendingDown,
  }[analytics.recentTrend]

  const TrendIcon = trendIcon

  return (
    <div className="space-y-6">
      {/* Key metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Build Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.averageBuildTime.toFixed(1)}s
            </div>
            <p className="text-xs text-muted-foreground">
              Median: {analytics.performanceMetrics.median.toFixed(1)}s
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Success Rate
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.successRate.toFixed(1)}%
            </div>
            <Progress 
              value={analytics.successRate} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Deploy Frequency
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.deploymentFrequency.toFixed(1)}/day
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Trend
            </CardTitle>
            <TrendIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge 
                variant={
                  analytics.recentTrend === 'improving' ? 'default' :
                  analytics.recentTrend === 'degrading' ? 'destructive' :
                  'secondary'
                }
              >
                {analytics.recentTrend}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              vs. previous period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Breakdown</CardTitle>
          <CardDescription>
            Build time statistics across recent deployments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm">Fastest</span>
              </div>
              <span className="text-sm font-medium">
                {analytics.performanceMetrics.fastest.toFixed(1)}s
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                <span className="text-sm">Average</span>
              </div>
              <span className="text-sm font-medium">
                {analytics.averageBuildTime.toFixed(1)}s
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <span className="text-sm">Slowest</span>
              </div>
              <span className="text-sm font-medium">
                {analytics.performanceMetrics.slowest.toFixed(1)}s
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error analysis */}
      {analytics.mostCommonErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Common Errors</CardTitle>
            <CardDescription>
              Most frequent deployment errors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.mostCommonErrors.map((error, index) => (
                <div key={index} className="flex items-center justify-between">
                  <code className="text-sm">{error.error}</code>
                  <Badge variant="outline">{error.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent deployments chart */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment Timeline</CardTitle>
          <CardDescription>
            Visual representation of recent deployments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {deployments.slice(0, 10).map((deployment) => {
              const duration = deployment.ready && deployment.buildingAt
                ? (deployment.ready - deployment.buildingAt) / 1000
                : 0
              const maxDuration = analytics.performanceMetrics.slowest
              const percentage = (duration / maxDuration) * 100

              return (
                <div key={deployment.uid} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate max-w-[200px]">
                      {deployment.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={deployment.state === 'READY' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {deployment.state}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {duration.toFixed(1)}s
                      </span>
                    </div>
                  </div>
                  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "absolute h-full rounded-full transition-all",
                        deployment.state === 'READY' ? 'bg-green-500' : 'bg-red-500'
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}