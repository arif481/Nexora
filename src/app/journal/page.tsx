'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Smile,
  Meh,
  Frown,
  Angry,
  Heart,
  Star,
  Sun,
  Cloud,
  CloudRain,
  Zap,
  Coffee,
  Moon,
  Book,
  PenLine,
  Sparkles,
  Brain,
  TrendingUp,
  BarChart3,
  Clock,
  Tag,
  Lock,
  MoreHorizontal,
  Edit3,
  Trash2,
  Image as ImageIcon,
  Mic,
  MapPin,
} from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Progress } from '@/components/ui/Progress';
import { EmptyState } from '@/components/ui/Loading';
import { useUIStore } from '@/stores/uiStore';
import { cn, formatDate } from '@/lib/utils';
import type { JournalEntry, MoodEntry } from '@/types';

// Mood options
const moodOptions = [
  { value: 1, label: 'Terrible', icon: Angry, color: 'text-status-error', bg: 'bg-status-error/20' },
  { value: 2, label: 'Bad', icon: Frown, color: 'text-neon-orange', bg: 'bg-neon-orange/20' },
  { value: 3, label: 'Okay', icon: Meh, color: 'text-dark-300', bg: 'bg-dark-500/20' },
  { value: 4, label: 'Good', icon: Smile, color: 'text-neon-green', bg: 'bg-neon-green/20' },
  { value: 5, label: 'Amazing', icon: Heart, color: 'text-neon-pink', bg: 'bg-neon-pink/20' },
];

const energyOptions = [
  { value: 1, label: 'Exhausted', icon: Moon },
  { value: 2, label: 'Tired', icon: CloudRain },
  { value: 3, label: 'Neutral', icon: Cloud },
  { value: 4, label: 'Energized', icon: Sun },
  { value: 5, label: 'Supercharged', icon: Zap },
];

const promptSuggestions = [
  'What made you smile today?',
  'What are you grateful for?',
  'What challenged you today?',
  'What did you learn today?',
  'What are you looking forward to?',
  'How did you take care of yourself today?',
  'What would you do differently?',
  'What are you proud of?',
];

// Mock journal entries
const mockEntries: JournalEntry[] = [
  {
    id: '1',
    userId: 'user1',
    date: new Date(),
    content: `## Today's Reflection

Had a really productive morning session. The new project architecture is coming together nicely. Felt focused and motivated.

### Highlights
- Completed the dashboard design
- Had a great brainstorming session with the team
- Took a proper lunch break for once!

### Challenges
- Some technical blockers in the afternoon
- Need to better manage context-switching

### Tomorrow's Focus
Focus on the calendar integration and start thinking about the AI assistant features.`,
    mood: {
      id: 'm1',
      userId: 'user1',
      date: new Date(),
      score: 4,
      energyLevel: 4,
      emotions: ['focused', 'motivated', 'creative'],
      triggers: ['productive work', 'good sleep', 'exercise'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    tags: ['productivity', 'work', 'reflection'],
    gratitude: ['Great team collaboration', 'Good health', 'Clear weather for a walk'],
    aiAnalysis: 'Your energy and mood patterns show strong correlation with productive work sessions. Consider scheduling important tasks during morning hours.',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    userId: 'user1',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    content: `## Quiet Sunday

Took it easy today. Read for a couple of hours and did some meal prep for the week.

### What I Did
- Finished "Atomic Habits" 📚
- 30 min meditation session
- Planned the week ahead
- Evening walk in the park

### Thoughts
Sometimes slow days are the most productive. Feeling recharged for the week ahead.`,
    mood: {
      id: 'm2',
      userId: 'user1',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      score: 5,
      energyLevel: 3,
      emotions: ['peaceful', 'content', 'relaxed'],
      triggers: ['rest', 'reading', 'nature'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    tags: ['self-care', 'relaxation', 'reading'],
    gratitude: ['Time to relax', 'Good book', 'Beautiful weather'],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    userId: 'user1',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    content: `## Challenging Day

Felt a bit overwhelmed with multiple deadlines approaching. Need to practice saying no more often.

### Learnings
- Better prioritization needed
- Ask for help earlier
- Take breaks even when busy

### Positive Moments
Despite the stress, managed to complete the critical deliverable. Team was supportive.`,
    mood: {
      id: 'm3',
      userId: 'user1',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      score: 2,
      energyLevel: 2,
      emotions: ['stressed', 'overwhelmed', 'determined'],
      triggers: ['deadlines', 'multitasking'],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    tags: ['work', 'stress', 'learning'],
    gratitude: ['Supportive colleagues', 'Completed the task', 'Learning opportunity'],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>(mockEntries);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const { openAIPanel } = useUIStore();

  // Get days in current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.unshift(new Date(year, month, -i));
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const monthDays = getDaysInMonth(currentDate);

  // Get entry for a specific date
  const getEntryForDate = (date: Date) => {
    return entries.find(entry => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getDate() === date.getDate() &&
        entryDate.getMonth() === date.getMonth() &&
        entryDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Get selected entry
  const currentEntry = getEntryForDate(selectedDate);

  // Navigation
  const navigatePrev = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const navigateNext = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if date is selected
  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  // Calculate stats
  const stats = useMemo(() => {
    const last30Days = entries.filter(e => {
      const diff = Date.now() - new Date(e.date).getTime();
      return diff <= 30 * 24 * 60 * 60 * 1000;
    });

    const avgMood = last30Days.reduce((sum, e) => sum + (e.mood?.score || 0), 0) / (last30Days.length || 1);
    const avgEnergy = last30Days.reduce((sum, e) => sum + (e.mood?.energyLevel || 0), 0) / (last30Days.length || 1);
    const streak = calculateStreak(entries);
    const totalEntries = entries.length;

    return {
      avgMood: avgMood.toFixed(1),
      avgEnergy: avgEnergy.toFixed(1),
      streak,
      totalEntries,
      entriesThisMonth: last30Days.length,
    };
  }, [entries]);

  function calculateStreak(entries: JournalEntry[]): number {
    const sortedDates = entries
      .map(e => new Date(e.date).setHours(0, 0, 0, 0))
      .sort((a, b) => b - a);

    let streak = 0;
    const today = new Date().setHours(0, 0, 0, 0);
    const oneDay = 24 * 60 * 60 * 1000;

    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = today - i * oneDay;
      if (sortedDates.includes(expectedDate)) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  const getMoodForDate = (date: Date) => {
    const entry = getEntryForDate(date);
    if (!entry?.mood) return null;
    return moodOptions.find(m => m.value === entry.mood?.score);
  };

  return (
    <MainLayout>
      <PageContainer title="Journal" subtitle="Reflect, grow, and understand yourself">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {[
                { label: 'Current Streak', value: `${stats.streak} days`, icon: Zap, color: 'neon-orange' },
                { label: 'Avg Mood', value: stats.avgMood, icon: Heart, color: 'neon-pink' },
                { label: 'Avg Energy', value: stats.avgEnergy, icon: Sun, color: 'neon-cyan' },
                { label: 'Total Entries', value: stats.totalEntries, icon: Book, color: 'neon-purple' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-xl bg-dark-900/50 border border-dark-700/50 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className={`w-5 h-5 text-${stat.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-dark-400">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Calendar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card variant="glass">
                <CardHeader
                  title={
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="sm" onClick={navigatePrev}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="min-w-[150px] text-center">
                        {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                      </span>
                      <Button variant="ghost" size="sm" onClick={navigateNext}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  }
                  action={
                    <Button
                      variant="glow"
                      size="sm"
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      New Entry
                    </Button>
                  }
                />
                <CardContent>
                  {/* Days header */}
                  <div className="grid grid-cols-7 mb-2">
                    {DAYS.map(day => (
                      <div key={day} className="text-center text-xs font-medium text-dark-400 py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {monthDays.map((day, i) => {
                      const entry = getEntryForDate(day);
                      const mood = getMoodForDate(day);
                      const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                      return (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.01 }}
                          onClick={() => setSelectedDate(day)}
                          className={cn(
                            'relative h-16 p-1 rounded-xl transition-all',
                            'border border-transparent',
                            !isCurrentMonth && 'opacity-30',
                            isSelected(day) && 'border-neon-cyan bg-neon-cyan/10',
                            isToday(day) && !isSelected(day) && 'border-neon-purple/50',
                            'hover:bg-dark-800/50'
                          )}
                        >
                          <span
                            className={cn(
                              'text-sm',
                              isToday(day) ? 'text-neon-purple font-semibold' : 'text-dark-300'
                            )}
                          >
                            {day.getDate()}
                          </span>

                          {/* Mood indicator */}
                          {entry && mood && (
                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                              <mood.icon className={cn('w-4 h-4', mood.color)} />
                            </div>
                          )}

                          {/* Has entry indicator */}
                          {entry && !mood && (
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-neon-cyan" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Entry View */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card variant="glass">
                <CardHeader
                  title={formatDate(selectedDate)}
                  subtitle={isToday(selectedDate) ? 'Today' : undefined}
                  icon={<PenLine className="w-5 h-5 text-neon-cyan" />}
                  action={
                    currentEntry ? (
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCreateModalOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Entry
                      </Button>
                    )
                  }
                />
                <CardContent>
                  {currentEntry ? (
                    <div className="space-y-4">
                      {/* Mood & Energy */}
                      {currentEntry.mood && (
                        <div className="flex items-center gap-6 p-4 rounded-xl bg-dark-800/30 border border-dark-700/30">
                          <div className="flex items-center gap-3">
                            {(() => {
                              const mood = moodOptions.find(m => m.value === currentEntry.mood?.score);
                              const MoodIcon = mood?.icon || Meh;
                              return (
                                <div className={cn('p-3 rounded-xl', mood?.bg)}>
                                  <MoodIcon className={cn('w-6 h-6', mood?.color)} />
                                </div>
                              );
                            })()}
                            <div>
                              <p className="text-sm text-dark-400">Mood</p>
                              <p className="font-medium text-white">
                                {moodOptions.find(m => m.value === currentEntry.mood?.score)?.label}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {(() => {
                              const energy = energyOptions.find(e => e.value === currentEntry.mood?.energyLevel);
                              const EnergyIcon = energy?.icon || Cloud;
                              return (
                                <div className="p-3 rounded-xl bg-neon-orange/20">
                                  <EnergyIcon className="w-6 h-6 text-neon-orange" />
                                </div>
                              );
                            })()}
                            <div>
                              <p className="text-sm text-dark-400">Energy</p>
                              <p className="font-medium text-white">
                                {energyOptions.find(e => e.value === currentEntry.mood?.energyLevel)?.label}
                              </p>
                            </div>
                          </div>

                          {/* Emotions */}
                          {currentEntry.mood.emotions && currentEntry.mood.emotions.length > 0 && (
                            <div className="flex-1">
                              <p className="text-sm text-dark-400 mb-1">Feelings</p>
                              <div className="flex flex-wrap gap-1">
                                {currentEntry.mood.emotions.map(emotion => (
                                  <Badge key={emotion} variant="outline" size="sm">
                                    {emotion}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Gratitude */}
                      {currentEntry.gratitude && currentEntry.gratitude.length > 0 && (
                        <div className="p-4 rounded-xl bg-neon-pink/10 border border-neon-pink/20">
                          <div className="flex items-center gap-2 mb-3">
                            <Heart className="w-4 h-4 text-neon-pink" />
                            <span className="text-sm font-medium text-neon-pink">Gratitude</span>
                          </div>
                          <ul className="space-y-1">
                            {currentEntry.gratitude.map((item, i) => (
                              <li key={i} className="text-sm text-dark-200 flex items-start gap-2">
                                <Star className="w-3 h-3 text-neon-pink mt-1 flex-shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-4 rounded-xl bg-dark-800/30 border border-dark-700/30">
                        <pre className="whitespace-pre-wrap font-sans text-dark-200 text-sm leading-relaxed">
                          {currentEntry.content}
                        </pre>
                      </div>

                      {/* AI Analysis */}
                      {currentEntry.aiAnalysis && (
                        <div className="p-4 rounded-xl bg-neon-purple/10 border border-neon-purple/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-neon-purple" />
                            <span className="text-sm font-medium text-neon-purple">AI Insight</span>
                          </div>
                          <p className="text-sm text-dark-200">{currentEntry.aiAnalysis}</p>
                        </div>
                      )}

                      {/* Tags */}
                      {currentEntry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {currentEntry.tags.map(tag => (
                            <Badge key={tag} variant="outline" size="sm">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<PenLine className="w-12 h-12" />}
                      title="No entry for this day"
                      description="Start journaling to track your thoughts and feelings"
                      action={
                        <Button variant="glow" onClick={() => setIsCreateModalOpen(true)}>
                          <Plus className="w-4 h-4 mr-1" />
                          Write Entry
                        </Button>
                      }
                    />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Entry */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card variant="glass">
                <CardHeader
                  title="Quick Check-in"
                  icon={<Clock className="w-5 h-5 text-neon-cyan" />}
                />
                <CardContent className="space-y-4">
                  <p className="text-sm text-dark-400">How are you feeling right now?</p>
                  
                  {/* Quick mood selector */}
                  <div className="flex justify-between">
                    {moodOptions.map(mood => (
                      <button
                        key={mood.value}
                        className={cn(
                          'p-3 rounded-xl transition-all',
                          mood.bg,
                          'hover:scale-110'
                        )}
                      >
                        <mood.icon className={cn('w-6 h-6', mood.color)} />
                      </button>
                    ))}
                  </div>

                  <Button variant="glass" className="w-full" onClick={() => setIsCreateModalOpen(true)}>
                    <PenLine className="w-4 h-4 mr-2" />
                    Full Journal Entry
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Writing Prompts */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card variant="glass">
                <CardHeader
                  title="Writing Prompts"
                  icon={<Sparkles className="w-5 h-5 text-neon-purple" />}
                />
                <CardContent className="space-y-2">
                  {promptSuggestions.slice(0, 4).map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => setIsCreateModalOpen(true)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg transition-all',
                        'bg-dark-800/30 hover:bg-dark-800/50',
                        'text-sm text-dark-300 hover:text-white'
                      )}
                    >
                      {prompt}
                    </button>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Mood Trends */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card variant="glass">
                <CardHeader
                  title="Mood Trends"
                  subtitle="Last 7 days"
                  icon={<TrendingUp className="w-5 h-5 text-neon-green" />}
                />
                <CardContent>
                  {/* Simple bar chart */}
                  <div className="flex items-end justify-between h-24 gap-1">
                    {Array.from({ length: 7 }, (_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() - (6 - i));
                      const entry = getEntryForDate(date);
                      const score = entry?.mood?.score || 0;
                      const height = score > 0 ? (score / 5) * 100 : 10;
                      const mood = moodOptions.find(m => m.value === score);

                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className={cn(
                              'w-full rounded-t-md transition-all',
                              score > 0 ? mood?.bg : 'bg-dark-700/50'
                            )}
                            style={{ height: `${height}%` }}
                          />
                          <span className="text-[10px] text-dark-500">
                            {DAYS[date.getDay()].charAt(0)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex justify-center gap-4 mt-4">
                    {moodOptions.slice(0, 3).map(mood => (
                      <div key={mood.value} className="flex items-center gap-1">
                        <div className={cn('w-2 h-2 rounded-full', mood.bg.replace('/20', ''))} />
                        <span className="text-[10px] text-dark-400">{mood.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Insights */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card variant="glass">
                <CardHeader
                  title="AI Insights"
                  icon={<Brain className="w-5 h-5 text-neon-purple" />}
                />
                <CardContent className="space-y-3">
                  <div className="p-3 rounded-lg bg-dark-800/30">
                    <p className="text-sm text-dark-200 mb-2">
                      Your mood tends to be highest on days when you exercise and get enough sleep.
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="green" size="sm">+23% mood</Badge>
                      <span className="text-xs text-dark-400">with exercise</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-dark-800/30">
                    <p className="text-sm text-dark-200">
                      Consider journaling earlier in the day - your entries are more detailed before 6 PM.
                    </p>
                  </div>

                  <Button variant="ghost" size="sm" className="w-full" onClick={openAIPanel}>
                    <Sparkles className="w-4 h-4 mr-1" />
                    Explore with AI
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Create Entry Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="New Journal Entry"
          size="xl"
        >
          <JournalEditor
            date={selectedDate}
            onClose={() => setIsCreateModalOpen(false)}
          />
        </Modal>
      </PageContainer>
    </MainLayout>
  );
}

// Journal Editor Component
function JournalEditor({
  entry,
  date,
  onClose,
}: {
  entry?: JournalEntry;
  date: Date;
  onClose: () => void;
}) {
  const [content, setContent] = useState(entry?.content || '');
  const [mood, setMood] = useState(entry?.mood?.score || 0);
  const [energy, setEnergy] = useState(entry?.mood?.energyLevel || 0);
  const [emotions, setEmotions] = useState<string[]>(entry?.mood?.emotions || []);
  const [gratitude, setGratitude] = useState<string[]>(entry?.gratitude || ['', '', '']);
  const [tags, setTags] = useState<string[]>(entry?.tags || []);
  const [newTag, setNewTag] = useState('');

  const emotionOptions = [
    'happy', 'grateful', 'peaceful', 'excited', 'motivated',
    'anxious', 'stressed', 'sad', 'frustrated', 'tired',
    'focused', 'creative', 'confident', 'hopeful', 'content'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ content, mood, energy, emotions, gratitude, tags });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date display */}
      <div className="flex items-center gap-2 text-dark-300">
        <Calendar className="w-4 h-4" />
        <span>{formatDate(date)}</span>
      </div>

      {/* Mood Selection */}
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-3">
          How are you feeling?
        </label>
        <div className="flex justify-between">
          {moodOptions.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMood(option.value)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl transition-all',
                mood === option.value
                  ? cn(option.bg, 'border-2', option.color.replace('text-', 'border-'))
                  : 'bg-dark-800/30 hover:bg-dark-800/50'
              )}
            >
              <option.icon className={cn('w-8 h-8', option.color)} />
              <span className="text-xs text-dark-300">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Energy Level */}
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-3">
          Energy Level
        </label>
        <div className="flex justify-between">
          {energyOptions.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => setEnergy(option.value)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-xl transition-all',
                energy === option.value
                  ? 'bg-neon-orange/20 border-2 border-neon-orange'
                  : 'bg-dark-800/30 hover:bg-dark-800/50'
              )}
            >
              <option.icon className={cn(
                'w-6 h-6',
                energy === option.value ? 'text-neon-orange' : 'text-dark-400'
              )} />
              <span className="text-xs text-dark-300">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Emotions */}
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-3">
          What emotions are you experiencing?
        </label>
        <div className="flex flex-wrap gap-2">
          {emotionOptions.map(emotion => (
            <button
              key={emotion}
              type="button"
              onClick={() => {
                if (emotions.includes(emotion)) {
                  setEmotions(emotions.filter(e => e !== emotion));
                } else {
                  setEmotions([...emotions, emotion]);
                }
              }}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm transition-all',
                emotions.includes(emotion)
                  ? 'bg-neon-cyan/20 text-neon-cyan'
                  : 'bg-dark-800/30 text-dark-300 hover:text-white'
              )}
            >
              {emotion}
            </button>
          ))}
        </div>
      </div>

      {/* Gratitude */}
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-3">
          <Heart className="w-4 h-4 inline mr-2 text-neon-pink" />
          3 Things You're Grateful For
        </label>
        <div className="space-y-2">
          {gratitude.map((item, i) => (
            <input
              key={i}
              type="text"
              placeholder={`${i + 1}. I'm grateful for...`}
              value={item}
              onChange={e => {
                const newGratitude = [...gratitude];
                newGratitude[i] = e.target.value;
                setGratitude(newGratitude);
              }}
              className={cn(
                'w-full px-4 py-2 rounded-lg text-sm',
                'bg-dark-800/50 border border-dark-700/50',
                'text-white placeholder:text-dark-500',
                'focus:outline-none focus:ring-2 focus:ring-neon-pink/50'
              )}
            />
          ))}
        </div>
      </div>

      {/* Journal Content */}
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-3">
          <PenLine className="w-4 h-4 inline mr-2" />
          Journal Entry
        </label>
        <textarea
          placeholder="Write about your day, thoughts, experiences..."
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={8}
          className={cn(
            'w-full px-4 py-3 rounded-xl text-sm',
            'bg-dark-800/50 border border-dark-700/50',
            'text-white placeholder:text-dark-500',
            'focus:outline-none focus:ring-2 focus:ring-neon-cyan/50',
            'resize-none'
          )}
        />
      </div>

      {/* AI Prompt Suggestion */}
      <div className="p-4 rounded-xl bg-neon-purple/10 border border-neon-purple/20">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-neon-purple" />
          <span className="text-sm font-medium text-neon-purple">Writing Prompt</span>
        </div>
        <p className="text-sm text-dark-300 mb-3">
          {promptSuggestions[Math.floor(Math.random() * promptSuggestions.length)]}
        </p>
        <Button type="button" variant="ghost" size="sm">
          <Brain className="w-4 h-4 mr-1" />
          Get AI Reflection
        </Button>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="glow">
          Save Entry
        </Button>
      </div>
    </form>
  );
}
