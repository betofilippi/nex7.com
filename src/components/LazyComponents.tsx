'use client';

import { lazy, Suspense } from 'react';
import { Card, CardContent } from './ui/card';

// Lazy load heavy components
export const LazyCanvas = lazy(() => import('./canvas/Canvas'));
export const LazyAgentSystemDemo = lazy(() => import('./agents/AgentSystemDemo'));
export const LazyVercelDashboard = lazy(() => import('./vercel/VercelDashboard'));
export const LazyAnalyticsDashboard = lazy(() => import('./analytics-dashboard'));
export const LazyDeploymentPipeline = lazy(() => import('./deploy/DeploymentPipeline'));

// Loading fallback component
const LoadingFallback = ({ message = 'Loading...' }: { message?: string }) => (
  <Card className="w-full h-64 flex items-center justify-center">
    <CardContent>
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </CardContent>
  </Card>
);

// Wrapper components with Suspense
export const SuspendedCanvas = (props: any) => (
  <Suspense fallback={<LoadingFallback message="Loading Canvas..." />}>
    <LazyCanvas {...props} />
  </Suspense>
);

export const SuspendedAgentSystemDemo = (props: any) => (
  <Suspense fallback={<LoadingFallback message="Loading Agent System..." />}>
    <LazyAgentSystemDemo {...props} />
  </Suspense>
);

export const SuspendedVercelDashboard = (props: any) => (
  <Suspense fallback={<LoadingFallback message="Loading Vercel Dashboard..." />}>
    <LazyVercelDashboard {...props} />
  </Suspense>
);

export const SuspendedAnalyticsDashboard = (props: any) => (
  <Suspense fallback={<LoadingFallback message="Loading Analytics..." />}>
    <LazyAnalyticsDashboard {...props} />
  </Suspense>
);

export const SuspendedDeploymentPipeline = (props: any) => (
  <Suspense fallback={<LoadingFallback message="Loading Deployment Pipeline..." />}>
    <LazyDeploymentPipeline {...props} />
  </Suspense>
);