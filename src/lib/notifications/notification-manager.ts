import { 
  Notification, 
  NotificationPreferences, 
  NotificationType, 
  NotificationPriority,
  NotificationChannel 
} from './types';
import { EmailService } from './email-service';
import { PushService } from './push-service';
import { WebhookService } from './webhook-service';

export class NotificationManager {
  private notifications: Map<string, Notification> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();
  private emailService: EmailService;
  private pushService: PushService;
  private webhookService: WebhookService;
  private storageKey = 'nex7:notifications';
  private preferencesKey = 'nex7:notification-preferences';

  constructor() {
    this.emailService = new EmailService();
    this.pushService = new PushService();
    this.webhookService = new WebhookService();
    this.loadFromStorage();
  }

  async createNotification(
    notification: Omit<Notification, 'id' | 'read' | 'createdAt' | 'readAt'>
  ): Promise<Notification> {
    const fullNotification: Notification = {
      id: this.generateId(),
      read: false,
      createdAt: new Date(),
      ...notification,
    };

    this.notifications.set(fullNotification.id, fullNotification);
    this.saveToStorage();

    // Send to appropriate channels
    await this.sendNotification(fullNotification);

    // Emit event
    this.emitNotificationEvent('created', fullNotification);

    return fullNotification;
  }

  async sendNotification(notification: Notification): Promise<void> {
    const userId = notification.userId || 'default';
    const userPrefs = this.preferences.get(userId);

    if (!userPrefs) {
      // Send to in-app only if no preferences
      if (notification.channels.includes('in-app')) {
        this.showInAppNotification(notification);
      }
      return;
    }

    // Send to each requested channel based on preferences
    const sendPromises = notification.channels.map(async (channel) => {
      try {
        switch (channel) {
          case 'in-app':
            if (this.shouldSendToChannel(userPrefs.inApp, notification)) {
              this.showInAppNotification(notification);
            }
            break;
          case 'email':
            if (this.shouldSendToChannel(userPrefs.email, notification)) {
              await this.emailService.sendNotification(notification, userPrefs.email);
            }
            break;
          case 'push':
            if (this.shouldSendToChannel(userPrefs.push, notification)) {
              await this.pushService.sendNotification(notification, userPrefs.push);
            }
            break;
          case 'webhook':
            if (this.shouldSendToChannel(userPrefs.webhook, notification)) {
              await this.webhookService.sendNotification(notification, userPrefs.webhook);
            }
            break;
        }
      } catch (error) {
        console.error(`Failed to send notification via ${channel}:`, error);
      }
    });

    await Promise.allSettled(sendPromises);
  }

  private shouldSendToChannel(
    channelPrefs: any,
    notification: Notification
  ): boolean {
    if (!channelPrefs.enabled) return false;
    
    if (!channelPrefs.types.includes(notification.type)) return false;
    
    if (notification.category && channelPrefs.categories?.length > 0) {
      if (!channelPrefs.categories.includes(notification.category)) return false;
    }

    return true;
  }

  private showInAppNotification(notification: Notification): void {
    // Emit event for in-app display
    this.emitNotificationEvent('show', notification);
  }

  getNotifications(userId?: string): Notification[] {
    const allNotifications = Array.from(this.notifications.values());
    
    if (userId) {
      return allNotifications.filter(n => n.userId === userId);
    }
    
    return allNotifications;
  }

  getUnreadNotifications(userId?: string): Notification[] {
    return this.getNotifications(userId).filter(n => !n.read);
  }

  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification && !notification.read) {
      notification.read = true;
      notification.readAt = new Date();
      this.saveToStorage();
      this.emitNotificationEvent('read', notification);
    }
  }

  async markAllAsRead(userId?: string): Promise<void> {
    const notifications = this.getNotifications(userId);
    const unreadNotifications = notifications.filter(n => !n.read);
    
    for (const notification of unreadNotifications) {
      notification.read = true;
      notification.readAt = new Date();
    }
    
    this.saveToStorage();
    
    for (const notification of unreadNotifications) {
      this.emitNotificationEvent('read', notification);
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      this.notifications.delete(notificationId);
      this.saveToStorage();
      this.emitNotificationEvent('deleted', notification);
    }
  }

  async clearNotifications(userId?: string): Promise<void> {
    const notificationsToDelete = this.getNotifications(userId);
    
    for (const notification of notificationsToDelete) {
      this.notifications.delete(notification.id);
    }
    
    this.saveToStorage();
    
    for (const notification of notificationsToDelete) {
      this.emitNotificationEvent('deleted', notification);
    }
  }

  async clearExpiredNotifications(): Promise<void> {
    const now = new Date();
    const expiredNotifications = Array.from(this.notifications.values())
      .filter(n => n.expiresAt && n.expiresAt < now);
    
    for (const notification of expiredNotifications) {
      this.notifications.delete(notification.id);
    }
    
    if (expiredNotifications.length > 0) {
      this.saveToStorage();
    }
  }

  getPreferences(userId: string): NotificationPreferences | undefined {
    return this.preferences.get(userId);
  }

  async updatePreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    const current = this.preferences.get(userId) || this.getDefaultPreferences(userId);
    const updated = { ...current, ...preferences };
    
    this.preferences.set(userId, updated);
    this.savePreferences();
    
    this.emitNotificationEvent('preferences-updated', { userId, preferences: updated });
  }

  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      email: {
        enabled: true,
        types: ['info', 'success', 'warning', 'error'],
        categories: [],
        frequency: 'immediate',
      },
      push: {
        enabled: true,
        types: ['warning', 'error'],
        categories: [],
        quiet_hours: {
          enabled: false,
          start: '22:00',
          end: '08:00',
        },
      },
      inApp: {
        enabled: true,
        types: ['info', 'success', 'warning', 'error'],
        categories: [],
        autoHide: true,
        sound: true,
      },
      webhook: {
        enabled: false,
        types: ['error'],
        categories: [],
      },
    };
  }

  // Quick notification methods
  async info(
    title: string, 
    message: string, 
    options?: Partial<Notification>
  ): Promise<Notification> {
    return this.createNotification({
      title,
      message,
      type: 'info',
      priority: 'medium',
      channels: ['in-app'],
      persistent: false,
      ...options,
    });
  }

  async success(
    title: string, 
    message: string, 
    options?: Partial<Notification>
  ): Promise<Notification> {
    return this.createNotification({
      title,
      message,
      type: 'success',
      priority: 'medium',
      channels: ['in-app'],
      persistent: false,
      ...options,
    });
  }

  async warning(
    title: string, 
    message: string, 
    options?: Partial<Notification>
  ): Promise<Notification> {
    return this.createNotification({
      title,
      message,
      type: 'warning',
      priority: 'high',
      channels: ['in-app', 'email'],
      persistent: true,
      ...options,
    });
  }

  async error(
    title: string, 
    message: string, 
    options?: Partial<Notification>
  ): Promise<Notification> {
    return this.createNotification({
      title,
      message,
      type: 'error',
      priority: 'urgent',
      channels: ['in-app', 'email', 'push'],
      persistent: true,
      ...options,
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadFromStorage(): void {
    try {
      const notificationsData = localStorage.getItem(this.storageKey);
      if (notificationsData) {
        const notifications = JSON.parse(notificationsData);
        this.notifications = new Map(
          notifications.map((n: Notification) => [
            n.id,
            {
              ...n,
              createdAt: new Date(n.createdAt),
              readAt: n.readAt ? new Date(n.readAt) : undefined,
              expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined,
            },
          ])
        );
      }

      const preferencesData = localStorage.getItem(this.preferencesKey);
      if (preferencesData) {
        const preferences = JSON.parse(preferencesData);
        this.preferences = new Map(preferences);
      }
    } catch (error) {
      console.error('Error loading notifications from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const notifications = Array.from(this.notifications.values());
      localStorage.setItem(this.storageKey, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications to storage:', error);
    }
  }

  private savePreferences(): void {
    try {
      const preferences = Array.from(this.preferences.entries());
      localStorage.setItem(this.preferencesKey, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving preferences to storage:', error);
    }
  }

  private emitNotificationEvent(type: string, data: any): void {
    const event = new CustomEvent(`notification-${type}`, { detail: data });
    window.dispatchEvent(event);
  }
}

// Global notification manager instance
export const notificationManager = new NotificationManager();