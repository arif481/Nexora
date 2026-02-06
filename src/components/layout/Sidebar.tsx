'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { useTaskStats } from '@/hooks/useTasks';
import {
  Home,
  CheckSquare,
  Calendar,
  FileText,
  BookOpen,
  Target,
  Brain,
  Heart,
  Wallet,
  MessageSquare,
  Settings,
  Search,
  Bell,
  User,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  GraduationCap,
  TrendingUp,
  Zap,
  Menu,
  X,
} from 'lucide-react';
import { Badge, CountBadge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: 'tasks'; // Key to look up dynamic badge value
  isNew?: boolean;
}

const mainNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, badgeKey: 'tasks' },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Notes', href: '/notes', icon: FileText },
  { name: 'Journal', href: '/journal', icon: BookOpen },
];

const productivityItems: NavItem[] = [
  { name: 'Habits', href: '/habits', icon: Target },
  { name: 'Focus Mode', href: '/focus', icon: Brain },
  { name: 'Study', href: '/study', icon: GraduationCap },
  { name: 'Goals', href: '/goals', icon: TrendingUp, isNew: true },
];

const wellnessItems: NavItem[] = [
  { name: 'Wellness', href: '/wellness', icon: Heart },
];

const otherItems: NavItem[] = [
  { name: 'Finance', href: '/finance', icon: Wallet },
  { name: 'AI Assistant', href: '/ai', icon: Sparkles },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapsed, sidebarOpen, setSidebarOpen } = useUIStore();
  const taskStats = useTaskStats();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Dynamic badge values
  const badgeValues = useMemo(() => ({
    tasks: taskStats.pending + taskStats.inProgress,
  }), [taskStats.pending, taskStats.inProgress]);

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;
    const badgeCount = item.badgeKey ? badgeValues[item.badgeKey] : undefined;

    const content = (
      <Link
        href={item.href}
        onMouseEnter={() => setHoveredItem(item.name)}
        onMouseLeave={() => setHoveredItem(null)}
        className={cn(
          'relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
          'group',
          isActive
            ? 'bg-neon-cyan/10 text-neon-cyan'
            : 'text-white/60 hover:text-white hover:bg-glass-medium'
        )}
      >
        {/* Active indicator */}
        {isActive && (
          <motion.div
            layoutId="activeNav"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-neon-cyan rounded-r-full"
            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
          />
        )}

        <Icon className={cn(
          'w-5 h-5 flex-shrink-0 transition-colors',
          isActive ? 'text-neon-cyan' : 'text-white/50 group-hover:text-white'
        )} />

        {!sidebarCollapsed && (
          <>
            <span className="flex-1 text-sm font-medium truncate">{item.name}</span>
            {badgeCount !== undefined && badgeCount > 0 && <CountBadge count={badgeCount} />}
            {item.isNew && <Badge variant="purple" size="sm">New</Badge>}
          </>
        )}

        {/* Glow effect on hover */}
        {hoveredItem === item.name && !isActive && (
          <motion.div
            layoutId="hoverGlow"
            className="absolute inset-0 bg-glass-medium rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ zIndex: -1 }}
          />
        )}
      </Link>
    );

    if (sidebarCollapsed) {
      return (
        <Tooltip content={item.name} side="right">
          {content}
        </Tooltip>
      );
    }

    return content;
  };

  const NavSection = ({ title, items }: { title: string; items: NavItem[] }) => (
    <div className="mb-6">
      {!sidebarCollapsed && (
        <h3 className="px-3 mb-2 text-xs font-semibold text-white/30 uppercase tracking-wider">
          {title}
        </h3>
      )}
      <nav className="space-y-1">
        {items.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-dark-900/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarCollapsed ? 80 : 280,
          x: sidebarOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024) ? -280 : 0,
        }}
        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
        className={cn(
          'fixed left-0 top-0 h-screen z-50',
          'backdrop-blur-2xl bg-dark-900/90 border-r border-glass-border',
          'flex flex-col',
          'lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center gap-3 p-4 border-b border-glass-border',
          sidebarCollapsed ? 'justify-center' : 'px-5'
        )}>
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
            <Zap className="w-5 h-5 text-dark-950" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple opacity-50 blur-lg" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-white">Nexora</h1>
              <p className="text-xs text-white/40">AI Life OS</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
          <NavSection title="Main" items={mainNavItems} />
          <NavSection title="Productivity" items={productivityItems} />
          <NavSection title="Wellness" items={wellnessItems} />
          <NavSection title="Other" items={otherItems} />
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-glass-border">
          {/* AI Quick Access */}
          {!sidebarCollapsed && (
            <Link
              href="/ai"
              className="block mb-3 p-3 rounded-xl bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 border border-neon-cyan/20 hover:border-neon-cyan/40 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-neon-cyan" />
                <span className="text-sm font-medium text-white">AI Assistant</span>
              </div>
              <p className="text-xs text-white/50">Get personalized suggestions</p>
            </Link>
          )}

          {/* Settings Link */}
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
              'text-white/60 hover:text-white hover:bg-glass-medium',
              pathname === '/settings' && 'bg-neon-cyan/10 text-neon-cyan'
            )}
          >
            <Settings className="w-5 h-5" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Settings</span>}
          </Link>

          {/* Collapse Button */}
          <button
            onClick={toggleSidebarCollapsed}
            className={cn(
              'hidden lg:flex items-center justify-center mt-2 w-full py-2 rounded-xl',
              'text-white/40 hover:text-white/60 hover:bg-glass-medium transition-colors'
            )}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </motion.aside>
    </>
  );
}

// Mobile Bottom Navigation
export function MobileNavigation() {
  const pathname = usePathname();

  const mobileNavItems: NavItem[] = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Notes', href: '/notes', icon: FileText },
    { name: 'AI', href: '/ai', icon: Sparkles },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden safe-bottom">
      <div className="mx-3 mb-3 px-2 py-2 rounded-2xl backdrop-blur-2xl bg-dark-900/90 border border-glass-border">
        <div className="flex items-center justify-around">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all',
                  isActive
                    ? 'text-neon-cyan'
                    : 'text-white/50 active:bg-glass-medium'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveNav"
                    className="absolute inset-0 bg-neon-cyan/10 rounded-xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <Icon className="w-5 h-5 relative z-10" />
                <span className="text-xs font-medium relative z-10">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
