import { prisma } from './prisma';
import { Conversation as PrismaConversation, Message as PrismaMessage, MessageRole } from '@prisma/client';

export interface Conversation {
  id: string;
  title: string;
  userId: string;
  model: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  attachments?: any;
  metadata?: any;
  createdAt: Date;
}

export async function createConversation(
  userId: string,
  title: string,
  model: string = 'claude-3-opus-20240229'
): Promise<Conversation> {
  const conversation = await prisma.conversation.create({
    data: {
      title,
      userId,
      model,
    }
  });
  
  return conversation;
}

export async function findConversationById(
  conversationId: string,
  userId: string
): Promise<Conversation | null> {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      userId,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  });
  
  return conversation;
}

export async function listUserConversations(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<Conversation[]> {
  const conversations = await prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    skip: offset,
    include: {
      messages: {
        take: 1,
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });
  
  return conversations;
}

export async function addMessage(
  conversationId: string,
  role: MessageRole,
  content: string,
  attachments?: any,
  metadata?: any
): Promise<Message> {
  const message = await prisma.message.create({
    data: {
      conversationId,
      role,
      content,
      attachments,
      metadata,
    }
  });
  
  // Update conversation's updatedAt
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() }
  });
  
  return message;
}

export async function deleteConversation(
  conversationId: string,
  userId: string
): Promise<boolean> {
  const result = await prisma.conversation.deleteMany({
    where: {
      id: conversationId,
      userId,
    }
  });
  
  return result.count > 0;
}

export async function updateConversationTitle(
  conversationId: string,
  userId: string,
  title: string
): Promise<Conversation | null> {
  try {
    const conversation = await prisma.conversation.update({
      where: {
        id: conversationId,
        userId,
      },
      data: { title }
    });
    
    return conversation;
  } catch (error) {
    return null;
  }
}