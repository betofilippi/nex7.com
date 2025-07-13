export interface Conversation {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: Date;
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  return [];
}

export async function getConversationById(id: string): Promise<Conversation | null> {
  return null;
}

export async function createConversation(data: {
  userId: string;
  title: string;
}): Promise<Conversation> {
  return {
    id: Math.random().toString(36).substr(2, 9),
    userId: data.userId,
    title: data.title,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function addMessage(
  conversationId: string,
  message: { content: string; role: 'user' | 'assistant' }
): Promise<Message> {
  return {
    id: Math.random().toString(36).substr(2, 9),
    conversationId,
    content: message.content,
    role: message.role,
    createdAt: new Date(),
  };
}
