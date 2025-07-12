'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
// Temporary replacements for missing UI components
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`border rounded-lg shadow-sm ${className}`}>{children}</div>
);
const CardHeader = ({ children }: { children: React.ReactNode }) => <div className="p-6 pb-0">{children}</div>;
const CardTitle = ({ children }: { children: React.ReactNode }) => <h3 className="text-lg font-semibold">{children}</h3>;
const CardDescription = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-gray-600">{children}</p>;
const CardContent = ({ children }: { children: React.ReactNode }) => <div className="p-6 pt-0">{children}</div>;
const Badge = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: string }) => (
  <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">{children}</span>
);
const Button = ({ children, variant = 'default', onClick, className = '' }: { 
  children: React.ReactNode; 
  variant?: string; 
  onClick?: () => void; 
  className?: string;
}) => (
  <button onClick={onClick} className={`px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 ${className}`}>
    {children}
  </button>
);
import { ExternalLink, Download, RefreshCw } from 'lucide-react';

// Type for SwaggerUI props
interface SwaggerUIProps {
  spec: any;
  deepLinking?: boolean;
  displayOperationId?: boolean;
  defaultModelsExpandDepth?: number;
  defaultModelExpandDepth?: number;
  showExtensions?: boolean;
  showCommonExtensions?: boolean;
  tryItOutEnabled?: boolean;
  supportedSubmitMethods?: string[];
  onComplete?: (system: any) => void;
  requestInterceptor?: (request: any) => any;
  responseInterceptor?: (response: any) => any;
}

// Dynamically import SwaggerUI - temporarily disabled due to missing dependency
// const SwaggerUI = dynamic<SwaggerUIProps>(
//   () => import('swagger-ui-react') as any,
//   {
//     ssr: false,
//     loading: () => (
//       <div className="flex items-center justify-center h-64">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
//       </div>
//     ),
//   }
// );

// Import Swagger UI styles - temporarily disabled
// import 'swagger-ui-react/swagger-ui.css';

// Temporary placeholder component
const SwaggerUI = ({ spec }: { spec: any }) => (
  <div className="border rounded-lg p-4 bg-gray-50">
    <p className="text-gray-600">API Documentation temporarily unavailable</p>
    <p className="text-sm text-gray-500 mt-2">
      Install swagger-ui-react to enable full API documentation
    </p>
  </div>
);

export default function APIDocumentationPage() {
  const [spec, setSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApiSpec = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/docs');
      if (!response.ok) {
        throw new Error('Failed to fetch API specification');
      }
      const data = await response.json();
      setSpec(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApiSpec();
  }, []);

  const downloadSpec = () => {
    if (!spec) return;
    const blob = new Blob([JSON.stringify(spec, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nex7-api-spec.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading API documentation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading API Documentation</CardTitle>
            <CardDescription className="text-red-600">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchApiSpec} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">NEX7 API Documentation</h1>
            <p className="text-xl text-muted-foreground">
              Interactive API reference for the NEX7 Platform
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadSpec} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Spec
            </Button>
            <Button onClick={fetchApiSpec} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button asChild variant="outline">
              <a
                href="https://github.com/betofilippi/nex7.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                GitHub
              </a>
            </Button>
          </div>
        </div>

        {/* API Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Version</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">v1.0.0</div>
              <Badge variant="secondary" className="mt-1">
                Stable
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Base URL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-mono bg-muted px-2 py-1 rounded">
                /api
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All endpoints relative to base
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">JWT Bearer Token</div>
              <Badge variant="outline" className="mt-1">
                Required
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Quick Links</CardTitle>
            <CardDescription>
              Jump to specific API sections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                'Authentication',
                'Agents',
                'Projects',
                'Canvas',
                'Deployments',
                'Users',
                'Webhooks',
                'Vercel'
              ].map((section) => (
                <Button
                  key={section}
                  variant="ghost"
                  size="sm"
                  className="justify-start"
                  onClick={() => {
                    const element = document.querySelector(`[data-tag="${section.toLowerCase()}"]`);
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {section}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Swagger UI */}
      <Card>
        <CardContent className="p-0">
          {spec && (
            <div className="swagger-ui-container">
              <SwaggerUI
                spec={spec}
                deepLinking={true}
                displayOperationId={false}
                defaultModelsExpandDepth={1}
                defaultModelExpandDepth={1}
                showExtensions={false}
                showCommonExtensions={false}
                tryItOutEnabled={true}
                supportedSubmitMethods={['get', 'post', 'put', 'delete', 'patch']}
                onComplete={(system: any) => {
                  // Add custom styling or functionality here
                  console.log('Swagger UI loaded');
                }}
                requestInterceptor={(request: any) => {
                  // Add auth token if available
                  const token = localStorage.getItem('auth_token');
                  if (token) {
                    request.headers.Authorization = `Bearer ${token}`;
                  }
                  return request;
                }}
                responseInterceptor={(response: any) => {
                  // Handle responses
                  return response;
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          Generated automatically from API route definitions.{' '}
          <a
            href="/docs/developer-guide/api-development"
            className="text-primary hover:underline"
          >
            Learn how to contribute
          </a>
        </p>
      </div>

      {/* Custom Styling for Swagger UI */}
      <style jsx global>{`
        .swagger-ui-container {
          font-family: inherit;
        }
        
        .swagger-ui .topbar {
          display: none;
        }
        
        .swagger-ui .scheme-container {
          background: none;
          border: none;
          box-shadow: none;
        }
        
        .swagger-ui .info {
          margin: 0;
        }
        
        .swagger-ui .info .title {
          font-size: 1.5rem;
          color: hsl(var(--foreground));
        }
        
        .swagger-ui .info .description {
          color: hsl(var(--muted-foreground));
        }
        
        .swagger-ui .opblock-tag {
          border-bottom: 1px solid hsl(var(--border));
          background: hsl(var(--muted/50));
        }
        
        .swagger-ui .opblock {
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .swagger-ui .opblock.is-open .opblock-summary {
          border-bottom: 1px solid hsl(var(--border));
        }
        
        .swagger-ui .btn.try-out__btn {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border: none;
        }
        
        .swagger-ui .btn.execute {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border: none;
        }
        
        .swagger-ui .parameters-col_description {
          color: hsl(var(--muted-foreground));
        }
        
        .swagger-ui .response-col_status {
          font-family: var(--font-mono);
        }
        
        .swagger-ui .model-box {
          background: hsl(var(--muted/20));
          border: 1px solid hsl(var(--border));
          border-radius: 0.375rem;
        }
        
        .swagger-ui .model .property {
          color: hsl(var(--foreground));
        }
        
        .swagger-ui .model .property.primitive {
          color: hsl(var(--muted-foreground));
        }
      `}</style>
    </div>
  );
}