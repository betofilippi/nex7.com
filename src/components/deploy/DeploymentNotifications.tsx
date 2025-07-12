'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Mail, MessageSquare, Smartphone, Volume2, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { cn } from '../../lib/utils';
import { useToast } from '../../hooks/use-toast';

interface NotificationChannel {
  id: string;
  name: string;
  icon: React.ElementType;
  enabled: boolean;
  config?: Record<string, unknown>;
}

interface NotificationEvent {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  channel?: string;
  read?: boolean;
}

interface DeploymentNotificationsProps {
  onChannelUpdate?: (channel: NotificationChannel) => void;
  className?: string;
}

const DeploymentNotifications: React.FC<DeploymentNotificationsProps> = ({
  onChannelUpdate,
  className
}) => {
  const { toast } = useToast();
  const [channels, setChannels] = useState<NotificationChannel[]>([
    { id: 'in-app', name: 'In-App Notifications', icon: Bell, enabled: true },
    { id: 'browser', name: 'Browser Push', icon: Volume2, enabled: false },
    { id: 'email', name: 'Email', icon: Mail, enabled: false, config: { email: '' } },
    { id: 'sms', name: 'SMS', icon: Smartphone, enabled: false, config: { phone: '' } },
    { id: 'slack', name: 'Slack', icon: MessageSquare, enabled: false, config: { webhook: '' } },
  ]);

  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Request browser notification permission
  useEffect(() => {
    const browserChannel = channels.find(c => c.id === 'browser');
    if (browserChannel?.enabled && 'Notification' in window) {
      Notification.requestPermission();
    }
  }, [channels]);

  // Update unread count
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const toggleChannel = (channelId: string) => {
    setChannels(prev => {
      const updated = prev.map(channel =>
        channel.id === channelId
          ? { ...channel, enabled: !channel.enabled }
          : channel
      );
      
      const updatedChannel = updated.find(c => c.id === channelId);
      if (updatedChannel && onChannelUpdate) {
        onChannelUpdate(updatedChannel);
      }
      
      return updated;
    });
  };

  const updateChannelConfig = (channelId: string, config: Record<string, unknown>) => {
    setChannels(prev => prev.map(channel =>
      channel.id === channelId
        ? { ...channel, config: { ...channel.config, ...config } }
        : channel
    ));
  };

  const sendNotification = useCallback((event: Omit<NotificationEvent, 'id' | 'timestamp'>) => {
    const notification: NotificationEvent = {
      ...event,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [notification, ...prev]);

    // Send through enabled channels
    channels.forEach(channel => {
      if (!channel.enabled) return;

      switch (channel.id) {
        case 'in-app':
          toast({
            title: notification.title,
            description: notification.message,
            variant: notification.type === 'error' ? 'destructive' : 'default'
          });
          break;

        case 'browser':
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico',
              badge: '/favicon.ico'
            });
          }
          break;

        // Other channels would be implemented with actual API calls
        case 'email':
        case 'sms':
        case 'slack':
          console.log(`Would send ${channel.id} notification:`, notification);
          break;
      }
    });
  }, [channels, toast]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: NotificationEvent['type']) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'error': return XCircle;
      case 'warning': return AlertCircle;
      default: return Info;
    }
  };

  const getNotificationColor = (type: NotificationEvent['type']) => {
    switch (type) {
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      default: return 'text-blue-500';
    }
  };

  // Simulate deployment notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const events = [
        { type: 'success' as const, title: 'Build Completed', message: 'Your application has been built successfully.' },
        { type: 'info' as const, title: 'Deployment Started', message: 'Deploying to production environment...' },
        { type: 'warning' as const, title: 'High Memory Usage', message: 'Memory usage exceeded 80% during build.' },
        { type: 'error' as const, title: 'Test Failed', message: 'Unit tests failed in the CI pipeline.' },
      ];

      if (Math.random() > 0.7) {
        const event = events[Math.floor(Math.random() * events.length)];
        sendNotification(event);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [sendNotification]);

  return (
    <div className={cn("space-y-6", className)}>
      <Tabs defaultValue="settings">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings">Notification Settings</TabsTrigger>
          <TabsTrigger value="history" className="relative">
            History
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
              >
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-100">Notification Channels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {channels.map((channel) => (
                <div key={channel.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <channel.icon className="w-5 h-5 text-gray-400" />
                      <Label htmlFor={channel.id} className="text-gray-200">
                        {channel.name}
                      </Label>
                    </div>
                    <Switch
                      id={channel.id}
                      checked={channel.enabled}
                      onCheckedChange={() => toggleChannel(channel.id)}
                    />
                  </div>

                  {/* Channel-specific configuration */}
                  <AnimatePresence>
                    {channel.enabled && channel.config && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="ml-8 space-y-2"
                      >
                        {channel.id === 'email' && (
                          <Input
                            type="email"
                            placeholder="Enter email address"
                            value={channel.config.email || ''}
                            onChange={(e) => updateChannelConfig(channel.id, { email: e.target.value })}
                            className="bg-gray-800 border-gray-700"
                          />
                        )}
                        {channel.id === 'sms' && (
                          <Input
                            type="tel"
                            placeholder="Enter phone number"
                            value={channel.config.phone || ''}
                            onChange={(e) => updateChannelConfig(channel.id, { phone: e.target.value })}
                            className="bg-gray-800 border-gray-700"
                          />
                        )}
                        {channel.id === 'slack' && (
                          <Input
                            type="url"
                            placeholder="Enter Slack webhook URL"
                            value={channel.config.webhook || ''}
                            onChange={(e) => updateChannelConfig(channel.id, { webhook: e.target.value })}
                            className="bg-gray-800 border-gray-700"
                          />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Test Notifications */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-100">Test Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => sendNotification({
                    type: 'success',
                    title: 'Test Success',
                    message: 'This is a test success notification.'
                  })}
                >
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  Test Success
                </Button>
                <Button
                  variant="outline"
                  onClick={() => sendNotification({
                    type: 'error',
                    title: 'Test Error',
                    message: 'This is a test error notification.'
                  })}
                >
                  <XCircle className="w-4 h-4 mr-2 text-red-500" />
                  Test Error
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-100">Recent Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
              >
                Mark all as read
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <AnimatePresence>
              {notifications.length === 0 ? (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="py-8 text-center">
                    <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No notifications yet</p>
                  </CardContent>
                </Card>
              ) : (
                notifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => markAsRead(notification.id)}
                      className={cn(
                        "p-4 rounded-lg border cursor-pointer transition-all",
                        notification.read
                          ? "bg-gray-900 border-gray-800"
                          : "bg-gray-800 border-gray-700"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={cn("w-5 h-5 mt-0.5", getNotificationColor(notification.type))} />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-gray-100">{notification.title}</h4>
                            <span className="text-xs text-gray-500">
                              {new Date(notification.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">{notification.message}</p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeploymentNotifications;