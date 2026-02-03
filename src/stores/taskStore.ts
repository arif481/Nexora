import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Task, TaskStatus, TaskPriority } from '@/types';

interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  filter: TaskFilter;
  sort: TaskSort;
  isLoading: boolean;
  error: string | null;

  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  selectTask: (task: Task | null) => void;
  setFilter: (filter: Partial<TaskFilter>) => void;
  setSort: (sort: TaskSort) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  completeTask: (taskId: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  
  // Computed
  getFilteredTasks: () => Task[];
  getPendingTasks: () => Task[];
  getOverdueTasks: () => Task[];
  getTodayTasks: () => Task[];
  getTasksByPriority: (priority: TaskPriority) => Task[];
}

interface TaskFilter {
  status: TaskStatus[];
  priority: TaskPriority[];
  tags: string[];
  category: string | null;
  dateRange: { start: Date | null; end: Date | null };
  search: string;
}

interface TaskSort {
  field: 'dueDate' | 'priority' | 'createdAt' | 'title';
  direction: 'asc' | 'desc';
}

const defaultFilter: TaskFilter = {
  status: ['pending', 'in-progress'],
  priority: [],
  tags: [],
  category: null,
  dateRange: { start: null, end: null },
  search: '',
};

const defaultSort: TaskSort = {
  field: 'dueDate',
  direction: 'asc',
};

const priorityOrder: Record<TaskPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      selectedTask: null,
      filter: defaultFilter,
      sort: defaultSort,
      isLoading: false,
      error: null,

      setTasks: (tasks) => set({ tasks, isLoading: false }),

      addTask: (task) =>
        set((state) => ({
          tasks: [task, ...state.tasks],
        })),

      updateTask: (taskId, updates) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? { ...task, ...updates, updatedAt: new Date() }
              : task
          ),
          selectedTask:
            state.selectedTask?.id === taskId
              ? { ...state.selectedTask, ...updates, updatedAt: new Date() }
              : state.selectedTask,
        })),

      deleteTask: (taskId) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== taskId),
          selectedTask:
            state.selectedTask?.id === taskId ? null : state.selectedTask,
        })),

      selectTask: (task) => set({ selectedTask: task }),

      setFilter: (filter) =>
        set((state) => ({
          filter: { ...state.filter, ...filter },
        })),

      setSort: (sort) => set({ sort }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error, isLoading: false }),

      completeTask: (taskId) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status: 'completed' as TaskStatus,
                  completedAt: new Date(),
                  updatedAt: new Date(),
                }
              : task
          ),
        })),

      toggleSubtask: (taskId, subtaskId) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: task.subtasks.map((subtask) =>
                    subtask.id === subtaskId
                      ? {
                          ...subtask,
                          completed: !subtask.completed,
                          completedAt: !subtask.completed ? new Date() : undefined,
                        }
                      : subtask
                  ),
                  updatedAt: new Date(),
                }
              : task
          ),
        })),

      getFilteredTasks: () => {
        const { tasks, filter, sort } = get();
        let filtered = [...tasks];

        // Filter by status
        if (filter.status.length > 0) {
          filtered = filtered.filter((task) =>
            filter.status.includes(task.status)
          );
        }

        // Filter by priority
        if (filter.priority.length > 0) {
          filtered = filtered.filter((task) =>
            filter.priority.includes(task.priority)
          );
        }

        // Filter by tags
        if (filter.tags.length > 0) {
          filtered = filtered.filter((task) =>
            filter.tags.some((tag) => task.tags.includes(tag))
          );
        }

        // Filter by category
        if (filter.category) {
          filtered = filtered.filter(
            (task) => task.category === filter.category
          );
        }

        // Filter by date range
        if (filter.dateRange.start) {
          filtered = filtered.filter(
            (task) =>
              task.dueDate && task.dueDate >= filter.dateRange.start!
          );
        }
        if (filter.dateRange.end) {
          filtered = filtered.filter(
            (task) =>
              task.dueDate && task.dueDate <= filter.dateRange.end!
          );
        }

        // Filter by search
        if (filter.search) {
          const search = filter.search.toLowerCase();
          filtered = filtered.filter(
            (task) =>
              task.title.toLowerCase().includes(search) ||
              task.description?.toLowerCase().includes(search) ||
              task.tags.some((tag) => tag.toLowerCase().includes(search))
          );
        }

        // Sort
        filtered.sort((a, b) => {
          let comparison = 0;
          switch (sort.field) {
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
          return sort.direction === 'asc' ? comparison : -comparison;
        });

        return filtered;
      },

      getPendingTasks: () => {
        const { tasks } = get();
        return tasks.filter(
          (task) => task.status === 'pending' || task.status === 'in-progress'
        );
      },

      getOverdueTasks: () => {
        const { tasks } = get();
        const now = new Date();
        return tasks.filter(
          (task) =>
            task.dueDate &&
            task.dueDate < now &&
            task.status !== 'completed' &&
            task.status !== 'cancelled'
        );
      },

      getTodayTasks: () => {
        const { tasks } = get();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return tasks.filter(
          (task) =>
            task.dueDate &&
            task.dueDate >= today &&
            task.dueDate < tomorrow &&
            task.status !== 'completed' &&
            task.status !== 'cancelled'
        );
      },

      getTasksByPriority: (priority) => {
        const { tasks } = get();
        return tasks.filter(
          (task) =>
            task.priority === priority &&
            task.status !== 'completed' &&
            task.status !== 'cancelled'
        );
      },
    }),
    {
      name: 'nexora-tasks',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tasks: state.tasks,
        filter: state.filter,
        sort: state.sort,
      }),
    }
  )
);
