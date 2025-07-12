import { hashPassword, verifyPassword } from './password';

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  picture?: string;
  provider?: 'local' | 'google' | 'github';
  createdAt: Date;
}

// In-memory user store (replace with database in production)
const users = new Map<string, User>();

export async function createUser(
  email: string,
  password: string,
  name: string,
  provider: 'local' | 'google' | 'github' = 'local'
): Promise<User> {
  const existingUser = Array.from(users.values()).find(u => u.email === email);
  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = provider === 'local' ? await hashPassword(password) : undefined;
  
  const user: User = {
    id: crypto.randomUUID(),
    email,
    password: hashedPassword,
    name,
    provider,
    createdAt: new Date(),
  };

  users.set(user.id, user);
  return user;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const user = Array.from(users.values()).find(u => u.email === email);
  return user || null;
}

export async function findUserById(id: string): Promise<User | null> {
  return users.get(id) || null;
}

export async function validatePassword(user: User, password: string): Promise<boolean> {
  if (!user.password || user.provider !== 'local') {
    return false;
  }
  return verifyPassword(password, user.password);
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const user = users.get(id);
  if (!user) return null;
  
  const updatedUser = { ...user, ...updates };
  users.set(id, updatedUser);
  return updatedUser;
}

// OAuth user creation/update
export async function findOrCreateOAuthUser(
  email: string,
  name: string,
  provider: 'google' | 'github',
  picture?: string
): Promise<User> {
  let user = await findUserByEmail(email);
  
  if (user) {
    // Update existing user with OAuth info
    if (user.provider === 'local') {
      // User exists with local auth, link OAuth
      user = await updateUser(user.id, { picture, provider }) || user;
    }
    return user;
  }
  
  // Create new OAuth user
  return createUser(email, '', name, provider);
}