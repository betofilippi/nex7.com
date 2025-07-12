import { prisma } from './prisma';
import { Session as PrismaSession } from '@prisma/client';
import crypto from 'crypto';

export interface Session {
  id: string;
  sessionToken: string;
  userId: string;
  expires: Date;
  createdAt: Date;
  updatedAt: Date;
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createSession(userId: string, expiresIn: number = 30 * 24 * 60 * 60 * 1000): Promise<Session> {
  const sessionToken = generateSessionToken();
  const expires = new Date(Date.now() + expiresIn);
  
  const session = await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
    }
  });
  
  return session;
}

export async function findSessionByToken(sessionToken: string): Promise<Session | null> {
  const session = await prisma.session.findUnique({
    where: { sessionToken }
  });
  
  if (!session) return null;
  
  // Check if session is expired
  if (session.expires < new Date()) {
    await deleteSession(session.id);
    return null;
  }
  
  return session;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await prisma.session.delete({
    where: { id: sessionId }
  });
}

export async function deleteUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId }
  });
}

export async function extendSession(sessionToken: string, expiresIn: number = 30 * 24 * 60 * 60 * 1000): Promise<Session | null> {
  const session = await findSessionByToken(sessionToken);
  if (!session) return null;
  
  const updatedSession = await prisma.session.update({
    where: { id: session.id },
    data: {
      expires: new Date(Date.now() + expiresIn),
    }
  });
  
  return updatedSession;
}

// Cleanup expired sessions
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      expires: {
        lt: new Date()
      }
    }
  });
  
  return result.count;
}