'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Sparkles, Code2, CheckCircle, RefreshCw, Gauge } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { cn } from '../../lib/utils';
import { useToast } from '../../hooks/use-toast';

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

interface SuggestedFix {
  id: string;
  description: string;
  confidence: number;
  changes: CodeChange[];
  explanation: string;
  estimatedImpact: 'low' | 'medium' | 'high';
}

interface CodeChange {
  file: string;
  oldCode: string;
  newCode: string;
  lineStart: number;
  lineEnd: number;
}

interface AutoRecoveryProps {
  error?: ErrorInfo;
  onFixApplied?: (fix: SuggestedFix) => void;
  onRedeploy?: () => void;
  className?: string;
}

const AutoRecovery: React.FC<AutoRecoveryProps> = ({
  error,
  onFixApplied,
  onRedeploy,
  className
}) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestedFixes, setSuggestedFixes] = useState<SuggestedFix[]>([]);
  const [selectedFix, setSelectedFix] = useState<SuggestedFix | null>(null);
  const [isApplyingFix, setIsApplyingFix] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Simulate error analysis with Claude
  const analyzeError = useCallback(async () => {
    if (!error) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate analysis progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate Claude API call
    setTimeout(() => {
      const mockFixes: SuggestedFix[] = [
        {
          id: '1',
          description: 'Fix TypeScript type mismatch in deployment configuration',
          confidence: 92,
          explanation: 'The error occurs because the deployment config expects a string value for the environment variable, but a number is being passed.',
          estimatedImpact: 'low',
          changes: [
            {
              file: 'src/config/deployment.ts',
              oldCode: 'const port = process.env.PORT || 3000;',
              newCode: 'const port = process.env.PORT || "3000";',
              lineStart: 15,
              lineEnd: 15
            }
          ]
        },
        {
          id: '2',
          description: 'Add missing error boundary for deployment pipeline',
          confidence: 78,
          explanation: 'The deployment pipeline crashes when an uncaught error occurs. Adding an error boundary will gracefully handle failures.',
          estimatedImpact: 'medium',
          changes: [
            {
              file: 'src/components/deploy/Pipeline.tsx',
              oldCode: 'export default function Pipeline({ children }) {',
              newCode: 'export default function Pipeline({ children }) {\n  try {',
              lineStart: 10,
              lineEnd: 10
            },
            {
              file: 'src/components/deploy/Pipeline.tsx',
              oldCode: '}',
              newCode: '  } catch (error) {\n    console.error("Pipeline error:", error);\n    return <ErrorFallback error={error} />;\n  }\n}',
              lineStart: 45,
              lineEnd: 45
            }
          ]
        },
        {
          id: '3',
          description: 'Update dependency version to fix compatibility issue',
          confidence: 65,
          explanation: 'The current version of the deployment library has a known issue. Updating to the latest version should resolve this.',
          estimatedImpact: 'high',
          changes: [
            {
              file: 'package.json',
              oldCode: '"deployment-lib": "^2.1.0",',
              newCode: '"deployment-lib": "^2.3.1",',
              lineStart: 28,
              lineEnd: 28
            }
          ]
        }
      ];

      setSuggestedFixes(mockFixes);
      setIsAnalyzing(false);
      clearInterval(progressInterval);
      setAnalysisProgress(100);

      toast({
        title: "Analysis Complete",
        description: `Found ${mockFixes.length} potential fixes for the error.`
      });
    }, 2500);
  }, [error, toast]);

  useEffect(() => {
    if (error) {
      analyzeError();
    }
  }, [error, analyzeError]);

  const applyFix = async (fix: SuggestedFix) => {
    setIsApplyingFix(true);

    // Simulate applying the fix
    setTimeout(() => {
      setIsApplyingFix(false);
      onFixApplied?.(fix);
      
      toast({
        title: "Fix Applied Successfully",
        description: "The suggested changes have been applied to your codebase."
      });
    }, 1500);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-500';
    if (confidence >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getImpactBadgeColor = (impact: string) => {
    switch (impact) {
      case 'low': return 'bg-green-900 text-green-200';
      case 'medium': return 'bg-yellow-900 text-yellow-200';
      case 'high': return 'bg-red-900 text-red-200';
      default: return 'bg-gray-900 text-gray-200';
    }
  };

  if (!error) {
    return (
      <Card className={cn("bg-gray-900 border-gray-800", className)}>
        <CardContent className="py-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-gray-400">No errors detected. System is running smoothly.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Error Alert */}
      <Alert className="bg-red-900/20 border-red-800">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Deployment Error Detected</AlertTitle>
        <AlertDescription className="mt-2">
          <div className="space-y-2">
            <p className="font-mono text-sm">{error.message}</p>
            {error.context?.file && (
              <p className="text-xs text-gray-400">
                {error.context.file}:{error.context.line}:{error.context.column}
              </p>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-100">
              <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
              Analyzing with Claude AI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={analysisProgress} className="mb-2" />
            <p className="text-sm text-gray-400">
              Analyzing error patterns and generating solutions...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Suggested Fixes */}
      {suggestedFixes.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-100">Suggested Fixes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suggestedFixes.map((fix) => (
                <motion.div
                  key={fix.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-all",
                    selectedFix?.id === fix.id
                      ? "bg-blue-900/20 border-blue-600"
                      : "bg-gray-800 border-gray-700 hover:border-gray-600"
                  )}
                  onClick={() => setSelectedFix(fix)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-100">{fix.description}</h4>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs px-2 py-1 rounded", getImpactBadgeColor(fix.estimatedImpact))}>
                        {fix.estimatedImpact} impact
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-3">{fix.explanation}</p>
                  
                  {/* Confidence Meter */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400">Confidence:</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Progress value={fix.confidence} className="flex-1 h-2" />
                        <span className={cn("text-sm font-medium", getConfidenceColor(fix.confidence))}>
                          {fix.confidence}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Fix Details */}
      {selectedFix && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-gray-100">Fix Preview</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedFix(null)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => applyFix(selectedFix)}
                  disabled={isApplyingFix}
                >
                  {isApplyingFix ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Apply Fix
                    </>
                  )}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="changes">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="changes">Code Changes</TabsTrigger>
                <TabsTrigger value="diff">Diff View</TabsTrigger>
              </TabsList>
              
              <TabsContent value="changes" className="space-y-4">
                {selectedFix.changes.map((change, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Code2 className="w-4 h-4" />
                      <span>{change.file}</span>
                      <span className="text-xs">Lines {change.lineStart}-{change.lineEnd}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-red-400 mb-1">Remove:</p>
                        <pre className="bg-red-900/20 border border-red-800 rounded p-3 text-sm overflow-x-auto">
                          <code className="text-red-200">{change.oldCode}</code>
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs text-green-400 mb-1">Add:</p>
                        <pre className="bg-green-900/20 border border-green-800 rounded p-3 text-sm overflow-x-auto">
                          <code className="text-green-200">{change.newCode}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="diff">
                <div className="bg-gray-950 rounded-lg p-4 font-mono text-sm">
                  {selectedFix.changes.map((change, index) => (
                    <div key={index} className="mb-4">
                      <div className="text-gray-400 mb-2">--- {change.file}</div>
                      <div className="text-gray-400 mb-2">+++ {change.file}</div>
                      <div className="space-y-1">
                        <div className="text-red-400">- {change.oldCode}</div>
                        <div className="text-green-400">+ {change.newCode}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Redeploy Button */}
      {onRedeploy && (
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={onRedeploy}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Redeploy with Fixes
          </Button>
        </div>
      )}
    </div>
  );
};

export default AutoRecovery;