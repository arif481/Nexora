'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  Tag,
  Clock,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Trash2,
  Edit3,
  Copy,
  Flag,
  Sparkles,
  Brain,
  Target,
  ListTodo,
  Grid3X3,
  List,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Timer,
  Repeat,
  Link2,
  MessageSquare,
} from 'lucide-react';
import { MainLayout, PageContainer, Section } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge, PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { Progress, CircularProgress } from '@/components/ui/Progress';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/Loading';
import { useTaskStore } from '@/stores/taskStore';
import { useUIStore } from '@/stores/uiStore';
import { cn, formatDate, formatRelativeDate, getDeadlineStatus } from '@/lib/utils';
import type { Task, Priority, TaskStatus } from '@/types';

// Mock tasks for demonstration
const mockTasks: Task[] = [
  {
    id: '1',
    userId: 'user1',
    title: 'Complete project proposal',
    description: 'Write and finalize the Q2 project proposal for the client meeting',
    priority: 'high',
    status: 'in-progress',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    tags: ['work', 'important', 'client'],
    subtasks: [
      { id: 's1', title: 'Research market trends', completed: true },
      { id: 's2', title: 'Draft executive summary', completed: true },
      { id: 's3', title: 'Create timeline & budget', completed: false },
      { id: 's4', title: 'Review with team', completed: false },
    ],
    contextTriggers: ['at office', 'high energy'],
    estimatedMinutes: 120,
    aiSuggested: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    userId: 'user1',
    title: 'Schedule dentist appointment',
    description: 'Annual checkup - call Dr. Smith\'s office',
    priority: 'medium',
    status: 'pending',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    tags: ['health', 'personal'],
    subtasks: [],
    contextTriggers: ['phone available'],
    estimatedMinutes: 15,
    aiSuggested: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    userId: 'user1',
    title: 'Review team performance reports',
    description: 'Go through quarterly performance metrics and prepare feedback',
    priority: 'high',
    status: 'pending',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // tomorrow
    tags: ['work', 'management'],
    subtasks: [
      { id: 's1', title: 'Review sales team metrics', completed: false },
      { id: 's2', title: 'Review engineering metrics', completed: false },
      { id: 's3', title: 'Prepare feedback notes', completed: false },
    ],
    contextTriggers: [],
    estimatedMinutes: 90,
    aiSuggested: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    userId: 'user1',
    title: 'Buy groceries',
    description: 'Weekly grocery shopping - milk, eggs, bread, vegetables',
    priority: 'low',
    status: 'pending',
    dueDate: new Date(),
    tags: ['personal', 'shopping'],
    subtasks: [],
    contextTriggers: ['near store', 'weekend'],
    estimatedMinutes: 45,
    aiSuggested: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '5',
    userId: 'user1',
    title: 'Morning meditation',
    description: '15-minute guided meditation session',
    priority: 'medium',
    status: 'completed',
    dueDate: new Date(),
    tags: ['wellness', 'habit'],
    subtasks: [],
    contextTriggers: ['morning'],
    estimatedMinutes: 15,
    aiSuggested: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: new Date(),
  },
  {
    id: '6',
    userId: 'user1',
    title: 'Read 30 minutes',
    description: 'Continue reading "Atomic Habits"',
    priority: 'low',
    status: 'completed',
    dueDate: new Date(),
    tags: ['personal', 'learning', 'habit'],
    subtasks: [],
    contextTriggers: ['evening', 'relaxed'],
    estimatedMinutes: 30,
    aiSuggested: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: new Date(),
  },
];

type ViewMode = 'list' | 'board' | 'calendar';
type SortOption = 'dueDate' | 'priority' | 'createdAt' | 'title';

const priorityOrder: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const statusOrder: Record<TaskStatus, number> = {
  'in-progress': 0,
  pending: 1,
  completed: 2,
  cancelled: 3,
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');
  const [sortAsc, setSortAsc] = useState(true);
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const { openAIPanel } = useUIStore();

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    tasks.forEach(task => task.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [tasks]);

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
          task.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Priority filter
    if (filterPriority !== 'all') {
      result = result.filter(task => task.priority === filterPriority);
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(task => task.status === filterStatus);
    }

    // Tags filter
    if (filterTags.length > 0) {
      result = result.filter(task =>
        filterTags.every(tag => task.tags.includes(tag))
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'dueDate':
          const dateA = a.dueDate?.getTime() || Infinity;
          const dateB = b.dueDate?.getTime() || Infinity;
          comparison = dateA - dateB;
          break;
        case 'priority':
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }
      return sortAsc ? comparison : -comparison;
    });

    return result;
  }, [tasks, searchQuery, filterPriority, filterStatus, filterTags, sortBy, sortAsc]);

  // Group tasks by status for board view
  const tasksByStatus = useMemo(() => {
    return {
      pending: filteredTasks.filter(t => t.status === 'pending'),
      'in-progress': filteredTasks.filter(t => t.status === 'in-progress'),
      completed: filteredTasks.filter(t => t.status === 'completed'),
    };
  }, [filteredTasks]);

  // Stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const overdue = tasks.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      return t.dueDate < new Date();
    }).length;
    const aiSuggested = tasks.filter(t => t.aiSuggested).length;

    return { total, completed, inProgress, overdue, aiSuggested };
  }, [tasks]);

  const toggleTaskExpand = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const toggleTaskComplete = (taskId: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? {
              ...task,
              status: task.status === 'completed' ? 'pending' : 'completed',
              completedAt: task.status === 'completed' ? undefined : new Date(),
            }
          : task
      )
    );
  };

  const toggleSubtaskComplete = (taskId: string, subtaskId: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks.map(st =>
                st.id === subtaskId ? { ...st, completed: !st.completed } : st
              ),
            }
          : task
      )
    );
  };

  const handleDeleteTask = () => {
    if (taskToDelete) {
      setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
      setTaskToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const TaskCard = ({ task, compact = false }: { task: Task; compact?: boolean }) => {
    const isExpanded = expandedTasks.has(task.id);
    const deadlineStatus = task.dueDate ? getDeadlineStatus(task.dueDate) : null;
    const completedSubtasks = task.subtasks.filter(st => st.completed).length;
    const totalSubtasks = task.subtasks.length;
    const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          'group relative rounded-xl transition-all duration-200',
          'bg-dark-900/50 border border-dark-700/50 backdrop-blur-sm',
          'hover:border-neon-cyan/30 hover:bg-dark-800/50',
          task.status === 'completed' && 'opacity-60'
        )}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <button
              onClick={() => toggleTaskComplete(task.id)}
              className={cn(
                'mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0',
                'flex items-center justify-center transition-all',
                task.status === 'completed'
                  ? 'bg-neon-green border-neon-green'
                  : 'border-dark-500 hover:border-neon-cyan'
              )}
            >
              {task.status === 'completed' && (
                <CheckCircle2 className="w-3 h-3 text-dark-900" />
              )}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className={cn(
                    'text-sm font-medium truncate',
                    task.status === 'completed'
                      ? 'text-dark-400 line-through'
                      : 'text-white'
                  )}
                >
                  {task.title}
                </h3>
                {task.aiSuggested && (
                  <Sparkles className="w-3.5 h-3.5 text-neon-purple flex-shrink-0" />
                )}
              </div>

              {/* Description */}
              {task.description && !compact && (
                <p className="text-xs text-dark-400 line-clamp-2 mb-2">
                  {task.description}
                </p>
              )}

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Due date */}
                {task.dueDate && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 text-xs',
                      deadlineStatus === 'overdue' && 'text-status-error',
                      deadlineStatus === 'today' && 'text-neon-orange',
                      deadlineStatus === 'upcoming' && 'text-dark-300'
                    )}
                  >
                    <Calendar className="w-3 h-3" />
                    {formatRelativeDate(task.dueDate)}
                  </span>
                )}

                {/* Time estimate */}
                {task.estimatedMinutes && (
                  <span className="inline-flex items-center gap-1 text-xs text-dark-400">
                    <Clock className="w-3 h-3" />
                    {task.estimatedMinutes}m
                  </span>
                )}

                {/* Subtasks progress */}
                {totalSubtasks > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-dark-400">
                    <ListTodo className="w-3 h-3" />
                    {completedSubtasks}/{totalSubtasks}
                  </span>
                )}

                {/* Tags */}
                {task.tags.slice(0, 2).map(tag => (
                  <Badge key={tag} variant="outline" size="sm">
                    {tag}
                  </Badge>
                ))}
                {task.tags.length > 2 && (
                  <span className="text-xs text-dark-500">+{task.tags.length - 2}</span>
                )}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <PriorityBadge priority={task.priority} />

              {/* Expand button for subtasks */}
              {totalSubtasks > 0 && (
                <button
                  onClick={() => toggleTaskExpand(task.id)}
                  className="p-1 rounded hover:bg-dark-700/50 transition-colors"
                >
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-dark-400 transition-transform',
                      isExpanded && 'rotate-180'
                    )}
                  />
                </button>
              )}

              {/* More menu */}
              <div className="relative">
                <button className="p-1 rounded hover:bg-dark-700/50 opacity-0 group-hover:opacity-100 transition-all">
                  <MoreHorizontal className="w-4 h-4 text-dark-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Subtasks (expanded) */}
          <AnimatePresence>
            {isExpanded && totalSubtasks > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-3 border-t border-dark-700/50">
                  {/* Progress bar */}
                  <div className="flex items-center gap-3 mb-3">
                    <Progress value={subtaskProgress} size="sm" className="flex-1" />
                    <span className="text-xs text-dark-400">
                      {Math.round(subtaskProgress)}%
                    </span>
                  </div>

                  {/* Subtask list */}
                  <div className="space-y-2">
                    {task.subtasks.map(subtask => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-2 pl-2"
                      >
                        <button
                          onClick={() => toggleSubtaskComplete(task.id, subtask.id)}
                          className={cn(
                            'w-4 h-4 rounded border flex-shrink-0',
                            'flex items-center justify-center transition-all',
                            subtask.completed
                              ? 'bg-neon-cyan/20 border-neon-cyan'
                              : 'border-dark-500 hover:border-neon-cyan'
                          )}
                        >
                          {subtask.completed && (
                            <CheckCircle2 className="w-3 h-3 text-neon-cyan" />
                          )}
                        </button>
                        <span
                          className={cn(
                            'text-sm',
                            subtask.completed
                              ? 'text-dark-500 line-through'
                              : 'text-dark-200'
                          )}
                        >
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  return (
    <MainLayout>
      <PageContainer title="Tasks" subtitle="Manage your tasks and priorities">
        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6"
        >
          {[
            { label: 'Total', value: stats.total, icon: ListTodo, color: 'neon-cyan' },
            { label: 'In Progress', value: stats.inProgress, icon: Timer, color: 'neon-purple' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'neon-green' },
            { label: 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'status-error' },
            { label: 'AI Suggested', value: stats.aiSuggested, icon: Sparkles, color: 'neon-pink' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-xl bg-dark-900/50 border border-dark-700/50 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-4 h-4 text-${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-dark-400">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6"
        >
          {/* Search */}
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <Input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <select
                value={filterPriority}
                onChange={e => setFilterPriority(e.target.value as Priority | 'all')}
                className="px-3 py-2 rounded-lg bg-dark-800/50 border border-dark-700/50 text-sm text-dark-200 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as TaskStatus | 'all')}
                className="px-3 py-2 rounded-lg bg-dark-800/50 border border-dark-700/50 text-sm text-dark-200 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* View mode & Actions */}
          <div className="flex items-center gap-3">
            {/* Sort */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-dark-800/50 border border-dark-700/50">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-sm text-dark-200 focus:outline-none"
              >
                <option value="dueDate">Due Date</option>
                <option value="priority">Priority</option>
                <option value="createdAt">Created</option>
                <option value="title">Title</option>
              </select>
              <button
                onClick={() => setSortAsc(!sortAsc)}
                className="p-1 rounded hover:bg-dark-700/50"
              >
                {sortAsc ? (
                  <SortAsc className="w-4 h-4 text-dark-400" />
                ) : (
                  <SortDesc className="w-4 h-4 text-dark-400" />
                )}
              </button>
            </div>

            {/* View mode toggle */}
            <div className="flex items-center p-1 rounded-lg bg-dark-800/50 border border-dark-700/50">
              {[
                { mode: 'list' as ViewMode, icon: List },
                { mode: 'board' as ViewMode, icon: Grid3X3 },
              ].map(({ mode, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    viewMode === mode
                      ? 'bg-neon-cyan/20 text-neon-cyan'
                      : 'text-dark-400 hover:text-white'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* AI Suggest */}
            <Button variant="ghost" size="sm" onClick={openAIPanel}>
              <Brain className="w-4 h-4 mr-1" />
              AI Suggest
            </Button>

            {/* New Task */}
            <Button
              variant="glow"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              New Task
            </Button>
          </div>
        </motion.div>

        {/* Task List View */}
        {viewMode === 'list' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <AnimatePresence mode="popLayout">
              {filteredTasks.length > 0 ? (
                filteredTasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))
              ) : (
                <EmptyState
                  icon={<ListTodo className="w-12 h-12" />}
                  title="No tasks found"
                  description="Try adjusting your filters or create a new task"
                  action={
                    <Button variant="glow" onClick={() => setIsCreateModalOpen(true)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Create Task
                    </Button>
                  }
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Board View */}
        {viewMode === 'board' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Pending Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-dark-900/50 border border-dark-700/50">
                <div className="w-2 h-2 rounded-full bg-neon-orange" />
                <h3 className="font-medium text-white">Pending</h3>
                <Badge variant="secondary" size="sm">
                  {tasksByStatus.pending.length}
                </Badge>
              </div>
              <div className="space-y-3">
                <AnimatePresence>
                  {tasksByStatus.pending.map(task => (
                    <TaskCard key={task.id} task={task} compact />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* In Progress Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-dark-900/50 border border-dark-700/50">
                <div className="w-2 h-2 rounded-full bg-neon-purple" />
                <h3 className="font-medium text-white">In Progress</h3>
                <Badge variant="secondary" size="sm">
                  {tasksByStatus['in-progress'].length}
                </Badge>
              </div>
              <div className="space-y-3">
                <AnimatePresence>
                  {tasksByStatus['in-progress'].map(task => (
                    <TaskCard key={task.id} task={task} compact />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Completed Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-dark-900/50 border border-dark-700/50">
                <div className="w-2 h-2 rounded-full bg-neon-green" />
                <h3 className="font-medium text-white">Completed</h3>
                <Badge variant="secondary" size="sm">
                  {tasksByStatus.completed.length}
                </Badge>
              </div>
              <div className="space-y-3">
                <AnimatePresence>
                  {tasksByStatus.completed.map(task => (
                    <TaskCard key={task.id} task={task} compact />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {/* Create Task Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Task"
          size="lg"
        >
          <CreateTaskForm onClose={() => setIsCreateModalOpen(false)} />
        </Modal>

        {/* Delete Confirmation */}
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteTask}
          title="Delete Task"
          description="Are you sure you want to delete this task? This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
        />
      </PageContainer>
    </MainLayout>
  );
}

// Create Task Form Component
function CreateTaskForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add task to store
    console.log({ title, description, priority, dueDate, tags, estimatedMinutes });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <Input
        label="Task Title"
        placeholder="What needs to be done?"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">
          Description
        </label>
        <textarea
          placeholder="Add more details..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          className={cn(
            'w-full px-4 py-3 rounded-xl text-sm',
            'bg-dark-800/50 border border-dark-700/50',
            'text-white placeholder:text-dark-500',
            'focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 focus:border-transparent',
            'transition-all duration-200'
          )}
        />
      </div>

      {/* Priority & Due Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-dark-200 mb-1.5">
            Priority
          </label>
          <select
            value={priority}
            onChange={e => setPriority(e.target.value as Priority)}
            className={cn(
              'w-full px-4 py-3 rounded-xl text-sm',
              'bg-dark-800/50 border border-dark-700/50',
              'text-white',
              'focus:outline-none focus:ring-2 focus:ring-neon-cyan/50',
              'transition-all duration-200'
            )}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <Input
          type="date"
          label="Due Date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
        />
      </div>

      {/* Time Estimate */}
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">
          Time Estimate: {estimatedMinutes} minutes
        </label>
        <input
          type="range"
          min={5}
          max={240}
          step={5}
          value={estimatedMinutes}
          onChange={e => setEstimatedMinutes(parseInt(e.target.value))}
          className="w-full accent-neon-cyan"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">
          Tags
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map(tag => (
            <Badge key={tag} variant="cyan" size="sm">
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:text-white"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add a tag"
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
          />
          <Button type="button" variant="ghost" onClick={handleAddTag}>
            Add
          </Button>
        </div>
      </div>

      {/* AI Suggestion */}
      <div className="p-4 rounded-xl bg-neon-purple/10 border border-neon-purple/20">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-neon-purple" />
          <span className="text-sm font-medium text-neon-purple">AI Tip</span>
        </div>
        <p className="text-sm text-dark-300">
          Based on your schedule, the best time to work on this task would be tomorrow afternoon between 2-4 PM when your energy levels are typically high.
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="glow">
          Create Task
        </Button>
      </div>
    </form>
  );
}
