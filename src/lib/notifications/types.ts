export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationChannel = 'in-app' | 'email' | 'push' | 'webhook';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  data?: Record<string, any>;
  actions?: NotificationAction[];
  read: boolean;
  persistent: boolean;
  expiresAt?: Date;
  createdAt: Date;
  readAt?: Date;
  userId?: string;
  category?: string;
  imageUrl?: string;
  sound?: string;
}

export interface NotificationAction {
  id: string;
  label: string;
  action: string;
  url?: string;
  style?: 'primary' | 'secondary' | 'destructive';
}

export interface NotificationPreferences {
  userId: string;
  email: {
    enabled: boolean;
    types: NotificationType[];
    categories: string[];
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  };
  push: {
    enabled: boolean;
    types: NotificationType[];
    categories: string[];
    quiet_hours: {
      enabled: boolean;
      start: string; // HH:mm format
      end: string;   // HH:mm format
    };
  };
  inApp: {
    enabled: boolean;
    types: NotificationType[];
    categories: string[];
    autoHide: boolean;
    sound: boolean;
  };
  webhook: {
    enabled: boolean;
    url?: string;
    secret?: string;
    types: NotificationType[];
    categories: string[];
  };
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text?: string;
  variables: string[];
}

export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  createdAt: Date;
  lastUsed?: Date;
}