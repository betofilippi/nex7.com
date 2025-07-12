import { prisma } from './prisma';
import { AgentMemory as PrismaAgentMemory } from '@prisma/client';

export interface AgentMemory {
  id: string;
  userId: string;
  agentId: string;
  key: string;
  value: any;
  metadata?: any;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function setAgentMemory(
  userId: string,
  agentId: string,
  key: string,
  value: any,
  expiresIn?: number,
  metadata?: any
): Promise<AgentMemory> {
  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn) : null;
  
  const memory = await prisma.agentMemory.upsert({
    where: {
      userId_agentId_key: {
        userId,
        agentId,
        key,
      }
    },
    update: {
      value,
      metadata,
      expiresAt,
    },
    create: {
      userId,
      agentId,
      key,
      value,
      metadata,
      expiresAt,
    }
  });
  
  return memory;
}

export async function getAgentMemory(
  userId: string,
  agentId: string,
  key: string
): Promise<AgentMemory | null> {
  const memory = await prisma.agentMemory.findUnique({
    where: {
      userId_agentId_key: {
        userId,
        agentId,
        key,
      }
    }
  });
  
  if (!memory) return null;
  
  // Check if memory is expired
  if (memory.expiresAt && memory.expiresAt < new Date()) {
    await deleteAgentMemory(userId, agentId, key);
    return null;
  }
  
  return memory;
}

export async function getAllAgentMemory(
  userId: string,
  agentId: string
): Promise<AgentMemory[]> {
  const memories = await prisma.agentMemory.findMany({
    where: {
      userId,
      agentId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    orderBy: { updatedAt: 'desc' }
  });
  
  return memories;
}

export async function deleteAgentMemory(
  userId: string,
  agentId: string,
  key: string
): Promise<boolean> {
  try {
    await prisma.agentMemory.delete({
      where: {
        userId_agentId_key: {
          userId,
          agentId,
          key,
        }
      }
    });
    return true;
  } catch (error) {
    return false;
  }
}

export async function clearAgentMemory(
  userId: string,
  agentId: string
): Promise<number> {
  const result = await prisma.agentMemory.deleteMany({
    where: {
      userId,
      agentId,
    }
  });
  
  return result.count;
}

export async function clearAllUserAgentMemory(userId: string): Promise<number> {
  const result = await prisma.agentMemory.deleteMany({
    where: { userId }
  });
  
  return result.count;
}

// Cleanup expired memories
export async function cleanupExpiredMemories(): Promise<number> {
  const result = await prisma.agentMemory.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  });
  
  return result.count;
}

// Search memories by pattern
export async function searchAgentMemory(
  userId: string,
  agentId: string,
  keyPattern: string
): Promise<AgentMemory[]> {
  const memories = await prisma.agentMemory.findMany({
    where: {
      userId,
      agentId,
      key: {
        contains: keyPattern,
      },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    orderBy: { updatedAt: 'desc' }
  });
  
  return memories;
}