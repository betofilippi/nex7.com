'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Agent } from '../../lib/agents/definitions';

interface AgentAvatarProps {
  agent: Agent;
  size?: 'sm' | 'md' | 'lg';
  mood?: string;
  isActive?: boolean;
  showName?: boolean;
  onClick?: () => void;
}

const sizeClasses = {
  sm: 'w-10 h-10 text-xl',
  md: 'w-16 h-16 text-3xl',
  lg: 'w-24 h-24 text-5xl'
};

const moodAnimations = {
  happy: {
    rotate: [0, -5, 5, -5, 0],
    scale: [1, 1.1, 1],
    transition: { duration: 0.5 }
  },
  excited: {
    y: [0, -10, 0],
    rotate: [0, -10, 10, -10, 0],
    transition: { duration: 0.6, repeat: 2 }
  },
  thinking: {
    rotate: [0, 5, 0, -5, 0],
    scale: [1, 0.95, 1],
    transition: { duration: 2, repeat: Infinity }
  },
  helpful: {
    scale: [1, 1.05, 1],
    transition: { duration: 1.5, repeat: Infinity }
  },
  focused: {
    scale: [1, 0.98, 1],
    transition: { duration: 2, repeat: Infinity }
  }
};

export const AgentAvatar: React.FC<AgentAvatarProps> = ({
  agent,
  size = 'md',
  mood = 'neutral',
  isActive = false,
  showName = false,
  onClick
}) => {
  const [currentMood, setCurrentMood] = useState(mood);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setCurrentMood(mood);
  }, [mood]);

  const handleClick = () => {
    if (onClick) {
      // Add a little bounce animation on click
      setCurrentMood('excited');
      setTimeout(() => setCurrentMood(mood), 600);
      onClick();
    }
  };

  return (
    <div
      className={`relative inline-flex flex-col items-center ${onClick ? 'cursor-pointer' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <motion.div
        className={`
          ${sizeClasses[size]}
          relative rounded-full flex items-center justify-center
          transition-all duration-300
          ${isActive ? 'ring-4 ring-offset-2' : ''}
        `}
        style={{
          backgroundColor: agent.color + '20',
          borderColor: agent.color,
          borderWidth: '2px',
          borderStyle: 'solid',
          ringColor: agent.color + '40'
        }}
        animate={moodAnimations[currentMood] || {}}
        whileHover={onClick ? { scale: 1.1 } : {}}
        whileTap={onClick ? { scale: 0.95 } : {}}
      >
        <span className="select-none">{agent.avatar}</span>
        
        {/* Active indicator */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-500"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <motion.div
                className="absolute inset-0 rounded-full bg-green-400"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [1, 0, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hover effect */}
        <AnimatePresence>
          {isHovered && onClick && (
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: agent.color + '10' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Agent name */}
      {showName && (
        <motion.div
          className="mt-2 text-center"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="text-sm font-medium" style={{ color: agent.color }}>
            {agent.name}
          </div>
          <div className="text-xs text-gray-500">
            {agent.role}
          </div>
        </motion.div>
      )}

      {/* Personality indicator bubbles */}
      {isActive && agent.personality.emotionalRange.includes(currentMood) && (
        <motion.div
          className="absolute -top-2 -right-2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
        >
          <div
            className="px-2 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: agent.color }}
          >
            {currentMood}
          </div>
        </motion.div>
      )}
    </div>
  );
};