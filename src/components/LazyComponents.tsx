'use client';

import { lazy, Suspense } from 'react';

// Lazy load heavy components
export const LazyDeploymentPipeline = lazy(() => import('./deploy/DeploymentPipeline'));

// Loading fallback component
const LoadingFallback = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="w-full h-64 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  </div>
);

// Wrapper components with Suspense
export const SuspendedDeploymentPipeline = (props: any) => (
  <Suspense fallback={<LoadingFallback message="Loading Deployment Pipeline..." />}>
    <LazyDeploymentPipeline {...props} />
  </Suspense>
);