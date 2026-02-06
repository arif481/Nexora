'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { useGoals } from '@/hooks/useGoals';
import { useJournal } from '@/hooks/useJournal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Mail,
  Calendar,
  CheckCircle,
  Target,
  BookOpen,
  TrendingUp,
  Award,
  Edit,
  ArrowLeft,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { tasks } = useTasks();
  const { habits } = useHabits();
  const { goals } = useGoals();
  const { entries: journalEntries } = useJournal();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-neon-cyan"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Calculate stats
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const activeHabits = habits.length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const totalGoals = goals.length;
  const journalCount = journalEntries.length;
  
  // Calculate longest habit streak
  const longestStreak = habits.reduce((max, h) => Math.max(max, h.longestStreak || 0), 0);

  // Member since
  const memberSince = user.metadata?.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      })
    : 'Unknown';

  const stats = [
    { label: 'Tasks Completed', value: completedTasks, total: totalTasks, icon: CheckCircle, color: 'text-neon-cyan' },
    { label: 'Active Habits', value: activeHabits, icon: Target, color: 'text-neon-purple' },
    { label: 'Goals Achieved', value: completedGoals, total: totalGoals, icon: TrendingUp, color: 'text-neon-green' },
    { label: 'Journal Entries', value: journalCount, icon: BookOpen, color: 'text-neon-pink' },
    { label: 'Longest Streak', value: `${longestStreak} days`, icon: Award, color: 'text-neon-yellow' },
  ];

  return (
    <div className="min-h-screen p-4 lg:p-8 pb-24 lg:pb-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-white/60 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card variant="glass" className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <Avatar
                  src={user.photoURL || undefined}
                  name={user.displayName || user.email || 'User'}
                  size="xl"
                  className="w-32 h-32 text-3xl"
                />
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {user.displayName || 'User'}
                  </h1>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-white/60">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {memberSince}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/settings')}
                  className="mt-4"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold text-white mb-4">Your Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.map((stat, index) => (
              <Card key={stat.label} variant="glass" className="p-4 text-center">
                <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                <div className="text-2xl font-bold text-white">
                  {stat.value}
                  {stat.total !== undefined && (
                    <span className="text-sm text-white/40">/{stat.total}</span>
                  )}
                </div>
                <div className="text-xs text-white/60 mt-1">{stat.label}</div>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          <Card variant="glass" className="p-6">
            {tasks.length === 0 && habits.length === 0 && goals.length === 0 ? (
              <p className="text-white/60 text-center py-8">
                No activity yet. Start by creating tasks, habits, or goals!
              </p>
            ) : (
              <div className="space-y-4">
                {/* Recent completed tasks */}
                {tasks
                  .filter(t => t.status === 'completed')
                  .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0))
                  .slice(0, 5)
                  .map(task => (
                    <div key={task.id} className="flex items-center gap-3 text-sm">
                      <CheckCircle className="w-4 h-4 text-neon-green" />
                      <span className="text-white/80">Completed task: {task.title}</span>
                      <Badge variant="green" size="sm">Done</Badge>
                    </div>
                  ))}
                
                {/* Active goals */}
                {goals
                  .filter(g => g.status === 'in-progress')
                  .slice(0, 3)
                  .map(goal => (
                    <div key={goal.id} className="flex items-center gap-3 text-sm">
                      <TrendingUp className="w-4 h-4 text-neon-purple" />
                      <span className="text-white/80">Working on: {goal.title}</span>
                      <Badge variant="cyan" size="sm">{goal.progress}%</Badge>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
