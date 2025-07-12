'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  DeploymentStatus,
  BuildLogsViewer,
  DeploymentHistory,
  QuickDeploy,
} from '../../components/vercel';
import {
  Settings,
  Globe,
  Activity,
  Terminal,
  Zap,
  Cloud,
  Shield,
  Clock,
} from 'lucide-react';

export default function VercelDemoPage() {
  const [selectedDeployment, setSelectedDeployment] = useState('dep_abc123');
  const [authStatus, setAuthStatus] = useState<'connected' | 'disconnected'>('disconnected');

  const handleConnect = () => {
    // In a real app, this would trigger the OAuth flow
    window.location.href = '/api/vercel/auth?action=login';
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/vercel/auth?action=logout');
      setAuthStatus('disconnected');
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vercel Integration Demo</h1>
          <p className="text-muted-foreground">
            Comprehensive Vercel deployment management and monitoring
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={authStatus === 'connected' ? 'default' : 'secondary'}>
            <Cloud className="mr-1 h-3 w-3" />
            {authStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </Badge>
          {authStatus === 'connected' ? (
            <Button variant="outline" onClick={handleDisconnect}>
              Disconnect
            </Button>
          ) : (
            <Button onClick={handleConnect}>
              <Shield className="mr-2 h-4 w-4" />
              Connect to Vercel
            </Button>
          )}
        </div>
      </div>

      {authStatus === 'disconnected' && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <Shield className="h-5 w-5" />
              <p className="font-medium">Authentication Required</p>
            </div>
            <p className="text-yellow-700 dark:text-yellow-300 mt-2">
              Connect your Vercel account to access deployment management features.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold">Quick Deploy</h3>
            </div>
            <QuickDeploy 
              onDeploy={setSelectedDeployment}
              showProjectSelector={true}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold">Active Deployments</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Building</span>
                <Badge variant="secondary">2</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Ready</span>
                <Badge variant="default">8</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-purple-500" />
              <h3 className="font-semibold">Projects</h3>
            </div>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" />
                Manage Projects
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="status" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Status
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DeploymentStatus
              deploymentId={selectedDeployment}
              onLogsClick={setSelectedDeployment}
              autoRefresh={true}
            />
            <Card>
              <CardHeader>
                <CardTitle>Canvas Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Vercel nodes are available in the visual canvas for workflow automation.
                </p>
                <div className="space-y-2">
                  <Badge variant="outline">Vercel Deploy Node</Badge>
                  <Badge variant="outline">Vercel Project Node</Badge>
                  <Badge variant="outline">Vercel Domain Node</Badge>
                </div>
                <Button className="w-full mt-4" asChild>
                  <a href="/canvas">Open Canvas</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <BuildLogsViewer
            deploymentId={selectedDeployment}
            autoScroll={true}
            syntaxHighlight={true}
            maxHeight="600px"
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <DeploymentHistory
            limit={20}
            onDeploymentClick={(deployment) => setSelectedDeployment(deployment.uid)}
            showChart={true}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Environment Variables</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Configure environment variables for your Vercel projects.
                </p>
                <Button variant="outline" className="w-full">
                  Manage Variables
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Domain Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Add custom domains and configure DNS settings.
                </p>
                <Button variant="outline" className="w-full">
                  Manage Domains
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Required Environment Variables</h4>
                  <div className="space-y-1 text-sm font-mono bg-muted p-3 rounded">
                    <div>VERCEL_CLIENT_ID=your_client_id</div>
                    <div>VERCEL_CLIENT_SECRET=your_secret</div>
                    <div>VERCEL_REDIRECT_URI=callback_url</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Integration Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>OAuth Authentication</span>
                  <Badge variant={authStatus === 'connected' ? 'default' : 'secondary'}>
                    {authStatus === 'connected' ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>API Access</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Webhook Events</span>
                  <Badge variant="secondary">Configured</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Deployment Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Create and monitor deployments</li>
              <li>• Real-time status updates</li>
              <li>• Cancel and redeploy functions</li>
              <li>• Build progress tracking</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Build Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Real-time log streaming</li>
              <li>• Syntax highlighting</li>
              <li>• Filter by log type</li>
              <li>• Download and copy logs</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Domain Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• Custom domain setup</li>
              <li>• DNS record management</li>
              <li>• SSL certificate status</li>
              <li>• Domain verification</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}