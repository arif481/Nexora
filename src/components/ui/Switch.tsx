'use client';

import { forwardRef } from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
  className?: string;
}

const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked,
      onCheckedChange,
      disabled,
      size = 'md',
      label,
      description,
      className,
    },
    ref
  ) => {
    const sizeStyles = {
      sm: {
        root: 'w-8 h-5',
        thumb: 'w-4 h-4 data-[state=checked]:translate-x-3',
      },
      md: {
        root: 'w-11 h-6',
        thumb: 'w-5 h-5 data-[state=checked]:translate-x-5',
      },
      lg: {
        root: 'w-14 h-7',
        thumb: 'w-6 h-6 data-[state=checked]:translate-x-7',
      },
    };

    const switchElement = (
      <SwitchPrimitive.Root
        ref={ref}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          'relative inline-flex items-center rounded-full transition-colors duration-200',
          'bg-dark-200 border border-glass-border',
          'data-[state=checked]:bg-neon-cyan/20 data-[state=checked]:border-neon-cyan/50',
          'focus:outline-none focus:ring-2 focus:ring-neon-cyan/30 focus:ring-offset-2 focus:ring-offset-dark-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          sizeStyles[size].root,
          className
        )}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            'block rounded-full transition-transform duration-200',
            'bg-white/80 data-[state=checked]:bg-neon-cyan',
            'shadow-sm',
            'translate-x-0.5',
            sizeStyles[size].thumb
          )}
        />
      </SwitchPrimitive.Root>
    );

    if (label || description) {
      return (
        <div className="flex items-center justify-between gap-4">
          <div>
            {label && (
              <label className="text-sm font-medium text-white">{label}</label>
            )}
            {description && (
              <p className="text-xs text-white/50 mt-0.5">{description}</p>
            )}
          </div>
          {switchElement}
        </div>
      );
    }

    return switchElement;
  }
);

Switch.displayName = 'Switch';

export { Switch };
