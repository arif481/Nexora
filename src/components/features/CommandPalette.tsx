'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import {
  Search,
  Home,
  CheckSquare,
  Calendar,
  FileText,
  BookOpen,
  Target,
  Brain,
  Heart,
  Wallet,
  Settings,
  Plus,
  Sparkles,
  Clock,
  ArrowRight,
  Command,
  X,
  Hash,
  Zap,
  Film,
  Users,
  Utensils,
  PlaneTakeoff,
  Building2,
  MessageCircle,
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'navigation' | 'actions' | 'recent' | 'ai';
  action: () => void;
  shortcut?: string;
}

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, toggleCommandPalette, openModal } = useUIStore();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    { id: 'nav-dashboard', title: 'Go to Dashboard', icon: Home, category: 'navigation', action: () => router.push('/dashboard'), shortcut: 'G D' },
    { id: 'nav-tasks', title: 'Go to Tasks', icon: CheckSquare, category: 'navigation', action: () => router.push('/tasks'), shortcut: 'G T' },
    { id: 'nav-calendar', title: 'Go to Calendar', icon: Calendar, category: 'navigation', action: () => router.push('/calendar'), shortcut: 'G C' },
    { id: 'nav-notes', title: 'Go to Notes', icon: FileText, category: 'navigation', action: () => router.push('/notes'), shortcut: 'G N' },
    { id: 'nav-journal', title: 'Go to Journal', icon: BookOpen, category: 'navigation', action: () => router.push('/journal'), shortcut: 'G J' },
    { id: 'nav-habits', title: 'Go to Habits', icon: Target, category: 'navigation', action: () => router.push('/habits'), shortcut: 'G H' },
    { id: 'nav-wellness', title: 'Go to Wellness', icon: Heart, category: 'navigation', action: () => router.push('/wellness') },
    { id: 'nav-finance', title: 'Go to Finance', icon: Wallet, category: 'navigation', action: () => router.push('/finance') },
    { id: 'nav-entertainment', title: 'Go to Entertainment', icon: Film, category: 'navigation', action: () => router.push('/entertainment'), shortcut: 'G E' },
    { id: 'nav-contacts', title: 'Go to Contacts', icon: Users, category: 'navigation', action: () => router.push('/contacts') },
    { id: 'nav-meals', title: 'Go to Meal Planner', icon: Utensils, category: 'navigation', action: () => router.push('/meals') },
    { id: 'nav-travel', title: 'Go to Travel Planner', icon: PlaneTakeoff, category: 'navigation', action: () => router.push('/travel') },
    { id: 'nav-admin', title: 'Go to Life Admin Hub', icon: Building2, category: 'navigation', action: () => router.push('/admin') },
    { id: 'nav-comms', title: 'Go to Communications Hub', icon: MessageCircle, category: 'navigation', action: () => router.push('/comms') },
    { id: 'nav-settings', title: 'Go to Settings', icon: Settings, category: 'navigation', action: () => router.push('/settings'), shortcut: 'G S' },

    // Actions
    { id: 'action-new-task', title: 'Create New Task', subtitle: 'Add a task to your list', icon: Plus, category: 'actions', action: () => openModal('create-task'), shortcut: 'N T' },
    { id: 'action-new-event', title: 'Create New Event', subtitle: 'Schedule a calendar event', icon: Calendar, category: 'actions', action: () => openModal('create-event'), shortcut: 'N E' },
    { id: 'action-new-note', title: 'Create New Note', subtitle: 'Capture your thoughts', icon: FileText, category: 'actions', action: () => openModal('create-note'), shortcut: 'N N' },
    { id: 'action-journal', title: 'Write Journal Entry', subtitle: 'Reflect on your day', icon: BookOpen, category: 'actions', action: () => openModal('journal-entry'), shortcut: 'N J' },
    { id: 'action-focus', title: 'Start Focus Session', subtitle: 'Enter deep work mode', icon: Brain, category: 'actions', action: () => router.push('/focus'), shortcut: 'F' },

    // AI
    { id: 'ai-chat', title: 'Ask AI Assistant', subtitle: 'Get help with anything', icon: Sparkles, category: 'ai', action: () => router.push('/ai'), shortcut: 'A' },
    { id: 'ai-insights', title: 'View AI Insights', subtitle: 'See personalized recommendations', icon: Zap, category: 'ai', action: () => router.push('/ai') },
  ], [router, openModal]);

  const filteredCommands = useMemo(() => {
    if (!search) return commands;
    const searchLower = search.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(searchLower) ||
        cmd.subtitle?.toLowerCase().includes(searchLower)
    );
  }, [commands, search]);

  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {
      ai: [],
      actions: [],
      navigation: [],
      recent: [],
    };

    filteredCommands.forEach((cmd) => {
      groups[cmd.category].push(cmd);
    });

    return groups;
  }, [filteredCommands]);

  // Keyboard navigation for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!commandPaletteOpen) {
        // Open command palette with Cmd/Ctrl + K
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          toggleCommandPalette();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            toggleCommandPalette();
          }
          break;
        case 'Escape':
          e.preventDefault();
          toggleCommandPalette();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, filteredCommands, selectedIndex, toggleCommandPalette]);

  // Keyboard shortcut sequences (G D, G T, N T, etc.)
  useEffect(() => {
    let lastKey = '';
    let lastKeyTime = 0;

    const shortcutMap: Record<string, () => void> = {
      'g d': () => router.push('/dashboard'),
      'g t': () => router.push('/tasks'),
      'g c': () => router.push('/calendar'),
      'g n': () => router.push('/notes'),
      'g j': () => router.push('/journal'),
      'g h': () => router.push('/habits'),
      'g s': () => router.push('/settings'),
      'g e': () => router.push('/entertainment'),
      'n t': () => openModal('create-task'),
      'n e': () => openModal('create-event'),
      'n n': () => openModal('create-note'),
      'n j': () => openModal('journal-entry'),
    };

    const singleKeyMap: Record<string, () => void> = {
      'f': () => router.push('/focus'),
      'a': () => router.push('/ai'),
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable) {
        return;
      }
      // Don't trigger when palette is open or when modifier keys are held
      if (commandPaletteOpen || e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      const key = e.key.toLowerCase();
      const now = Date.now();

      // Check for two-key sequence
      if (now - lastKeyTime < 800 && lastKey) {
        const combo = `${lastKey} ${key}`;
        if (shortcutMap[combo]) {
          e.preventDefault();
          shortcutMap[combo]();
          lastKey = '';
          lastKeyTime = 0;
          return;
        }
      }

      // Check for single-key shortcut
      if (singleKeyMap[key] && !['g', 'n'].includes(key)) {
        e.preventDefault();
        singleKeyMap[key]();
        lastKey = '';
        lastKeyTime = 0;
        return;
      }

      // Store for potential two-key sequence
      lastKey = key;
      lastKeyTime = now;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, router, openModal]);

  // Reset state when closing
  useEffect(() => {
    if (!commandPaletteOpen) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [commandPaletteOpen]);

  const categoryLabels: Record<string, string> = {
    ai: 'AI Assistant',
    actions: 'Actions',
    navigation: 'Navigation',
    recent: 'Recent',
  };

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm"
            onClick={toggleCommandPalette}
          />

          {/* Command Palette */}
          <div className="absolute inset-0 flex items-start justify-center pt-[15vh]">
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'w-full max-w-xl mx-4',
                'backdrop-blur-2xl bg-dark-800/95 border border-glass-border rounded-2xl',
                'shadow-glass-lg overflow-hidden'
              )}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-glass-border">
                <Search className="w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSelectedIndex(0);
                  }}
                  placeholder="Type a command or search..."
                  className="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-base"
                  autoFocus
                />
                <kbd className="px-2 py-1 rounded bg-dark-700 text-xs text-white/40">ESC</kbd>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
                {filteredCommands.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-white/50">No results found</p>
                    <p className="text-sm text-white/30 mt-1">Try a different search term</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {Object.entries(groupedCommands).map(([category, items]) => {
                      if (items.length === 0) return null;

                      return (
                        <div key={category} className="mb-4 last:mb-0">
                          <div className="px-3 py-2">
                            <span className="text-xs font-medium text-white/30 uppercase tracking-wider">
                              {categoryLabels[category]}
                            </span>
                          </div>
                          {items.map((cmd) => {
                            const globalIndex = filteredCommands.findIndex((c) => c.id === cmd.id);
                            const isSelected = globalIndex === selectedIndex;
                            const Icon = cmd.icon;

                            return (
                              <button
                                key={cmd.id}
                                onClick={() => {
                                  cmd.action();
                                  toggleCommandPalette();
                                }}
                                onMouseEnter={() => setSelectedIndex(globalIndex)}
                                className={cn(
                                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
                                  isSelected
                                    ? 'bg-neon-cyan/10 text-white'
                                    : 'text-white/70 hover:bg-glass-medium'
                                )}
                              >
                                <div
                                  className={cn(
                                    'w-8 h-8 rounded-lg flex items-center justify-center',
                                    isSelected
                                      ? 'bg-neon-cyan/20 text-neon-cyan'
                                      : 'bg-glass-medium text-white/50'
                                  )}
                                >
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 text-left">
                                  <p className="text-sm font-medium">{cmd.title}</p>
                                  {cmd.subtitle && (
                                    <p className="text-xs text-white/40">{cmd.subtitle}</p>
                                  )}
                                </div>
                                {cmd.shortcut && (
                                  <div className="flex items-center gap-1">
                                    {cmd.shortcut.split(' ').map((key, i) => (
                                      <kbd
                                        key={i}
                                        className="px-1.5 py-0.5 rounded bg-dark-700 text-xs text-white/40"
                                      >
                                        {key}
                                      </kbd>
                                    ))}
                                  </div>
                                )}
                                {isSelected && (
                                  <ArrowRight className="w-4 h-4 text-neon-cyan" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-4 px-4 py-3 border-t border-glass-border text-xs text-white/30">
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-dark-700">↑↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-dark-700">↵</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-dark-700">ESC</kbd>
                  <span>Close</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
