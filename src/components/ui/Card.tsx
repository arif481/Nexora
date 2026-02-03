'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'solid' | 'gradient' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
  glowColor?: 'cyan' | 'purple' | 'pink' | 'blue' | 'green';
  hoverEffect?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      glow = false,
      glowColor = 'cyan',
      hoverEffect = false,
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      default: cn(
        'backdrop-blur-xl border border-glass-border rounded-2xl',
        'bg-gradient-to-br from-glass-medium to-glass-light'
      ),
      glass: cn(
        'backdrop-blur-2xl border border-glass-border rounded-2xl',
        'bg-glass-light'
      ),
      solid: cn(
        'bg-dark-300 border border-glass-border rounded-2xl'
      ),
      gradient: cn(
        'backdrop-blur-xl border border-glass-border rounded-2xl',
        'bg-gradient-to-br from-neon-cyan/10 via-transparent to-neon-purple/10'
      ),
      interactive: cn(
        'backdrop-blur-xl border border-glass-border rounded-2xl',
        'bg-gradient-to-br from-glass-medium to-glass-light',
        'cursor-pointer transition-all duration-300',
        'hover:border-neon-cyan/30 hover:shadow-glow-sm',
        'hover:translate-y-[-2px]'
      ),
    };

    const paddingStyles = {
      none: '',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-6',
      xl: 'p-8',
    };

    const glowStyles = {
      cyan: 'shadow-glow',
      purple: 'shadow-glow-purple',
      pink: 'shadow-glow-pink',
      blue: 'shadow-glow-blue',
      green: 'shadow-glow-green',
    };

    return (
      <div
        ref={ref}
        className={cn(
          variantStyles[variant],
          paddingStyles[padding],
          glow && glowStyles[glowColor],
          hoverEffect && 'transition-all duration-300 hover:scale-[1.02]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Animated Card with Framer Motion
export interface AnimatedCardProps extends CardProps {
  delay?: number;
  animate?: boolean;
}

const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps & Omit<HTMLMotionProps<'div'>, keyof AnimatedCardProps>>(
  ({ className, variant = 'default', padding = 'md', glow = false, glowColor = 'cyan', delay = 0, animate = true, children, ...props }, ref) => {
    const variantStyles = {
      default: cn(
        'backdrop-blur-xl border border-glass-border rounded-2xl',
        'bg-gradient-to-br from-glass-medium to-glass-light'
      ),
      glass: cn(
        'backdrop-blur-2xl border border-glass-border rounded-2xl',
        'bg-glass-light'
      ),
      solid: cn(
        'bg-dark-300 border border-glass-border rounded-2xl'
      ),
      gradient: cn(
        'backdrop-blur-xl border border-glass-border rounded-2xl',
        'bg-gradient-to-br from-neon-cyan/10 via-transparent to-neon-purple/10'
      ),
      interactive: cn(
        'backdrop-blur-xl border border-glass-border rounded-2xl',
        'bg-gradient-to-br from-glass-medium to-glass-light',
        'cursor-pointer'
      ),
    };

    const paddingStyles = {
      none: '',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-6',
      xl: 'p-8',
    };

    const glowStyles = {
      cyan: 'shadow-glow',
      purple: 'shadow-glow-purple',
      pink: 'shadow-glow-pink',
      blue: 'shadow-glow-blue',
      green: 'shadow-glow-green',
    };

    return (
      <motion.div
        ref={ref}
        initial={animate ? { opacity: 0, y: 20 } : undefined}
        animate={animate ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.5, delay, ease: 'easeOut' }}
        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        className={cn(
          variantStyles[variant],
          paddingStyles[padding],
          glow && glowStyles[glowColor],
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';

// Card Header
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, action, icon, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-start justify-between gap-4 mb-4', className)}
        {...props}
      >
        <div className="flex items-start gap-3">
          {icon && (
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-glass-medium flex items-center justify-center text-neon-cyan">
              {icon}
            </div>
          )}
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-white">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-white/50 mt-0.5">{subtitle}</p>
            )}
            {children}
          </div>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// Card Content
const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('', className)} {...props} />;
  }
);

CardContent.displayName = 'CardContent';

// Card Footer
const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-3 mt-4 pt-4 border-t border-glass-border', className)}
        {...props}
      />
    );
  }
);

CardFooter.displayName = 'CardFooter';

export { Card, AnimatedCard, CardHeader, CardContent, CardFooter };
