'use client';

import { cn } from '@/lib/utils';

interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient' | 'success' | 'warning' | 'danger' | 'cyan' | 'purple' | 'pink' | 'green' | 'orange' | 'blue';
  showValue?: boolean;
  animated?: boolean;
  glow?: boolean;
  className?: string;
}

export function Progress({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showValue = false,
  animated = true,
  glow = false,
  className,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const variantStyles = {
    default: 'bg-gradient-to-r from-neon-cyan to-neon-blue',
    gradient: 'bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink',
    success: 'bg-neon-green',
    warning: 'bg-neon-orange',
    danger: 'bg-neon-red',
    cyan: 'bg-neon-cyan',
    purple: 'bg-neon-purple',
    pink: 'bg-neon-pink',
    green: 'bg-neon-green',
    orange: 'bg-neon-orange',
    blue: 'bg-neon-blue',
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'w-full bg-dark-300 rounded-full overflow-hidden',
          sizeStyles[size]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            variantStyles[variant],
            animated && 'transition-[width]',
            glow && 'shadow-glow-sm'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <div className="flex justify-end mt-1">
          <span className="text-xs text-white/60">{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
}

// Circular Progress
interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'gradient' | 'success' | 'warning' | 'danger' | 'cyan' | 'purple' | 'pink' | 'green' | 'orange' | 'blue';
  showValue?: boolean;
  label?: string;
  className?: string;
  children?: React.ReactNode;
}

export function CircularProgress({
  value,
  max = 100,
  size = 80,
  strokeWidth = 8,
  variant = 'default',
  showValue = true,
  label,
  className,
  children,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const variantColors = {
    default: { stroke: '#00fff5', id: 'cyan' },
    gradient: { stroke: 'url(#progress-gradient)', id: 'gradient' },
    success: { stroke: '#00ff88', id: 'green' },
    warning: { stroke: '#ffaa00', id: 'orange' },
    danger: { stroke: '#ff4466', id: 'red' },
    cyan: { stroke: '#00fff5', id: 'cyan' },
    purple: { stroke: '#bf00ff', id: 'purple' },
    pink: { stroke: '#ff00aa', id: 'pink' },
    green: { stroke: '#00ff88', id: 'green' },
    orange: { stroke: '#ff8800', id: 'orange' },
    blue: { stroke: '#00aaff', id: 'blue' },
  };

  const colorConfig = variantColors[variant];

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <defs>
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00fff5" />
            <stop offset="50%" stopColor="#bf00ff" />
            <stop offset="100%" stopColor="#ff00aa" />
          </linearGradient>
        </defs>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorConfig.stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
          style={{
            filter: `drop-shadow(0 0 6px ${variant === 'gradient' ? '#bf00ff' : colorConfig.stroke})`,
          }}
        />
      </svg>
      {(showValue || label || children) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {children ? children : (
            <>
              {showValue && (
                <span className="text-lg font-bold text-white">
                  {Math.round(percentage)}%
                </span>
              )}
              {label && (
                <span className="text-xs text-white/50">{label}</span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Stats Progress Card
interface StatsProgressProps {
  title: string;
  value: number;
  max: number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  variant?: ProgressProps['variant'];
  className?: string;
}

export function StatsProgress({
  title,
  value,
  max,
  unit = '',
  trend,
  trendValue,
  icon,
  variant = 'default',
  className,
}: StatsProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const trendColors = {
    up: 'text-neon-green',
    down: 'text-neon-red',
    neutral: 'text-white/50',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-white/60">{icon}</span>}
          <span className="text-sm text-white/70">{title}</span>
        </div>
        {trend && trendValue && (
          <span className={cn('text-xs font-medium', trendColors[trend])}>
            {trendIcons[trend]} {trendValue}
          </span>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        <span className="text-sm text-white/50 mb-1">/ {max} {unit}</span>
      </div>
      <Progress value={value} max={max} variant={variant} size="sm" glow />
    </div>
  );
}

// Multi-segment Progress
interface SegmentProgressProps {
  segments: Array<{
    value: number;
    color: string;
    label?: string;
  }>;
  total?: number;
  size?: 'sm' | 'md' | 'lg';
  showLegend?: boolean;
  className?: string;
}

export function SegmentProgress({
  segments,
  total,
  size = 'md',
  showLegend = false,
  className,
}: SegmentProgressProps) {
  const calculatedTotal = total || segments.reduce((sum, s) => sum + s.value, 0);

  const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'w-full bg-dark-300 rounded-full overflow-hidden flex',
          sizeStyles[size]
        )}
      >
        {segments.map((segment, index) => (
          <div
            key={index}
            className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${(segment.value / calculatedTotal) * 100}%`,
              backgroundColor: segment.color,
            }}
          />
        ))}
      </div>
      {showLegend && (
        <div className="flex flex-wrap gap-4 mt-3">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-xs text-white/60">
                {segment.label || `Segment ${index + 1}`}: {segment.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
