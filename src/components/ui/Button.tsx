'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'glass' | 'glow';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  glow?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      glow = false,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'relative inline-flex items-center justify-center font-medium transition-all duration-300',
      'focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 focus:ring-offset-2 focus:ring-offset-dark-500',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      'active:scale-[0.98]'
    );

    const variantStyles = {
      primary: cn(
        'bg-gradient-to-r from-neon-cyan to-neon-blue text-dark-500',
        'hover:shadow-glow hover:brightness-110',
        glow && 'shadow-glow animate-pulse-glow'
      ),
      secondary: cn(
        'bg-gradient-to-r from-neon-purple to-neon-pink text-white',
        'hover:shadow-glow-purple hover:brightness-110',
        glow && 'shadow-glow-purple'
      ),
      ghost: cn(
        'bg-transparent text-white/80',
        'hover:bg-glass-medium hover:text-white'
      ),
      danger: cn(
        'bg-gradient-to-r from-neon-red to-neon-orange text-white',
        'hover:shadow-glow hover:brightness-110'
      ),
      outline: cn(
        'bg-transparent border border-neon-cyan/50 text-neon-cyan',
        'hover:bg-neon-cyan/10 hover:border-neon-cyan',
        glow && 'shadow-glow-sm'
      ),
      glass: cn(
        'backdrop-blur-xl bg-glass-medium border border-glass-border text-white',
        'hover:bg-glass-heavy hover:border-neon-cyan/30',
        glow && 'shadow-inner-glow'
      ),
      glow: cn(
        'bg-gradient-to-r from-neon-cyan to-neon-purple text-white',
        'shadow-glow hover:shadow-glow-lg hover:brightness-110',
        'animate-pulse-glow'
      ),
    };

    const sizeStyles = {
      sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
      md: 'h-10 px-4 text-sm rounded-xl gap-2',
      lg: 'h-12 px-6 text-base rounded-xl gap-2.5',
      xl: 'h-14 px-8 text-lg rounded-2xl gap-3',
      icon: 'h-10 w-10 rounded-xl',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Animated Button with Framer Motion
interface AnimatedButtonProps extends Omit<ButtonProps, 'ref'> {
  className?: string;
}

export const AnimatedButton = forwardRef<
  HTMLButtonElement,
  AnimatedButtonProps
>(({ className, variant = 'primary', size = 'md', glow = false, children, ...props }, ref) => {
  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={className}
    >
      {children}
    </motion.button>
  );
});

AnimatedButton.displayName = 'AnimatedButton';

export { Button };
