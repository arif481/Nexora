'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { useAuth } from '@/hooks/useAuth';
import {
  Search,
  Bell,
  Settings,
  User,
  Menu,
  Plus,
  Command,
  Mic,
  Sparkles,
  Moon,
  Sun,
  LogOut,
  HelpCircle,
  Keyboard,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge, CountBadge } from '../ui/Badge';

export function Header() {
  const router = useRouter();
  const { 
    toggleSidebar, 
    toggleCommandPalette, 
    toggleNotificationPanel,
    toggleQuickActions,
    theme,
    setTheme 
  } = useUIStore();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
      setShowUserMenu(false);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const notificationCount = 3; // This would come from a notification store

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-dark-950/80 border-b border-glass-border">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-xl text-white/60 hover:text-white hover:bg-glass-medium transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search Bar */}
          <div className="hidden md:flex items-center">
            <button
              onClick={toggleCommandPalette}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl',
                'backdrop-blur-md bg-glass-light border border-glass-border',
                'text-white/50 hover:text-white/70 hover:border-glass-heavy',
                'transition-all duration-200 w-64 lg:w-80'
              )}
            >
              <Search className="w-4 h-4" />
              <span className="text-sm">Search anything...</span>
              <div className="ml-auto flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-dark-800 text-xs text-white/40">⌘</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-dark-800 text-xs text-white/40">K</kbd>
              </div>
            </button>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Quick Add Button */}
          <div className="relative">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="hidden sm:flex"
            >
              Create
            </Button>
            <button
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="sm:hidden p-2 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-blue text-dark-950"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Quick Add Dropdown */}
            <AnimatePresence>
              {showQuickAdd && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowQuickAdd(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      'absolute right-0 mt-2 w-56 z-50',
                      'backdrop-blur-2xl bg-dark-800/95 border border-glass-border rounded-xl',
                      'shadow-glass-lg overflow-hidden'
                    )}
                  >
                    <div className="p-2">
                      {[
                        { label: 'New Task', icon: '✓', shortcut: 'T' },
                        { label: 'New Event', icon: '📅', shortcut: 'E' },
                        { label: 'New Note', icon: '📝', shortcut: 'N' },
                        { label: 'Journal Entry', icon: '📖', shortcut: 'J' },
                        { label: 'Quick Capture', icon: '⚡', shortcut: 'Q' },
                      ].map((item) => (
                        <button
                          key={item.label}
                          onClick={() => setShowQuickAdd(false)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/80 hover:text-white hover:bg-glass-medium transition-colors"
                        >
                          <span className="text-lg">{item.icon}</span>
                          <span className="flex-1 text-sm text-left">{item.label}</span>
                          <kbd className="px-1.5 py-0.5 rounded bg-dark-700 text-xs text-white/40">
                            {item.shortcut}
                          </kbd>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Voice Command */}
          <button className="hidden lg:flex p-2 rounded-xl text-white/50 hover:text-white hover:bg-glass-medium transition-colors">
            <Mic className="w-5 h-5" />
          </button>

          {/* AI Assistant */}
          <button className="p-2 rounded-xl text-white/50 hover:text-neon-purple hover:bg-neon-purple/10 transition-colors">
            <Sparkles className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <button
            onClick={toggleNotificationPanel}
            className="relative p-2 rounded-xl text-white/50 hover:text-white hover:bg-glass-medium transition-colors"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-neon-red text-white text-xs font-bold">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hidden lg:flex p-2 rounded-xl text-white/50 hover:text-white hover:bg-glass-medium transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-glass-medium transition-colors"
            >
              <Avatar
                src={user?.photoURL || undefined}
                name={user?.displayName || 'User'}
                size="sm"
                status="online"
              />
            </button>

            {/* User Menu Dropdown */}
            <AnimatePresence>
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      'absolute right-0 mt-2 w-64 z-50',
                      'backdrop-blur-2xl bg-dark-800/95 border border-glass-border rounded-xl',
                      'shadow-glass-lg overflow-hidden'
                    )}
                  >
                    {/* User Info */}
                    <div className="p-4 border-b border-glass-border">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={user?.photoURL || undefined}
                          name={user?.displayName || 'User'}
                          size="md"
                          status="online"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {user?.displayName || 'User'}
                          </p>
                          <p className="text-xs text-white/50 truncate">
                            {user?.email || ''}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Badge variant="cyan" size="sm">Free Plan</Badge>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      {[
                        { label: 'Profile', icon: User, href: '/profile' },
                        { label: 'Settings', icon: Settings, href: '/settings' },
                        { label: 'Keyboard Shortcuts', icon: Keyboard, onClick: toggleCommandPalette },
                        { label: 'Help & Support', icon: HelpCircle, href: '/help' },
                      ].map((item) => (
                        <button
                          key={item.label}
                          onClick={() => {
                            setShowUserMenu(false);
                            item.onClick?.();
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-glass-medium transition-colors"
                        >
                          <item.icon className="w-4 h-4" />
                          <span className="text-sm">{item.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Sign Out */}
                    <div className="p-2 border-t border-glass-border">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-neon-red/80 hover:text-neon-red hover:bg-neon-red/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
