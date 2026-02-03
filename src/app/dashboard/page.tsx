'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Moon,
  CloudSun,
  Cloud,
  CloudRain,
  Zap,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Smile,
  Frown,
  Meh,
  Heart,
  Brain,
  Target,
  CheckCircle2,
  Clock,
  CalendarDays,
  ListTodo,
  TrendingUp,
  Sparkles,
  Plus,
  ArrowRight,
  ChevronRight,
  Activity,
  Coffee,
  Flame,
  Droplets,
  Moon as MoonIcon,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress, CircularProgress } from '@/components/ui/Progress';
import { Badge, PriorityBadge } from '@/components/ui/Badge';
import { useUIStore } from '@/stores/uiStore';
import { useTaskStore } from '@/stores/taskStore';
import { formatTime, formatDate, getGreeting, cn } from '@/lib/utils';
import type { Task, CalendarEvent, MoodEntry, WellnessEntry } from '@/types';

// Mock data for demonstration
const mockTasks: Task[] = [
  {
    id: '1',
    userId: 'user1',
    title: 'Review project proposal',
    description: 'Go through the Q2 project proposal and provide feedback',
    priority: 'high',
    status: 'in-progress',
    dueDate: new Date(),
    tags: ['work', 'important'],
    subtasks: [],
    contextTriggers: [],
    estimatedMinutes: 45,
    aiSuggested: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    userId: 'user1',
    title: 'Team standup meeting',
    description: 'Daily sync with the development team',
    priority: 'medium',
    status: 'pending',
    dueDate: new Date(),
    tags: ['meeting'],
    subtasks: [],
    contextTriggers: [],
    estimatedMinutes: 15,
    aiSuggested: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    userId: 'user1',
    title: 'Finish meditation session',
    description: '15 minute guided meditation',
    priority: 'low',
    status: 'completed',
    dueDate: new Date(),
    tags: ['wellness', 'habit'],
    subtasks: [],
    contextTriggers: [],
    estimatedMinutes: 15,
    aiSuggested: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    userId: 'user1',
    title: 'Client Call',
    startTime: new Date(new Date().setHours(10, 0)),
    endTime: new Date(new Date().setHours(11, 0)),
    type: 'meeting',
    isAllDay: false,
    recurrence: null,
    reminderMinutes: [15],
    attendees: ['client@example.com'],
    location: 'Zoom',
    aiGenerated: false,
    conflictResolved: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    userId: 'user1',
    title: 'Deep Work Block',
    startTime: new Date(new Date().setHours(14, 0)),
    endTime: new Date(new Date().setHours(16, 0)),
    type: 'focus',
    isAllDay: false,
    recurrence: null,
    reminderMinutes: [5],
    aiGenerated: true,
    conflictResolved: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const quickActions = [
  { icon: Plus, label: 'New Task', color: 'neon-cyan', action: 'new-task' },
  { icon: CalendarDays, label: 'Add Event', color: 'neon-purple', action: 'new-event' },
  { icon: Brain, label: 'Ask AI', color: 'neon-pink', action: 'ai-chat' },
  { icon: Target, label: 'Focus Mode', color: 'neon-green', action: 'focus-mode' },
];

const aiInsights = [
  {
    type: 'suggestion',
    message: 'Based on your energy patterns, consider scheduling deep work between 2-4 PM today.',
    icon: Zap,
    color: 'neon-cyan',
  },
  {
    type: 'reminder',
    message: 'You have a 3-day streak on meditation. Keep it up! 🔥',
    icon: Flame,
    color: 'neon-orange',
  },
  {
    type: 'insight',
    message: 'Your productivity is 23% higher on days when you exercise in the morning.',
    icon: TrendingUp,
    color: 'neon-green',
  },
];

// Energy level estimation based on time and patterns
function getEnergyLevel(hour: number): { level: number; label: string; icon: typeof Battery } {
  if (hour >= 6 && hour < 10) return { level: 85, label: 'High Energy', icon: BatteryFull };
  if (hour >= 10 && hour < 14) return { level: 70, label: 'Good Energy', icon: BatteryMedium };
  if (hour >= 14 && hour < 17) return { level: 50, label: 'Moderate', icon: BatteryMedium };
  if (hour >= 17 && hour < 21) return { level: 40, label: 'Winding Down', icon: BatteryLow };
  return { level: 25, label: 'Rest Time', icon: BatteryLow };
}

// Weather icon based on conditions
function getWeatherIcon(condition: string) {
  switch (condition) {
    case 'sunny': return Sun;
    case 'partly-cloudy': return CloudSun;
    case 'cloudy': return Cloud;
    case 'rainy': return CloudRain;
    default: return Sun;
  }
}

// Mood icon
function getMoodIcon(mood: number) {
  if (mood >= 4) return Smile;
  if (mood >= 3) return Meh;
  return Frown;
}

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [energyLevel, setEnergyLevel] = useState(getEnergyLevel(new Date().getHours()));
  const [currentMood, setCurrentMood] = useState(4); // 1-5 scale
  const { openAIPanel, toggleFocusMode } = useUIStore();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      setEnergyLevel(getEnergyLevel(now.getHours()));
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const hour = currentTime.getHours();
  const isNight = hour < 6 || hour >= 21;
  const WeatherIcon = getWeatherIcon('sunny');
  const MoodIcon = getMoodIcon(currentMood);
  const EnergyIcon = energyLevel.icon;

  const completedTasks = mockTasks.filter(t => t.status === 'completed').length;
  const totalTasks = mockTasks.length;
  const taskProgress = Math.round((completedTasks / totalTasks) * 100);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'ai-chat':
        openAIPanel();
        break;
      case 'focus-mode':
        toggleFocusMode();
        break;
      // Add more actions as needed
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Hero Section - Time, Date, Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-dark-900/80 via-dark-800/50 to-dark-900/80 border border-dark-700/50 backdrop-blur-xl p-8"
        >
          {/* Background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/5 via-neon-purple/5 to-neon-pink/5 opacity-50" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-neon-purple/10 rounded-full blur-3xl" />
          
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Time & Greeting */}
            <div>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-dark-400 mb-1"
              >
                {formatDate(currentTime)}
              </motion.p>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl lg:text-5xl font-bold mb-2"
              >
                <span className="text-white">{getGreeting()}, </span>
                <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                  Alex
                </span>
              </motion.h1>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-4 text-dark-300"
              >
                <span className="text-6xl font-light text-white font-mono">
                  {formatTime(currentTime)}
                </span>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800/50">
                  <WeatherIcon className="w-5 h-5 text-neon-orange" />
                  <span>24°C</span>
                </div>
              </motion.div>
            </div>

            {/* Quick Status Indicators */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              {/* Energy Level */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-800/50 border border-dark-700/50">
                <div className={cn(
                  'p-2 rounded-lg',
                  energyLevel.level >= 70 ? 'bg-neon-green/20' :
                  energyLevel.level >= 40 ? 'bg-neon-orange/20' : 'bg-status-error/20'
                )}>
                  <EnergyIcon className={cn(
                    'w-5 h-5',
                    energyLevel.level >= 70 ? 'text-neon-green' :
                    energyLevel.level >= 40 ? 'text-neon-orange' : 'text-status-error'
                  )} />
                </div>
                <div>
                  <p className="text-xs text-dark-400">Energy</p>
                  <p className="text-sm font-medium text-white">{energyLevel.label}</p>
                </div>
              </div>

              {/* Mood */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-800/50 border border-dark-700/50">
                <div className={cn(
                  'p-2 rounded-lg',
                  currentMood >= 4 ? 'bg-neon-green/20' :
                  currentMood >= 3 ? 'bg-neon-orange/20' : 'bg-status-error/20'
                )}>
                  <MoodIcon className={cn(
                    'w-5 h-5',
                    currentMood >= 4 ? 'text-neon-green' :
                    currentMood >= 3 ? 'text-neon-orange' : 'text-status-error'
                  )} />
                </div>
                <div>
                  <p className="text-xs text-dark-400">Mood</p>
                  <p className="text-sm font-medium text-white">Good</p>
                </div>
              </div>

              {/* Today's Progress */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-800/50 border border-dark-700/50">
                <CircularProgress value={taskProgress} size={44} strokeWidth={4} />
                <div>
                  <p className="text-xs text-dark-400">Tasks Done</p>
                  <p className="text-sm font-medium text-white">{completedTasks}/{totalTasks}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {quickActions.map((action, index) => (
            <motion.button
              key={action.action}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              onClick={() => handleQuickAction(action.action)}
              className={cn(
                'group relative flex items-center gap-3 p-4 rounded-xl',
                'bg-dark-900/50 border border-dark-700/50 backdrop-blur-sm',
                'hover:border-neon-cyan/30 transition-all duration-300',
                'cursor-pointer'
              )}
            >
              <div className={cn(
                'p-2.5 rounded-lg transition-colors',
                `bg-${action.color}/10 group-hover:bg-${action.color}/20`
              )}>
                <action.icon className={`w-5 h-5 text-${action.color}`} />
              </div>
              <span className="text-sm font-medium text-white">{action.label}</span>
              <ChevronRight className="w-4 h-4 text-dark-500 ml-auto group-hover:text-neon-cyan group-hover:translate-x-1 transition-all" />
            </motion.button>
          ))}
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Priorities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card variant="glass">
              <CardHeader
                title="Today's Priorities"
                subtitle="Focus on what matters most"
                icon={<Target className="w-5 h-5 text-neon-cyan" />}
                action={
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                }
              />
              <CardContent>
                <div className="space-y-3">
                  {mockTasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className={cn(
                        'group flex items-center gap-4 p-4 rounded-xl',
                        'bg-dark-800/30 border border-dark-700/30',
                        'hover:bg-dark-800/50 hover:border-neon-cyan/20 transition-all',
                        task.status === 'completed' && 'opacity-60'
                      )}
                    >
                      {/* Checkbox */}
                      <button 
                        className={cn(
                          'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                          task.status === 'completed' 
                            ? 'bg-neon-green border-neon-green' 
                            : 'border-dark-500 hover:border-neon-cyan'
                        )}
                      >
                        {task.status === 'completed' && (
                          <CheckCircle2 className="w-4 h-4 text-dark-900" />
                        )}
                      </button>

                      {/* Task Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={cn(
                            'text-sm font-medium truncate',
                            task.status === 'completed' ? 'text-dark-400 line-through' : 'text-white'
                          )}>
                            {task.title}
                          </p>
                          {task.aiSuggested && (
                            <Sparkles className="w-3.5 h-3.5 text-neon-purple" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {task.estimatedMinutes && (
                            <span className="text-xs text-dark-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {task.estimatedMinutes}m
                            </span>
                          )}
                          {task.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Priority */}
                      <PriorityBadge priority={task.priority} />
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card variant="glass" className="h-full">
              <CardHeader
                title="AI Insights"
                subtitle="Personalized for you"
                icon={<Brain className="w-5 h-5 text-neon-purple" />}
              />
              <CardContent>
                <div className="space-y-4">
                  {aiInsights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className={cn(
                        'p-4 rounded-xl',
                        'bg-dark-800/30 border border-dark-700/30',
                        'hover:border-neon-purple/30 transition-colors'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-${insight.color}/10`}>
                          <insight.icon className={`w-4 h-4 text-${insight.color}`} />
                        </div>
                        <p className="text-sm text-dark-200 leading-relaxed">
                          {insight.message}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  <Button
                    variant="glass"
                    className="w-full mt-4"
                    onClick={openAIPanel}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Chat with Nexora AI
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Schedule & Wellness Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card variant="glass">
              <CardHeader
                title="Today's Schedule"
                subtitle={formatDate(currentTime)}
                icon={<CalendarDays className="w-5 h-5 text-neon-orange" />}
                action={
                  <Button variant="ghost" size="sm">
                    Open Calendar
                  </Button>
                }
              />
              <CardContent>
                <div className="space-y-3">
                  {mockEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="flex items-center gap-4"
                    >
                      {/* Time */}
                      <div className="w-16 text-right">
                        <p className="text-sm font-medium text-white">
                          {formatTime(event.startTime)}
                        </p>
                        <p className="text-xs text-dark-500">
                          {formatTime(event.endTime)}
                        </p>
                      </div>

                      {/* Timeline dot */}
                      <div className="relative flex flex-col items-center">
                        <div className={cn(
                          'w-3 h-3 rounded-full',
                          event.type === 'focus' ? 'bg-neon-green' :
                          event.type === 'meeting' ? 'bg-neon-orange' : 'bg-neon-cyan'
                        )} />
                        {index < mockEvents.length - 1 && (
                          <div className="w-0.5 h-12 bg-dark-700/50 my-1" />
                        )}
                      </div>

                      {/* Event card */}
                      <div className={cn(
                        'flex-1 p-3 rounded-lg',
                        'bg-dark-800/30 border-l-2',
                        event.type === 'focus' ? 'border-neon-green' :
                        event.type === 'meeting' ? 'border-neon-orange' : 'border-neon-cyan'
                      )}>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-white">{event.title}</p>
                          {event.aiGenerated && (
                            <Sparkles className="w-3 h-3 text-neon-purple" />
                          )}
                        </div>
                        {event.location && (
                          <p className="text-xs text-dark-400">{event.location}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}

                  {/* Add event button */}
                  <Button variant="ghost" size="sm" className="w-full mt-2">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Wellness Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card variant="glass">
              <CardHeader
                title="Wellness Check"
                subtitle="How are you doing today?"
                icon={<Heart className="w-5 h-5 text-neon-pink" />}
              />
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {/* Sleep */}
                  <div className="p-4 rounded-xl bg-dark-800/30 border border-dark-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      <MoonIcon className="w-4 h-4 text-neon-purple" />
                      <span className="text-sm text-dark-300">Sleep</span>
                    </div>
                    <p className="text-2xl font-semibold text-white">7.5h</p>
                    <Progress value={75} size="sm" variant="purple" className="mt-2" />
                  </div>

                  {/* Water */}
                  <div className="p-4 rounded-xl bg-dark-800/30 border border-dark-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Droplets className="w-4 h-4 text-neon-cyan" />
                      <span className="text-sm text-dark-300">Water</span>
                    </div>
                    <p className="text-2xl font-semibold text-white">4/8</p>
                    <Progress value={50} size="sm" variant="cyan" className="mt-2" />
                  </div>

                  {/* Activity */}
                  <div className="p-4 rounded-xl bg-dark-800/30 border border-dark-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-neon-green" />
                      <span className="text-sm text-dark-300">Activity</span>
                    </div>
                    <p className="text-2xl font-semibold text-white">4,230</p>
                    <Progress value={42} size="sm" variant="green" className="mt-2" />
                  </div>

                  {/* Focus */}
                  <div className="p-4 rounded-xl bg-dark-800/30 border border-dark-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Coffee className="w-4 h-4 text-neon-orange" />
                      <span className="text-sm text-dark-300">Focus Time</span>
                    </div>
                    <p className="text-2xl font-semibold text-white">2.5h</p>
                    <Progress value={62} size="sm" variant="orange" className="mt-2" />
                  </div>
                </div>

                {/* Log wellness button */}
                <Button variant="glass" className="w-full mt-4">
                  <Heart className="w-4 h-4 mr-2" />
                  Log Wellness Check
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { label: 'Tasks Completed', value: '12', change: '+3 today', color: 'neon-cyan', icon: CheckCircle2 },
            { label: 'Streak Days', value: '7', change: 'Keep going!', color: 'neon-orange', icon: Flame },
            { label: 'Focus Hours', value: '18h', change: 'This week', color: 'neon-purple', icon: Brain },
            { label: 'Goals Progress', value: '68%', change: '3 active', color: 'neon-green', icon: Target },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + index * 0.1 }}
              className="p-4 rounded-xl bg-dark-900/50 border border-dark-700/50 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-dark-400">{stat.label}</span>
                <stat.icon className={`w-4 h-4 text-${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className={`text-xs text-${stat.color}`}>{stat.change}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </MainLayout>
  );
}
