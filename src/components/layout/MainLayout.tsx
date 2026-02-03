'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { Sidebar, MobileNavigation } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from '../features/CommandPalette';
import { NotificationPanel } from '../features/NotificationPanel';
import { AIAssistantPanel } from '../features/AIAssistantPanel';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { sidebarCollapsed, focusModeActive } = useUIStore();

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Grid Pattern */}
        <div className="absolute inset-0 grid-background opacity-30" />
        
        {/* Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-neon-cyan/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-neon-purple/5 rounded-full blur-[100px]" />
        
        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-dark-950/50" />
      </div>

      {/* Sidebar */}
      {!focusModeActive && <Sidebar />}

      {/* Main Content Area */}
      <motion.main
        initial={false}
        animate={{
          marginLeft: focusModeActive ? 0 : (sidebarCollapsed ? 80 : 280),
        }}
        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
        className="min-h-screen flex flex-col lg:ml-0"
      >
        {/* Header */}
        {!focusModeActive && <Header />}

        {/* Page Content */}
        <div className="flex-1 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4 lg:p-6 pb-24 lg:pb-6"
          >
            {children}
          </motion.div>
        </div>
      </motion.main>

      {/* Mobile Bottom Navigation */}
      {!focusModeActive && <MobileNavigation />}

      {/* Command Palette */}
      <CommandPalette />

      {/* Notification Panel */}
      <NotificationPanel />

      {/* AI Assistant Panel */}
      <AIAssistantPanel />
    </div>
  );
}

// Page Container with consistent styling
interface PageContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageContainer({
  children,
  title,
  subtitle,
  actions,
  className,
}: PageContainerProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {title && (
              <h1 className="text-2xl lg:text-3xl font-bold text-white">{title}</h1>
            )}
            {subtitle && (
              <p className="mt-1 text-white/50">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3">{actions}</div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

// Section Container
interface SectionProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function Section({
  children,
  title,
  subtitle,
  action,
  className,
}: SectionProps) {
  return (
    <section className={cn('space-y-4', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h2 className="text-lg font-semibold text-white">{title}</h2>
            )}
            {subtitle && (
              <p className="text-sm text-white/50">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
