'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/stores/uiStore';
import { useTasks } from '@/hooks/useTasks';
import { useCalendar } from '@/hooks/useCalendar';
import { useNotes } from '@/hooks/useNotes';
import { useJournal } from '@/hooks/useJournal';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X, CheckCircle, Calendar, FileText, BookOpen, Zap, Trash2, Save, Repeat } from 'lucide-react';
import type { RecurrenceRule } from '@/types';
import { useState } from 'react';
import type { TaskStatus, TaskPriority } from '@/types';

export function GlobalModals() {
  const router = useRouter();
  const { activeModal, modalData, closeModal } = useUIStore();
  const { createTask, updateTask, deleteTask } = useTasks();
  const { createEvent } = useCalendar();
  const { createNote } = useNotes();
  const { createEntry: createJournalEntry } = useJournal();

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [journalContent, setJournalContent] = useState('');
  const [quickCapture, setQuickCapture] = useState('');

  // Edit task form states
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium');
  const [editStatus, setEditStatus] = useState<TaskStatus>('todo');
  const [editDueDate, setEditDueDate] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editRecurFreq, setEditRecurFreq] = useState<RecurrenceRule['frequency'] | 'none'>('none');
  const [editRecurInterval, setEditRecurInterval] = useState(1);
  const [editRecurDays, setEditRecurDays] = useState<number[]>([]);

  // Populate edit form when edit-task modal opens
  useEffect(() => {
    if (activeModal === 'edit-task' && modalData?.task) {
      const t = modalData.task as any;
      setEditTitle(t.title || '');
      setEditDescription(t.description || '');
      setEditPriority(t.priority || 'medium');
      setEditStatus(t.status || 'todo');
      setEditDueDate(t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '');
      setEditRecurFreq(t.recurrence?.frequency || 'none');
      setEditRecurInterval(t.recurrence?.interval || 1);
      setEditRecurDays(t.recurrence?.daysOfWeek || []);
      setShowDeleteConfirm(false);
    }
  }, [activeModal, modalData]);

  const resetForms = useCallback(() => {
    setTaskTitle('');
    setEventTitle('');
    setNoteTitle('');
    setJournalContent('');
    setQuickCapture('');
    setEditTitle('');
    setEditDescription('');
    setEditPriority('medium');
    setEditStatus('todo');
    setEditDueDate('');
    setEditRecurFreq('none');
    setEditRecurInterval(1);
    setEditRecurDays([]);
    setShowDeleteConfirm(false);
    setIsSubmitting(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForms();
    closeModal();
  }, [closeModal, resetForms]);

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) return;
    setIsSubmitting(true);
    try {
      await createTask({
        title: taskTitle.trim(),
        priority: 'medium',
        status: 'todo',
      });
      handleClose();
      router.push('/tasks');
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventTitle.trim()) return;
    setIsSubmitting(true);
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration
      await createEvent({
        title: eventTitle.trim(),
        startTime,
        endTime,
        allDay: false,
      });
      handleClose();
      router.push('/calendar');
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNote = async () => {
    if (!noteTitle.trim()) return;
    setIsSubmitting(true);
    try {
      await createNote({
        title: noteTitle.trim(),
        content: '',
      });
      handleClose();
      router.push('/notes');
    } catch (error) {
      console.error('Failed to create note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateJournal = async () => {
    if (!journalContent.trim()) return;
    setIsSubmitting(true);
    try {
      await createJournalEntry({
        content: journalContent.trim(),
        mood: {
          score: 5,
          emotions: [],
          energyLevel: 5,
          stressLevel: 5,
        },
        date: new Date(),
      });
      handleClose();
      router.push('/journal');
    } catch (error) {
      console.error('Failed to create journal entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickCapture = async () => {
    if (!quickCapture.trim()) return;
    setIsSubmitting(true);
    try {
      // Quick capture creates a task by default
      await createTask({
        title: quickCapture.trim(),
        priority: 'medium',
        status: 'todo',
      });
      handleClose();
    } catch (error) {
      console.error('Failed to capture:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!editTitle.trim() || !modalData?.taskId) return;
    setIsSubmitting(true);
    try {
      const recurrence: RecurrenceRule | undefined = editRecurFreq !== 'none' ? {
        frequency: editRecurFreq,
        interval: editRecurInterval,
        ...(editRecurFreq === 'weekly' && editRecurDays.length > 0 ? { daysOfWeek: editRecurDays } : {}),
      } : undefined;
      await updateTask(modalData.taskId as string, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        priority: editPriority,
        status: editStatus,
        dueDate: editDueDate ? new Date(editDueDate) : undefined,
        recurrence,
      });
      handleClose();
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!modalData?.taskId) return;
    setIsSubmitting(true);
    try {
      await deleteTask(modalData.taskId as string);
      handleClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeModal) return null;

  const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    { value: 'high', label: 'High', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    { value: 'critical', label: 'Critical', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  ];

  const statusOptions: { value: TaskStatus; label: string }[] = [
    { value: 'todo', label: 'To Do' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'review', label: 'Review' },
    { value: 'done', label: 'Done' },
  ];

  return (
    <AnimatePresence>
      {activeModal === 'create-task' && (
        <Modal isOpen onClose={handleClose} title="Create Task">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Task Title</label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                placeholder="What needs to be done?"
                className="w-full px-4 py-3 rounded-xl bg-glass-light border border-glass-border text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan"
                autoFocus
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button
                variant="primary"
                onClick={handleCreateTask}
                disabled={!taskTitle.trim() || isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {activeModal === 'edit-task' && (
        <Modal isOpen onClose={handleClose} title="Edit Task">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Task title..."
                className="w-full px-4 py-3 rounded-xl bg-glass-light border border-glass-border text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Description</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Add details..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-glass-light border border-glass-border text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Priority</label>
                <div className="flex flex-wrap gap-2">
                  {priorityOptions.map(p => (
                    <button
                      key={p.value}
                      onClick={() => setEditPriority(p.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${editPriority === p.value ? p.color : 'bg-dark-800 text-dark-400 border-dark-700 hover:border-dark-500'
                        }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-glass-light border border-glass-border text-white focus:outline-none focus:border-neon-cyan"
                >
                  {statusOptions.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Due Date</label>
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-glass-light border border-glass-border text-white focus:outline-none focus:border-neon-cyan"
              />
            </div>

            {/* Recurrence */}
            <div>
              <label className="block text-sm text-white/60 mb-2 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5" /> Repeat
              </label>
              <div className="flex gap-3">
                <select
                  value={editRecurFreq}
                  onChange={(e) => setEditRecurFreq(e.target.value as any)}
                  className="flex-1 px-3 py-2 rounded-xl bg-glass-light border border-glass-border text-white focus:outline-none focus:border-neon-cyan text-sm"
                >
                  <option value="none">No repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                {editRecurFreq !== 'none' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50">every</span>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={editRecurInterval}
                      onChange={(e) => setEditRecurInterval(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 px-2 py-2 rounded-xl bg-glass-light border border-glass-border text-white text-center text-sm focus:outline-none focus:border-neon-cyan"
                    />
                    <span className="text-xs text-white/50">
                      {editRecurFreq === 'daily' ? 'day(s)' : editRecurFreq === 'weekly' ? 'week(s)' : editRecurFreq === 'monthly' ? 'month(s)' : 'year(s)'}
                    </span>
                  </div>
                )}
              </div>
              {editRecurFreq === 'weekly' && (
                <div className="flex gap-1.5 mt-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEditRecurDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i])}
                      className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${editRecurDays.includes(i)
                          ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                          : 'bg-dark-800 text-dark-400 border border-dark-700 hover:border-dark-500'
                        }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Delete Confirmation */}
            {showDeleteConfirm ? (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-sm text-red-400 mb-3">Are you sure you want to delete this task? This cannot be undone.</p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-red-600 hover:bg-red-700"
                    onClick={handleDeleteTask}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    {isSubmitting ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="flex gap-3 justify-between pt-2">
              <Button
                variant="ghost"
                className="text-red-400 hover:text-red-300"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={handleClose}>Cancel</Button>
                <Button
                  variant="primary"
                  onClick={handleUpdateTask}
                  disabled={!editTitle.trim() || isSubmitting}
                >
                  <Save className="w-4 h-4 mr-1" />
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {activeModal === 'create-event' && (
        <Modal isOpen onClose={handleClose} title="Create Event">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Event Title</label>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateEvent()}
                placeholder="What's happening?"
                className="w-full px-4 py-3 rounded-xl bg-glass-light border border-glass-border text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan"
                autoFocus
              />
            </div>
            <p className="text-sm text-white/40">Event will be created for 1 hour from now. Edit details on the calendar page.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button
                variant="primary"
                onClick={handleCreateEvent}
                disabled={!eventTitle.trim() || isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Event'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {activeModal === 'create-note' && (
        <Modal isOpen onClose={handleClose} title="Create Note">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Note Title</label>
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateNote()}
                placeholder="Note title..."
                className="w-full px-4 py-3 rounded-xl bg-glass-light border border-glass-border text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan"
                autoFocus
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button
                variant="primary"
                onClick={handleCreateNote}
                disabled={!noteTitle.trim() || isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Note'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {activeModal === 'journal-entry' && (
        <Modal isOpen onClose={handleClose} title="New Journal Entry">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">What&apos;s on your mind?</label>
              <textarea
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
                placeholder="Write your thoughts..."
                rows={5}
                className="w-full px-4 py-3 rounded-xl bg-glass-light border border-glass-border text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan resize-none"
                autoFocus
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button
                variant="primary"
                onClick={handleCreateJournal}
                disabled={!journalContent.trim() || isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Entry'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {activeModal === 'quick-capture' && (
        <Modal isOpen onClose={handleClose} title="Quick Capture">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Capture anything</label>
              <input
                type="text"
                value={quickCapture}
                onChange={(e) => setQuickCapture(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickCapture()}
                placeholder="Type something to remember..."
                className="w-full px-4 py-3 rounded-xl bg-glass-light border border-glass-border text-white placeholder-white/40 focus:outline-none focus:border-neon-cyan"
                autoFocus
              />
            </div>
            <p className="text-sm text-white/40">Creates a task with your text. You can categorize it later.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button
                variant="primary"
                onClick={handleQuickCapture}
                disabled={!quickCapture.trim() || isSubmitting}
              >
                {isSubmitting ? 'Capturing...' : 'Capture'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </AnimatePresence>
  );
}
