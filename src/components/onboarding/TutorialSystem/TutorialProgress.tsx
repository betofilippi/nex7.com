'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Clock, Target, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { Badge } from '../../ui/badge';
import { useTutorial } from './TutorialContext';
import { getAllTours, getToursByCategory } from './tourConfigs';

interface TutorialProgressProps {
  className?: string;
  showDetailed?: boolean;
}

const TutorialProgress: React.FC<TutorialProgressProps> = ({
  className,
  showDetailed = false,
}) => {
  const { state } = useTutorial();
  
  const allTours = getAllTours();
  const completedTours = state.completedTours;
  const totalTours = allTours.length;
  const completionPercentage = Math.round((completedTours.length / totalTours) * 100);
  
  // Calculate category progress
  const categoryProgress = [
    { id: 'overview', name: 'Dashboard', icon: Target },
    { id: 'canvas', name: 'Canvas', icon: Target },
    { id: 'agents', name: 'AI Agents', icon: Target },
    { id: 'deploy', name: 'Deploy', icon: Target },
    { id: 'projects', name: 'Projects', icon: Target },
  ].map(category => {
    const categoryTours = getToursByCategory(category.id as any);
    const completedInCategory = categoryTours.filter(tour => 
      completedTours.includes(tour.id)
    ).length;
    
    return {
      ...category,
      total: categoryTours.length,
      completed: completedInCategory,
      percentage: categoryTours.length > 0 ? Math.round((completedInCategory / categoryTours.length) * 100) : 0,
    };
  });

  // Calculate estimated time for remaining tours
  const remainingTours = allTours.filter(tour => !completedTours.includes(tour.id));
  const estimatedTimeRemaining = remainingTours.reduce((total, tour) => {
    const timeStr = tour.estimatedTime;
    const minutes = parseInt(timeStr.split('-')[0]) || 5; // Default to 5 minutes
    return total + minutes;
  }, 0);

  // Get current streak (consecutive days with tutorial progress)
  const getCurrentStreak = () => {
    // This would typically come from a more sophisticated tracking system
    // For now, return a placeholder value
    return Math.floor(Math.random() * 7) + 1;
  };

  const streak = getCurrentStreak();

  if (!showDetailed) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Learning Progress</CardTitle>
            <Badge variant={completionPercentage === 100 ? "default" : "secondary"}>
              {completedTours.length}/{totalTours} Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            
            {completionPercentage === 100 ? (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Trophy className="w-4 h-4" />
                <span>All tutorials completed!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>~{estimatedTimeRemaining} min remaining</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Overall Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Learning Dashboard
          </CardTitle>
          <CardDescription>
            Track your progress through all Nex7 tutorials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Completion Stats */}
            <div className="text-center">
              <motion.div
                className="text-3xl font-bold text-primary mb-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              >
                {completionPercentage}%
              </motion.div>
              <p className="text-sm text-muted-foreground">Complete</p>
              <Progress value={completionPercentage} className="mt-2 h-2" />
            </div>

            {/* Streak */}
            <div className="text-center">
              <motion.div
                className="text-3xl font-bold text-orange-500 mb-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              >
                {streak}
              </motion.div>
              <p className="text-sm text-muted-foreground">Day Streak</p>
              <div className="flex justify-center mt-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full mx-0.5 ${
                      i < streak ? 'bg-orange-500' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Time Remaining */}
            <div className="text-center">
              <motion.div
                className="text-3xl font-bold text-blue-500 mb-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
              >
                {estimatedTimeRemaining}
              </motion.div>
              <p className="text-sm text-muted-foreground">Minutes Left</p>
              <div className="flex items-center justify-center mt-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3 mr-1" />
                Estimated time
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progress by Category</CardTitle>
          <CardDescription>
            See how you're doing in each area of Nex7
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryProgress.map((category, index) => (
              <motion.div
                key={category.id}
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <category.icon className="w-4 h-4" />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {category.completed}/{category.total}
                    </span>
                    {category.percentage === 100 && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>
                <Progress value={category.percentage} className="h-2" />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      {completionPercentage > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Steps */}
              {completedTours.length >= 1 && (
                <motion.div
                  className="p-3 border rounded-lg bg-muted/5"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">First Steps</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Completed your first tutorial
                  </p>
                </motion.div>
              )}

              {/* Quick Learner */}
              {completedTours.length >= 3 && (
                <motion.div
                  className="p-3 border rounded-lg bg-muted/5"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="font-medium">Quick Learner</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Completed 3 tutorials
                  </p>
                </motion.div>
              )}

              {/* Master */}
              {completionPercentage === 100 && (
                <motion.div
                  className="p-3 border rounded-lg bg-muted/5 md:col-span-2"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">Nex7 Master</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Completed all tutorials! You're now ready to build amazing projects.
                  </p>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TutorialProgress;