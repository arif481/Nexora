'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Tag,
  Clock,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Trash2,
  Flag,
  Sparkles,
  Brain,
  Target,
  ListTodo,
  List,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge, PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { Progress, CircularProgress } from '@/components/ui/Progress';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, LoadingSpinner } from '@/components/ui/Loading';
import { useUIStore } from '@/stores/uiStore';
import { cn, formatRelativeDate, getDeadlineStatus } from '@/lib/utils';
import { useTasks, useTaskStats } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import type { Task, TaskPriority, TaskStatus } from '@/types';

const priorityOptions: { label: string; value: TaskPriority; color: string }[] = [
  { label: 'Critical', value: 'critical', color: 'text-red-500' },
  { label: 'High', value: 'high', color: 'text-neon-orange' },
  { label: 'Medium', value: 'medium', color: 'text-neon-purple' },
  { label: 'Low', value: 'low', color: 'text-neon-cyan' },
];

const statusOptions: { label: string; value: TaskStatus }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' },
];

export default function TasksPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { tasks, loading, error, createTask, updateTask, deleteTask, completeTask, reopenTask } = useTasks();
  const stats = useTaskStats();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'createdAt'>('dueDate');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const { openAIPanel } = useUIStore();

  // Form state for new task
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    dueDate: '',
    tags: '',
  });

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        task =>
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(task => task.status === filterStatus);
    }

    // Priority filter
    if (filterPriority !== 'all') {
      result = result.filter(task => task.priority === filterPriority);
    }

    // Sort
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    result.sort((a, b) => {
      if (sortBy === 'dueDate') {
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return aDate - bDate;
      }
      if (sortBy === 'priority') {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [tasks, searchQuery, filterStatus, filterPriority, sortBy]);

  // Group by status
  const taskGroups = useMemo(() => {
    const pending = filteredTasks.filter(t => t.status === 'pending');
    const inProgress = filteredTasks.filter(t => t.status === 'in-progress');
    const completed = filteredTasks.filter(t => t.status === 'completed');
    return { pending, inProgress, completed };
  }, [filteredTasks]);

  // Handle task completion toggle
  const handleToggleComplete = async (task: Task) => {
    try {
      if (task.status === 'completed') {
        await reopenTask(task.id);
      } else {
        await completeTask(task.id);
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  // Create new task
  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;
    
    setIsSaving(true);
    try {
      await createTask({
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        status: 'pending',
        dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
        tags: newTask.tags ? newTask.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        subtasks: [],
      });
      
      setIsCreateModalOpen(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        tags: '',
      });
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete task
  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    
    setIsSaving(true);
    try {
      await deleteTask(selectedTask.id);
      setIsDeleteModalOpen(false);
      setSelectedTask(null);
    } catch (err) {
      console.error('Failed to delete task:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Update task status
  const handleUpdateStatus = async (taskId: string, status: TaskStatus) => {
    try {
      if (status === 'completed') {
        await completeTask(taskId);
      } else {
        await updateTask(taskId, { status });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const toggleTaskExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <MainLayout>
        <PageContainer title="Tasks" subtitle="Organize and accomplish your goals">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading tasks...</p>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  // Show error state
  if (error && !loading) {
    return (
      <MainLayout>
        <PageContainer title="Tasks" subtitle="Organize and accomplish your goals">
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <div className="p-4 rounded-full bg-red-500/10">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-white">Unable to Load Tasks</h2>
            <p className="text-dark-400 text-center max-w-md">
              {error.includes('index') 
                ? 'Database indexes are being built. This usually takes 2-5 minutes. Please try again shortly.'
                : error.includes('permission')
                ? 'You don\'t have permission to access this data. Please sign out and sign in again.'
                : error}
            </p>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button variant="glow" onClick={() => router.push('/auth/login')}>
                Sign In Again
              </Button>
            </div>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <MainLayout>
        <PageContainer title="Tasks" subtitle="Organize and accomplish your goals">
          <EmptyState
            icon={<ListTodo className="w-12 h-12" />}
            title="Sign in to manage tasks"
            description="Create an account to start organizing your tasks"
            action={
              <Button variant="glow" onClick={() => router.push('/auth/login')}>
                Sign In
              </Button>
            }
          />
        </PageContainer>
      </MainLayout>
    );
  }

  const TaskCard = ({ task }: { task: Task }) => {
    const isExpanded = expandedTasks.has(task.id);
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
    const totalSubtasks = task.subtasks?.length || 0;
    const deadlineStatus = task.dueDate ? getDeadlineStatus(new Date(task.dueDate)) : null;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className={cn(
          'group rounded-xl transition-all duration-200',
          'bg-dark-900/50 border border-dark-700/50 backdrop-blur-sm',
          'hover:border-neon-cyan/30',
          task.status === 'completed' && 'opacity-60'
        )}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <button
              onClick={() => handleToggleComplete(task)}
              className={cn(
                'mt-0.5 w-6 h-6 rounded-lg flex-shrink-0',
                'flex items-center justify-center transition-all',
                task.status === 'completed'
                  ? 'bg-neon-green text-dark-900'
                  : 'border-2 border-dark-500 hover:border-neon-cyan'
              )}
            >
              {task.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className={cn(
                  'font-medium text-white',
                  task.status === 'completed' && 'line-through text-dark-400'
                )}>
                  {task.title}
                </h3>
                <PriorityBadge priority={task.priority} />
              </div>

              {task.description && (
                <p className="text-sm text-dark-400 line-clamp-2 mb-2">{task.description}</p>
              )}

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {task.dueDate && (
                  <Badge
                    variant={
                      deadlineStatus === 'overdue' ? 'red' :
                      deadlineStatus === 'today' ? 'orange' :
                      deadlineStatus === 'tomorrow' ? 'purple' :
                      deadlineStatus === 'upcoming' ? 'blue' : 'default'
                    }
                    size="sm"
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatRelativeDate(new Date(task.dueDate))}
                  </Badge>
                )}

                {task.tags && task.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    {task.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="default" size="sm">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {task.tags.length > 2 && (
                      <span className="text-xs text-dark-500">+{task.tags.length - 2}</span>
                    )}
                  </div>
                )}

                {task.estimatedDuration && (
                  <Badge variant="default" size="sm">
                    <Clock className="w-3 h-3 mr-1" />
                    {task.estimatedDuration}m
                  </Badge>
                )}
              </div>

              {/* Subtasks */}
              {hasSubtasks && (
                <div className="mt-3">
                  <button
                    onClick={() => toggleTaskExpanded(task.id)}
                    className="flex items-center gap-2 text-sm text-dark-400 hover:text-white transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span>{completedSubtasks}/{totalSubtasks} subtasks</span>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 space-y-1 pl-4 border-l border-dark-700">
                          {task.subtasks?.map(subtask => (
                            <div
                              key={subtask.id}
                              className="flex items-center gap-2 py-1"
                            >
                              {subtask.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-neon-green flex-shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-dark-500 flex-shrink-0" />
                              )}
                              <span className={cn(
                                'text-sm',
                                subtask.completed ? 'text-dark-500 line-through' : 'text-dark-300'
                              )}>
                                {subtask.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Actions */}
            <button
              onClick={() => {
                setSelectedTask(task);
                setIsDeleteModalOpen(true);
              }}
              className="p-1.5 rounded-lg hover:bg-dark-700/50 opacity-0 group-hover:opacity-100 transition-all"
            >
              <MoreHorizontal className="w-4 h-4 text-dark-400" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const TaskGroup = ({ title, tasks, icon: Icon }: { title: string; tasks: Task[]; icon: any }) => {
    if (tasks.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-neon-cyan" />
          <h3 className="font-medium text-white">{title}</h3>
          <Badge variant="default" size="sm">{tasks.length}</Badge>
        </div>
        <div className="space-y-2">
          <AnimatePresence>
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <PageContainer title="Tasks" subtitle="Organize and accomplish your goals">
        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-dark-400">Total Tasks</span>
              <ListTodo className="w-5 h-5 text-neon-cyan" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </Card>

          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-dark-400">In Progress</span>
              <Target className="w-5 h-5 text-neon-purple" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
          </Card>

          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-dark-400">Completed</span>
              <CheckCircle2 className="w-5 h-5 text-neon-green" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.completed}</p>
          </Card>

          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-dark-400">Overdue</span>
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.overdue}</p>
          </Card>
        </motion.div>

        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-3 mb-6"
        >
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
            className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan outline-none"
          >
            <option value="all">All Status</option>
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as TaskPriority | 'all')}
            className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan outline-none"
          >
            <option value="all">All Priority</option>
            {priorityOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan outline-none"
          >
            <option value="dueDate">Sort by Due Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="createdAt">Sort by Created</option>
          </select>

          <Button variant="glow" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            New Task
          </Button>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tasks List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {filteredTasks.length > 0 ? (
              <>
                <TaskGroup title="In Progress" tasks={taskGroups.inProgress} icon={Target} />
                <TaskGroup title="Pending" tasks={taskGroups.pending} icon={Clock} />
                <TaskGroup title="Completed" tasks={taskGroups.completed} icon={CheckCircle2} />
              </>
            ) : tasks.length > 0 ? (
              <EmptyState
                icon={<Search className="w-12 h-12" />}
                title="No tasks found"
                description="Try adjusting your filters or search query"
              />
            ) : (
              <EmptyState
                icon={<ListTodo className="w-12 h-12" />}
                title="No tasks yet"
                description="Create your first task to get started"
                action={
                  <Button variant="glow" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Create Task
                  </Button>
                }
              />
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            {/* AI Suggestions */}
            <Card variant="glass" className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-neon-purple" />
                <h3 className="font-medium text-white">AI Insights</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-dark-800/50 border border-dark-700/50">
                  <p className="text-sm text-dark-300">
                    {stats.overdue > 0
                      ? `⚠️ You have ${stats.overdue} overdue task${stats.overdue > 1 ? 's' : ''}. Consider prioritizing these first.`
                      : stats.total === 0
                      ? "🚀 Ready to be productive? Add your first task!"
                      : stats.completionRate >= 80
                      ? "🎉 Great progress! You're crushing your task list."
                      : "💪 Keep going! Focus on high-priority items first."}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={openAIPanel}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Get AI Help
                </Button>
              </div>
            </Card>

            {/* Progress Overview */}
            <Card variant="glass" className="p-4">
              <h3 className="font-medium text-white mb-4">Progress Overview</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-400">Completion Rate</span>
                  <span className="text-sm font-medium text-neon-cyan">{stats.completionRate}%</span>
                </div>
                <Progress value={stats.completionRate} variant="cyan" size="sm" />

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-dark-800/50 text-center">
                    <p className="text-lg font-bold text-neon-orange">{stats.highPriority}</p>
                    <p className="text-xs text-dark-400">High Priority</p>
                  </div>
                  <div className="p-3 rounded-lg bg-dark-800/50 text-center">
                    <p className="text-lg font-bold text-neon-green">{stats.dueToday}</p>
                    <p className="text-xs text-dark-400">Due Today</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Create Task Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Task"
        >
          <div className="space-y-4">
            <Input
              label="Task Title"
              placeholder="What needs to be done?"
              value={newTask.title}
              onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
            />
            
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Description</label>
              <textarea
                placeholder="Add more details..."
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white placeholder-dark-500 focus:border-neon-cyan outline-none resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white focus:border-neon-cyan outline-none"
                >
                  {priorityOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Due Date</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white focus:border-neon-cyan outline-none"
                />
              </div>
            </div>

            <Input
              label="Tags (comma separated)"
              placeholder="work, important, project"
              value={newTask.tags}
              onChange={(e) => setNewTask(prev => ({ ...prev, tags: e.target.value }))}
            />

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="glow"
                className="flex-1"
                onClick={handleCreateTask}
                disabled={!newTask.title.trim() || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Task'
                )}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedTask(null);
          }}
          title="Delete Task"
        >
          <div className="space-y-4">
            <p className="text-dark-300">
              Are you sure you want to delete "{selectedTask?.title}"?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedTask(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-red-500 border-red-500/30 hover:bg-red-500/10"
                onClick={handleDeleteTask}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      </PageContainer>
    </MainLayout>
  );
}
