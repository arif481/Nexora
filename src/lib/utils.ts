import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a human-readable string
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

/**
 * Format a time to a human-readable string
 */
export function formatTime(date: Date | string, format: '12h' | '24h' = '12h'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: format === '12h',
  });
}

/**
 * Format a date-time to a human-readable string
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${formatDate(d)} at ${formatTime(d)}`;
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  const diffWeek = Math.round(diffDay / 7);
  const diffMonth = Math.round(diffDay / 30);

  if (Math.abs(diffSec) < 60) {
    return diffSec >= 0 ? 'just now' : 'just now';
  }
  if (Math.abs(diffMin) < 60) {
    return diffMin > 0 ? `in ${diffMin}m` : `${Math.abs(diffMin)}m ago`;
  }
  if (Math.abs(diffHour) < 24) {
    return diffHour > 0 ? `in ${diffHour}h` : `${Math.abs(diffHour)}h ago`;
  }
  if (Math.abs(diffDay) < 7) {
    return diffDay > 0 ? `in ${diffDay}d` : `${Math.abs(diffDay)}d ago`;
  }
  if (Math.abs(diffWeek) < 4) {
    return diffWeek > 0 ? `in ${diffWeek}w` : `${Math.abs(diffWeek)}w ago`;
  }
  return diffMonth > 0 ? `in ${diffMonth}mo` : `${Math.abs(diffMonth)}mo ago`;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is tomorrow
 */
export function isTomorrow(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    d.getDate() === tomorrow.getDate() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getFullYear() === tomorrow.getFullYear()
  );
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() < Date.now();
}

/**
 * Get deadline status for a task
 */
export function getDeadlineStatus(dueDate: Date | string | undefined): 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'none' {
  if (!dueDate) return 'none';
  const d = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dueDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (dueDay < today) return 'overdue';
  if (dueDay.getTime() === today.getTime()) return 'today';
  if (dueDay.getTime() === tomorrow.getTime()) return 'tomorrow';
  return 'upcoming';
}

/**
 * Format a date relative to today
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'long' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Get the start of the day
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of the day
 */
export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get the start of the week
 */
export function startOfWeek(date: Date, weekStartsOn: 0 | 1 | 6 = 1): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get the end of the week
 */
export function endOfWeek(date: Date, weekStartsOn: 0 | 1 | 6 = 1): Date {
  const d = startOfWeek(date, weekStartsOn);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get an array of dates for a week
 */
export function getWeekDates(date: Date, weekStartsOn: 0 | 1 | 6 = 1): Date[] {
  const start = startOfWeek(date, weekStartsOn);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Truncate text to a specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncate a string with ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

/**
 * Get greeting based on time of day
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

/**
 * Get time of day
 */
export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour < 5) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

/**
 * Calculate percentage
 */
export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Smooth scroll to element
 */
export function scrollToElement(elementId: string, offset: number = 0): void {
  const element = document.getElementById(elementId);
  if (element) {
    const top = element.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Check if running in browser
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Check if device is mobile
 */
export function isMobile(): boolean {
  if (!isBrowser()) return false;
  return window.innerWidth < 768;
}

/**
 * Check if device is tablet
 */
export function isTablet(): boolean {
  if (!isBrowser()) return false;
  return window.innerWidth >= 768 && window.innerWidth < 1024;
}

/**
 * Check if device is desktop
 */
export function isDesktop(): boolean {
  if (!isBrowser()) return false;
  return window.innerWidth >= 1024;
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get color for priority level
 */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical':
      return 'text-neon-red';
    case 'high':
      return 'text-neon-orange';
    case 'medium':
      return 'text-neon-yellow';
    case 'low':
      return 'text-neon-green';
    default:
      return 'text-white/60';
  }
}

/**
 * Get color for energy level
 */
export function getEnergyColor(level: string): string {
  switch (level) {
    case 'high':
      return 'text-energy-high';
    case 'medium':
      return 'text-energy-medium';
    case 'low':
      return 'text-energy-low';
    default:
      return 'text-white/60';
  }
}

/**
 * Get color for mood level
 */
export function getMoodColor(score: number): string {
  if (score >= 8) return 'text-mood-excellent';
  if (score >= 6) return 'text-mood-good';
  if (score >= 4) return 'text-mood-neutral';
  if (score >= 2) return 'text-mood-low';
  return 'text-mood-stressed';
}

/**
 * Get emoji for mood level
 */
export function getMoodEmoji(score: number): string {
  if (score >= 8) return '😄';
  if (score >= 6) return '🙂';
  if (score >= 4) return '😐';
  if (score >= 2) return '😔';
  return '😰';
}

/**
 * Parse natural language time
 */
export function parseNaturalTime(input: string): Date | null {
  const now = new Date();
  const lower = input.toLowerCase().trim();

  // Handle "in X minutes/hours/days"
  const inMatch = lower.match(/in\s+(\d+)\s*(min(?:ute)?s?|hour?s?|days?|weeks?)/);
  if (inMatch) {
    const amount = parseInt(inMatch[1]);
    const unit = inMatch[2];
    const result = new Date(now);
    if (unit.startsWith('min')) result.setMinutes(result.getMinutes() + amount);
    else if (unit.startsWith('hour')) result.setHours(result.getHours() + amount);
    else if (unit.startsWith('day')) result.setDate(result.getDate() + amount);
    else if (unit.startsWith('week')) result.setDate(result.getDate() + amount * 7);
    return result;
  }

  // Handle "tomorrow", "today"
  if (lower === 'today') return startOfDay(now);
  if (lower === 'tomorrow') {
    const result = new Date(now);
    result.setDate(result.getDate() + 1);
    return startOfDay(result);
  }

  // Handle "next week", "next month"
  if (lower === 'next week') {
    const result = new Date(now);
    result.setDate(result.getDate() + 7);
    return startOfDay(result);
  }

  return null;
}
