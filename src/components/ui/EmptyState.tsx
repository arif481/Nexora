'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { 
  Inbox, 
  Search, 
  FileText, 
  Calendar, 
  CheckSquare,
  AlertCircle,
  FolderOpen,
  Zap
} from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'search' | 'error' | 'minimal';
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  variant = 'default',
  className,
}: EmptyStateProps) {
  const defaultIcons = {
    default: <Inbox className="w-12 h-12" />,
    search: <Search className="w-12 h-12" />,
    error: <AlertCircle className="w-12 h-12" />,
    minimal: <Zap className="w-8 h-8" />,
  };

  const variantStyles = {
    default: 'py-16',
    search: 'py-12',
    error: 'py-16',
    minimal: 'py-8',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        variantStyles[variant],
        className
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center mb-4',
          variant === 'minimal' 
            ? 'w-14 h-14 rounded-xl bg-glass-medium text-white/40'
            : 'w-20 h-20 rounded-2xl bg-glass-light text-white/30'
        )}
      >
        {icon || defaultIcons[variant]}
      </div>
      <h3
        className={cn(
          'font-semibold text-white',
          variant === 'minimal' ? 'text-base' : 'text-lg'
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            'mt-2 text-white/50 max-w-sm',
            variant === 'minimal' ? 'text-sm' : 'text-base'
          )}
        >
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-6">
          {action && (
            <Button
              variant={action.variant || 'primary'}
              onClick={action.onClick}
              size={variant === 'minimal' ? 'sm' : 'md'}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              onClick={secondaryAction.onClick}
              size={variant === 'minimal' ? 'sm' : 'md'}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Preset Empty States
export function NoTasksEmptyState({ onCreateTask }: { onCreateTask: () => void }) {
  return (
    <EmptyState
      icon={<CheckSquare className="w-12 h-12" />}
      title="No tasks yet"
      description="Create your first task to start organizing your day"
      action={{ label: 'Create Task', onClick: onCreateTask }}
    />
  );
}

export function NoEventsEmptyState({ onCreateEvent }: { onCreateEvent: () => void }) {
  return (
    <EmptyState
      icon={<Calendar className="w-12 h-12" />}
      title="No events scheduled"
      description="Your calendar is clear. Add an event to get started"
      action={{ label: 'Add Event', onClick: onCreateEvent }}
    />
  );
}

export function NoNotesEmptyState({ onCreateNote }: { onCreateNote: () => void }) {
  return (
    <EmptyState
      icon={<FileText className="w-12 h-12" />}
      title="No notes yet"
      description="Capture your thoughts, ideas, and knowledge"
      action={{ label: 'Create Note', onClick: onCreateNote }}
    />
  );
}

export function NoSearchResultsEmptyState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <EmptyState
      variant="search"
      title={`No results for "${query}"`}
      description="Try adjusting your search or filters to find what you're looking for"
      action={{ label: 'Clear Search', onClick: onClear, variant: 'ghost' }}
    />
  );
}

export function FolderEmptyState({ folderName, onAddItem }: { folderName: string; onAddItem: () => void }) {
  return (
    <EmptyState
      icon={<FolderOpen className="w-12 h-12" />}
      title={`${folderName} is empty`}
      description="Add items to this folder to organize your content"
      action={{ label: 'Add Item', onClick: onAddItem }}
    />
  );
}

export function ErrorEmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      variant="error"
      title="Something went wrong"
      description="We couldn't load the content. Please try again"
      action={{ label: 'Retry', onClick: onRetry }}
    />
  );
}
