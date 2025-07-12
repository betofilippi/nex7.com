import { useCallback, useEffect, useRef, useState } from 'react';

export interface PerformanceMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

export function usePerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const observer = useRef<PerformanceObserver | null>(null);

  const measureFunction = useCallback(<T extends any[], R>(
    fn: (...args: T) => R,
    name: string
  ) => {
    return (...args: T): R => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      
      console.log(`${name} execution time: ${end - start}ms`);
      
      // Store custom metric
      performance.mark(`${name}-start`);
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      return result;
    };
  }, []);

  const measureAsyncFunction = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    name: string
  ) => {
    return async (...args: T): Promise<R> => {
      const start = performance.now();
      const result = await fn(...args);
      const end = performance.now();
      
      console.log(`${name} execution time: ${end - start}ms`);
      
      // Store custom metric
      performance.mark(`${name}-start`);
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      return result;
    };
  }, []);

  useEffect(() => {
    // Web Vitals monitoring
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const lcp = entry as PerformanceEntry & { renderTime?: number; loadTime?: number };
          setMetrics(prev => ({
            ...prev,
            lcp: lcp.renderTime || lcp.loadTime || entry.startTime
          }));
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fid = entry as PerformanceEntry & { processingStart?: number };
          setMetrics(prev => ({
            ...prev,
            fid: fid.processingStart ? fid.processingStart - entry.startTime : 0
          }));
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          const cls = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
          if (!cls.hadRecentInput) {
            clsValue += cls.value || 0;
          }
        }
        setMetrics(prev => ({ ...prev, cls: clsValue }));
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });

      // Navigation timing
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        setMetrics(prev => ({
          ...prev,
          fcp: navigationEntry.loadEventStart - navigationEntry.fetchStart,
          ttfb: navigationEntry.responseStart - navigationEntry.requestStart
        }));
      }

      observer.current = lcpObserver;

      return () => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
      };
    }
  }, []);

  return {
    metrics,
    measureFunction,
    measureAsyncFunction,
  };
}

export function useRenderCount(componentName: string) {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${renderCount.current} times`);
    }
  });

  return renderCount.current;
}

export function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  const previousProps = useRef<Record<string, any>>();

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach(key => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key]
          };
        }
      });

      if (Object.keys(changedProps).length) {
        console.log('[why-did-you-update]', name, changedProps);
      }
    }

    previousProps.current = props;
  });
}