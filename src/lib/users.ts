export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  // Simplified implementation
  return null;
}

export async function createUser(data: {
  email: string;
  name?: string;
  image?: string;
}): Promise<User> {
  return {
    id: Math.random().toString(36).substr(2, 9),
    email: data.email,
    name: data.name,
    image: data.image,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function getUserById(id: string): Promise<User | null> {
  return null;
}
