'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Video,
  Repeat,
  Bell,
  Sparkles,
  Brain,
  Zap,
  Target,
  Coffee,
  Moon,
  Sun,
  Filter,
  MoreHorizontal,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useCalendarStore } from '@/stores/calendarStore';
import { useUIStore } from '@/stores/uiStore';
import { cn, formatTime } from '@/lib/utils';
import type { CalendarEvent, FocusBlock } from '@/types';

// Mock events for demonstration
const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    userId: 'user1',
    title: 'Team Standup',
    startTime: new Date(new Date().setHours(9, 0, 0, 0)),
    endTime: new Date(new Date().setHours(9, 30, 0, 0)),
    type: 'meeting',
    isAllDay: false,
    recurrence: { frequency: 'daily', interval: 1 },
    reminderMinutes: [15],
    attendees: ['team@company.com'],
    location: 'Zoom',
    aiGenerated: false,
    conflictResolved: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    userId: 'user1',
    title: 'Deep Work Block',
    description: 'Focus time for project development',
    startTime: new Date(new Date().setHours(10, 0, 0, 0)),
    endTime: new Date(new Date().setHours(12, 0, 0, 0)),
    type: 'focus',
    isAllDay: false,
    recurrence: null,
    reminderMinutes: [5],
    aiGenerated: true,
    conflictResolved: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    userId: 'user1',
    title: 'Lunch Break',
    startTime: new Date(new Date().setHours(12, 0, 0, 0)),
    endTime: new Date(new Date().setHours(13, 0, 0, 0)),
    type: 'personal',
    isAllDay: false,
    recurrence: null,
    reminderMinutes: [],
    aiGenerated: false,
    conflictResolved: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    userId: 'user1',
    title: 'Client Presentation',
    description: 'Q2 Results presentation to stakeholders',
    startTime: new Date(new Date().setHours(14, 0, 0, 0)),
    endTime: new Date(new Date().setHours(15, 30, 0, 0)),
    type: 'meeting',
    isAllDay: false,
    recurrence: null,
    reminderMinutes: [30, 15],
    attendees: ['client@example.com', 'sales@company.com'],
    location: 'Conference Room A',
    aiGenerated: false,
    conflictResolved: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '5',
    userId: 'user1',
    title: 'Gym Session',
    startTime: new Date(new Date().setHours(18, 0, 0, 0)),
    endTime: new Date(new Date().setHours(19, 0, 0, 0)),
    type: 'personal',
    isAllDay: false,
    recurrence: { frequency: 'weekly', interval: 1, daysOfWeek: [1, 3, 5] },
    reminderMinutes: [60],
    location: 'Fitness Center',
    aiGenerated: false,
    conflictResolved: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockFocusBlocks: FocusBlock[] = [
  {
    id: '1',
    userId: 'user1',
    startTime: new Date(new Date().setHours(10, 0, 0, 0)),
    endTime: new Date(new Date().setHours(12, 0, 0, 0)),
    type: 'deep-work',
    linkedTaskIds: ['task-1'],
    energyLevel: 'high',
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

type ViewMode = 'day' | 'week' | 'month';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const eventTypeColors: Record<string, { bg: string; border: string; text: string }> = {
  meeting: { bg: 'bg-neon-orange/20', border: 'border-neon-orange', text: 'text-neon-orange' },
  focus: { bg: 'bg-neon-green/20', border: 'border-neon-green', text: 'text-neon-green' },
  personal: { bg: 'bg-neon-purple/20', border: 'border-neon-purple', text: 'text-neon-purple' },
  task: { bg: 'bg-neon-cyan/20', border: 'border-neon-cyan', text: 'text-neon-cyan' },
  reminder: { bg: 'bg-neon-pink/20', border: 'border-neon-pink', text: 'text-neon-pink' },
};

function getEventTypeIcon(type: string) {
  switch (type) {
    case 'meeting':
      return Users;
    case 'focus':
      return Target;
    case 'personal':
      return Coffee;
    default:
      return CalendarIcon;
  }
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const { openAIPanel } = useUIStore();

  // Get start of week
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Get days in current month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];

    // Add padding days from previous month
    for (let i = 0; i < firstDay.getDay(); i++) {
      const d = new Date(year, month, -i);
      days.unshift(d);
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // Add padding days for next month
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  // Get week days
  const getWeekDays = (date: Date) => {
    const weekStart = getWeekStart(date);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays(currentDate);
  const monthDays = getDaysInMonth(currentDate);

  // Filter events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Navigation
  const navigatePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') {
      d.setDate(d.getDate() - 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setMonth(d.getMonth() - 1);
    }
    setCurrentDate(d);
  };

  const navigateNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') {
      d.setDate(d.getDate() + 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    setCurrentDate(d);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if date is selected
  const isSelected = (date: Date) => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  // Get current time position
  const getCurrentTimePosition = () => {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    return (minutes / (24 * 60)) * 100;
  };

  const EventCard = ({ event, compact = false }: { event: CalendarEvent; compact?: boolean }) => {
    const colors = eventTypeColors[event.type] || eventTypeColors.personal;
    const Icon = getEventTypeIcon(event.type);
    const duration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60);

    if (compact) {
      return (
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setSelectedEvent(event)}
          className={cn(
            'p-2 rounded-lg cursor-pointer transition-all',
            colors.bg,
            'border-l-2',
            colors.border,
            'hover:scale-[1.02]'
          )}
        >
          <div className="flex items-center gap-1.5">
            {event.aiGenerated && <Sparkles className="w-3 h-3 text-neon-purple" />}
            <span className="text-xs font-medium text-white truncate">{event.title}</span>
          </div>
          <span className="text-[10px] text-dark-400">
            {formatTime(event.startTime)}
          </span>
        </motion.div>
      );
    }

    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => setSelectedEvent(event)}
        className={cn(
          'group p-3 rounded-xl cursor-pointer transition-all',
          colors.bg,
          'border-l-4',
          colors.border,
          'hover:scale-[1.01]'
        )}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Icon className={cn('w-4 h-4', colors.text)} />
            <h4 className="font-medium text-white">{event.title}</h4>
            {event.aiGenerated && (
              <Sparkles className="w-3.5 h-3.5 text-neon-purple" />
            )}
          </div>
          <button className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-dark-700/50 transition-all">
            <MoreHorizontal className="w-4 h-4 text-dark-400" />
          </button>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-dark-300">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {formatTime(event.startTime)} - {formatTime(event.endTime)}
            </span>
            <span className="text-dark-500">({duration}m)</span>
          </div>

          {event.location && (
            <div className="flex items-center gap-2 text-sm text-dark-400">
              {event.location.includes('Zoom') || event.location.includes('Meet') ? (
                <Video className="w-3.5 h-3.5" />
              ) : (
                <MapPin className="w-3.5 h-3.5" />
              )}
              <span>{event.location}</span>
            </div>
          )}

          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-dark-400">
              <Users className="w-3.5 h-3.5" />
              <span>{event.attendees.length} attendee(s)</span>
            </div>
          )}

          {event.recurrence && (
            <div className="flex items-center gap-2 text-sm text-dark-500">
              <Repeat className="w-3.5 h-3.5" />
              <span>Repeats {event.recurrence.frequency}</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Week View Component
  const WeekView = () => {
    const todayEvents = getEventsForDay(selectedDate);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-6">
        {/* Week Calendar */}
        <Card variant="glass">
          <CardContent className="p-0">
            {/* Week Header */}
            <div className="grid grid-cols-8 border-b border-dark-700/50">
              <div className="p-3" /> {/* Time column */}
              {weekDays.map((day, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'p-3 text-center cursor-pointer transition-colors',
                    'border-l border-dark-700/50',
                    isSelected(day) && 'bg-neon-cyan/10',
                    isToday(day) && 'bg-neon-purple/10'
                  )}
                >
                  <p className="text-xs text-dark-400 mb-1">{DAYS[day.getDay()]}</p>
                  <p
                    className={cn(
                      'text-lg font-semibold',
                      isToday(day) ? 'text-neon-purple' : 'text-white'
                    )}
                  >
                    {day.getDate()}
                  </p>
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="relative h-[600px] overflow-y-auto">
              {/* Current time indicator */}
              {weekDays.some(d => isToday(d)) && (
                <div
                  className="absolute left-0 right-0 z-10 pointer-events-none"
                  style={{ top: `${getCurrentTimePosition()}%` }}
                >
                  <div className="relative flex items-center">
                    <div className="w-2 h-2 rounded-full bg-status-error" />
                    <div className="flex-1 h-0.5 bg-status-error/50" />
                  </div>
                </div>
              )}

              {HOURS.map(hour => (
                <div key={hour} className="grid grid-cols-8 border-b border-dark-800/50">
                  {/* Time label */}
                  <div className="p-2 text-right pr-3">
                    <span className="text-xs text-dark-500">
                      {hour.toString().padStart(2, '0')}:00
                    </span>
                  </div>

                  {/* Day columns */}
                  {weekDays.map((day, i) => {
                    const dayEvents = getEventsForDay(day).filter(e => {
                      const h = e.startTime.getHours();
                      return h >= hour && h < hour + 1;
                    });

                    return (
                      <div
                        key={i}
                        className={cn(
                          'min-h-[60px] p-1 border-l border-dark-800/50 relative',
                          isSelected(day) && 'bg-neon-cyan/5'
                        )}
                      >
                        {dayEvents.map(event => (
                          <EventCard key={event.id} event={event} compact />
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Details */}
        <div className="space-y-4">
          {/* Date Info */}
          <Card variant="glass">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-dark-400 mb-1">
                  {DAYS[selectedDate.getDay()]}
                </p>
                <p className="text-4xl font-bold text-white mb-1">
                  {selectedDate.getDate()}
                </p>
                <p className="text-sm text-dark-300">
                  {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Day Events */}
          <Card variant="glass">
            <CardHeader
              title="Schedule"
              subtitle={`${todayEvents.length} events`}
              icon={<CalendarIcon className="w-5 h-5 text-neon-cyan" />}
            />
            <CardContent>
              <div className="space-y-3">
                {todayEvents.length > 0 ? (
                  todayEvents
                    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
                    .map(event => <EventCard key={event.id} event={event} />)
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                    <p className="text-dark-400">No events scheduled</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Event
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          <Card variant="glass">
            <CardHeader
              title="AI Suggestions"
              icon={<Brain className="w-5 h-5 text-neon-purple" />}
            />
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-neon-green/10 border border-neon-green/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-neon-green" />
                    <span className="text-sm font-medium text-neon-green">Optimal Focus Time</span>
                  </div>
                  <p className="text-sm text-dark-300">
                    Based on your patterns, 10 AM - 12 PM is your peak productivity window. Consider blocking this time.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-neon-orange/10 border border-neon-orange/20">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-neon-orange" />
                    <span className="text-sm font-medium text-neon-orange">Schedule Conflict</span>
                  </div>
                  <p className="text-sm text-dark-300">
                    Tomorrow has 5 back-to-back meetings. Consider adding breaks for better energy management.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Month View Component
  const MonthView = () => (
    <Card variant="glass">
      <CardContent className="p-6">
        {/* Days header */}
        <div className="grid grid-cols-7 mb-4">
          {DAYS.map(day => (
            <div key={day} className="text-center text-sm font-medium text-dark-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {monthDays.map((day, i) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.01 }}
                onClick={() => {
                  setSelectedDate(day);
                  setViewMode('week');
                }}
                className={cn(
                  'min-h-[100px] p-2 rounded-xl cursor-pointer transition-all',
                  'border border-dark-700/30 hover:border-neon-cyan/30',
                  !isCurrentMonth && 'opacity-40',
                  isSelected(day) && 'bg-neon-cyan/10 border-neon-cyan/50',
                  isToday(day) && 'bg-neon-purple/10 border-neon-purple/50'
                )}
              >
                <p
                  className={cn(
                    'text-sm font-medium mb-2',
                    isToday(day) ? 'text-neon-purple' : 'text-white'
                  )}
                >
                  {day.getDate()}
                </p>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={cn(
                        'px-1.5 py-0.5 rounded text-[10px] truncate',
                        eventTypeColors[event.type]?.bg || 'bg-dark-700/50',
                        'text-white'
                      )}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="text-[10px] text-dark-500">
                      +{dayEvents.length - 3} more
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <MainLayout>
      <PageContainer title="Calendar" subtitle="Manage your schedule intelligently">
        {/* Header Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6"
        >
          {/* Navigation */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={navigatePrev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <h2 className="text-lg font-semibold text-white min-w-[200px] text-center">
              {viewMode === 'month'
                ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                : viewMode === 'week'
                ? `Week of ${MONTHS[getWeekStart(currentDate).getMonth()]} ${getWeekStart(currentDate).getDate()}`
                : `${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`}
            </h2>

            <Button variant="ghost" size="sm" onClick={navigateNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>

            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>

          {/* View Mode & Actions */}
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-lg bg-dark-800/50 border border-dark-700/50">
              {(['day', 'week', 'month'] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm capitalize transition-colors',
                    viewMode === mode
                      ? 'bg-neon-cyan/20 text-neon-cyan'
                      : 'text-dark-400 hover:text-white'
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* AI Schedule */}
            <Button variant="ghost" size="sm" onClick={openAIPanel}>
              <Brain className="w-4 h-4 mr-1" />
              AI Schedule
            </Button>

            {/* New Event */}
            <Button
              variant="glow"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              New Event
            </Button>
          </div>
        </motion.div>

        {/* Calendar View */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {viewMode === 'week' && <WeekView />}
          {viewMode === 'month' && <MonthView />}
          {viewMode === 'day' && <WeekView />} {/* Same as week but focused on selected day */}
        </motion.div>

        {/* Create Event Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create Event"
          size="lg"
        >
          <CreateEventForm onClose={() => setIsCreateModalOpen(false)} />
        </Modal>

        {/* Event Details Modal */}
        <Modal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title={selectedEvent?.title || 'Event Details'}
          size="md"
        >
          {selectedEvent && (
            <EventDetails
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
            />
          )}
        </Modal>
      </PageContainer>
    </MainLayout>
  );
}

// Create Event Form
function CreateEventForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CalendarEvent['type']>('meeting');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add event to store
    console.log({ title, description, type, date, startTime, endTime, location, isAllDay });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Event Title"
        placeholder="Meeting with team"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />

      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">
          Description
        </label>
        <textarea
          placeholder="Add details..."
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
          <label className="block text-sm font-medium text-dark-200 mb-1.5">
            Type
          </label>
          <select
            value={type}
            onChange={e => setType(e.target.value as CalendarEvent['type'])}
            className={cn(
              'w-full px-4 py-3 rounded-xl text-sm',
              'bg-dark-800/50 border border-dark-700/50',
              'text-white focus:outline-none focus:ring-2 focus:ring-neon-cyan/50'
            )}
          >
            <option value="meeting">Meeting</option>
            <option value="focus">Focus Block</option>
            <option value="personal">Personal</option>
            <option value="task">Task</option>
            <option value="reminder">Reminder</option>
          </select>
        </div>

        <Input
          type="date"
          label="Date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
        />
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isAllDay}
            onChange={e => setIsAllDay(e.target.checked)}
            className="rounded border-dark-700/50 bg-dark-800/50 text-neon-cyan focus:ring-neon-cyan/50"
          />
          <span className="text-sm text-dark-200">All day</span>
        </label>
      </div>

      {!isAllDay && (
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="time"
            label="Start Time"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            required
          />
          <Input
            type="time"
            label="End Time"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            required
          />
        </div>
      )}

      <Input
        label="Location"
        placeholder="Office, Zoom, etc."
        value={location}
        onChange={e => setLocation(e.target.value)}
        icon={<MapPin className="w-4 h-4" />}
      />

      {/* AI Suggestion */}
      <div className="p-4 rounded-xl bg-neon-purple/10 border border-neon-purple/20">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-neon-purple" />
          <span className="text-sm font-medium text-neon-purple">AI Suggestion</span>
        </div>
        <p className="text-sm text-dark-300">
          This time slot has no conflicts. However, adding a 15-minute buffer before would help you transition smoothly from your previous meeting.
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="glow">
          Create Event
        </Button>
      </div>
    </form>
  );
}

// Event Details Component
function EventDetails({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  const colors = eventTypeColors[event.type] || eventTypeColors.personal;
  const Icon = getEventTypeIcon(event.type);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={cn('p-3 rounded-xl', colors.bg)}>
          <Icon className={cn('w-6 h-6', colors.text)} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{event.title}</h3>
          <Badge variant="outline" size="sm" className="capitalize">
            {event.type}
          </Badge>
        </div>
        {event.aiGenerated && (
          <Badge variant="purple" size="sm">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Generated
          </Badge>
        )}
      </div>

      {event.description && (
        <p className="text-dark-300">{event.description}</p>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-3 text-dark-200">
          <Clock className="w-4 h-4 text-dark-400" />
          <span>
            {formatTime(event.startTime)} - {formatTime(event.endTime)}
          </span>
        </div>

        {event.location && (
          <div className="flex items-center gap-3 text-dark-200">
            {event.location.includes('Zoom') || event.location.includes('Meet') ? (
              <Video className="w-4 h-4 text-dark-400" />
            ) : (
              <MapPin className="w-4 h-4 text-dark-400" />
            )}
            <span>{event.location}</span>
          </div>
        )}

        {event.attendees && event.attendees.length > 0 && (
          <div className="flex items-center gap-3 text-dark-200">
            <Users className="w-4 h-4 text-dark-400" />
            <span>{event.attendees.join(', ')}</span>
          </div>
        )}

        {event.recurrence && (
          <div className="flex items-center gap-3 text-dark-200">
            <Repeat className="w-4 h-4 text-dark-400" />
            <span>Repeats {event.recurrence.frequency}</span>
          </div>
        )}

        {event.reminderMinutes && event.reminderMinutes.length > 0 && (
          <div className="flex items-center gap-3 text-dark-200">
            <Bell className="w-4 h-4 text-dark-400" />
            <span>
              Reminders: {event.reminderMinutes.map(m => `${m}m`).join(', ')} before
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4 border-t border-dark-700/50">
        <Button variant="ghost" size="sm" className="text-status-error hover:text-status-error">
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline" size="sm">
            <Edit3 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
}
