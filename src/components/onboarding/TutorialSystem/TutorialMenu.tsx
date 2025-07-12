'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, 
  LayoutDashboard, 
  Palette, 
  Bot, 
  Rocket, 
  FolderOpen,
  ChevronRight,
  Clock,
  CheckCircle,
  Play,
  X
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { useTutorial } from './TutorialContext';
import { getAllTours, getToursByCategory } from './tourConfigs';
import { TutorialTour } from './types';

interface TutorialMenuProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const TutorialMenu: React.FC<TutorialMenuProps> = ({ 
  isOpen, 
  onClose, 
  className 
}) => {
  const { startTour, state } = useTutorial();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const allTours = getAllTours();
  
  const categories = [
    { 
      id: 'overview', 
      name: 'Dashboard Overview', 
      icon: LayoutDashboard, 
      description: 'Get familiar with the main interface',
      color: 'bg-blue-500'
    },
    { 
      id: 'canvas', 
      name: 'Visual Canvas', 
      icon: Palette, 
      description: 'Learn drag-and-drop development',
      color: 'bg-purple-500'
    },
    { 
      id: 'agents', 
      name: 'AI Agents', 
      icon: Bot, 
      description: 'Work with intelligent assistants',
      color: 'bg-green-500'
    },
    { 
      id: 'deploy', 
      name: 'Deployment', 
      icon: Rocket, 
      description: 'Deploy your projects easily',
      color: 'bg-orange-500'
    },
    { 
      id: 'projects', 
      name: 'Project Management', 
      icon: FolderOpen, 
      description: 'Organize and collaborate on projects',
      color: 'bg-pink-500'
    },
  ];

  const handleStartTour = (tourId: string) => {
    startTour(tourId);
    onClose();
  };

  const isTourCompleted = (tourId: string) => {
    return state.completedTours.includes(tourId);
  };

  const getTourProgress = (tourId: string) => {
    const progress = state.userProgress[tourId];
    const tour = allTours.find(t => t.id === tourId);
    if (!tour || progress === undefined) return 0;
    return Math.round((progress / tour.steps.length) * 100);
  };

  const renderTourCard = (tour: TutorialTour) => {
    const completed = isTourCompleted(tour.id);
    const progress = getTourProgress(tour.id);
    const hasProgress = progress > 0 && !completed;

    return (
      <motion.div
        key={tour.id}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ scale: 1.02 }}
        className="group"
      >
        <Card className="h-full border-2 hover:border-primary/20 transition-all duration-200 cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${categories.find(c => c.id === tour.category)?.color || 'bg-gray-500'}`}>
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {tour.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{tour.estimatedTime}</span>
                  </div>
                </div>
              </div>
              {completed && (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              )}
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <CardDescription className="text-sm mb-4 leading-relaxed">
              {tour.description}
            </CardDescription>

            {/* Progress bar for partially completed tours */}
            {hasProgress && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Prerequisites if any */}
            {tour.prerequisites && tour.prerequisites.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Prerequisites:</p>
                <div className="flex flex-wrap gap-1">
                  {tour.prerequisites.map(prereq => (
                    <Badge key={prereq} variant="outline" className="text-xs">
                      {prereq}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button
              className="w-full gap-2"
              onClick={() => handleStartTour(tour.id)}
              variant={completed ? "outline" : "default"}
            >
              <Play className="w-4 h-4" />
              {completed ? 'Replay Tutorial' : hasProgress ? 'Continue Tutorial' : 'Start Tutorial'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const menuVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.9,
      y: 20 
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      y: 20,
      transition: {
        duration: 0.2
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className || ''}`}
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Menu content */}
        <motion.div
          className="relative bg-background border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          variants={menuVariants}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-muted/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Tutorial Center</h2>
                <p className="text-sm text-muted-foreground">
                  Learn how to use Nex7 with guided tutorials
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex h-[calc(90vh-120px)]">
            {/* Category sidebar */}
            <div className="w-80 border-r bg-muted/5 p-4 overflow-y-auto">
              <h3 className="font-semibold mb-4">Categories</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedCategory === null
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5" />
                    <span className="font-medium">All Tutorials</span>
                  </div>
                </button>
                
                {categories.map(category => {
                  const categoryTours = getToursByCategory(category.id as any);
                  const completedCount = categoryTours.filter(tour => 
                    isTourCompleted(tour.id)
                  ).length;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedCategory === category.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded ${category.color}`}>
                            <category.icon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-medium">{category.name}</div>
                            <div className="text-xs opacity-70">{category.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs">
                            {completedCount}/{categoryTours.length}
                          </span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tour list */}
            <div className="flex-1 p-6 overflow-y-auto">
              <motion.div layout className="grid gap-4 md:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {(selectedCategory 
                    ? getToursByCategory(selectedCategory as any)
                    : allTours
                  ).map(renderTourCard)}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TutorialMenu;