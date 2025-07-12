'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { 
  HelpCircle, 
  BookOpen, 
  ChevronRight, 
  Play, 
  Users, 
  GitBranch, 
  Cloud, 
  FolderOpen,
  X,
  Lightbulb
} from 'lucide-react';
import { useTutorial } from './TutorialContext';

interface TutorialTriggerProps {
  variant?: 'floating' | 'button' | 'icon' | 'menu';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

export const TutorialTrigger: React.FC<TutorialTriggerProps> = ({
  variant = 'floating',
  position = 'bottom-right',
  className = ''
}) => {
  const { startTour, progress, isCompleted } = useTutorial();
  const [showMenu, setShowMenu] = useState(false);

  const tutorials = [
    {
      id: 'dashboard-overview',
      title: 'Dashboard Overview',
      description: 'Learn about the main interface and navigation',
      icon: BookOpen,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      duration: '3 min',
      completed: isCompleted('dashboard-overview')
    },
    {
      id: 'visual-canvas',
      title: 'Visual Canvas',
      description: 'Create workflows with drag-and-drop',
      icon: GitBranch,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      duration: '5 min',
      completed: isCompleted('visual-canvas')
    },
    {
      id: 'ai-agents',
      title: 'AI Agents',
      description: 'Chat with intelligent assistants',
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      duration: '4 min',
      completed: isCompleted('ai-agents')
    },
    {
      id: 'project-deployment',
      title: 'Project Deployment',
      description: 'Deploy your projects with one click',
      icon: Cloud,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      duration: '3 min',
      completed: isCompleted('project-deployment')
    },
    {
      id: 'project-management',
      title: 'Project Management',
      description: 'Organize and collaborate on projects',
      icon: FolderOpen,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      duration: '4 min',
      completed: isCompleted('project-management')
    }
  ];

  const completedCount = tutorials.filter(t => t.completed).length;
  const totalCount = tutorials.length;

  const handleStartTour = (tourId: string) => {
    startTour(tourId);
    setShowMenu(false);
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  if (variant === 'floating') {
    return (
      <>
        <motion.div
          className={`fixed ${positionClasses[position]} z-50 ${className}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <Button
            onClick={() => setShowMenu(true)}
            className="rounded-full w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            <div className="relative">
              <HelpCircle className="w-6 h-6" />
              {completedCount < totalCount && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
          </Button>
        </motion.div>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
            >
              <motion.div
                className="w-full max-w-2xl"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <Card className="shadow-2xl">
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <Lightbulb className="w-6 h-6 text-yellow-500" />
                          Interactive Tutorials
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          Learn how to use NEX7 with step-by-step guides
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">
                          {completedCount}/{totalCount} completed
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowMenu(false)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {tutorials.map((tutorial) => {
                        const Icon = tutorial.icon;
                        return (
                          <motion.div
                            key={tutorial.id}
                            className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
                              tutorial.completed 
                                ? 'border-green-200 bg-green-50' 
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleStartTour(tutorial.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${tutorial.bgColor}`}>
                                  <Icon className={`w-6 h-6 ${tutorial.color}`} />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    {tutorial.title}
                                    {tutorial.completed && (
                                      <Badge variant="secondary" className="text-xs">
                                        Completed
                                      </Badge>
                                    )}
                                  </h3>
                                  <p className="text-sm text-gray-600">{tutorial.description}</p>
                                  <p className="text-xs text-gray-500 mt-1">Duration: {tutorial.duration}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="gap-2">
                                  <Play className="w-4 h-4" />
                                  Start
                                  <ChevronRight className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {completedCount === totalCount && (
                      <motion.div
                        className="mt-6 p-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg text-white text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <h3 className="font-semibold mb-2">🎉 Congratulations!</h3>
                        <p className="text-sm">You've completed all tutorials. You're now a NEX7 expert!</p>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  if (variant === 'button') {
    return (
      <Button
        onClick={() => setShowMenu(true)}
        variant="outline"
        className={`gap-2 ${className}`}
      >
        <HelpCircle className="w-4 h-4" />
        Tutorials
        {completedCount < totalCount && (
          <Badge variant="secondary" className="ml-1">
            {totalCount - completedCount} new
          </Badge>
        )}
      </Button>
    );
  }

  if (variant === 'icon') {
    return (
      <Button
        onClick={() => setShowMenu(true)}
        variant="ghost"
        size="sm"
        className={`relative ${className}`}
      >
        <HelpCircle className="w-5 h-5" />
        {completedCount < totalCount && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </Button>
    );
  }

  return null;
};