'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Flag,
  Trophy,
  TrendingUp,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Edit3,
  Trash2,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Brain,
  Flame,
  Star,
  Zap,
  Milestone,
  Award,
  BarChart3,
  ArrowRight,
  Play,
  Pause,
  RefreshCw,
  LogIn,
  Loader2,
} from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Progress, CircularProgress } from '@/components/ui/Progress';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner, EmptyState } from '@/components/ui/Loading';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useGoals, useGoalStats } from '@/hooks/useGoals';
import { useOKR } from '@/hooks/useOKR';
import { OKRTracker } from '@/components/features/goals/OKRTracker';
import type { Goal, Milestone as MilestoneType } from '@/lib/services/goals';

const categoryConfig: Record<string, { label: string; icon: string; color: string }> = {
  health: { label: 'Health', icon: '💪', color: '#10b981' },
  career: { label: 'Career', icon: '💼', color: '#a855f7' },
  finance: { label: 'Finance', icon: '💰', color: '#00f0ff' },
  personal: { label: 'Personal', icon: '🌟', color: '#ec4899' },
  education: { label: 'Education', icon: '📚', color: '#f97316' },
  relationships: { label: 'Relationships', icon: '❤️', color: '#ef4444' },
};

export default function GoalsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    goals,
    loading: goalsLoading,
    createGoal,
    updateGoal,
    deleteGoal,
    toggleMilestone: toggleMilestoneService,
    addMilestone: addMilestoneService,
  } = useGoals();
  const goalStats = useGoalStats(goals);
  const { objectives, addObjective, editObjective, removeObjective } = useOKR();

  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const { openAIPanel } = useUIStore();

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: 'personal' as Goal['category'],
    priority: 'medium' as Goal['priority'],
    targetDate: '',
  });

  const loading = authLoading || goalsLoading;

  const filteredGoals = useMemo(() => {
    switch (filter) {
      case 'active':
        return goals.filter(g => g.status === 'in-progress' || g.status === 'not-started');
      case 'completed':
        return goals.filter(g => g.status === 'completed');
      default:
        return goals;
    }
  }, [goals, filter]);

  const toggleExpanded = (goalId: string) => {
    setExpandedGoals(prev => {
      const next = new Set(prev);
      if (next.has(goalId)) {
        next.delete(goalId);
      } else {
        next.add(goalId);
      }
      return next;
    });
  };

  const handleToggleMilestone = async (goalId: string, milestoneId: string, currentCompleted: boolean) => {
    try {
      await toggleMilestoneService(goalId, milestoneId, !currentCompleted);
    } catch (error) {
      console.error('Failed to toggle milestone:', error);
    }
  };

  // Open edit modal
  const handleEditGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setEditForm({
      title: goal.title,
      description: goal.description || '',
      category: goal.category,
      priority: goal.priority,
      targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '',
    });
    setIsEditModalOpen(true);
  };

  // Save edited goal
  const handleSaveEdit = async () => {
    if (!selectedGoal || !editForm.title.trim()) return;

    setIsSaving(true);
    try {
      await updateGoal(selectedGoal.id, {
        title: editForm.title,
        description: editForm.description,
        category: editForm.category,
        priority: editForm.priority,
        targetDate: editForm.targetDate ? new Date(editForm.targetDate) : undefined,
      });
      setIsEditModalOpen(false);
      setSelectedGoal(null);
    } catch (error) {
      console.error('Failed to update goal:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete goal
  const handleDeleteGoal = async () => {
    if (!selectedGoal) return;
    if (!confirm('Are you sure you want to delete this goal?')) return;

    setIsSaving(true);
    try {
      await deleteGoal(selectedGoal.id);
      setIsEditModalOpen(false);
      setSelectedGoal(null);
    } catch (error) {
      console.error('Failed to delete goal:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Add milestone to goal
  const handleAddMilestone = async () => {
    if (!selectedGoal || !newMilestoneTitle.trim()) return;

    setIsSaving(true);
    try {
      await addMilestoneService(selectedGoal.id, { title: newMilestoneTitle });
      setNewMilestoneTitle('');
      setIsAddMilestoneOpen(false);
    } catch (error) {
      console.error('Failed to add milestone:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <MainLayout>
        <PageContainer title="Goals" subtitle="Track your progress towards meaningful goals">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading goals...</p>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <MainLayout>
        <PageContainer title="Goals" subtitle="Track your progress towards meaningful goals">
          <Card variant="glass" className="max-w-md mx-auto p-8 text-center">
            <LogIn className="w-12 h-12 text-neon-cyan mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Sign in to track goals</h3>
            <p className="text-dark-400 mb-6">
              Set goals, track milestones, and achieve your dreams.
            </p>
            <Button variant="glow" onClick={() => router.push('/auth/login')}>
              Sign In
            </Button>
          </Card>
        </PageContainer>
      </MainLayout>
    );
  }

  const getDaysRemaining = (targetDate?: Date) => {
    if (!targetDate) return null;
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const GoalCard = ({ goal }: { goal: Goal }) => {
    const isExpanded = expandedGoals.has(goal.id);
    const daysRemaining = getDaysRemaining(goal.targetDate);
    const category = categoryConfig[goal.category];
    const completedMilestones = goal.milestones.filter(m => m.completed).length;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'group rounded-xl overflow-hidden transition-all',
          'bg-dark-900/50 border border-dark-700/50 backdrop-blur-sm',
          'hover:border-opacity-50'
        )}
        style={{ borderColor: `${goal.color}30` }}
      >
        {/* Header */}
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Progress Circle */}
            <CircularProgress
              value={goal.progress}
              size={56}
              strokeWidth={4}
              className="flex-shrink-0"
            >
              <span className="text-xs font-bold text-white">{goal.progress}%</span>
            </CircularProgress>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{category.icon}</span>
                <h3 className="font-semibold text-white truncate">{goal.title}</h3>
              </div>
              {goal.description && (
                <p className="text-sm text-dark-400 line-clamp-1 mb-2">{goal.description}</p>
              )}
              <div className="flex items-center gap-3 flex-wrap">
                <Badge
                  variant={
                    goal.priority === 'high' ? 'orange' : goal.priority === 'medium' ? 'cyan' : 'default'
                  }
                  size="sm"
                >
                  {goal.priority}
                </Badge>
                <Badge
                  variant={
                    goal.status === 'in-progress'
                      ? 'cyan'
                      : goal.status === 'completed'
                        ? 'green'
                        : goal.status === 'paused'
                          ? 'orange'
                          : 'default'
                  }
                  size="sm"
                >
                  {goal.status.replace('-', ' ')}
                </Badge>
                {daysRemaining !== null && daysRemaining > 0 && (
                  <span className="text-xs text-dark-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {daysRemaining} days left
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleExpanded(goal.id)}
                className="p-2 rounded-lg hover:bg-dark-700/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-dark-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-dark-400" />
                )}
              </button>
              <button
                onClick={() => handleEditGoal(goal)}
                className="p-2 rounded-lg hover:bg-dark-700/50 opacity-0 group-hover:opacity-100 transition-all"
                title="Edit goal"
              >
                <Edit3 className="w-5 h-5 text-dark-400 hover:text-neon-cyan" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-dark-500">
                {completedMilestones}/{goal.milestones.length} milestones
              </span>
              <span className="text-xs font-medium" style={{ color: goal.color }}>
                {goal.progress}%
              </span>
            </div>
            <Progress value={goal.progress} variant="cyan" size="sm" />
          </div>
        </div>

        {/* Milestones (Expanded) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 pt-0 space-y-2 border-t border-dark-700/30">
                <div className="pt-4">
                  {goal.milestones.map((milestone, index) => (
                    <div
                      key={milestone.id}
                      className="flex items-center gap-3 py-2"
                    >
                      <button
                        onClick={() => handleToggleMilestone(goal.id, milestone.id, milestone.completed)}
                        className={cn(
                          'w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all',
                          milestone.completed
                            ? 'bg-neon-green text-dark-900'
                            : 'border-2 border-dark-500 hover:border-neon-cyan'
                        )}
                      >
                        {milestone.completed && <CheckCircle2 className="w-3 h-3" />}
                      </button>
                      <span
                        className={cn(
                          'text-sm',
                          milestone.completed ? 'text-dark-400 line-through' : 'text-white'
                        )}
                      >
                        {milestone.title}
                      </span>
                      {index < goal.milestones.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-dark-600 ml-auto" />
                      )}
                    </div>
                  ))}

                  {/* Add Milestone Button */}
                  <button
                    onClick={() => {
                      setSelectedGoal(goal);
                      setIsAddMilestoneOpen(true);
                    }}
                    className="flex items-center gap-2 py-2 text-sm text-dark-400 hover:text-neon-cyan transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Milestone
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <MainLayout>
      <PageContainer title="Goals" subtitle="Dream big, achieve bigger">
        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">Total Goals</span>
              <Target className="w-6 h-6 text-neon-cyan" />
            </div>
            <p className="text-2xl font-bold text-white">{goalStats.total}</p>
            <p className="text-xs text-dark-500">goals set</p>
          </Card>

          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">In Progress</span>
              <TrendingUp className="w-6 h-6 text-neon-orange" />
            </div>
            <p className="text-2xl font-bold text-white">{goalStats.inProgress}</p>
            <p className="text-xs text-dark-500">actively working</p>
          </Card>

          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">Completed</span>
              <Trophy className="w-6 h-6 text-neon-green" />
            </div>
            <p className="text-2xl font-bold text-white">{goalStats.completed}</p>
            <p className="text-xs text-dark-500">goals achieved</p>
          </Card>

          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">Avg Progress</span>
              <CircularProgress value={goalStats.averageProgress} size={48} strokeWidth={4} />
            </div>
            <p className="text-2xl font-bold text-white">{goalStats.averageProgress}%</p>
            <p className="text-xs text-dark-500">overall progress</p>
          </Card>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Goals List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {(['all', 'active', 'completed'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm capitalize transition-all',
                      filter === f
                        ? 'bg-neon-cyan/20 text-neon-cyan'
                        : 'bg-dark-800/50 text-dark-300 hover:text-white'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <Button variant="glow" size="sm" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                New Goal
              </Button>
            </div>

            {/* Goals */}
            {filteredGoals.length > 0 ? (
              <div className="space-y-4">
                {filteredGoals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Target className="w-12 h-12" />}
                title="No goals found"
                description={filter === 'all' ? 'Set your first goal to get started' : `No ${filter} goals`}
                action={
                  <Button variant="glow" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Create Goal
                  </Button>
                }
              />
            )}
          </motion.div>

          {/* OKR Section below Goals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2"
          >
            <Card variant="glass">
              <CardContent className="p-5">
                <OKRTracker
                  objectives={objectives}
                  onAddObjective={addObjective}
                  onUpdateObjective={editObjective}
                  onDeleteObjective={removeObjective}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Categories */}
            <Card variant="glass">
              <CardHeader
                title="By Category"
                icon={<BarChart3 className="w-5 h-5 text-neon-cyan" />}
              />
              <CardContent className="space-y-3">
                {Object.entries(categoryConfig).map(([key, config]) => {
                  const count = goals.filter(g => g.category === key).length;
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 rounded-lg bg-dark-800/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{config.icon}</span>
                        <span className="text-sm text-white">{config.label}</span>
                      </div>
                      <Badge variant="default" size="sm">
                        {count}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Upcoming Deadlines */}
            <Card variant="glass">
              <CardHeader
                title="Upcoming Deadlines"
                icon={<Calendar className="w-5 h-5 text-neon-orange" />}
              />
              <CardContent className="space-y-3">
                {goals
                  .filter(g => g.targetDate && g.status !== 'completed')
                  .sort((a, b) => (a.targetDate?.getTime() || 0) - (b.targetDate?.getTime() || 0))
                  .slice(0, 3)
                  .map(goal => {
                    const days = getDaysRemaining(goal.targetDate);
                    return (
                      <div
                        key={goal.id}
                        className="p-3 rounded-lg bg-dark-800/30"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-white truncate">
                            {goal.title}
                          </span>
                          <Badge
                            variant={days && days < 30 ? 'orange' : 'default'}
                            size="sm"
                          >
                            {days}d
                          </Badge>
                        </div>
                        <Progress value={goal.progress} variant="cyan" size="sm" />
                      </div>
                    );
                  })}
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card variant="glass">
              <CardHeader
                title="AI Insights"
                icon={<Brain className="w-5 h-5 text-neon-purple" />}
              />
              <CardContent className="space-y-3">
                {goals.filter(g => g.status !== 'completed' && g.progress > 0).length > 0 ? (
                  <>
                    {goals
                      .filter(g => g.status !== 'completed')
                      .sort((a, b) => b.progress - a.progress)
                      .slice(0, 1)
                      .map(g => (
                        <div key={`insight-top-${g.id}`} className="p-3 rounded-lg bg-neon-green/10 border border-neon-green/20">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-neon-green" />
                            <span className="text-xs font-medium text-neon-green">Great Progress!</span>
                          </div>
                          <p className="text-sm text-dark-300">
                            &quot;{g.title}&quot; is at {g.progress}% — keep up the momentum!
                          </p>
                        </div>
                      ))}
                    {goals
                      .filter(g => g.status !== 'completed' && g.progress < 30)
                      .slice(0, 1)
                      .map(g => (
                        <div key={`insight-low-${g.id}`} className="p-3 rounded-lg bg-neon-orange/10 border border-neon-orange/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Flame className="w-4 h-4 text-neon-orange" />
                            <span className="text-xs font-medium text-neon-orange">Needs Attention</span>
                          </div>
                          <p className="text-sm text-dark-300">
                            &quot;{g.title}&quot; is only at {g.progress}%. Break it into smaller steps.
                          </p>
                        </div>
                      ))}
                  </>
                ) : (
                  <p className="text-sm text-dark-400 text-center py-2">
                    Add goals and start tracking to see AI insights.
                  </p>
                )}

                <Button variant="ghost" size="sm" className="w-full" onClick={openAIPanel}>
                  <Sparkles className="w-4 h-4 mr-1" />
                  Get Personalized Plan
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Create Goal Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Goal"
          size="lg"
        >
          <CreateGoalForm onClose={() => setIsCreateModalOpen(false)} />
        </Modal>

        {/* Goal Details Modal */}
        <Modal
          isOpen={!!selectedGoal}
          onClose={() => setSelectedGoal(null)}
          title={selectedGoal?.title || 'Goal Details'}
          size="md"
        >
          {selectedGoal && (
            <GoalDetails
              goal={selectedGoal}
              onClose={() => setSelectedGoal(null)}
            />
          )}
        </Modal>

        {/* Edit Goal Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Goal"
          size="lg"
        >
          {editForm && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value as Goal['category'] })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="career">Career</option>
                    <option value="health">Health</option>
                    <option value="finance">Finance</option>
                    <option value="personal">Personal</option>
                    <option value="education">Education</option>
                    <option value="relationships">Relationships</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as Goal['priority'] })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={editForm.targetDate}
                  onChange={(e) => setEditForm({ ...editForm, targetDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={handleDeleteGoal}
                  disabled={isSaving}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete Goal
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving || !editForm.title.trim()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Add Milestone Modal */}
        <Modal
          isOpen={isAddMilestoneOpen}
          onClose={() => {
            setIsAddMilestoneOpen(false);
            setNewMilestoneTitle('');
          }}
          title="Add Milestone"
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Milestone Title
              </label>
              <input
                type="text"
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                placeholder="Enter milestone title..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setIsAddMilestoneOpen(false);
                  setNewMilestoneTitle('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMilestone}
                disabled={isSaving || !newMilestoneTitle.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Milestone
              </button>
            </div>
          </div>
        </Modal>
      </PageContainer>
    </MainLayout>
  );
}

// Create Goal Form
function CreateGoalForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Goal['category']>('personal');
  const [priority, setPriority] = useState<Goal['priority']>('medium');
  const [targetDate, setTargetDate] = useState('');
  const [milestones, setMilestones] = useState<string[]>(['']);

  const addMilestone = () => setMilestones([...milestones, '']);
  const updateMilestone = (index: number, value: string) => {
    const updated = [...milestones];
    updated[index] = value;
    setMilestones(updated);
  };
  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={e => { e.preventDefault(); onClose(); }} className="space-y-5">
      <Input
        label="Goal Title"
        placeholder="What do you want to achieve?"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />

      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Description</label>
        <textarea
          placeholder="Describe your goal in detail..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
          className={cn(
            'w-full px-4 py-3 rounded-xl text-sm',
            'bg-dark-800/50 border border-dark-700/50',
            'text-white placeholder:text-dark-500',
            'focus:outline-none focus:ring-2 focus:ring-neon-cyan/50'
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoryConfig).map(([key, config]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key as Goal['category'])}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5',
                  category === key
                    ? 'bg-neon-cyan/20 text-neon-cyan'
                    : 'bg-dark-800/50 text-dark-300 hover:text-white'
                )}
              >
                <span>{config.icon}</span>
                {config.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-2">Priority</label>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as const).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm capitalize transition-all',
                  priority === p
                    ? p === 'high'
                      ? 'bg-neon-orange/20 text-neon-orange'
                      : p === 'medium'
                        ? 'bg-neon-cyan/20 text-neon-cyan'
                        : 'bg-dark-600/50 text-dark-200'
                    : 'bg-dark-800/50 text-dark-300 hover:text-white'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Input
        type="date"
        label="Target Date"
        value={targetDate}
        onChange={e => setTargetDate(e.target.value)}
      />

      {/* Milestones */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-dark-200">Milestones</label>
          <Button type="button" variant="ghost" size="sm" onClick={addMilestone}>
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
        <div className="space-y-2">
          {milestones.map((milestone, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder={`Milestone ${index + 1}`}
                value={milestone}
                onChange={e => updateMilestone(index, e.target.value)}
                className="flex-1"
              />
              {milestones.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMilestone(index)}
                >
                  <Trash2 className="w-4 h-4 text-dark-400" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="glow">Create Goal</Button>
      </div>
    </form>
  );
}

// Goal Details Component
function GoalDetails({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const category = categoryConfig[goal.category];
  const daysRemaining = goal.targetDate
    ? Math.ceil((goal.targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <CircularProgress value={goal.progress} size={64} strokeWidth={5}>
          <span className="text-sm font-bold text-white">{goal.progress}%</span>
        </CircularProgress>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{category.icon}</span>
            <h3 className="text-lg font-semibold text-white">{goal.title}</h3>
          </div>
          <p className="text-sm text-dark-400">{goal.description}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 rounded-lg bg-dark-800/30 text-center">
          <p className="text-lg font-bold text-white">{goal.milestones.filter(m => m.completed).length}</p>
          <p className="text-xs text-dark-400">Milestones Done</p>
        </div>
        <div className="p-3 rounded-lg bg-dark-800/30 text-center">
          <p className="text-lg font-bold text-white">{daysRemaining || '-'}</p>
          <p className="text-xs text-dark-400">Days Left</p>
        </div>
        <div className="p-3 rounded-lg bg-dark-800/30 text-center">
          <Badge variant={goal.priority === 'high' ? 'orange' : 'cyan'} size="sm">
            {goal.priority}
          </Badge>
          <p className="text-xs text-dark-400 mt-1">Priority</p>
        </div>
      </div>

      {/* Milestones */}
      <div>
        <h4 className="text-sm font-medium text-dark-200 mb-3">Milestones</h4>
        <div className="space-y-2">
          {goal.milestones.map(milestone => (
            <div
              key={milestone.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg',
                milestone.completed ? 'bg-neon-green/10' : 'bg-dark-800/30'
              )}
            >
              {milestone.completed ? (
                <CheckCircle2 className="w-5 h-5 text-neon-green" />
              ) : (
                <Circle className="w-5 h-5 text-dark-500" />
              )}
              <span className={cn(
                'text-sm',
                milestone.completed ? 'text-dark-400 line-through' : 'text-white'
              )}>
                {milestone.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-dark-700/50">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            <Pause className="w-4 h-4 mr-1" />
            Pause
          </Button>
          <Button variant="ghost" size="sm" className="text-status-error">
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
          <Button variant="outline" size="sm">
            <Edit3 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
}
