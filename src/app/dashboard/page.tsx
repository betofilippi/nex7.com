'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useAuth } from '../../contexts/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Canvas } from '../../components/canvas';
import { AgentChat } from '../../components/agents/AgentChat';
import { AgentSelector } from '../../components/agents/AgentSelector';
import { DeploymentHistory } from '../../components/vercel/DeploymentHistory';
import { DeploymentStatus } from '../../components/vercel/DeploymentStatus';
import { QuickDeploy } from '../../components/vercel/QuickDeploy';
import { TutorialProvider } from '../../components/onboarding/TutorialSystem/TutorialContext';
import { TutorialTrigger } from '../../components/onboarding/TutorialSystem/TutorialTrigger';
import { 
  BarChart3, 
  GitBranch, 
  User, 
  Settings, 
  MessageSquare, 
  Cloud, 
  FolderOpen,
  Zap,
  Activity,
  Clock,
  Users,
  Palette
} from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useRequireAuth();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeAgent, setActiveAgent] = useState('nexy');
  const [dashboardStats] = useState({
    totalProjects: 12,
    activeDeployments: 3,
    totalMessages: 247,
    canvasNodes: 18
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Active Projects',
      value: dashboardStats.totalProjects,
      icon: FolderOpen,
      color: 'text-blue-500',
      change: '+2 this week'
    },
    {
      title: 'Deployments',
      value: dashboardStats.activeDeployments,
      icon: Cloud,
      color: 'text-green-500',
      change: '+5 this month'
    },
    {
      title: 'AI Messages',
      value: dashboardStats.totalMessages,
      icon: MessageSquare,
      color: 'text-purple-500',
      change: '+23 today'
    },
    {
      title: 'Canvas Nodes',
      value: dashboardStats.canvasNodes,
      icon: GitBranch,
      color: 'text-orange-500',
      change: '+8 this week'
    }
  ];

  return (
    <TutorialProvider onEvent={(event, data) => console.log('Tutorial Event:', event, data)}>
      <div className="min-h-screen bg-gray-50 dashboard-container">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">N7</span>
                </div>
                <h1 className="text-xl font-semibold text-gray-900">NEX7 Dashboard</h1>
              </div>
              <Badge variant="outline" className="hidden sm:inline-flex">
                v2.0.0
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <TutorialTrigger variant="icon" />
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user?.name}</span>
              </div>
              <Button
                onClick={logout}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0]}!</h2>
                <p className="text-blue-100">Ready to build something amazing today?</p>
              </div>
              {user?.picture && (
                <Image 
                  src={user.picture} 
                  alt="Profile" 
                  width={60}
                  height={60}
                  className="rounded-full border-2 border-white/20"
                />
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-green-600">{stat.change}</p>
                    </div>
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Tabs Interface */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="canvas" className="flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                <span className="hidden sm:inline">Canvas</span>
              </TabsTrigger>
              <TabsTrigger value="agents" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">AI Agents</span>
              </TabsTrigger>
              <TabsTrigger value="deploy" className="flex items-center gap-2">
                <Cloud className="w-4 h-4" />
                <span className="hidden sm:inline">Deploy</span>
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Projects</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { action: 'Canvas updated', time: '5 min ago', type: 'canvas' },
                        { action: 'Chat with Dev agent', time: '12 min ago', type: 'agent' },
                        { action: 'Deployment successful', time: '1 hour ago', type: 'deploy' },
                        { action: 'New project created', time: '2 hours ago', type: 'project' }
                      ].map((activity, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                          <div className="flex items-center gap-3">
                            {activity.type === 'canvas' && <Palette className="w-4 h-4 text-orange-500" />}
                            {activity.type === 'agent' && <MessageSquare className="w-4 h-4 text-purple-500" />}
                            {activity.type === 'deploy' && <Cloud className="w-4 h-4 text-green-500" />}
                            {activity.type === 'project' && <FolderOpen className="w-4 h-4 text-blue-500" />}
                            <span className="text-sm">{activity.action}</span>
                          </div>
                          <span className="text-xs text-gray-500">{activity.time}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start gap-2" onClick={() => setActiveTab('canvas')}>
                      <GitBranch className="w-4 h-4" />
                      Open Canvas
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setActiveTab('agents')}>
                      <MessageSquare className="w-4 h-4" />
                      Chat with AI
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setActiveTab('deploy')}>
                      <Cloud className="w-4 h-4" />
                      Quick Deploy
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setActiveTab('projects')}>
                      <FolderOpen className="w-4 h-4" />
                      New Project
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Visual Canvas Tab */}
            <TabsContent value="canvas" className="p-0">
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Visual Workflow Canvas</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Design and manage your automation workflows with drag-and-drop interface
                      </p>
                    </div>
                    <Badge variant="outline">
                      {dashboardStats.canvasNodes} nodes
                    </Badge>
                  </div>
                </CardHeader>
                <div className="h-[600px] relative">
                  <Canvas height="h-full" className="rounded-b-lg" />
                </div>
              </Card>
            </TabsContent>

            {/* AI Agents Tab */}
            <TabsContent value="agents" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Agent Selector Sidebar */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      AI Assistants
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AgentSelector
                      activeAgentId={activeAgent}
                      onSelectAgent={setActiveAgent}
                      variant="list"
                      showLabels={true}
                    />
                  </CardContent>
                </Card>

                {/* Chat Interface */}
                <Card className="lg:col-span-3">
                  <CardHeader className="border-b">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Chat with AI Assistant
                    </CardTitle>
                  </CardHeader>
                  <div className="h-[500px]">
                    <AgentChat
                      apiKey={process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || ''}
                      conversationId="dashboard-chat"
                      activeAgentId={activeAgent}
                      className="h-full"
                    />
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Deploy Tab */}
            <TabsContent value="deploy" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Deploy */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Quick Deploy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <QuickDeploy
                      onDeploy={(deploymentId) => {
                        console.log('Deployment created:', deploymentId);
                      }}
                      variant="default"
                      showProjectSelector={true}
                    />
                  </CardContent>
                </Card>

                {/* Deployment Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Latest Deployment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DeploymentStatus
                      deploymentId="latest"
                      autoRefresh={true}
                    />
                  </CardContent>
                </Card>

                {/* Deployment History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Recent Deployments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DeploymentHistory
                      limit={5}
                      showChart={false}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" />
                    Project Workspace
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Project Management</h3>
                    <p className="text-gray-600 mb-6">
                      Organize your projects, manage files, and collaborate with your team.
                    </p>
                    <Button className="gap-2">
                      <FolderOpen className="w-4 h-4" />
                      Create New Project
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Dashboard Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">User Profile</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <p className="text-sm text-gray-900">{user?.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <p className="text-sm text-gray-900">{user?.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Preferences</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Theme</span>
                          <Badge variant="outline">Light</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Notifications</span>
                          <Badge variant="outline">Enabled</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {/* Floating Tutorial Trigger */}
      <TutorialTrigger variant="floating" position="bottom-right" />
    </div>
    </TutorialProvider>
  );
}