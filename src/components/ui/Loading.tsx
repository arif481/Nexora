'use client';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'cyan' | 'purple' | 'white';
  className?: string;
}

export function LoadingSpinner({ size = 'md', color = 'cyan', className }: LoadingSpinnerProps) {
  const sizeStyles = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4',
  };

  const colorStyles = {
    cyan: 'border-neon-cyan/20 border-t-neon-cyan',
    purple: 'border-neon-purple/20 border-t-neon-purple',
    white: 'border-white/20 border-t-white',
  };

  return (
    <div
      className={cn(
        'rounded-full animate-spin',
        sizeStyles[size],
        colorStyles[color],
        className
      )}
    />
  );
}

// Loading Dots
interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'cyan' | 'purple' | 'white';
  className?: string;
}

export function LoadingDots({ size = 'md', color = 'cyan', className }: LoadingDotsProps) {
  const sizeStyles = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const gapStyles = {
    sm: 'gap-1',
    md: 'gap-1.5',
    lg: 'gap-2',
  };

  const colorStyles = {
    cyan: 'bg-neon-cyan',
    purple: 'bg-neon-purple',
    white: 'bg-white',
  };

  return (
    <div className={cn('flex items-center', gapStyles[size], className)}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            'rounded-full animate-bounce',
            sizeStyles[size],
            colorStyles[color]
          )}
          style={{
            animationDelay: `${index * 0.1}s`,
            animationDuration: '0.6s',
          }}
        />
      ))}
    </div>
  );
}

// Loading Pulse
interface LoadingPulseProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'cyan' | 'purple' | 'white';
  className?: string;
}

export function LoadingPulse({ size = 'md', color = 'cyan', className }: LoadingPulseProps) {
  const sizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const colorStyles = {
    cyan: 'bg-neon-cyan',
    purple: 'bg-neon-purple',
    white: 'bg-white',
  };

  return (
    <div className={cn('relative', sizeStyles[size], className)}>
      <div
        className={cn(
          'absolute inset-0 rounded-full opacity-75 animate-ping',
          colorStyles[color]
        )}
      />
      <div
        className={cn(
          'absolute inset-2 rounded-full',
          colorStyles[color]
        )}
      />
    </div>
  );
}

// Full Page Loading
interface FullPageLoadingProps {
  message?: string;
}

export function FullPageLoading({ message = 'Loading...' }: FullPageLoadingProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-500/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6">
        {/* Nexora Logo Animation */}
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple opacity-20 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple opacity-40 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-dark-400 flex items-center justify-center">
            <span className="text-2xl font-bold text-gradient">N</span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-white/80 font-medium">{message}</p>
          <LoadingDots className="mt-3 justify-center" />
        </div>
      </div>
    </div>
  );
}

// Inline Loading
interface InlineLoadingProps {
  text?: string;
  className?: string;
}

export function InlineLoading({ text = 'Loading', className }: InlineLoadingProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LoadingSpinner size="sm" />
      <span className="text-sm text-white/60">{text}</span>
    </div>
  );
}

// Card Loading Overlay
interface CardLoadingOverlayProps {
  visible: boolean;
}

export function CardLoadingOverlay({ visible }: CardLoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-dark-400/80 backdrop-blur-sm rounded-2xl">
      <LoadingSpinner size="lg" />
    </div>
  );
}

// AI Thinking Animation
export function AIThinkingAnimation({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink animate-spin" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-0.5 rounded-full bg-dark-400" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple animate-pulse" />
      </div>
      <span className="text-sm text-white/60">
        Thinking<span className="animate-pulse">...</span>
      </span>
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      {icon && (
        <div className="mb-4 text-dark-400">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-dark-400 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
