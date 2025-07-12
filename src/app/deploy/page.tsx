'use client';

import React, { useState } from 'react';
import { 
  DeploymentPipeline, 
  DeploymentMonitor, 
  AutoRecovery, 
  DeploymentNotifications,
  PipelineStage 
} from '../../components/deploy';

interface ErrorInfo {
  id: string;
  type: string;
  message: string;
  stackTrace: string;
  timestamp: string;
  context?: {
    file?: string;
    line?: number;
    column?: number;
  };
}
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Button } from '../../components/ui/button';
import { Play, RotateCcw, Pause } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

export default function DeployPage() {
  const { toast } = useToast();
  const [isDeploying, setIsDeploying] = useState(false);
  const [currentError, setCurrentError] = useState<ErrorInfo | undefined>(undefined);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([
    { id: 'source', name: 'Source Code', status: 'pending' },
    { id: 'build', name: 'Build', status: 'pending' },
    { id: 'test', name: 'Test', status: 'pending' },
    { id: 'deploy', name: 'Deploy', status: 'pending' },
  ]);

  const startDeployment = () => {
    setIsDeploying(true);
    setCurrentError(undefined);
    
    // Reset all stages
    setPipelineStages(stages => stages.map(stage => ({ ...stage, status: 'pending' })));

    // Simulate deployment process
    let currentStageIndex = 0;
    
    const deploymentInterval = setInterval(() => {
      if (currentStageIndex >= pipelineStages.length) {
        clearInterval(deploymentInterval);
        setIsDeploying(false);
        toast({
          title: "Deployment Complete",
          description: "Your application has been successfully deployed!"
        });
        return;
      }

      setPipelineStages(stages => stages.map((stage, index) => {
        if (index < currentStageIndex) {
          return { ...stage, status: 'success', duration: 2000 + Math.random() * 3000 };
        } else if (index === currentStageIndex) {
          // Simulate random error on test stage
          if (stage.id === 'test' && Math.random() > 0.7) {
            setCurrentError({
              id: Date.now().toString(),
              type: 'TestFailure',
              message: 'Unit test failed: Expected value to be true but got false',
              stackTrace: 'at Object.<anonymous> (src/tests/deployment.test.ts:45:12)',
              timestamp: new Date().toISOString(),
              context: {
                file: 'src/tests/deployment.test.ts',
                line: 45,
                column: 12
              }
            });
            clearInterval(deploymentInterval);
            setIsDeploying(false);
            return { ...stage, status: 'error', message: 'Tests failed' };
          }
          return { ...stage, status: 'running' };
        }
        return stage;
      }));

      currentStageIndex++;
    }, 3000);
  };

  const resetDeployment = () => {
    setIsDeploying(false);
    setCurrentError(undefined);
    setPipelineStages(stages => stages.map(stage => ({ 
      ...stage, 
      status: 'pending',
      duration: undefined,
      message: undefined 
    })));
  };

  const handleStageClick = (stage: PipelineStage) => {
    toast({
      title: `Stage: ${stage.name}`,
      description: `Status: ${stage.status}${stage.duration ? ` (${stage.duration}ms)` : ''}`
    });
  };

  const handleFixApplied = (_fix: unknown) => {
    // Reset error and continue deployment
    setCurrentError(undefined);
    toast({
      title: "Fix Applied",
      description: "Retrying deployment with the applied fix..."
    });
    
    // Continue from where it failed
    startDeployment();
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-100">Deployment Center</h1>
            <p className="text-gray-400 mt-2">Monitor and manage your application deployments</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={startDeployment}
              disabled={isDeploying}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isDeploying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Deploying...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Deployment
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={resetDeployment}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Deployment Pipeline */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-100">Deployment Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <DeploymentPipeline
              stages={pipelineStages}
              onStageClick={handleStageClick}
            />
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="monitor" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="monitor">Monitor</TabsTrigger>
            <TabsTrigger value="recovery">Auto Recovery</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="monitor">
            <DeploymentMonitor
              deploymentId="demo-deployment"
              onErrorDetected={(error) => setCurrentError(error)}
            />
          </TabsContent>

          <TabsContent value="recovery">
            <AutoRecovery
              error={currentError}
              onFixApplied={handleFixApplied}
              onRedeploy={startDeployment}
            />
          </TabsContent>

          <TabsContent value="notifications">
            <DeploymentNotifications
              onChannelUpdate={(channel) => {
                toast({
                  title: "Channel Updated",
                  description: `${channel.name} is now ${channel.enabled ? 'enabled' : 'disabled'}`
                });
              }}
            />
          </TabsContent>
        </Tabs>

        {/* GitHub Webhook Info */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-100">GitHub Webhook Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-400">
                Configure your GitHub repository to send webhooks to trigger automatic deployments.
              </p>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-300 mb-2">Webhook URL:</p>
                <code className="text-sm text-blue-400 break-all">
                  {typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/github` : 'https://your-domain.com/api/webhooks/github'}
                </code>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-300 font-medium mb-1">Supported Events:</p>
                  <ul className="text-gray-400 space-y-1">
                    <li>• Push (trigger on main branch)</li>
                    <li>• Pull Request (merged)</li>
                    <li>• Workflow Run</li>
                    <li>• Release</li>
                  </ul>
                </div>
                <div>
                  <p className="text-gray-300 font-medium mb-1">Configuration:</p>
                  <ul className="text-gray-400 space-y-1">
                    <li>• Content type: application/json</li>
                    <li>• Secret: Set GITHUB_WEBHOOK_SECRET</li>
                    <li>• SSL verification: Enable</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}