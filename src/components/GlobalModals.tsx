'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/stores/uiStore';
import { useTasks } from '@/hooks/useTasks';
import { useCalendar } from '@/hooks/useCalendar';
import { useNotes } from '@/hooks/useNotes';
import { useJournal } from '@/hooks/useJournal';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { X, CheckCircle, Calendar, FileText, BookOpen, Zap } from 'lucide-react';
import { useState } from 'react';

export function GlobalModals() {
  const router = useRouter();
  const { activeModal, modalData, closeModal } = useUIStore();
  const { createTask } = useTasks();
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

  const resetForms = useCallback(() => {
    setTaskTitle('');
    setEventTitle('');
    setNoteTitle('');
    setJournalContent('');
    setQuickCapture('');
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

  if (!activeModal) return null;

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
