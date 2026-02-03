'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'cyan' | 'purple' | 'pink' | 'green' | 'orange' | 'red' | 'blue' | 'yellow' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  pulse = false,
  className,
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-glass-medium border-glass-border text-white/80',
    cyan: 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan',
    purple: 'bg-neon-purple/10 border-neon-purple/30 text-neon-purple',
    pink: 'bg-neon-pink/10 border-neon-pink/30 text-neon-pink',
    green: 'bg-neon-green/10 border-neon-green/30 text-neon-green',
    orange: 'bg-neon-orange/10 border-neon-orange/30 text-neon-orange',
    red: 'bg-neon-red/10 border-neon-red/30 text-neon-red',
    blue: 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue',
    yellow: 'bg-neon-yellow/10 border-neon-yellow/30 text-neon-yellow',
    outline: 'bg-transparent border-white/30 text-white/70',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const dotColors = {
    default: 'bg-white/60',
    cyan: 'bg-neon-cyan',
    purple: 'bg-neon-purple',
    pink: 'bg-neon-pink',
    green: 'bg-neon-green',
    orange: 'bg-neon-orange',
    red: 'bg-neon-red',
    blue: 'bg-neon-blue',
    yellow: 'bg-neon-yellow',
    outline: 'bg-white/60',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-2 h-2 rounded-full',
            dotColors[variant],
            pulse && 'animate-pulse'
          )}
        />
      )}
      {children}
    </span>
  );
}

// Priority Badge
interface PriorityBadgeProps {
  priority: 'critical' | 'high' | 'medium' | 'low';
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const priorityConfig = {
    critical: { variant: 'red' as const, label: 'Critical', dot: true, pulse: true },
    high: { variant: 'orange' as const, label: 'High', dot: true, pulse: false },
    medium: { variant: 'yellow' as const, label: 'Medium', dot: false, pulse: false },
    low: { variant: 'green' as const, label: 'Low', dot: false, pulse: false },
  };

  const config = priorityConfig[priority];

  return (
    <Badge
      variant={config.variant}
      dot={config.dot}
      pulse={config.pulse}
      size="sm"
      className={className}
    >
      {config.label}
    </Badge>
  );
}

// Status Badge
interface StatusBadgeProps {
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'snoozed';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig = {
    pending: { variant: 'blue' as const, label: 'Pending' },
    'in-progress': { variant: 'cyan' as const, label: 'In Progress' },
    completed: { variant: 'green' as const, label: 'Completed' },
    cancelled: { variant: 'red' as const, label: 'Cancelled' },
    snoozed: { variant: 'purple' as const, label: 'Snoozed' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} size="sm" className={className}>
      {config.label}
    </Badge>
  );
}

// Energy Badge
interface EnergyBadgeProps {
  level: 'high' | 'medium' | 'low';
  className?: string;
}

export function EnergyBadge({ level, className }: EnergyBadgeProps) {
  const levelConfig = {
    high: { variant: 'green' as const, label: '⚡ High Energy' },
    medium: { variant: 'yellow' as const, label: '💡 Medium Energy' },
    low: { variant: 'blue' as const, label: '🌙 Low Energy' },
  };

  const config = levelConfig[level];

  return (
    <Badge variant={config.variant} size="sm" className={className}>
      {config.label}
    </Badge>
  );
}

// Category Badge
interface CategoryBadgeProps {
  category: string;
  color?: BadgeProps['variant'];
  className?: string;
}

export function CategoryBadge({ category, color = 'default', className }: CategoryBadgeProps) {
  return (
    <Badge variant={color} size="sm" className={className}>
      {category}
    </Badge>
  );
}

// Notification Count Badge
interface CountBadgeProps {
  count: number;
  max?: number;
  className?: string;
}

export function CountBadge({ count, max = 99, className }: CountBadgeProps) {
  const displayCount = count > max ? `${max}+` : count;

  if (count === 0) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full',
        'bg-neon-red text-white text-xs font-bold',
        className
      )}
    >
      {displayCount}
    </span>
  );
}
