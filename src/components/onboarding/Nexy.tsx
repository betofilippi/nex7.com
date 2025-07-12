'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface NexyProps {
  size?: number;
  emotion?: 'happy' | 'thinking' | 'excited' | 'waving';
  className?: string;
}

const Nexy: React.FC<NexyProps> = ({ size = 80, emotion = 'happy', className = '' }) => {
  const emotions = {
    happy: {
      eyes: 'M35,35 Q40,40 45,35',
      mouth: 'M30,55 Q40,65 50,55',
    },
    thinking: {
      eyes: 'M35,35 L45,35',
      mouth: 'M35,55 L45,55',
    },
    excited: {
      eyes: 'M35,30 Q40,35 45,30',
      mouth: 'M25,55 Q40,70 55,55',
    },
    waving: {
      eyes: 'M35,35 Q40,40 45,35',
      mouth: 'M30,55 Q40,65 50,55',
    },
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      className={className}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      {/* Body */}
      <motion.circle
        cx="40"
        cy="40"
        r="35"
        fill="url(#nexyGradient)"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      />

      {/* Inner glow */}
      <circle cx="40" cy="40" r="30" fill="url(#innerGlow)" opacity="0.5" />

      {/* Eyes */}
      <motion.path
        d={emotions[emotion].eyes}
        stroke="#333"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      />

      {/* Mouth */}
      <motion.path
        d={emotions[emotion].mouth}
        stroke="#333"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      />

      {/* Antenna */}
      <motion.g
        initial={{ y: 5 }}
        animate={{ y: 0 }}
        transition={{
          repeat: Infinity,
          repeatType: 'reverse',
          duration: 2,
          ease: 'easeInOut',
        }}
      >
        <line x1="40" y1="5" x2="40" y2="15" stroke="#666" strokeWidth="2" />
        <circle cx="40" cy="5" r="4" fill="#9333ea" />
      </motion.g>

      {/* Waving hand (if emotion is waving) */}
      {emotion === 'waving' && (
        <motion.g
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, -20, 0, 20, 0] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 2,
          }}
          style={{ transformOrigin: '65px 45px' }}
        >
          <ellipse cx="65" cy="45" rx="8" ry="15" fill="url(#nexyGradient)" />
          <circle cx="65" cy="55" r="6" fill="url(#nexyGradient)" />
        </motion.g>
      )}

      {/* Gradients */}
      <defs>
        <linearGradient id="nexyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <radialGradient id="innerGlow">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </radialGradient>
      </defs>
    </motion.svg>
  );
};

export default Nexy;