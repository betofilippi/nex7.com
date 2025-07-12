interface PerformanceTest {
  name: string;
  description: string;
  threshold: number;
  unit: 'ms' | 'score' | '%';
}

interface PerformanceResult {
  test: PerformanceTest;
  value: number;
  passed: boolean;
  timestamp: number;
}

export class PerformanceTester {
  private tests: PerformanceTest[] = [
    {
      name: 'Page Load Time',
      description: 'Time from navigation start to load complete',
      threshold: 3000,
      unit: 'ms',
    },
    {
      name: 'First Contentful Paint',
      description: 'Time until first content is painted',
      threshold: 1800,
      unit: 'ms',
    },
    {
      name: 'Largest Contentful Paint',
      description: 'Time until largest content element is painted',
      threshold: 2500,
      unit: 'ms',
    },
    {
      name: 'First Input Delay',
      description: 'Time between first user input and browser response',
      threshold: 100,
      unit: 'ms',
    },
    {
      name: 'Cumulative Layout Shift',
      description: 'Measure of visual stability',
      threshold: 0.1,
      unit: 'score',
    },
    {
      name: 'Time to Interactive',
      description: 'Time until page is fully interactive',
      threshold: 3800,
      unit: 'ms',
    },
  ];

  private results: PerformanceResult[] = [];

  async runTests(): Promise<PerformanceResult[]> {
    this.results = [];

    // Wait for page to be fully loaded
    if (document.readyState !== 'complete') {
      await new Promise(resolve => {
        window.addEventListener('load', resolve);
      });
    }

    // Run each test
    for (const test of this.tests) {
      try {
        const value = await this.measureTest(test);
        const passed = this.evaluateTest(test, value);
        
        this.results.push({
          test,
          value,
          passed,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error(`Failed to run test "${test.name}":`, error);
      }
    }

    return this.results;
  }

  private async measureTest(test: PerformanceTest): Promise<number> {
    switch (test.name) {
      case 'Page Load Time':
        return this.measurePageLoadTime();
      case 'First Contentful Paint':
        return this.measureFCP();
      case 'Largest Contentful Paint':
        return this.measureLCP();
      case 'First Input Delay':
        return this.measureFID();
      case 'Cumulative Layout Shift':
        return this.measureCLS();
      case 'Time to Interactive':
        return this.measureTTI();
      default:
        throw new Error(`Unknown test: ${test.name}`);
    }
  }

  private evaluateTest(test: PerformanceTest, value: number): boolean {
    return value <= test.threshold;
  }

  private measurePageLoadTime(): number {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return navigation.loadEventEnd - navigation.fetchStart;
  }

  private async measureFCP(): Promise<number> {
    return new Promise(resolve => {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            observer.disconnect();
            resolve(entry.startTime);
            return;
          }
        }
      });
      observer.observe({ entryTypes: ['paint'] });
    });
  }

  private async measureLCP(): Promise<number> {
    return new Promise(resolve => {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        const lcp = lastEntry as PerformanceEntry & { renderTime?: number; loadTime?: number };
        resolve(lcp.renderTime || lcp.loadTime || lastEntry.startTime);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      
      // Fallback timeout
      setTimeout(() => {
        observer.disconnect();
        resolve(0);
      }, 10000);
    });
  }

  private async measureFID(): Promise<number> {
    return new Promise(resolve => {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          const fid = entry as PerformanceEntry & { processingStart?: number };
          observer.disconnect();
          resolve(fid.processingStart ? fid.processingStart - entry.startTime : 0);
          return;
        }
      });
      observer.observe({ entryTypes: ['first-input'] });
      
      // Fallback timeout
      setTimeout(() => {
        observer.disconnect();
        resolve(0);
      }, 10000);
    });
  }

  private async measureCLS(): Promise<number> {
    return new Promise(resolve => {
      let clsValue = 0;
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          const cls = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
          if (!cls.hadRecentInput) {
            clsValue += cls.value || 0;
          }
        }
      });
      observer.observe({ entryTypes: ['layout-shift'] });
      
      // Resolve after a delay to collect multiple layout shifts
      setTimeout(() => {
        observer.disconnect();
        resolve(clsValue);
      }, 5000);
    });
  }

  private measureTTI(): number {
    // Simplified TTI calculation
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return navigation.domContentLoadedEventEnd - navigation.fetchStart + 1000; // Add 1s buffer
  }

  generateReport(): string {
    if (this.results.length === 0) {
      return 'No performance tests have been run yet.';
    }

    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const score = Math.round((passed / total) * 100);

    let report = `Performance Test Report\n`;
    report += `=======================\n`;
    report += `Overall Score: ${score}% (${passed}/${total} tests passed)\n\n`;

    this.results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      const value = result.test.unit === 'score' 
        ? result.value.toFixed(3)
        : Math.round(result.value);
      
      report += `${status} ${result.test.name}: ${value}${result.test.unit} `;
      report += `(threshold: ${result.test.threshold}${result.test.unit})\n`;
      report += `   ${result.test.description}\n\n`;
    });

    return report;
  }

  getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    this.results.forEach(result => {
      if (!result.passed) {
        switch (result.test.name) {
          case 'Page Load Time':
            recommendations.push('Optimize images, minify CSS/JS, use CDN');
            break;
          case 'First Contentful Paint':
            recommendations.push('Minimize render-blocking resources, optimize critical CSS');
            break;
          case 'Largest Contentful Paint':
            recommendations.push('Optimize images, preload important resources');
            break;
          case 'First Input Delay':
            recommendations.push('Minimize JavaScript execution time, use web workers');
            break;
          case 'Cumulative Layout Shift':
            recommendations.push('Set image dimensions, avoid inserting content above existing content');
            break;
          case 'Time to Interactive':
            recommendations.push('Code splitting, lazy loading, optimize third-party scripts');
            break;
        }
      }
    });

    return [...new Set(recommendations)]; // Remove duplicates
  }
}

// Bundle size analyzer
export class BundleAnalyzer {
  async analyzeBundles(): Promise<any> {
    if (typeof window === 'undefined') {
      throw new Error('Bundle analysis only available in browser');
    }

    const scripts = Array.from(document.querySelectorAll('script[src]')) as HTMLScriptElement[];
    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
    
    const analysis = {
      scripts: await this.analyzeResources(scripts.map(s => s.src)),
      stylesheets: await this.analyzeResources(stylesheets.map(s => s.href)),
      totalSize: 0,
      recommendations: [] as string[],
    };

    analysis.totalSize = analysis.scripts.totalSize + analysis.stylesheets.totalSize;

    // Generate recommendations
    if (analysis.totalSize > 1000000) { // 1MB
      analysis.recommendations.push('Consider code splitting to reduce bundle size');
    }
    
    if (analysis.scripts.resources.length > 10) {
      analysis.recommendations.push('Consider bundling scripts to reduce HTTP requests');
    }

    return analysis;
  }

  private async analyzeResources(urls: string[]): Promise<any> {
    const resources = await Promise.all(
      urls.map(async url => {
        try {
          const response = await fetch(url, { method: 'HEAD' });
          const size = parseInt(response.headers.get('content-length') || '0');
          const contentType = response.headers.get('content-type') || '';
          
          return {
            url,
            size,
            contentType,
            compressed: response.headers.get('content-encoding') !== null,
          };
        } catch (error) {
          return {
            url,
            size: 0,
            contentType: 'unknown',
            compressed: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    const totalSize = resources.reduce((sum, resource) => sum + resource.size, 0);
    
    return {
      resources,
      totalSize,
      count: resources.length,
    };
  }
}

// Utility functions
export const measureFunctionPerformance = <T extends any[], R>(
  fn: (...args: T) => R,
  args: T,
  iterations: number = 1000
): { averageTime: number; totalTime: number; iterations: number } => {
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn(...args);
    const end = performance.now();
    times.push(end - start);
  }
  
  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / iterations;
  
  return {
    averageTime,
    totalTime,
    iterations,
  };
};

export const measureAsyncFunctionPerformance = async <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  args: T,
  iterations: number = 100
): Promise<{ averageTime: number; totalTime: number; iterations: number }> => {
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn(...args);
    const end = performance.now();
    times.push(end - start);
  }
  
  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / iterations;
  
  return {
    averageTime,
    totalTime,
    iterations,
  };
};