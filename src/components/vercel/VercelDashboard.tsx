'use client'

import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Activity,
  AlertCircle,
  Code,
  ExternalLink,
  FolderOpen,
  GitBranch,
  Globe,
  Loader2,
  Plus,
  RefreshCw,
  Rocket,
  Settings,
  Zap
} from 'lucide-react'
import { QuickDeploy } from './QuickDeploy'
import { DeploymentHistory } from './DeploymentHistory'
import { DeploymentAnalytics } from './DeploymentAnalytics'
import { VercelProject } from '@/lib/vercel/client'
import { projectTemplates } from '@/lib/vercel/templates'

interface VercelDashboardProps {
  isAuthenticated: boolean
}

export function VercelDashboard({ isAuthenticated: initialAuth }: VercelDashboardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth)
  const [projects, setProjects] = useState<VercelProject[]>([])
  const [selectedProject, setSelectedProject] = useState<VercelProject | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    template: 'nextjs',
    gitRepo: '',
    gitType: 'github' as 'github' | 'gitlab' | 'bitbucket'
  })

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/vercel/auth?action=status')
        const data = await response.json()
        setIsAuthenticated(data.authenticated)
      } catch (error) {
        console.error('Error checking auth status:', error)
      }
    }

    checkAuth()
  }, [])

  // Fetch projects
  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects()
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/vercel/projects')
      if (!response.ok) throw new Error('Failed to fetch projects')
      
      const data = await response.json()
      setProjects(data.projects || [])
      
      // Select first project by default
      if (data.projects && data.projects.length > 0 && !selectedProject) {
        setSelectedProject(data.projects[0])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const connectVercel = () => {
    window.location.href = '/api/vercel/auth?action=login'
  }

  const createProject = async () => {
    setIsCreatingProject(true)
    try {
      const response = await fetch('/api/vercel/projects/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'create-from-template',
          name: newProjectData.name,
          template: newProjectData.template,
          gitRepository: newProjectData.gitRepo ? {
            repo: newProjectData.gitRepo,
            type: newProjectData.gitType
          } : undefined
        })
      })

      if (!response.ok) throw new Error('Failed to create project')
      
      const project = await response.json()
      setProjects([...projects, project])
      setSelectedProject(project)
      
      // Reset form
      setNewProjectData({
        name: '',
        template: 'nextjs',
        gitRepo: '',
        gitType: 'github'
      })
    } catch (error) {
      console.error('Error creating project:', error)
    } finally {
      setIsCreatingProject(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle>Connect to Vercel</CardTitle>
          <CardDescription>
            Link your Vercel account to start deploying projects
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={connectVercel} size="lg">
            <Zap className="mr-2 h-4 w-4" />
            Connect Vercel Account
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vercel Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your deployments and projects
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchProjects}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Set up a new project with your preferred framework
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={newProjectData.name}
                    onChange={(e) => setNewProjectData({
                      ...newProjectData,
                      name: e.target.value
                    })}
                    placeholder="my-awesome-project"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="template">Framework</Label>
                  <Select
                    value={newProjectData.template}
                    onValueChange={(value) => setNewProjectData({
                      ...newProjectData,
                      template: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(projectTemplates).map(([key, template]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            <span>{template.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="gitRepo">Git Repository (optional)</Label>
                  <Input
                    id="gitRepo"
                    value={newProjectData.gitRepo}
                    onChange={(e) => setNewProjectData({
                      ...newProjectData,
                      gitRepo: e.target.value
                    })}
                    placeholder="username/repo"
                  />
                </div>
                {newProjectData.gitRepo && (
                  <div className="grid gap-2">
                    <Label htmlFor="gitType">Git Provider</Label>
                    <Select
                      value={newProjectData.gitType}
                      onValueChange={(value) => setNewProjectData({
                        ...newProjectData,
                        gitType: value as 'github' | 'gitlab' | 'bitbucket'
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="github">GitHub</SelectItem>
                        <SelectItem value="gitlab">GitLab</SelectItem>
                        <SelectItem value="bitbucket">Bitbucket</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={createProject}
                  disabled={!newProjectData.name || isCreatingProject}
                >
                  {isCreatingProject && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Project selector */}
      {projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Project</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedProject?.id}
              onValueChange={(value) => {
                const project = projects.find(p => p.id === value)
                setSelectedProject(project || null)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4" />
                      <span>{project.name}</span>
                      {project.framework && (
                        <Badge variant="outline" className="ml-2">
                          {project.framework}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Main content */}
      {selectedProject ? (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="deployments">Deployments</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Quick deploy */}
            <QuickDeploy />

            {/* Project info */}
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium">Name</p>
                    <p className="text-sm text-muted-foreground">{selectedProject.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Framework</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedProject.framework || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedProject.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedProject.gitRepository && (
                    <div>
                      <p className="text-sm font-medium">Repository</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedProject.gitRepository.type}: {selectedProject.gitRepository.repo}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deployments">
            <DeploymentHistory projectId={selectedProject.id} />
          </TabsContent>

          <TabsContent value="analytics">
            <DeploymentAnalytics projectId={selectedProject.id} />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Project Settings</CardTitle>
                <CardDescription>
                  Manage your project configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" asChild>
                  <a
                    href={`https://vercel.com/${selectedProject.accountId}/${selectedProject.name}/settings`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Open in Vercel Dashboard
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {projects.length === 0
              ? "No projects found. Create your first project to get started."
              : "Select a project to view its details."}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}