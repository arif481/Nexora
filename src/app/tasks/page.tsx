'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, ListTodo, AlertCircle, LayoutDashboard, Calendar, Folder } from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner, EmptyState } from '@/components/ui/Loading';
import { useAuth } from '@/hooks/useAuth';
import { useTasks, useTaskStats } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import type { Task, TaskStatus } from '@/types';
import { KanbanBoard } from '@/components/features/tasks/KanbanBoard';

export default function TasksPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    updateTask,
    completeTask
  } = useTasks();

  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    addProject,
  } = useProjects();

  // const stats = useTaskStats(); // removed to fix lint, will re-add if needed in UI

  const [activeTab, setActiveTab] = useState<'all' | 'my-day' | string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loading = authLoading || tasksLoading || projectsLoading;
  const error = tasksError || projectsError;

  // Derive displayed tasks based on active tab
  const displayedTasks = useMemo(() => {
    let result = tasks;

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }

    if (activeTab === 'my-day') {
      const today = new Date().toDateString();
      result = result.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === today);
    } else if (activeTab !== 'all') {
      result = result.filter(t => t.projectId === activeTab);
    }

    // Sort by due date natively
    result.sort((a, b) => {
      const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return aTime - bTime;
    });

    return result;
  }, [tasks, activeTab, searchQuery]);

  /* const activeProject = useMemo(() => {
    if (activeTab === 'all' || activeTab === 'my-day') return null;
    return projects.find(p => p.id === activeTab) || null;
  }, [activeTab, projects]); */

  const handleTaskMove = async (taskId: string, newStatus: TaskStatus) => {
    try {
      if (newStatus === 'done') {
        await completeTask(taskId);
      } else {
        await updateTask(taskId, { status: newStatus });
      }
    } catch (err) {
      console.error('Failed to move task:', err);
    }
  };

  const handleTaskClick = (task: Task) => {
    // For now simple routing or modal
    console.log('Task clicked', task);
  };

  const handleCreateTestProject = async () => {
    try {
      await addProject({
        name: 'New Project',
        description: 'Auto-generated test project',
        color: '#a855f7'
      });
    } catch (err) {
      console.error('Failed to create project', err);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <PageContainer title="Tasks & Projects" subtitle="Manage your work efficiently">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <PageContainer title="Tasks & Projects">
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <p className="text-dark-400 max-w-md text-center">{error instanceof Error ? error.message : error}</p>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <PageContainer title="Tasks & Projects">
          <EmptyState
            icon={<ListTodo className="w-12 h-12" />}
            title="Sign in to manage tasks"
            description="Create an account to track your projects and tasks."
            action={<Button variant="glow" onClick={() => router.push('/auth/login')}>Sign In</Button>}
          />
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageContainer title="Tasks & Projects" subtitle="Organize your work with boards and lists">

        {/* Navigation / Toolbar */}
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="flex-1">
            <div className="flex bg-dark-800 rounded-lg p-1 overflow-x-auto scrollbar-none max-w-max border border-glass-border">
              <NavTab
                active={activeTab === 'all'}
                onClick={() => setActiveTab('all')}
                icon={<LayoutDashboard className="w-4 h-4 mr-2" />}
                label="All Tasks"
              />
              <NavTab
                active={activeTab === 'my-day'}
                onClick={() => setActiveTab('my-day')}
                icon={<Calendar className="w-4 h-4 mr-2" />}
                label="My Day"
              />
              <div className="w-px h-6 bg-dark-600 mx-2 self-center"></div>
              {projects.map(project => (
                <NavTab
                  key={project.id}
                  active={activeTab === project.id}
                  onClick={() => setActiveTab(project.id)}
                  icon={<Folder className="w-4 h-4 mr-2 text-neon-purple" />}
                  label={project.name}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-64">
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <Button variant="outline" onClick={handleCreateTestProject}>
              <Folder className="w-4 h-4 mr-1" /> Project
            </Button>
            <Button variant="glow">
              <Plus className="w-4 h-4 mr-1" /> Task
            </Button>
          </div>
        </div>

        {/* Board Area */}
        <div className="h-[calc(100vh-280px)]">
          {(activeTab === 'all' || activeTab === 'my-day') && displayedTasks.length === 0 ? (
            <EmptyState
              icon={<ListTodo className="w-12 h-12" />}
              title={activeTab === 'my-day' ? "No tasks for today" : "No tasks found"}
              description="Create a task to get started"
            />
          ) : (
            <KanbanBoard
              tasks={displayedTasks}
              onTaskMove={handleTaskMove}
              onTaskClick={handleTaskClick}
            />
          )}
        </div>

      </PageContainer>
    </MainLayout>
  );
}

function NavTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${active
        ? 'bg-dark-600 text-white shadow-sm'
        : 'text-dark-300 hover:text-white hover:bg-dark-700/50'
        }`}
    >
      {icon}
      {label}
    </button>
  );
}
