'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Tabs Context
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
};

// Tabs Root
interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeTab = value ?? internalValue;

  const setActiveTab = (newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

// Tabs List
interface TabsListProps {
  children: ReactNode;
  variant?: 'default' | 'pills' | 'underline';
  className?: string;
}

export function TabsList({ children, variant = 'default', className }: TabsListProps) {
  const variantStyles = {
    default: 'p-1 bg-dark-300 rounded-xl border border-glass-border',
    pills: 'gap-2',
    underline: 'border-b border-glass-border gap-1',
  };

  return (
    <div
      className={cn(
        'flex items-center',
        variantStyles[variant],
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  );
}

// Tabs Trigger
interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  variant?: 'default' | 'pills' | 'underline';
  disabled?: boolean;
  className?: string;
}

export function TabsTrigger({
  value,
  children,
  variant = 'default',
  disabled = false,
  className,
}: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  const variantStyles = {
    default: cn(
      'relative px-4 py-2 text-sm font-medium rounded-lg transition-colors',
      isActive
        ? 'text-white'
        : 'text-white/60 hover:text-white/80',
      disabled && 'opacity-50 cursor-not-allowed'
    ),
    pills: cn(
      'px-4 py-2 text-sm font-medium rounded-full transition-all',
      isActive
        ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
        : 'text-white/60 hover:text-white/80 border border-transparent',
      disabled && 'opacity-50 cursor-not-allowed'
    ),
    underline: cn(
      'relative px-4 py-3 text-sm font-medium transition-colors',
      isActive
        ? 'text-neon-cyan'
        : 'text-white/60 hover:text-white/80',
      disabled && 'opacity-50 cursor-not-allowed'
    ),
  };

  return (
    <button
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => !disabled && setActiveTab(value)}
      className={cn(variantStyles[variant], className)}
    >
      {children}
      {variant === 'default' && isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-glass-heavy rounded-lg"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
          style={{ zIndex: -1 }}
        />
      )}
      {variant === 'underline' && isActive && (
        <motion.div
          layoutId="activeTabUnderline"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-cyan"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
          style={{ boxShadow: '0 0 10px var(--neon-cyan)' }}
        />
      )}
    </button>
  );
}

// Tabs Content
interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { activeTab } = useTabsContext();

  if (activeTab !== value) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      role="tabpanel"
      className={cn('mt-4', className)}
    >
      {children}
    </motion.div>
  );
}
