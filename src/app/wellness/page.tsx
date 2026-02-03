'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Activity,
  Moon,
  Droplets,
  Brain,
  Flame,
  TrendingUp,
  TrendingDown,
  Plus,
  MoreHorizontal,
  Calendar,
  Clock,
  Target,
  Award,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Footprints,
  Dumbbell,
  Apple,
  Coffee,
  Wine,
  Pill,
  Scale,
  Thermometer,
  Eye,
  Ear,
  Smile,
  Frown,
  Meh,
  Zap,
  Battery,
  BatteryLow,
  BatteryFull,
  Sun,
  Leaf,
  Settings,
} from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Progress, CircularProgress } from '@/components/ui/Progress';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/Loading';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

// Types
interface HealthMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  goal: number;
  icon: any;
  color: string;
  trend: 'up' | 'down' | 'stable';
  history: { date: string; value: number }[];
}

interface SleepData {
  date: string;
  duration: number; // minutes
  quality: number; // 1-100
  bedTime: string;
  wakeTime: string;
  deepSleep: number;
  remSleep: number;
  lightSleep: number;
}

interface ActivityLog {
  id: string;
  type: string;
  name: string;
  duration: number;
  calories: number;
  timestamp: Date;
  icon: any;
}

interface MoodEntry {
  date: string;
  mood: number; // 1-5
  energy: number; // 1-5
  stress: number; // 1-5
  notes?: string;
}

// Mock data
const mockMetrics: HealthMetric[] = [
  {
    id: 'steps',
    name: 'Steps',
    value: 8432,
    unit: 'steps',
    goal: 10000,
    icon: Footprints,
    color: '#00f0ff',
    trend: 'up',
    history: [
      { date: '2024-01-08', value: 7500 },
      { date: '2024-01-09', value: 9200 },
      { date: '2024-01-10', value: 8100 },
      { date: '2024-01-11', value: 8432 },
    ],
  },
  {
    id: 'water',
    name: 'Water',
    value: 6,
    unit: 'glasses',
    goal: 8,
    icon: Droplets,
    color: '#3b82f6',
    trend: 'stable',
    history: [
      { date: '2024-01-08', value: 7 },
      { date: '2024-01-09', value: 5 },
      { date: '2024-01-10', value: 8 },
      { date: '2024-01-11', value: 6 },
    ],
  },
  {
    id: 'sleep',
    name: 'Sleep',
    value: 7.5,
    unit: 'hours',
    goal: 8,
    icon: Moon,
    color: '#a855f7',
    trend: 'up',
    history: [
      { date: '2024-01-08', value: 6.5 },
      { date: '2024-01-09', value: 7 },
      { date: '2024-01-10', value: 7.2 },
      { date: '2024-01-11', value: 7.5 },
    ],
  },
  {
    id: 'calories',
    name: 'Calories',
    value: 1850,
    unit: 'kcal',
    goal: 2000,
    icon: Flame,
    color: '#f97316',
    trend: 'stable',
    history: [
      { date: '2024-01-08', value: 2100 },
      { date: '2024-01-09', value: 1920 },
      { date: '2024-01-10', value: 1800 },
      { date: '2024-01-11', value: 1850 },
    ],
  },
  {
    id: 'exercise',
    name: 'Exercise',
    value: 45,
    unit: 'min',
    goal: 60,
    icon: Dumbbell,
    color: '#10b981',
    trend: 'up',
    history: [
      { date: '2024-01-08', value: 30 },
      { date: '2024-01-09', value: 0 },
      { date: '2024-01-10', value: 60 },
      { date: '2024-01-11', value: 45 },
    ],
  },
  {
    id: 'heartRate',
    name: 'Avg Heart Rate',
    value: 72,
    unit: 'bpm',
    goal: 75,
    icon: Heart,
    color: '#ec4899',
    trend: 'down',
    history: [
      { date: '2024-01-08', value: 78 },
      { date: '2024-01-09', value: 75 },
      { date: '2024-01-10', value: 74 },
      { date: '2024-01-11', value: 72 },
    ],
  },
];

const mockSleepData: SleepData = {
  date: new Date().toISOString().split('T')[0],
  duration: 7.5 * 60,
  quality: 82,
  bedTime: '23:30',
  wakeTime: '07:00',
  deepSleep: 90,
  remSleep: 100,
  lightSleep: 260,
};

const mockActivities: ActivityLog[] = [
  {
    id: '1',
    type: 'exercise',
    name: 'Morning Run',
    duration: 30,
    calories: 320,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    icon: Activity,
  },
  {
    id: '2',
    type: 'exercise',
    name: 'Strength Training',
    duration: 45,
    calories: 280,
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    icon: Dumbbell,
  },
  {
    id: '3',
    type: 'wellness',
    name: 'Meditation',
    duration: 15,
    calories: 0,
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    icon: Brain,
  },
];

const mockMoodData: MoodEntry[] = [
  { date: '2024-01-11', mood: 4, energy: 4, stress: 2 },
  { date: '2024-01-10', mood: 3, energy: 3, stress: 3 },
  { date: '2024-01-09', mood: 4, energy: 5, stress: 2 },
  { date: '2024-01-08', mood: 3, energy: 3, stress: 4 },
  { date: '2024-01-07', mood: 4, energy: 4, stress: 2 },
  { date: '2024-01-06', mood: 5, energy: 5, stress: 1 },
  { date: '2024-01-05', mood: 4, energy: 4, stress: 2 },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WellnessPage() {
  const [metrics, setMetrics] = useState(mockMetrics);
  const [sleepData] = useState(mockSleepData);
  const [activities] = useState(mockActivities);
  const [moodData] = useState(mockMoodData);
  const [selectedMetric, setSelectedMetric] = useState<HealthMetric | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const { openAIPanel } = useUIStore();

  const today = new Date();

  // Calculate wellness score
  const wellnessScore = useMemo(() => {
    const scores = metrics.map(m => Math.min((m.value / m.goal) * 100, 100));
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [metrics]);

  // Update metric value
  const updateMetric = (id: string, delta: number) => {
    setMetrics(prev =>
      prev.map(m =>
        m.id === id
          ? { ...m, value: Math.max(0, m.value + delta) }
          : m
      )
    );
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const MetricCard = ({ metric }: { metric: HealthMetric }) => {
    const Icon = metric.icon;
    const percentage = Math.min((metric.value / metric.goal) * 100, 100);
    const isCompleted = percentage >= 100;

    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setSelectedMetric(metric)}
        className={cn(
          'p-4 rounded-xl text-left transition-all w-full',
          'bg-dark-900/50 border border-dark-700/50 backdrop-blur-sm',
          'hover:border-opacity-50',
          isCompleted && 'border-neon-green/30 bg-neon-green/5'
        )}
        style={{
          borderColor: isCompleted ? undefined : `${metric.color}20`,
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${metric.color}20` }}
          >
            <Icon className="w-5 h-5" style={{ color: metric.color }} />
          </div>
          {metric.trend === 'up' ? (
            <TrendingUp className="w-4 h-4 text-neon-green" />
          ) : metric.trend === 'down' ? (
            <TrendingDown className="w-4 h-4 text-neon-orange" />
          ) : (
            <span className="w-4 h-1 bg-dark-500 rounded" />
          )}
        </div>

        <p className="text-sm text-dark-400 mb-1">{metric.name}</p>
        <p className="text-2xl font-bold text-white mb-2">
          {metric.value.toLocaleString()}
          <span className="text-sm font-normal text-dark-400 ml-1">{metric.unit}</span>
        </p>

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-dark-500">
            Goal: {metric.goal.toLocaleString()} {metric.unit}
          </span>
          <span
            className="text-xs font-medium"
            style={{ color: isCompleted ? '#22c55e' : metric.color }}
          >
            {Math.round(percentage)}%
          </span>
        </div>
        <Progress
          value={percentage}
          variant={isCompleted ? 'green' : 'cyan'}
          size="sm"
          className="h-1.5"
        />
      </motion.button>
    );
  };

  return (
    <MainLayout>
      <PageContainer title="Wellness" subtitle="Your health, visualized and optimized">
        {/* Top Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          {/* Wellness Score */}
          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">Wellness Score</span>
              <CircularProgress value={wellnessScore} size={48} strokeWidth={4} />
            </div>
            <p className="text-2xl font-bold text-white">{wellnessScore}%</p>
            <p className="text-xs text-dark-500">Overall health rating</p>
          </Card>

          {/* Sleep Quality */}
          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">Sleep Quality</span>
              <Moon className="w-6 h-6 text-neon-purple" />
            </div>
            <p className="text-2xl font-bold text-white">{sleepData.quality}%</p>
            <p className="text-xs text-dark-500">{formatTime(sleepData.duration)} last night</p>
          </Card>

          {/* Active Minutes */}
          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">Active Minutes</span>
              <Activity className="w-6 h-6 text-neon-green" />
            </div>
            <p className="text-2xl font-bold text-white">
              {activities.reduce((sum, a) => sum + a.duration, 0)}
            </p>
            <p className="text-xs text-dark-500">minutes today</p>
          </Card>

          {/* Calories Burned */}
          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">Calories Burned</span>
              <Flame className="w-6 h-6 text-neon-orange" />
            </div>
            <p className="text-2xl font-bold text-white">
              {activities.reduce((sum, a) => sum + a.calories, 0)}
            </p>
            <p className="text-xs text-dark-500">kcal from activities</p>
          </Card>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Health Metrics Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Health Metrics</h2>
                <Button variant="outline" size="sm" onClick={() => setIsLogModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Log Data
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {metrics.map(metric => (
                  <MetricCard key={metric.id} metric={metric} />
                ))}
              </div>
            </div>

            {/* Sleep Analysis */}
            <Card variant="glass">
              <CardHeader
                title="Sleep Analysis"
                icon={<Moon className="w-5 h-5 text-neon-purple" />}
                action={
                  <span className="text-sm text-dark-400">Last Night</span>
                }
              />
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 rounded-lg bg-dark-800/30 text-center">
                    <p className="text-2xl font-bold text-white">{formatTime(sleepData.duration)}</p>
                    <p className="text-xs text-dark-400">Total Sleep</p>
                  </div>
                  <div className="p-3 rounded-lg bg-dark-800/30 text-center">
                    <p className="text-2xl font-bold text-neon-purple">{sleepData.quality}%</p>
                    <p className="text-xs text-dark-400">Quality</p>
                  </div>
                  <div className="p-3 rounded-lg bg-dark-800/30 text-center">
                    <p className="text-2xl font-bold text-white">{sleepData.bedTime}</p>
                    <p className="text-xs text-dark-400">Bed Time</p>
                  </div>
                  <div className="p-3 rounded-lg bg-dark-800/30 text-center">
                    <p className="text-2xl font-bold text-white">{sleepData.wakeTime}</p>
                    <p className="text-xs text-dark-400">Wake Time</p>
                  </div>
                </div>

                {/* Sleep stages */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-dark-200">Sleep Stages</p>
                  <div className="space-y-2">
                    {[
                      { name: 'Deep Sleep', value: sleepData.deepSleep, color: '#a855f7', total: sleepData.duration },
                      { name: 'REM Sleep', value: sleepData.remSleep, color: '#00f0ff', total: sleepData.duration },
                      { name: 'Light Sleep', value: sleepData.lightSleep, color: '#6366f1', total: sleepData.duration },
                    ].map(stage => (
                      <div key={stage.name} className="flex items-center gap-3">
                        <span className="w-24 text-sm text-dark-400">{stage.name}</span>
                        <div className="flex-1">
                          <Progress
                            value={(stage.value / stage.total) * 100}
                            variant="purple"
                            size="sm"
                          />
                        </div>
                        <span className="text-sm text-dark-300 w-16 text-right">
                          {formatTime(stage.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mood Trends */}
            <Card variant="glass">
              <CardHeader
                title="Mood & Energy Trends"
                icon={<Brain className="w-5 h-5 text-neon-cyan" />}
              />
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {moodData.slice(0, 7).reverse().map((entry, i) => {
                    const date = new Date(entry.date);
                    const moodColors = ['#ef4444', '#f97316', '#fbbf24', '#22c55e', '#10b981'];
                    const moodEmojis = ['😢', '😕', '😐', '🙂', '😊'];

                    return (
                      <div key={entry.date} className="text-center">
                        <div
                          className="w-full aspect-square rounded-xl flex items-center justify-center text-xl mb-1"
                          style={{ backgroundColor: `${moodColors[entry.mood - 1]}20` }}
                        >
                          {moodEmojis[entry.mood - 1]}
                        </div>
                        <p className="text-xs text-dark-400">
                          {DAYS[date.getDay()]}
                        </p>
                        <div className="flex items-center justify-center gap-0.5 mt-1">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <div
                              key={j}
                              className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                j < entry.energy ? 'bg-neon-cyan' : 'bg-dark-700'
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-dark-700/30">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🙂</span>
                    <span className="text-sm text-dark-400">Mood</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div
                          key={i}
                          className={cn(
                            'w-2 h-2 rounded-full',
                            i <= 3 ? 'bg-neon-cyan' : 'bg-dark-700'
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-dark-400">Energy</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column - Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Quick Actions */}
            <Card variant="glass">
              <CardHeader
                title="Quick Log"
                icon={<Plus className="w-5 h-5 text-neon-cyan" />}
              />
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: Droplets, label: 'Water', color: '#3b82f6', action: () => updateMetric('water', 1) },
                    { icon: Apple, label: 'Meal', color: '#22c55e', action: () => {} },
                    { icon: Coffee, label: 'Coffee', color: '#f97316', action: () => {} },
                    { icon: Dumbbell, label: 'Exercise', color: '#10b981', action: () => {} },
                    { icon: Pill, label: 'Medicine', color: '#a855f7', action: () => {} },
                    { icon: Moon, label: 'Sleep', color: '#6366f1', action: () => {} },
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={item.action}
                      className="p-3 rounded-xl bg-dark-800/30 hover:bg-dark-700/30 transition-colors flex flex-col items-center gap-2"
                    >
                      <item.icon className="w-5 h-5" style={{ color: item.color }} />
                      <span className="text-xs text-dark-400">{item.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Today's Activities */}
            <Card variant="glass">
              <CardHeader
                title="Today's Activities"
                icon={<Activity className="w-5 h-5 text-neon-green" />}
              />
              <CardContent className="space-y-3">
                {activities.map(activity => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-dark-800/30"
                  >
                    <div className="p-2 rounded-lg bg-neon-green/10">
                      <activity.icon className="w-4 h-4 text-neon-green" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {activity.name}
                      </p>
                      <p className="text-xs text-dark-400">
                        {activity.duration} min • {activity.calories} kcal
                      </p>
                    </div>
                    <span className="text-xs text-dark-500">
                      {activity.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}

                <Button variant="ghost" size="sm" className="w-full">
                  <Plus className="w-4 h-4 mr-1" />
                  Log Activity
                </Button>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card variant="glass">
              <CardHeader
                title="AI Insights"
                icon={<Sparkles className="w-5 h-5 text-neon-purple" />}
              />
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-neon-green/10 border border-neon-green/20">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-neon-green" />
                    <span className="text-xs font-medium text-neon-green">Great Progress!</span>
                  </div>
                  <p className="text-sm text-dark-300">
                    Your sleep quality improved 15% this week. Keep up the consistent bedtime routine!
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-neon-orange/10 border border-neon-orange/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets className="w-4 h-4 text-neon-orange" />
                    <span className="text-xs font-medium text-neon-orange">Reminder</span>
                  </div>
                  <p className="text-sm text-dark-300">
                    You're 2 glasses behind on water intake. Try drinking water with each meal.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-dark-800/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-4 h-4 text-neon-cyan" />
                    <span className="text-xs font-medium text-dark-200">Suggestion</span>
                  </div>
                  <p className="text-sm text-dark-400">
                    Your energy peaks around 10 AM. Schedule demanding tasks during this window.
                  </p>
                </div>

                <Button variant="ghost" size="sm" className="w-full" onClick={openAIPanel}>
                  <Sparkles className="w-4 h-4 mr-1" />
                  Get Health Report
                </Button>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card variant="glass">
              <CardHeader
                title="Achievements"
                icon={<Award className="w-5 h-5 text-neon-orange" />}
              />
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[
                    { emoji: '🏃', name: '10k Steps', unlocked: true },
                    { emoji: '💧', name: 'Hydration Hero', unlocked: true },
                    { emoji: '😴', name: 'Sleep Master', unlocked: true },
                    { emoji: '🔥', name: '7-Day Streak', unlocked: false },
                  ].map((achievement, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg',
                        achievement.unlocked
                          ? 'bg-neon-orange/10 border border-neon-orange/20'
                          : 'bg-dark-800/30 opacity-50'
                      )}
                    >
                      <span className="text-lg">{achievement.emoji}</span>
                      <span className="text-xs text-dark-300">{achievement.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Metric Details Modal */}
        <Modal
          isOpen={!!selectedMetric}
          onClose={() => setSelectedMetric(null)}
          title={selectedMetric?.name || 'Metric Details'}
          size="md"
        >
          {selectedMetric && (
            <MetricDetails
              metric={selectedMetric}
              onUpdate={(delta) => {
                updateMetric(selectedMetric.id, delta);
              }}
              onClose={() => setSelectedMetric(null)}
            />
          )}
        </Modal>

        {/* Log Data Modal */}
        <Modal
          isOpen={isLogModalOpen}
          onClose={() => setIsLogModalOpen(false)}
          title="Log Health Data"
          size="lg"
        >
          <LogDataForm onClose={() => setIsLogModalOpen(false)} />
        </Modal>
      </PageContainer>
    </MainLayout>
  );
}

// Metric Details Component
function MetricDetails({
  metric,
  onUpdate,
  onClose,
}: {
  metric: HealthMetric;
  onUpdate: (delta: number) => void;
  onClose: () => void;
}) {
  const Icon = metric.icon;
  const percentage = Math.min((metric.value / metric.goal) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: `${metric.color}20` }}
        >
          <Icon className="w-8 h-8" style={{ color: metric.color }} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{metric.name}</h3>
          <p className="text-sm text-dark-400">
            {metric.value.toLocaleString()} / {metric.goal.toLocaleString()} {metric.unit}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-dark-400">Today's Progress</span>
          <span className="text-sm font-medium" style={{ color: metric.color }}>
            {Math.round(percentage)}%
          </span>
        </div>
        <Progress value={percentage} variant="cyan" />
      </div>

      {/* Quick Update */}
      <div className="p-4 rounded-xl bg-dark-800/30">
        <p className="text-sm font-medium text-dark-200 mb-3">Quick Update</p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => onUpdate(-1)}
            className="p-3 rounded-xl bg-dark-700/50 hover:bg-dark-600/50 transition-colors"
          >
            <span className="text-lg">−</span>
          </button>
          <span className="text-2xl font-bold text-white min-w-[80px] text-center">
            {metric.value}
          </span>
          <button
            onClick={() => onUpdate(1)}
            className="p-3 rounded-xl bg-dark-700/50 hover:bg-dark-600/50 transition-colors"
          >
            <span className="text-lg">+</span>
          </button>
        </div>
      </div>

      {/* History */}
      <div>
        <p className="text-sm font-medium text-dark-200 mb-3">Recent History</p>
        <div className="space-y-2">
          {metric.history.map((entry, i) => (
            <div
              key={entry.date}
              className="flex items-center justify-between p-2 rounded-lg bg-dark-800/20"
            >
              <span className="text-sm text-dark-400">{entry.date}</span>
              <span className="text-sm text-white">
                {entry.value.toLocaleString()} {metric.unit}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
        <Button variant="glow">
          <Settings className="w-4 h-4 mr-1" />
          Edit Goal
        </Button>
      </div>
    </div>
  );
}

// Log Data Form Component
function LogDataForm({ onClose }: { onClose: () => void }) {
  const [category, setCategory] = useState<'activity' | 'nutrition' | 'vitals' | 'mood'>('activity');

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'activity', label: 'Activity', icon: Activity },
          { id: 'nutrition', label: 'Nutrition', icon: Apple },
          { id: 'vitals', label: 'Vitals', icon: Heart },
          { id: 'mood', label: 'Mood', icon: Smile },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setCategory(tab.id as typeof category)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all',
              category === tab.id
                ? 'bg-neon-cyan/20 text-neon-cyan'
                : 'bg-dark-800/50 text-dark-300 hover:text-white'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form Content */}
      {category === 'activity' && (
        <div className="space-y-4">
          <Input label="Activity Name" placeholder="e.g., Morning Run" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Duration (minutes)" type="number" placeholder="30" />
            <Input label="Calories Burned" type="number" placeholder="300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Activity Type
            </label>
            <div className="flex flex-wrap gap-2">
              {['Running', 'Walking', 'Cycling', 'Swimming', 'Gym', 'Yoga', 'Other'].map(type => (
                <Badge key={type} variant="outline" className="cursor-pointer">
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {category === 'nutrition' && (
        <div className="space-y-4">
          <Input label="Food Item" placeholder="e.g., Grilled Chicken Salad" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Calories" type="number" placeholder="350" />
            <Input label="Protein (g)" type="number" placeholder="30" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Carbs (g)" type="number" placeholder="20" />
            <Input label="Fat (g)" type="number" placeholder="15" />
          </div>
        </div>
      )}

      {category === 'vitals' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Heart Rate (bpm)" type="number" placeholder="72" />
            <Input label="Blood Pressure" placeholder="120/80" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Weight (kg)" type="number" placeholder="70" />
            <Input label="Temperature (°C)" type="number" placeholder="36.5" />
          </div>
        </div>
      )}

      {category === 'mood' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-3">How are you feeling?</label>
            <div className="flex justify-between">
              {['😢', '😕', '😐', '🙂', '😊'].map((emoji, i) => (
                <button
                  key={i}
                  className={cn(
                    'w-12 h-12 rounded-xl text-2xl transition-all',
                    'bg-dark-800/50 hover:bg-dark-700/50 hover:scale-110'
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-3">Energy Level</label>
            <div className="flex justify-between">
              {[1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  className={cn(
                    'w-12 h-12 rounded-xl transition-all flex items-center justify-center',
                    'bg-dark-800/50 hover:bg-neon-cyan/20'
                  )}
                >
                  <Zap
                    className={cn(
                      'w-5 h-5',
                      level <= 2 ? 'text-dark-500' : level <= 4 ? 'text-neon-cyan/50' : 'text-neon-cyan'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">Notes (optional)</label>
            <textarea
              placeholder="How are you feeling today?"
              rows={3}
              className={cn(
                'w-full px-4 py-3 rounded-xl text-sm',
                'bg-dark-800/50 border border-dark-700/50',
                'text-white placeholder:text-dark-500',
                'focus:outline-none focus:ring-2 focus:ring-neon-cyan/50'
              )}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="glow" onClick={onClose}>
          Save Entry
        </Button>
      </div>
    </div>
  );
}
