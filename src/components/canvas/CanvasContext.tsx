'use client';

import { createContext } from 'react';

interface CanvasContextType {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export const CanvasContext = createContext<CanvasContextType | null>(null);