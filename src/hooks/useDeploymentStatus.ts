import { useState, useEffect, useCallback } from 'react'
import { VercelDeployment } from '@/lib/vercel/client'

interface DeploymentStatusData {
  deployment: VercelDeployment
  metrics: {
    state: string
    url: string
    createdAt: number
    buildingAt?: number
    buildDuration?: number
  }
  progress: number
}

interface UseDeploymentStatusOptions {
  deploymentId: string
  onComplete?: (deployment: VercelDeployment) => void
  onError?: (error: Error) => void
}

export function useDeploymentStatus({
  deploymentId,
  onComplete,
  onError
}: UseDeploymentStatusOptions) {
  const [data, setData] = useState<DeploymentStatusData | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const connect = useCallback(() => {
    const eventSource = new EventSource(
      `/api/vercel/deployments/${deploymentId}/status`
    )

    eventSource.addEventListener('connected', () => {
      setIsConnected(true)
      setError(null)
    })

    eventSource.addEventListener('status', (event) => {
      try {
        const statusData = JSON.parse(event.data)
        setData(statusData)
      } catch (err) {
        console.error('Failed to parse status data:', err)
      }
    })

    eventSource.addEventListener('complete', (event) => {
      try {
        const completeData = JSON.parse(event.data)
        if (completeData.success && onComplete) {
          onComplete(completeData.deployment)
        }
      } catch (err) {
        console.error('Failed to parse complete data:', err)
      }
      eventSource.close()
      setIsConnected(false)
    })

    eventSource.addEventListener('error', (event) => {
      const err = new Error('Failed to connect to deployment status stream')
      setError(err)
      setIsConnected(false)
      if (onError) {
        onError(err)
      }
      eventSource.close()
    })

    eventSource.addEventListener('timeout', () => {
      const err = new Error('Deployment monitoring timed out')
      setError(err)
      setIsConnected(false)
      if (onError) {
        onError(err)
      }
      eventSource.close()
    })

    eventSource.onerror = () => {
      const err = new Error('Connection to deployment status stream lost')
      setError(err)
      setIsConnected(false)
      if (onError) {
        onError(err)
      }
    }

    return eventSource
  }, [deploymentId, onComplete, onError])

  useEffect(() => {
    const eventSource = connect()

    return () => {
      eventSource.close()
    }
  }, [connect])

  return {
    data,
    isConnected,
    error,
    reconnect: connect
  }
}