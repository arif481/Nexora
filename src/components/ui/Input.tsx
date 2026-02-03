'use client';

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, useState } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Search, X } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'glass' | 'minimal';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      variant = 'default',
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const variantStyles = {
      default: cn(
        'bg-dark-300 border-glass-border',
        'focus:border-neon-cyan/50 focus:bg-dark-200',
        error && 'border-neon-red/50 focus:border-neon-red'
      ),
      glass: cn(
        'backdrop-blur-xl bg-glass-light border-glass-border',
        'focus:bg-glass-medium focus:border-neon-cyan/30',
        error && 'border-neon-red/30 focus:border-neon-red/50'
      ),
      minimal: cn(
        'bg-transparent border-b border-glass-border rounded-none',
        'focus:border-neon-cyan',
        error && 'border-neon-red focus:border-neon-red'
      ),
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-white/80 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
              {leftIcon}
            </div>
          )}
          <input
            type={inputType}
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full px-4 py-3 rounded-xl border',
              'text-white placeholder-white/40 transition-all duration-300',
              'focus:outline-none focus:ring-2 focus:ring-neon-cyan/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              leftIcon && 'pl-10',
              (rightIcon || isPassword) && 'pr-10',
              variantStyles[variant],
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          )}
          {rightIcon && !isPassword && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
              {rightIcon}
            </div>
          )}
        </div>
        {(error || hint) && (
          <p className={cn('mt-2 text-sm', error ? 'text-neon-red' : 'text-white/50')}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Search Input Component
export interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'type'> {
  onClear?: () => void;
  showClear?: boolean;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, showClear = true, value, ...props }, ref) => {
    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
        <input
          ref={ref}
          type="search"
          value={value}
          className={cn(
            'w-full pl-10 pr-10 py-3 rounded-xl',
            'backdrop-blur-xl bg-glass-light border border-glass-border',
            'text-white placeholder-white/40 transition-all duration-300',
            'focus:outline-none focus:border-neon-cyan/30 focus:bg-glass-medium',
            'focus:ring-2 focus:ring-neon-cyan/20',
            className
          )}
          {...props}
        />
        {showClear && value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

// Textarea Component
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  variant?: 'default' | 'glass' | 'minimal';
  autoResize?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      hint,
      variant = 'default',
      autoResize = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      default: cn(
        'bg-dark-300 border-glass-border',
        'focus:border-neon-cyan/50 focus:bg-dark-200',
        error && 'border-neon-red/50 focus:border-neon-red'
      ),
      glass: cn(
        'backdrop-blur-xl bg-glass-light border-glass-border',
        'focus:bg-glass-medium focus:border-neon-cyan/30',
        error && 'border-neon-red/30 focus:border-neon-red/50'
      ),
      minimal: cn(
        'bg-transparent border-b border-glass-border rounded-none',
        'focus:border-neon-cyan',
        error && 'border-neon-red focus:border-neon-red'
      ),
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-white/80 mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full px-4 py-3 rounded-xl border min-h-[100px] resize-none',
            'text-white placeholder-white/40 transition-all duration-300',
            'focus:outline-none focus:ring-2 focus:ring-neon-cyan/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            autoResize && 'resize-y',
            variantStyles[variant],
            className
          )}
          {...props}
        />
        {(error || hint) && (
          <p className={cn('mt-2 text-sm', error ? 'text-neon-red' : 'text-white/50')}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Input, SearchInput, Textarea };
