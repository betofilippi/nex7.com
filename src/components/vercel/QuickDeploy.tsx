'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';
import {
  Cloud,
  RefreshCw,
  ChevronDown,
  GitBranch,
  Zap,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { VercelProject } from '../../lib/vercel/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface QuickDeployProps {
  projectId?: string;
  onDeploy?: (deploymentId: string) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showProjectSelector?: boolean;
}

export default function QuickDeploy({ 
  projectId: defaultProjectId,
  onDeploy,
  variant = 'default',
  size = 'default',
  showProjectSelector = true
}: QuickDeployProps) {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<VercelProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(defaultProjectId || null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [deployConfig, setDeployConfig] = useState({
    target: 'production',
    branch: 'main',
    message: '',
  });

  useEffect(() => {
    if (showProjectSelector) {
      fetchProjects();
    }
  }, [showProjectSelector]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/vercel/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
        if (!selectedProject && data.projects.length > 0) {
          setSelectedProject(data.projects[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleQuickDeploy = async () => {
    if (!selectedProject && !defaultProjectId) return;

    setLoading(true);
    try {
      // Simulate deployment creation
      // In a real implementation, this would call the deployment API
      const response = await fetch('/api/vercel/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Quick Deploy - ${new Date().toISOString()}`,
          project: selectedProject || defaultProjectId,
          target: deployConfig.target,
          meta: {
            githubCommitRef: deployConfig.branch,
            message: deployConfig.message,
          },
          files: [
            // This would include the actual files to deploy
            { file: 'index.html', sha: 'abc123', size: 1024 }
          ],
        }),
      });

      if (response.ok) {
        const deployment = await response.json();
        onDeploy?.(deployment.id);
      }
    } catch (error) {
      console.error('Error creating deployment:', error);
    } finally {
      setLoading(false);
      setShowConfigDialog(false);
    }
  };

  const currentProject = projects.find(p => p.id === selectedProject);

  if (showProjectSelector && projects.length > 1) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={variant} size={size} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Quick Deploy
                  <ChevronDown className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-sm font-semibold">Select Project</div>
            <DropdownMenuSeparator />
            {projects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => {
                  setSelectedProject(project.id);
                  setShowConfigDialog(true);
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    <span>{project.name}</span>
                  </div>
                  {project.framework && (
                    <Badge variant="outline" className="text-xs">
                      {project.framework}
                    </Badge>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/vercel/projects" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Manage Projects
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deploy Configuration</DialogTitle>
              <DialogDescription>
                Configure deployment settings for {currentProject?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="target">Environment</Label>
                <Select
                  value={deployConfig.target}
                  onValueChange={(value) => setDeployConfig({ ...deployConfig, target: value })}
                >
                  <SelectTrigger id="target">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="preview">Preview</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="branch"
                    value={deployConfig.branch}
                    onChange={(e) => setDeployConfig({ ...deployConfig, branch: e.target.value })}
                    placeholder="main"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Deploy Message (optional)</Label>
                <Input
                  id="message"
                  value={deployConfig.message}
                  onChange={(e) => setDeployConfig({ ...deployConfig, message: e.target.value })}
                  placeholder="Quick deploy from dashboard"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleQuickDeploy} disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Cloud className="mr-2 h-4 w-4" />
                    Deploy Now
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Simple button when project is pre-selected
  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleQuickDeploy}
      disabled={loading || (!selectedProject && !defaultProjectId)}
    >
      {loading ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Deploying...
        </>
      ) : (
        <>
          <Zap className="mr-2 h-4 w-4" />
          Quick Deploy
        </>
      )}
    </Button>
  );
}