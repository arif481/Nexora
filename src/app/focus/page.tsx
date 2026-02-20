'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Settings,
  Volume2,
  VolumeX,
  Timer,
  Coffee,
  Brain,
  Zap,
  Target,
  CheckCircle2,
  Plus,
  X,
  Music,
  Headphones,
  Sparkles,
  TrendingUp,
  Clock,
  Calendar,
  Flame,
  ChevronRight,
  Shield,
  Ban,
  Globe,
  Smartphone,
  Bell,
  BellOff,
  Focus,
  Eye,
  EyeOff,
  Moon,
  Sun,
  LogIn,
} from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Progress, CircularProgress } from '@/components/ui/Progress';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/Loading';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useFocus, useFocusStats } from '@/hooks/useFocus';

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';
type TimerStatus = 'idle' | 'running' | 'paused';

interface FocusTask {
  id: string;
  name: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  completed: boolean;
}

// Timer presets in seconds
const TIMER_PRESETS = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

// Persisted timer state
interface PersistedTimerState {
  mode: TimerMode;
  status: TimerStatus;
  timeLeft: number;
  startedAt: number | null;
  pausedAt: number | null;
  activeTaskId: string | null;
}

const TIMER_STORAGE_KEY = 'nexora_focus_timer_state';

const saveTimerState = (state: PersistedTimerState) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
  }
};

const loadTimerState = (): PersistedTimerState | null => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!saved) return null;
    return JSON.parse(saved);
  } catch {
    return null;
  }
};

const clearTimerState = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TIMER_STORAGE_KEY);
  }
};

// Ambient sounds with free audio URLs from Pixabay/FreeSound (royalty-free)
const ambientSounds = [
  {
    id: 'rain',
    name: 'Rain',
    icon: '🌧️',
    // Rain sound - white noise generator fallback
    audioUrl: null,
    oscillatorType: 'brown' as const,
  },
  {
    id: 'forest',
    name: 'Forest',
    icon: '🌲',
    audioUrl: null,
    oscillatorType: 'pink' as const,
  },
  {
    id: 'ocean',
    name: 'Ocean',
    icon: '🌊',
    audioUrl: null,
    oscillatorType: 'brown' as const,
  },
  {
    id: 'fire',
    name: 'Fireplace',
    icon: '🔥',
    audioUrl: null,
    oscillatorType: 'pink' as const,
  },
  {
    id: 'coffee',
    name: 'White Noise',
    icon: '☕',
    audioUrl: null,
    oscillatorType: 'white' as const,
  },
  {
    id: 'lofi',
    name: 'Brown Noise',
    icon: '🎵',
    audioUrl: null,
    oscillatorType: 'brown' as const,
  },
];

export default function FocusPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { sessions, tasks, loading: focusLoading, addSession, addTask, updateTask, removeTask } = useFocus();
  const focusStats = useFocusStats(sessions);

  const [mode, setMode] = useState<TimerMode>('focus');
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [timeLeft, setTimeLeft] = useState(TIMER_PRESETS.focus);
  const [activeTask, setActiveTask] = useState<FocusTask | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [soundVolume, setSoundVolume] = useState(0.3);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [focusModeActive, setFocusModeActive] = useState(false);
  const [distractionBlocker, setDistractionBlocker] = useState(false);
  const [isRestoringState, setIsRestoringState] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const { openAIPanel } = useUIStore();

  const loading = authLoading || focusLoading;

  // Restore timer state from localStorage on mount
  useEffect(() => {
    const savedState = loadTimerState();
    if (savedState && savedState.status !== 'idle') {
      // Restore mode
      setMode(savedState.mode);

      // Calculate elapsed time if timer was running
      if (savedState.status === 'running' && savedState.startedAt) {
        const elapsedSeconds = Math.floor((Date.now() - savedState.startedAt) / 1000);
        const remaining = Math.max(0, savedState.timeLeft - elapsedSeconds);

        if (remaining > 0) {
          setTimeLeft(remaining);
          setStatus('running');
          if (savedState.mode === 'focus') {
            setFocusModeActive(true);
          }
        } else {
          // Timer would have completed - reset
          clearTimerState();
          setTimeLeft(TIMER_PRESETS[savedState.mode]);
        }
      } else if (savedState.status === 'paused') {
        setTimeLeft(savedState.timeLeft);
        setStatus('paused');
      }
    }
    setIsRestoringState(false);
  }, []);

  // Persist timer state when it changes
  useEffect(() => {
    if (isRestoringState) return;

    if (status !== 'idle') {
      saveTimerState({
        mode,
        status,
        timeLeft,
        startedAt: status === 'running' ? Date.now() : null,
        pausedAt: status === 'paused' ? Date.now() : null,
        activeTaskId: activeTask?.id || null,
      });
    } else {
      clearTimerState();
    }
  }, [mode, status, timeLeft, activeTask, isRestoringState]);

  // Generate colored noise
  const createNoiseBuffer = useCallback((type: 'white' | 'pink' | 'brown', sampleRate: number, duration: number) => {
    const bufferSize = sampleRate * duration;
    const buffer = new Float32Array(bufferSize);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        buffer[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        buffer[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    } else if (type === 'brown') {
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        buffer[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = buffer[i];
        buffer[i] *= 3.5;
      }
    }

    return buffer;
  }, []);

  // Play ambient sound
  const playAmbientSound = useCallback((soundId: string) => {
    const sound = ambientSounds.find(s => s.id === soundId);
    if (!sound) return;

    // Stop existing sound
    if (noiseNodeRef.current) {
      noiseNodeRef.current.stop();
      noiseNodeRef.current = null;
    }

    // Create audio context if needed
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    const sampleRate = ctx.sampleRate;
    const duration = 10; // 10 second buffer that loops

    // Create noise buffer
    const noiseData = createNoiseBuffer(sound.oscillatorType, sampleRate, duration);
    const audioBuffer = ctx.createBuffer(1, noiseData.length, sampleRate);
    audioBuffer.copyToChannel(noiseData, 0);

    // Create nodes
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = true;

    const gainNode = ctx.createGain();
    gainNode.gain.value = soundVolume;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start();

    noiseNodeRef.current = source;
    gainNodeRef.current = gainNode;
  }, [createNoiseBuffer, soundVolume]);

  // Stop ambient sound
  const stopAmbientSound = useCallback(() => {
    if (noiseNodeRef.current) {
      noiseNodeRef.current.stop();
      noiseNodeRef.current = null;
    }
  }, []);

  // Handle sound toggle
  useEffect(() => {
    if (activeSound && soundEnabled) {
      playAmbientSound(activeSound);
    } else {
      stopAmbientSound();
    }

    return () => {
      stopAmbientSound();
    };
  }, [activeSound, soundEnabled, playAmbientSound, stopAmbientSound]);

  // Update volume when changed
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = soundVolume;
    }
  }, [soundVolume]);

  // Calculate total focus time today
  const totalFocusToday = sessions
    .filter(s => s.type === 'pomodoro' && s.endTime && new Date(s.endTime).toDateString() === new Date().toDateString())
    .reduce((acc, s) => acc + (s.duration || 0), 0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Timer logic
  useEffect(() => {
    if (status === 'running') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status]);

  const handleTimerComplete = async () => {
    setStatus('idle');

    // Add session to Firebase
    const now = new Date();
    try {
      await addSession({
        type: mode === 'focus' ? 'pomodoro' : mode === 'shortBreak' ? 'pomodoro' : 'deep-work',
        duration: Math.floor(TIMER_PRESETS[mode] / 60), // convert to minutes
        startTime: new Date(now.getTime() - TIMER_PRESETS[mode] * 1000),
        endTime: now,
        distractions: 0,
        quality: 5,
        taskId: activeTask?.id,
      });
    } catch (error) {
      console.error('Failed to save session:', error);
    }

    // Update task if focus session
    if (mode === 'focus' && activeTask) {
      updateTask(activeTask.id, {
        completedPomodoros: activeTask.completedPomodoros + 1
      });
    }

    // Auto-switch mode
    if (mode === 'focus') {
      const focusCount = sessions.filter(s => s.type === 'pomodoro').length + 1;
      if (focusCount % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(TIMER_PRESETS.longBreak);
      } else {
        setMode('shortBreak');
        setTimeLeft(TIMER_PRESETS.shortBreak);
      }
    } else {
      setMode('focus');
      setTimeLeft(TIMER_PRESETS.focus);
    }

    // Play notification sound
    if (soundEnabled) {
      // Would play sound here
    }
  };

  const startTimer = () => {
    setStatus('running');
    if (mode === 'focus') {
      setFocusModeActive(true);
    }
  };

  const pauseTimer = () => {
    setStatus('paused');
  };

  const resumeTimer = () => {
    setStatus('running');
  };

  const resetTimer = () => {
    setStatus('idle');
    setTimeLeft(TIMER_PRESETS[mode]);
    setFocusModeActive(false);
  };

  const skipTimer = () => {
    handleTimerComplete();
  };

  const switchMode = (newMode: TimerMode) => {
    if (status !== 'idle') {
      // Could add confirmation dialog
    }
    setMode(newMode);
    setTimeLeft(TIMER_PRESETS[newMode]);
    setStatus('idle');
  };

  const progress = ((TIMER_PRESETS[mode] - timeLeft) / TIMER_PRESETS[mode]) * 100;

  const modeConfig = {
    focus: {
      label: 'Focus',
      color: 'neon-cyan',
      icon: Brain,
      description: 'Deep work session',
    },
    shortBreak: {
      label: 'Short Break',
      color: 'neon-green',
      icon: Coffee,
      description: 'Quick refresh',
    },
    longBreak: {
      label: 'Long Break',
      color: 'neon-purple',
      icon: Moon,
      description: 'Recharge completely',
    },
  };

  const currentMode = modeConfig[mode];
  const ModeIcon = currentMode.icon;

  // Loading state
  if (authLoading) {
    return (
      <MainLayout>
        <PageContainer title="Focus Mode" subtitle="Deep work, zero distractions">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-dark-400">Loading focus data...</p>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <MainLayout>
        <PageContainer title="Focus Mode" subtitle="Deep work, zero distractions">
          <Card variant="glass" className="max-w-md mx-auto p-8 text-center">
            <LogIn className="w-12 h-12 text-neon-cyan mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Sign in to track focus</h3>
            <p className="text-dark-400 mb-6">
              Save your focus sessions and track productivity over time.
            </p>
            <Button variant="glow" onClick={() => router.push('/auth/login')}>
              Sign In
            </Button>
          </Card>
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageContainer title="Focus Mode" subtitle="Deep work, zero distractions">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timer Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <Card variant="glass" className="relative overflow-hidden">
              {/* Background gradient based on mode */}
              <div
                className={cn(
                  'absolute inset-0 opacity-10 transition-colors duration-500',
                  mode === 'focus' && 'bg-gradient-radial from-neon-cyan/30 to-transparent',
                  mode === 'shortBreak' && 'bg-gradient-radial from-neon-green/30 to-transparent',
                  mode === 'longBreak' && 'bg-gradient-radial from-neon-purple/30 to-transparent'
                )}
              />

              <CardContent className="relative p-8">
                {/* Mode Selector */}
                <div className="flex items-center justify-center gap-2 mb-8">
                  {(Object.keys(modeConfig) as TimerMode[]).map(m => (
                    <button
                      key={m}
                      onClick={() => switchMode(m)}
                      className={cn(
                        'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                        mode === m
                          ? cn(
                            'text-dark-900',
                            m === 'focus' && 'bg-neon-cyan',
                            m === 'shortBreak' && 'bg-neon-green',
                            m === 'longBreak' && 'bg-neon-purple'
                          )
                          : 'bg-dark-800/50 text-dark-300 hover:text-white hover:bg-dark-700/50'
                      )}
                    >
                      {modeConfig[m].label}
                    </button>
                  ))}
                </div>

                {/* Timer Display */}
                <div className="flex flex-col items-center mb-8">
                  <div className="relative">
                    {/* Progress ring */}
                    <svg className="w-64 h-64 -rotate-90">
                      <circle
                        cx="128"
                        cy="128"
                        r="120"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-dark-700/50"
                      />
                      <circle
                        cx="128"
                        cy="128"
                        r="120"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 120}
                        strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                        className={cn(
                          'transition-all duration-300',
                          mode === 'focus' && 'text-neon-cyan',
                          mode === 'shortBreak' && 'text-neon-green',
                          mode === 'longBreak' && 'text-neon-purple'
                        )}
                      />
                    </svg>

                    {/* Timer text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <ModeIcon
                        className={cn(
                          'w-8 h-8 mb-2',
                          mode === 'focus' && 'text-neon-cyan',
                          mode === 'shortBreak' && 'text-neon-green',
                          mode === 'longBreak' && 'text-neon-purple'
                        )}
                      />
                      <span className="text-5xl font-mono font-bold text-white">
                        {formatTime(timeLeft)}
                      </span>
                      <span className="text-sm text-dark-400 mt-2">
                        {currentMode.description}
                      </span>
                    </div>
                  </div>

                  {/* Active task indicator */}
                  {activeTask && mode === 'focus' && (
                    <div className="flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-dark-800/50">
                      <Target className="w-4 h-4 text-neon-cyan" />
                      <span className="text-sm text-dark-300">{activeTask.name}</span>
                      <button
                        onClick={() => setActiveTask(null)}
                        className="p-1 rounded hover:bg-dark-700/50"
                      >
                        <X className="w-3 h-3 text-dark-400" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={resetTimer}
                    className="p-3 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 transition-colors"
                  >
                    <RotateCcw className="w-5 h-5 text-dark-300" />
                  </button>

                  <button
                    onClick={status === 'running' ? pauseTimer : status === 'paused' ? resumeTimer : startTimer}
                    className={cn(
                      'p-6 rounded-2xl transition-all transform hover:scale-105',
                      mode === 'focus' && 'bg-neon-cyan text-dark-900',
                      mode === 'shortBreak' && 'bg-neon-green text-dark-900',
                      mode === 'longBreak' && 'bg-neon-purple text-dark-900'
                    )}
                  >
                    {status === 'running' ? (
                      <Pause className="w-8 h-8" />
                    ) : (
                      <Play className="w-8 h-8 ml-1" />
                    )}
                  </button>

                  <button
                    onClick={skipTimer}
                    className="p-3 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 transition-colors"
                  >
                    <SkipForward className="w-5 h-5 text-dark-300" />
                  </button>
                </div>

                {/* Quick actions */}
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      soundEnabled ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-dark-800/50 text-dark-400'
                    )}
                  >
                    {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={() => setDistractionBlocker(!distractionBlocker)}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      distractionBlocker ? 'bg-neon-orange/20 text-neon-orange' : 'bg-dark-800/50 text-dark-400'
                    )}
                  >
                    <Shield className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 rounded-lg bg-dark-800/50 text-dark-400 hover:text-white transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Ambient Sounds */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-6"
            >
              <Card variant="glass">
                <CardHeader
                  title="Ambient Sounds"
                  icon={<Headphones className="w-5 h-5 text-neon-purple" />}
                  action={
                    activeSound && (
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-dark-400" />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={soundVolume}
                          onChange={(e) => setSoundVolume(Number(e.target.value))}
                          className="w-20 h-1 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-neon-purple"
                        />
                      </div>
                    )
                  }
                />
                <CardContent>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {ambientSounds.map(sound => (
                      <button
                        key={sound.id}
                        onClick={() => setActiveSound(activeSound === sound.id ? null : sound.id)}
                        className={cn(
                          'p-4 rounded-xl flex flex-col items-center gap-2 transition-all',
                          activeSound === sound.id
                            ? 'bg-neon-purple/20 border-2 border-neon-purple'
                            : 'bg-dark-800/30 hover:bg-dark-700/30'
                        )}
                      >
                        <span className="text-2xl">{sound.icon}</span>
                        <span className="text-xs text-dark-300">{sound.name}</span>
                      </button>
                    ))}
                  </div>
                  {activeSound && (
                    <p className="text-xs text-dark-500 mt-3 text-center">
                      Click the active sound again to stop
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Today's Stats */}
            <Card variant="glass">
              <CardHeader
                title="Today's Focus"
                icon={<TrendingUp className="w-5 h-5 text-neon-cyan" />}
              />
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-dark-800/30 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Flame className="w-4 h-4 text-neon-orange" />
                      <span className="text-2xl font-bold text-white">{focusStats.todayPomodoros}</span>
                    </div>
                    <p className="text-xs text-dark-400">Pomodoros</p>
                  </div>
                  <div className="p-3 rounded-lg bg-dark-800/30 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Clock className="w-4 h-4 text-neon-cyan" />
                      <span className="text-2xl font-bold text-white">{formatDuration(focusStats.todayMinutes * 60)}</span>
                    </div>
                    <p className="text-xs text-dark-400">Focus Time</p>
                  </div>
                </div>

                {/* Weekly stats */}
                <div className="mt-4 p-3 rounded-lg bg-dark-800/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neon-purple" />
                      <span className="text-sm text-dark-300">This Week</span>
                    </div>
                    <span className="text-sm font-medium text-white">{focusStats.weekPomodoros} sessions</span>
                  </div>
                </div>

                {/* Streak */}
                <div className="mt-2 p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span className="text-sm text-dark-300">Focus Streak</span>
                    </div>
                    <span className="text-lg font-bold text-orange-400">{focusStats.streak} {focusStats.streak === 1 ? 'day' : 'days'}</span>
                  </div>
                </div>

                {/* Daily goal progress */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-dark-400">Daily Goal</span>
                    <span className="text-sm text-dark-300">{focusStats.todayPomodoros}/8 sessions</span>
                  </div>
                  <Progress value={(focusStats.todayPomodoros / 8) * 100} variant="cyan" />
                </div>
              </CardContent>
            </Card>

            {/* Tasks */}
            <Card variant="glass">
              <CardHeader
                title="Focus Tasks"
                icon={<Target className="w-5 h-5 text-neon-orange" />}
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddTaskOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                }
              />
              <CardContent className="space-y-3">
                {tasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => !task.completed && setActiveTask(task)}
                    className={cn(
                      'w-full p-3 rounded-lg text-left transition-all',
                      task.completed
                        ? 'bg-dark-800/30 opacity-50'
                        : activeTask?.id === task.id
                          ? 'bg-neon-cyan/10 border border-neon-cyan/30'
                          : 'bg-dark-800/30 hover:bg-dark-700/30'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center',
                          task.completed
                            ? 'bg-neon-green text-dark-900'
                            : 'border-2 border-dark-500'
                        )}
                      >
                        {task.completed && <CheckCircle2 className="w-3 h-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-sm font-medium truncate',
                            task.completed ? 'text-dark-400 line-through' : 'text-white'
                          )}
                        >
                          {task.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex gap-1">
                            {Array.from({ length: task.estimatedPomodoros }).map((_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  'w-2 h-2 rounded-full',
                                  i < task.completedPomodoros
                                    ? 'bg-neon-orange'
                                    : 'bg-dark-600'
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-dark-500">
                            {task.completedPomodoros}/{task.estimatedPomodoros}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}

                {tasks.length === 0 && (
                  <div className="text-center py-6">
                    <Target className="w-8 h-8 text-dark-500 mx-auto mb-2" />
                    <p className="text-sm text-dark-400">No tasks yet</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAddTaskOpen(true)}
                      className="mt-2"
                    >
                      Add Task
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card variant="glass">
              <CardHeader
                title="AI Insights"
                icon={<Brain className="w-5 h-5 text-neon-purple" />}
              />
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-neon-green/10 border border-neon-green/20">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-neon-green" />
                    <span className="text-xs font-medium text-neon-green">Peak Hours</span>
                  </div>
                  <p className="text-sm text-dark-300">
                    Your focus is strongest between 9-11 AM. Schedule demanding tasks then.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-dark-800/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-neon-cyan" />
                    <span className="text-xs font-medium text-dark-200">Suggestion</span>
                  </div>
                  <p className="text-sm text-dark-400">
                    Try a 50/10 ratio for complex tasks. You've been more productive with longer sessions.
                  </p>
                </div>

                <Button variant="ghost" size="sm" className="w-full" onClick={openAIPanel}>
                  <Sparkles className="w-4 h-4 mr-1" />
                  More Insights
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Focus Mode Active Overlay */}
        <AnimatePresence>
          {focusModeActive && status === 'running' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-40 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Settings Modal */}
        <Modal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          title="Focus Settings"
          size="md"
        >
          <FocusSettings onClose={() => setIsSettingsOpen(false)} />
        </Modal>

        {/* Add Task Modal */}
        <Modal
          isOpen={isAddTaskOpen}
          onClose={() => setIsAddTaskOpen(false)}
          title="Add Focus Task"
          size="md"
        >
          <AddFocusTask
            onAdd={task => {
              addTask(task);
              setIsAddTaskOpen(false);
            }}
            onClose={() => setIsAddTaskOpen(false)}
          />
        </Modal>
      </PageContainer>
    </MainLayout>
  );
}

// Focus Settings Component
function FocusSettings({ onClose }: { onClose: () => void }) {
  const [focusDuration, setFocusDuration] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [longBreakInterval, setLongBreakInterval] = useState(4);
  const [autoStartBreaks, setAutoStartBreaks] = useState(true);
  const [autoStartFocus, setAutoStartFocus] = useState(false);
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="space-y-6">
      {/* Timer Durations */}
      <div>
        <h3 className="text-sm font-medium text-dark-200 mb-3">Timer Durations (minutes)</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-dark-400 mb-1">Focus</label>
            <Input
              type="number"
              value={focusDuration}
              onChange={e => setFocusDuration(parseInt(e.target.value))}
              min={1}
              max={120}
            />
          </div>
          <div>
            <label className="block text-xs text-dark-400 mb-1">Short Break</label>
            <Input
              type="number"
              value={shortBreak}
              onChange={e => setShortBreak(parseInt(e.target.value))}
              min={1}
              max={30}
            />
          </div>
          <div>
            <label className="block text-xs text-dark-400 mb-1">Long Break</label>
            <Input
              type="number"
              value={longBreak}
              onChange={e => setLongBreak(parseInt(e.target.value))}
              min={1}
              max={60}
            />
          </div>
        </div>
      </div>

      {/* Long Break Interval */}
      <div>
        <label className="block text-sm text-dark-200 mb-2">Long Break Interval</label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={longBreakInterval}
            onChange={e => setLongBreakInterval(parseInt(e.target.value))}
            min={2}
            max={8}
            className="w-20"
          />
          <span className="text-sm text-dark-400">sessions</span>
        </div>
      </div>

      {/* Toggle Options */}
      <div className="space-y-3">
        <label className="flex items-center justify-between">
          <span className="text-sm text-dark-200">Auto-start breaks</span>
          <button
            onClick={() => setAutoStartBreaks(!autoStartBreaks)}
            className={cn(
              'w-12 h-6 rounded-full transition-colors',
              autoStartBreaks ? 'bg-neon-cyan' : 'bg-dark-700'
            )}
          >
            <div
              className={cn(
                'w-5 h-5 rounded-full bg-white transition-transform',
                autoStartBreaks ? 'translate-x-6' : 'translate-x-0.5'
              )}
            />
          </button>
        </label>

        <label className="flex items-center justify-between">
          <span className="text-sm text-dark-200">Auto-start focus</span>
          <button
            onClick={() => setAutoStartFocus(!autoStartFocus)}
            className={cn(
              'w-12 h-6 rounded-full transition-colors',
              autoStartFocus ? 'bg-neon-cyan' : 'bg-dark-700'
            )}
          >
            <div
              className={cn(
                'w-5 h-5 rounded-full bg-white transition-transform',
                autoStartFocus ? 'translate-x-6' : 'translate-x-0.5'
              )}
            />
          </button>
        </label>

        <label className="flex items-center justify-between">
          <span className="text-sm text-dark-200">Notifications</span>
          <button
            onClick={() => setNotifications(!notifications)}
            className={cn(
              'w-12 h-6 rounded-full transition-colors',
              notifications ? 'bg-neon-cyan' : 'bg-dark-700'
            )}
          >
            <div
              className={cn(
                'w-5 h-5 rounded-full bg-white transition-transform',
                notifications ? 'translate-x-6' : 'translate-x-0.5'
              )}
            />
          </button>
        </label>
      </div>

      {/* Distraction Blocking */}
      <div className="p-4 rounded-xl bg-dark-800/30">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-neon-orange" />
          <h3 className="text-sm font-medium text-white">Distraction Blocking</h3>
        </div>
        <p className="text-xs text-dark-400 mb-3">
          Block distracting websites and apps during focus sessions.
        </p>
        <div className="flex flex-wrap gap-2">
          {['Social Media', 'News', 'YouTube', 'Reddit'].map(site => (
            <Badge key={site} variant="outline" className="cursor-pointer">
              <Ban className="w-3 h-3 mr-1" />
              {site}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="glow" onClick={onClose}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}

// Add Focus Task Component
function AddFocusTask({
  onAdd,
  onClose,
}: {
  onAdd: (task: FocusTask) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      id: Date.now().toString(),
      name,
      estimatedPomodoros,
      completedPomodoros: 0,
      completed: false,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Task Name"
        placeholder="What do you want to focus on?"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />

      <div>
        <label className="block text-sm font-medium text-dark-200 mb-2">
          Estimated Pomodoros
        </label>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setEstimatedPomodoros(n)}
                className={cn(
                  'w-10 h-10 rounded-lg text-sm font-medium transition-all',
                  estimatedPomodoros === n
                    ? 'bg-neon-orange text-dark-900'
                    : 'bg-dark-800/50 text-dark-300 hover:text-white'
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <span className="text-sm text-dark-400">
            ≈ {estimatedPomodoros * 25} min
          </span>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-neon-cyan" />
          <span className="text-sm font-medium text-neon-cyan">AI Tip</span>
        </div>
        <p className="text-sm text-dark-300">
          Break large tasks into smaller, focused chunks. Aim for 1-4 pomodoros per task.
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="glow">
          Add Task
        </Button>
      </div>
    </form>
  );
}
