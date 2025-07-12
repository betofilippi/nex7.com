'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Download, 
  Cloud, 
  Container, 
  Smartphone,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { ProjectExporter } from '@/lib/export/project-exporter';
import { 
  ExportOptions, 
  ExportProgress, 
  ExportResult, 
  ProjectExportData,
  FrameworkType,
  CloudProvider,
  ExportTarget
} from '@/lib/export/types';

interface ExportDialogProps {
  projectData: ProjectExportData;
  trigger?: React.ReactNode;
}

export function ExportDialog({ projectData, trigger }: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [options, setOptions] = useState<ExportOptions>({
    format: 'zip',
    target: 'download',
    includeAssets: true,
    includeData: false,
    includeDependencies: true,
    compression: true,
    minify: true,
    framework: 'next',
  });

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setProgress(null);
    setResult(null);

    try {
      const exporter = new ProjectExporter();
      const exportResult = await exporter.exportProject(
        projectData,
        options,
        (progress) => setProgress(progress)
      );
      
      setResult(exportResult);
      
      // If it's a download, trigger the download
      if (exportResult.downloadUrl) {
        const link = document.createElement('a');
        link.href = exportResult.downloadUrl;
        link.download = `${projectData.name}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Export failed:', error);
      setProgress({
        stage: 'error',
        progress: 0,
        message: 'Export failed',
        error: error.message,
      });
    } finally {
      setIsExporting(false);
    }
  }, [projectData, options]);

  const getTargetIcon = (target: ExportTarget) => {
    switch (target) {
      case 'download':
        return <Download className="h-4 w-4" />;
      case 'cloud':
        return <Cloud className="h-4 w-4" />;
      case 'docker':
        return <Container className="h-4 w-4" />;
      case 'standalone':
        return <Smartphone className="h-4 w-4" />;
    }
  };

  const getTargetDescription = (target: ExportTarget) => {
    switch (target) {
      case 'download':
        return 'Download as ZIP file';
      case 'cloud':
        return 'Deploy to cloud platform';
      case 'docker':
        return 'Generate Docker container';
      case 'standalone':
        return 'Create standalone application';
    }
  };

  const renderTargetOptions = () => {
    switch (options.target) {
      case 'cloud':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="cloudProvider">Cloud Provider</Label>
              <Select 
                value={options.cloudProvider} 
                onValueChange={(value: CloudProvider) => 
                  setOptions(prev => ({ ...prev, cloudProvider: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vercel">Vercel</SelectItem>
                  <SelectItem value="netlify">Netlify</SelectItem>
                  <SelectItem value="aws">AWS</SelectItem>
                  <SelectItem value="gcp">Google Cloud</SelectItem>
                  <SelectItem value="azure">Azure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="domain">Custom Domain (optional)</Label>
              <Input 
                id="domain"
                placeholder="example.com"
                value={options.customConfig?.domain || ''}
                onChange={(e) => 
                  setOptions(prev => ({
                    ...prev,
                    customConfig: { ...prev.customConfig, domain: e.target.value }
                  }))
                }
              />
            </div>
          </div>
        );
      case 'docker':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="baseImage">Base Image</Label>
              <Input 
                id="baseImage"
                placeholder="node:18-alpine"
                value={options.customConfig?.baseImage || 'node:18-alpine'}
                onChange={(e) => 
                  setOptions(prev => ({
                    ...prev,
                    customConfig: { ...prev.customConfig, baseImage: e.target.value }
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="port">Port</Label>
              <Input 
                id="port"
                type="number"
                placeholder="3000"
                value={options.customConfig?.port || 3000}
                onChange={(e) => 
                  setOptions(prev => ({
                    ...prev,
                    customConfig: { ...prev.customConfig, port: parseInt(e.target.value) }
                  }))
                }
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Project</DialogTitle>
          <DialogDescription>
            Export your project in various formats and deploy to different platforms.
          </DialogDescription>
        </DialogHeader>

        {isExporting || result ? (
          <div className="space-y-4">
            {progress && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {progress.stage === 'error' ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : progress.stage === 'complete' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <span className="text-sm font-medium">{progress.message}</span>
                </div>
                <Progress value={progress.progress} className="w-full" />
                {progress.currentFile && (
                  <p className="text-xs text-muted-foreground">
                    Processing: {progress.currentFile}
                  </p>
                )}
                {progress.error && (
                  <p className="text-xs text-red-500">{progress.error}</p>
                )}
              </div>
            )}

            {result && (
              <div className="space-y-2 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-green-700">Export completed!</span>
                </div>
                {result.downloadUrl && (
                  <p className="text-sm text-green-600">
                    Your project has been downloaded automatically.
                  </p>
                )}
                {result.deployUrl && (
                  <div className="space-y-1">
                    <p className="text-sm text-green-600">
                      Your project has been deployed successfully!
                    </p>
                    <a 
                      href={result.deployUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View deployment →
                    </a>
                  </div>
                )}
                <div className="text-xs text-green-600 space-y-1">
                  <p>Size: {(result.size / 1024 / 1024).toFixed(2)} MB</p>
                  <p>Files: {result.files.length}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="framework">Framework</TabsTrigger>
              <TabsTrigger value="target">Target</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="includeAssets"
                    checked={options.includeAssets}
                    onCheckedChange={(checked) =>
                      setOptions(prev => ({ ...prev, includeAssets: checked }))
                    }
                  />
                  <Label htmlFor="includeAssets">Include Assets</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="includeData"
                    checked={options.includeData}
                    onCheckedChange={(checked) =>
                      setOptions(prev => ({ ...prev, includeData: checked }))
                    }
                  />
                  <Label htmlFor="includeData">Include Data</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="includeDependencies"
                    checked={options.includeDependencies}
                    onCheckedChange={(checked) =>
                      setOptions(prev => ({ ...prev, includeDependencies: checked }))
                    }
                  />
                  <Label htmlFor="includeDependencies">Include Dependencies</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="compression"
                    checked={options.compression}
                    onCheckedChange={(checked) =>
                      setOptions(prev => ({ ...prev, compression: checked }))
                    }
                  />
                  <Label htmlFor="compression">Enable Compression</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="minify"
                    checked={options.minify}
                    onCheckedChange={(checked) =>
                      setOptions(prev => ({ ...prev, minify: checked }))
                    }
                  />
                  <Label htmlFor="minify">Minify Code</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="framework" className="space-y-4">
              <div>
                <Label>Target Framework</Label>
                <Select 
                  value={options.framework} 
                  onValueChange={(value: FrameworkType) => 
                    setOptions(prev => ({ ...prev, framework: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="next">Next.js</SelectItem>
                    <SelectItem value="react">React</SelectItem>
                    <SelectItem value="vue">Vue.js</SelectItem>
                    <SelectItem value="angular">Angular</SelectItem>
                    <SelectItem value="svelte">Svelte</SelectItem>
                    <SelectItem value="vanilla">Vanilla JS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="target" className="space-y-4">
              <div>
                <Label>Export Target</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {(['download', 'cloud', 'docker', 'standalone'] as ExportTarget[]).map((target) => (
                    <Button
                      key={target}
                      variant={options.target === target ? 'default' : 'outline'}
                      className="flex items-center gap-2 h-auto p-4"
                      onClick={() => setOptions(prev => ({ ...prev, target }))}
                    >
                      {getTargetIcon(target)}
                      <div className="text-left">
                        <div className="font-medium capitalize">{target}</div>
                        <div className="text-xs text-muted-foreground">
                          {getTargetDescription(target)}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {renderTargetOptions()}
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              getTargetIcon(options.target)
            )}
            {isExporting ? 'Exporting...' : 'Start Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}