'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Brain, Sparkles, Target, MessageCircle } from 'lucide-react';
import { Agent } from '../../lib/agents/definitions';
import { AgentAvatar } from './AgentAvatar';
import { Progress } from '../ui/progress';

interface AgentPersonalityProps {
  agent: Agent;
  mood?: string;
  confidence?: number;
  messageCount?: number;
  showDetails?: boolean;
}

interface PersonalityTraitProps {
  trait: string;
  color: string;
}

const PersonalityTrait: React.FC<PersonalityTraitProps> = ({ trait, color }) => {
  return (
    <motion.div
      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
      style={{
        backgroundColor: color + '20',
        color: color
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {trait}
    </motion.div>
  );
};

export const AgentPersonality: React.FC<AgentPersonalityProps> = ({
  agent,
  mood = 'neutral',
  confidence = 0.8,
  messageCount = 0,
  showDetails = true
}) => {
  const [currentMood, setCurrentMood] = useState(mood);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  useEffect(() => {
    if (mood !== currentMood) {
      setPulseAnimation(true);
      setCurrentMood(mood);
      setTimeout(() => setPulseAnimation(false), 1000);
    }
  }, [mood, currentMood]);

  const getMoodIcon = () => {
    switch (currentMood) {
      case 'happy':
      case 'excited':
        return <Sparkles className="w-4 h-4" />;
      case 'thinking':
      case 'focused':
        return <Brain className="w-4 h-4" />;
      case 'helpful':
      case 'supportive':
        return <Heart className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getMoodColor = () => {
    switch (currentMood) {
      case 'happy':
      case 'excited':
        return '#FBBF24'; // yellow
      case 'thinking':
      case 'focused':
        return '#8B5CF6'; // purple
      case 'helpful':
      case 'supportive':
        return '#EC4899'; // pink
      default:
        return agent.color;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header with Avatar and Status */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          <AgentAvatar
            agent={agent}
            size="lg"
            mood={currentMood}
            isActive={true}
          />
          <div>
            <h3 className="text-xl font-semibold" style={{ color: agent.color }}>
              {agent.name}
            </h3>
            <p className="text-sm text-gray-600">{agent.role}</p>
            
            {/* Current Mood */}
            <motion.div
              className="flex items-center space-x-2 mt-2"
              animate={pulseAnimation ? { scale: [1, 1.1, 1] } : {}}
            >
              <div style={{ color: getMoodColor() }}>
                {getMoodIcon()}
              </div>
              <span 
                className="text-sm font-medium capitalize"
                style={{ color: getMoodColor() }}
              >
                {currentMood}
              </span>
            </motion.div>
          </div>
        </div>
        
        {/* Activity Indicator */}
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color: agent.color }}>
            {messageCount}
          </div>
          <div className="text-xs text-gray-500">messages</div>
        </div>
      </div>

      {showDetails && (
        <>
          {/* Confidence Level */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Confidence</span>
              <span className="text-sm text-gray-600">{Math.round(confidence * 100)}%</span>
            </div>
            <Progress 
              value={confidence * 100} 
              className="h-2"
              style={{ 
                backgroundColor: agent.color + '20',
              }}
            />
          </div>

          {/* Personality Traits */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Personality Traits</h4>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {agent.personality.traits.map((trait, index) => (
                  <motion.div
                    key={trait}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <PersonalityTrait trait={trait} color={agent.color} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Speaking Style */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Speaking Style</h4>
            <p className="text-sm text-gray-600 italic">
              &ldquo;{agent.personality.speakingStyle}&rdquo;
            </p>
          </div>

          {/* Primary Goal */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-4 h-4" style={{ color: agent.color }} />
              <h4 className="text-sm font-medium text-gray-700">Primary Goal</h4>
            </div>
            <p className="text-sm text-gray-600">
              {agent.personality.primaryGoal}
            </p>
          </div>

          {/* Emotional Range */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Emotional Range</h4>
            <div className="grid grid-cols-2 gap-2">
              {agent.personality.emotionalRange.map((emotion) => (
                <motion.div
                  key={emotion}
                  className={`
                    text-center py-2 px-3 rounded-lg text-sm
                    ${emotion === currentMood ? 'font-medium' : ''}
                  `}
                  style={{
                    backgroundColor: emotion === currentMood ? agent.color + '20' : 'transparent',
                    color: emotion === currentMood ? agent.color : '#6B7280',
                    border: `1px solid ${emotion === currentMood ? agent.color : '#E5E7EB'}`
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {emotion}
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};