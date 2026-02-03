'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import {
  X,
  Bell,
  CheckSquare,
  Calendar,
  Sparkles,
  AlertCircle,
  Trophy,
  Heart,
  Clock,
  Settings,
  Check,
  Trash2,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface Notification {
  id: string;
  type: 'task' | 'calendar' | 'ai' | 'achievement' | 'wellness' | 'system';
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

// Mock notifications
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'ai',
    title: 'AI Insight Available',
    body: 'Based on your patterns, you\'re most productive between 9-11 AM. Consider scheduling important tasks during this time.',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    read: false,
  },
  {
    id: '2',
    type: 'task',
    title: 'Task Due Soon',
    body: '"Complete project proposal" is due in 2 hours',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: false,
  },
  {
    id: '3',
    type: 'calendar',
    title: 'Upcoming Event',
    body: 'Team standup meeting starts in 15 minutes',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    read: false,
  },
  {
    id: '4',
    type: 'achievement',
    title: 'Achievement Unlocked! 🎉',
    body: 'You\'ve completed 7 days streak! Keep up the great work.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: true,
  },
  {
    id: '5',
    type: 'wellness',
    title: 'Time for a Break',
    body: 'You\'ve been focused for 90 minutes. Consider taking a short break.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    read: true,
  },
];

const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${diffDay}d ago`;
};

export function NotificationPanel() {
  const { notificationPanelOpen, toggleNotificationPanel } = useUIStore();

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task':
        return <CheckSquare className="w-4 h-4" />;
      case 'calendar':
        return <Calendar className="w-4 h-4" />;
      case 'ai':
        return <Sparkles className="w-4 h-4" />;
      case 'achievement':
        return <Trophy className="w-4 h-4" />;
      case 'wellness':
        return <Heart className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'task':
        return 'text-neon-cyan bg-neon-cyan/10';
      case 'calendar':
        return 'text-neon-blue bg-neon-blue/10';
      case 'ai':
        return 'text-neon-purple bg-neon-purple/10';
      case 'achievement':
        return 'text-neon-yellow bg-neon-yellow/10';
      case 'wellness':
        return 'text-neon-pink bg-neon-pink/10';
      default:
        return 'text-white/60 bg-glass-medium';
    }
  };

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  return (
    <AnimatePresence>
      {notificationPanelOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm"
            onClick={toggleNotificationPanel}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'absolute right-0 top-0 h-full w-full max-w-md',
              'backdrop-blur-2xl bg-dark-200/95 border-l border-glass-border'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-glass-border">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-white">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-neon-cyan/20 text-neon-cyan text-xs font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-glass-medium transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleNotificationPanel}
                  className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-glass-medium transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-glass-border">
              <button className="text-sm text-neon-cyan hover:text-neon-cyan/80 transition-colors">
                Mark all as read
              </button>
              <button className="text-sm text-white/50 hover:text-white transition-colors">
                Clear all
              </button>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto h-[calc(100%-120px)] scrollbar-thin">
              {mockNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-glass-medium flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-white/30" />
                  </div>
                  <p className="text-white/60 font-medium">No notifications</p>
                  <p className="text-sm text-white/40 mt-1">
                    You&apos;re all caught up!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-glass-border">
                  {mockNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'p-4 hover:bg-glass-light transition-colors cursor-pointer',
                        !notification.read && 'bg-neon-cyan/5'
                      )}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                            getNotificationColor(notification.type)
                          )}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                'text-sm font-medium',
                                notification.read ? 'text-white/70' : 'text-white'
                              )}
                            >
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="w-2 h-2 rounded-full bg-neon-cyan flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-sm text-white/50 mt-1 line-clamp-2">
                            {notification.body}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-white/30 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getRelativeTime(notification.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3 ml-11">
                        {!notification.read && (
                          <button className="text-xs text-neon-cyan hover:text-neon-cyan/80 transition-colors flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Mark as read
                          </button>
                        )}
                        <button className="text-xs text-white/40 hover:text-neon-red transition-colors flex items-center gap-1">
                          <Trash2 className="w-3 h-3" />
                          Dismiss
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
