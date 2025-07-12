'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, AlertCircle, Loader2, GitBranch, Package, Rocket, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface PipelineStage {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  duration?: number;
  message?: string;
  logs?: string[];
}

interface DeploymentPipelineProps {
  stages: PipelineStage[];
  onStageClick?: (stage: PipelineStage) => void;
  className?: string;
}

const stageIcons = {
  'source': GitBranch,
  'build': Package,
  'test': Shield,
  'deploy': Rocket,
};

const DeploymentPipeline: React.FC<DeploymentPipelineProps> = ({
  stages,
  onStageClick,
  className
}) => {
  const [celebrationActive, setCelebrationActive] = useState(false);

  useEffect(() => {
    const allSuccess = stages.every(stage => stage.status === 'success');
    if (allSuccess && stages.length > 0) {
      setCelebrationActive(true);
      setTimeout(() => setCelebrationActive(false), 3000);
    }
  }, [stages]);

  const getStageIcon = (stage: PipelineStage) => {
    const IconComponent = stageIcons[stage.id as keyof typeof stageIcons] || Circle;
    
    switch (stage.status) {
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'running':
        return <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />;
      default:
        return <IconComponent className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStageAnimation = (stage: PipelineStage) => {
    if (stage.status === 'error') {
      return {
        x: [0, -5, 5, -5, 5, 0],
        transition: { duration: 0.5, repeat: 2 }
      };
    }
    if (stage.status === 'running') {
      return {
        scale: [1, 1.1, 1],
        transition: { duration: 1, repeat: Infinity }
      };
    }
    return {};
  };

  const getProgressPercentage = () => {
    const completedStages = stages.filter(s => s.status === 'success').length;
    return (completedStages / stages.length) * 100;
  };

  return (
    <div className={cn("relative", className)}>
      {/* 3D Pipeline Container */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 shadow-2xl overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
        
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 via-transparent to-transparent" />

        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-700">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${getProgressPercentage()}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Pipeline Stages */}
        <div className="relative z-10 flex justify-between items-center">
          {stages.map((stage, index) => (
            <React.Fragment key={stage.id}>
              {/* Stage Node */}
              <motion.div
                className="relative group"
                animate={getStageAnimation(stage)}
                onClick={() => onStageClick?.(stage)}
              >
                {/* 3D Card Effect */}
                <div
                  className={cn(
                    "relative transform-gpu transition-all duration-300",
                    "hover:scale-110 hover:-translate-y-2",
                    onStageClick && "cursor-pointer"
                  )}
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: 'perspective(1000px) rotateX(10deg)',
                  }}
                >
                  {/* Stage Background */}
                  <div
                    className={cn(
                      "relative bg-gradient-to-br rounded-xl p-6 shadow-lg",
                      "border border-gray-700 backdrop-blur-sm",
                      stage.status === 'success' && "from-green-900/50 to-green-800/50 border-green-600",
                      stage.status === 'error' && "from-red-900/50 to-red-800/50 border-red-600",
                      stage.status === 'running' && "from-blue-900/50 to-blue-800/50 border-blue-600",
                      stage.status === 'pending' && "from-gray-800/50 to-gray-700/50",
                    )}
                  >
                    {/* Glow Effect for Active Stage */}
                    {stage.status === 'running' && (
                      <div className="absolute inset-0 rounded-xl bg-blue-500/20 blur-xl animate-pulse" />
                    )}

                    {/* Stage Icon */}
                    <div className="relative z-10 flex flex-col items-center space-y-2">
                      {getStageIcon(stage)}
                      <span className="text-sm font-medium text-gray-200">{stage.name}</span>
                      {stage.duration && (
                        <span className="text-xs text-gray-400">{stage.duration}ms</span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="absolute -top-2 -right-2">
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full",
                          stage.status === 'success' && "bg-green-500",
                          stage.status === 'error' && "bg-red-500",
                          stage.status === 'running' && "bg-blue-500 animate-pulse",
                          stage.status === 'pending' && "bg-gray-500"
                        )}
                      />
                    </div>
                  </div>

                  {/* Stage Message Tooltip */}
                  {stage.message && (
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                        {stage.message}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Connection Line */}
              {index < stages.length - 1 && (
                <div className="relative flex-1 mx-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-0.5 bg-gray-700" />
                  </div>
                  {/* Animated Progress Line */}
                  {stages[index].status === 'success' && (
                    <motion.div
                      className="absolute inset-0 flex items-center"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      style={{ transformOrigin: 'left' }}
                    >
                      <div className="w-full h-0.5 bg-gradient-to-r from-green-500 to-blue-500" />
                    </motion.div>
                  )}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Celebration Animation */}
        <AnimatePresence>
          {celebrationActive && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full"
                  initial={{
                    x: '50%',
                    y: '50%',
                    scale: 0
                  }}
                  animate={{
                    x: `${Math.random() * 100}%`,
                    y: `${Math.random() * 100}%`,
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.1,
                    ease: "easeOut"
                  }}
                />
              ))}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              >
                <span className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  Deployment Successful!
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DeploymentPipeline;