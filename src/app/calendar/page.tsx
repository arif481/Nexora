'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Brain,
  Sparkles,
  Loader2,
  Grid3X3,
  List,
} from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, LoadingSpinner } from '@/components/ui/Loading';
import { useUIStore } from '@/stores/uiStore';
import { cn, formatTime } from '@/lib/utils';
import { useCalendar, useEventsInRange } from '@/hooks/useCalendar';
import { useAuth } from '@/hooks/useAuth';
import type { CalendarEvent, EventCategory } from '@/types';

const categoryOptions: { label: string; value: EventCategory; color: string }[] = [
  { label: 'Work', value: 'work', color: 'bg-neon-cyan' },
  { label: 'Personal', value: 'personal', color: 'bg-neon-purple' },
  { label: 'Health', value: 'health', color: 'bg-neon-green' },
  { label: 'Social', value: 'social', color: 'bg-neon-orange' },
  { label: 'Learning', value: 'learning', color: 'bg-neon-pink' },
  { label: 'Rest', value: 'rest', color: 'bg-blue-500' },
  { label: 'Other', value: 'other', color: 'bg-gray-500' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarPage() {
  const { user, loading: authLoading } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  
  // Get the start and end of the current month for fetching events
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  const { events, loading } = useEventsInRange(monthStart, monthEnd);
  const { createEvent, deleteEvent } = useCalendar();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { openAIPanel } = useUIStore();

  // Form state for new event
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    category: 'work' as EventCategory,
    allDay: false,
  });

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const startDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  }, [currentDate]);

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  // Get events for selected date
  const selectedDateEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Create event
  const handleCreateEvent = async () => {
    if (!newEvent.title.trim() || !newEvent.date) return;
    
    setIsSaving(true);
    try {
      const startTime = newEvent.allDay
        ? new Date(newEvent.date)
        : new Date(`${newEvent.date}T${newEvent.startTime || '09:00'}`);
      
      const endTime = newEvent.allDay
        ? new Date(new Date(newEvent.date).setHours(23, 59, 59))
        : new Date(`${newEvent.date}T${newEvent.endTime || '10:00'}`);
      
      await createEvent({
        title: newEvent.title,
        description: newEvent.description,
        startTime,
        endTime,
        allDay: newEvent.allDay,
        location: newEvent.location,
        category: newEvent.category,
        energyRequired: 'medium',
        isFlexible: false,
      });
      
      setIsCreateModalOpen(false);
      setNewEvent({
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        location: '',
        category: 'work',
        allDay: false,
      });
    } catch (err) {
      console.error('Failed to create event:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryColor = (category: EventCategory) => {
    return categoryOptions.find(c => c.value === category)?.color || 'bg-gray-500';
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <MainLayout>
        <PageContainer title="Calendar" subtitle="Plan and organize your time">
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-dark-400">Loading calendar...</p>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <MainLayout>
        <PageContainer title="Calendar" subtitle="Plan and organize your time">
          <EmptyState
            icon={<CalendarDays className="w-12 h-12" />}
            title="Sign in to use calendar"
            description="Create an account to start planning your schedule"
            action={
              <Button variant="glow" onClick={() => window.location.href = '/auth/login'}>
                Sign In
              </Button>
            }
          />
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageContainer title="Calendar" subtitle="Plan and organize your time">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousMonth}
                className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-dark-300" />
              </button>
              <h2 className="text-xl font-semibold text-white min-w-[200px] text-center">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={goToNextMonth}
                className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-dark-300" />
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-dark-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('month')}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  viewMode === 'month' ? 'bg-dark-700 text-white' : 'text-dark-400 hover:text-white'
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  viewMode === 'week' ? 'bg-dark-700 text-white' : 'text-dark-400 hover:text-white'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <Button variant="glow" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              New Event
            </Button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            <Card variant="glass" className="p-4">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map(day => (
                  <div key={day} className="text-center py-2 text-sm font-medium text-dark-400">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={index} className="aspect-square p-1" />;
                  }
                  
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  const dayEvents = getEventsForDay(date);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        'aspect-square p-1 rounded-lg transition-all text-left',
                        'hover:bg-dark-800/50',
                        isToday && 'ring-2 ring-neon-cyan',
                        isSelected && 'bg-neon-cyan/20'
                      )}
                    >
                      <div className={cn(
                        'text-sm font-medium mb-1',
                        isToday ? 'text-neon-cyan' : 'text-white'
                      )}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            className={cn(
                              'text-[10px] px-1 py-0.5 rounded truncate text-white',
                              getCategoryColor(event.category)
                            )}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-[10px] text-dark-400 px-1">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {/* Selected Day Events */}
            <Card variant="glass" className="p-4">
              <h3 className="font-medium text-white mb-4">
                {selectedDate
                  ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                  : 'Select a date'}
              </h3>
              
              {selectedDate && (
                <div className="space-y-3">
                  {selectedDateEvents.length > 0 ? (
                    selectedDateEvents.map(event => (
                      <div
                        key={event.id}
                        className="p-3 rounded-lg bg-dark-800/50 border-l-2"
                        style={{ borderColor: getCategoryColor(event.category).replace('bg-', '#') }}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-medium text-white text-sm">{event.title}</h4>
                          <Badge variant="default" size="sm">{event.category}</Badge>
                        </div>
                        {!event.allDay && (
                          <div className="flex items-center gap-1 text-xs text-dark-400">
                            <Clock className="w-3 h-3" />
                            {formatTime(new Date(event.startTime))} - {formatTime(new Date(event.endTime))}
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-1 text-xs text-dark-400 mt-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-dark-500">
                      <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No events</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setNewEvent(prev => ({
                            ...prev,
                            date: selectedDate.toISOString().split('T')[0]
                          }));
                          setIsCreateModalOpen(true);
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Event
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* AI Assistant */}
            <Card variant="glass" className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-neon-purple" />
                <h3 className="font-medium text-white">AI Assistant</h3>
              </div>
              <p className="text-sm text-dark-400 mb-3">
                Get help scheduling, finding free time, or optimizing your calendar.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={openAIPanel}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Ask AI
              </Button>
            </Card>

            {/* Quick Stats */}
            <Card variant="glass" className="p-4">
              <h3 className="font-medium text-white mb-4">This Month</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-dark-400">Total Events</span>
                  <span className="text-white font-medium">{events.length}</span>
                </div>
                {categoryOptions.slice(0, 4).map(cat => {
                  const count = events.filter(e => e.category === cat.value).length;
                  return (
                    <div key={cat.value} className="flex items-center justify-between text-sm">
                      <span className="text-dark-400 capitalize">{cat.label}</span>
                      <span className="text-white font-medium">{count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Create Event Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create Event"
        >
          <div className="space-y-4">
            <Input
              label="Title"
              placeholder="Event title..."
              value={newEvent.title}
              onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
            />

            <Input
              label="Description"
              placeholder="Add details..."
              value={newEvent.description}
              onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
            />

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Date</label>
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white focus:border-neon-cyan outline-none"
              />
            </div>

            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="allDay"
                checked={newEvent.allDay}
                onChange={(e) => setNewEvent(prev => ({ ...prev, allDay: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="allDay" className="text-sm text-dark-300">All day event</label>
            </div>

            {!newEvent.allDay && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white focus:border-neon-cyan outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">End Time</label>
                  <input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white focus:border-neon-cyan outline-none"
                  />
                </div>
              </div>
            )}

            <Input
              label="Location"
              placeholder="Add location..."
              value={newEvent.location}
              onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
            />

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map(({ label, value, color }) => (
                  <button
                    key={value}
                    onClick={() => setNewEvent(prev => ({ ...prev, category: value }))}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1',
                      newEvent.category === value
                        ? 'bg-neon-cyan/20 border border-neon-cyan text-neon-cyan'
                        : 'bg-dark-800 border border-dark-700 text-dark-400 hover:border-dark-500'
                    )}
                  >
                    <div className={cn('w-2 h-2 rounded-full', color)} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

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
                onClick={handleCreateEvent}
                disabled={!newEvent.title.trim() || !newEvent.date || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Event'
                )}
              </Button>
            </div>
          </div>
        </Modal>
      </PageContainer>
    </MainLayout>
  );
}
