import { hashPassword, verifyPassword } from './password';
import { prisma } from './prisma';
import { User as PrismaUser } from '@prisma/client';

export interface User {
  id: string;
  email: string;
  password?: string | null;
  name: string | null;
  picture?: string | null;
  provider?: 'local' | 'google' | 'github' | null;
  createdAt: Date;
}

// Convert Prisma User to our User interface
function toDomainUser(prismaUser: PrismaUser): User {
  return {
    id: prismaUser.id,
    email: prismaUser.email,
    password: prismaUser.hashedPassword,
    name: prismaUser.name || '',
    picture: prismaUser.image,
    provider: prismaUser.provider as 'local' | 'google' | 'github' | null || 'local',
    createdAt: prismaUser.createdAt,
  };
}

export async function createUser(
  email: string,
  password: string,
  name: string,
  provider: 'local' | 'google' | 'github' = 'local'
): Promise<User> {
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });
  
  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = provider === 'local' ? await hashPassword(password) : null;
  
  const user = await prisma.user.create({
    data: {
      email,
      hashedPassword,
      name,
      provider,
    }
  });

  return toDomainUser(user);
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  return user ? toDomainUser(user) : null;
}

export async function findUserById(id: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id }
  });
  
  return user ? toDomainUser(user) : null;
}

export async function validatePassword(user: User, password: string): Promise<boolean> {
  if (!user.password || user.provider !== 'local') {
    return false;
  }
  return verifyPassword(password, user.password);
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const user = await prisma.user.update({
    where: { id },
    data: {
      email: updates.email,
      name: updates.name,
      image: updates.picture,
      provider: updates.provider,
      hashedPassword: updates.password,
    }
  });
  
  return toDomainUser(user);
}

// OAuth user creation/update
export async function findOrCreateOAuthUser(
  email: string,
  name: string,
  provider: 'google' | 'github',
  picture?: string,
  providerId?: string
): Promise<User> {
  let user = await findUserByEmail(email);
  
  if (user) {
    // Update existing user with OAuth info
    if (user.provider === 'local' || !user.provider) {
      // User exists with local auth, link OAuth
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          image: picture,
          provider,
          providerId,
        }
      });
      return toDomainUser(updatedUser);
    }
    return user;
  }
  
  // Create new OAuth user
  const newUser = await prisma.user.create({
    data: {
      email,
      name,
      provider,
      providerId,
      image: picture,
    }
  });
  
  return toDomainUser(newUser);
}