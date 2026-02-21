'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  MapPin,
  Brain,
  Sparkles,
  Loader2,
  Grid3X3,
  List,
  Trash2,
  Edit3,
  ArrowUpRight,
  BellRing,
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
import { WeekView } from '@/components/features/calendar/WeekView';
import { SmartEventInput } from '@/components/features/calendar/SmartEventInput';
import { useCalendar, useEventsInRange } from '@/hooks/useCalendar';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useGoals } from '@/hooks/useGoals';
import { useUpcomingExams } from '@/hooks/useStudy';
import { useRecentWellness } from '@/hooks/useWellness';
import { useUser } from '@/hooks/useUser';
import { getCountryHolidaysInRange, supportsLocalHolidays, type HolidayItem } from '@/lib/holidays';
import { createNotification } from '@/lib/services/notifications';
import { downloadAppleCalendarEvent, getGoogleCalendarAddLink } from '@/lib/externalCalendar';
import { createNote } from '@/lib/services/notes';
import type { CalendarEvent, EventCategory } from '@/types';

const categoryOptions: { label: string; value: EventCategory; color: string; hex: string }[] = [
  { label: 'Work', value: 'work', color: 'bg-neon-cyan', hex: '#06b6d4' },
  { label: 'Personal', value: 'personal', color: 'bg-neon-purple', hex: '#a855f7' },
  { label: 'Health', value: 'health', color: 'bg-neon-green', hex: '#22c55e' },
  { label: 'Social', value: 'social', color: 'bg-neon-orange', hex: '#f97316' },
  { label: 'Learning', value: 'learning', color: 'bg-neon-pink', hex: '#ec4899' },
  { label: 'Rest', value: 'rest', color: 'bg-blue-500', hex: '#3b82f6' },
  { label: 'Other', value: 'other', color: 'bg-gray-500', hex: '#6b7280' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MS_PER_DAY = 1000 * 60 * 60 * 24;

type LinkedItemType = 'task' | 'goal' | 'exam' | 'period' | 'holiday';

interface LinkedDateItem {
  id: string;
  title: string;
  date: Date;
  type: LinkedItemType;
  actionUrl: string;
  subtitle?: string;
}

const getDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getPredictedPeriodStarts = (entries: Array<{ date: Date; period?: { isPeriodDay?: boolean; cycleLength?: number } }>): Date[] => {
  const periodEntries = entries
    .filter(entry => entry.period?.isPeriodDay)
    .map(entry => new Date(entry.date))
    .sort((a, b) => a.getTime() - b.getTime());

  if (periodEntries.length === 0) return [];

  const cycleStarts: Date[] = [];
  for (const currentDate of periodEntries) {
    const previousDate = cycleStarts[cycleStarts.length - 1];
    if (!previousDate) {
      cycleStarts.push(currentDate);
      continue;
    }
    const diffDays = Math.round((currentDate.getTime() - previousDate.getTime()) / MS_PER_DAY);
    if (diffDays > 2) {
      cycleStarts.push(currentDate);
    }
  }

  if (cycleStarts.length === 0) return [];

  const cycleLengths: number[] = [];
  for (let index = 1; index < cycleStarts.length; index += 1) {
    const diffDays = Math.round((cycleStarts[index].getTime() - cycleStarts[index - 1].getTime()) / MS_PER_DAY);
    if (diffDays >= 18 && diffDays <= 45) {
      cycleLengths.push(diffDays);
    }
  }

  const avgCycleLength =
    cycleLengths.length > 0
      ? Math.round(cycleLengths.reduce((sum, value) => sum + value, 0) / cycleLengths.length)
      : 28;

  const predictions: Date[] = [];
  const lastStart = new Date(cycleStarts[cycleStarts.length - 1]);
  const cursor = new Date(lastStart);

  for (let count = 0; count < 4; count += 1) {
    cursor.setDate(cursor.getDate() + avgCycleLength);
    predictions.push(new Date(cursor));
  }

  return predictions;
};

export default function CalendarPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { profile } = useUser();
  const { tasks, loading: tasksLoading } = useTasks();
  const { goals, loading: goalsLoading } = useGoals();
  const { exams: upcomingExams, loading: examsLoading } = useUpcomingExams();
  const { entries: recentWellnessEntries, loading: wellnessLoading } = useRecentWellness(90);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const reminderCacheRef = useRef<Set<string>>(new Set());

  // Get a stable month range for fetching events and derived data.
  const { monthStart, monthEnd, monthStartTime, monthEndTime } = useMemo(() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
    return {
      monthStart: start,
      monthEnd: end,
      monthStartTime: start.getTime(),
      monthEndTime: end.getTime(),
    };
  }, [currentDate]);

  const { events, loading } = useEventsInRange(monthStart, monthEnd);
  const { createEvent, updateEvent, deleteEvent } = useCalendar();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const countryCode = profile?.preferences?.country || 'US';
  const holidays = useMemo<HolidayItem[]>(() => {
    return getCountryHolidaysInRange(countryCode, new Date(monthStartTime), new Date(monthEndTime));
  }, [countryCode, monthStartTime, monthEndTime]);

  const periodPredictions = useMemo(() => {
    const starts = getPredictedPeriodStarts(recentWellnessEntries);
    return starts.filter(date => {
      const timestamp = date.getTime();
      return timestamp >= monthStartTime && timestamp <= monthEndTime;
    });
  }, [recentWellnessEntries, monthStartTime, monthEndTime]);

  const linkedDateItems = useMemo<LinkedDateItem[]>(() => {
    const taskItems: LinkedDateItem[] = tasks
      .filter(task => task.dueDate && task.status !== 'done')
      .map<LinkedDateItem>(task => ({
        id: `task_${task.id}`,
        title: task.title,
        date: new Date(task.dueDate as Date),
        type: 'task',
        actionUrl: `/tasks?id=${task.id}`,
        subtitle: 'Task deadline',
      }))
      .filter(item => {
        const timestamp = item.date.getTime();
        return timestamp >= monthStartTime && timestamp <= monthEndTime;
      });

    const goalItems: LinkedDateItem[] = goals
      .filter(goal => goal.targetDate && goal.status !== 'completed')
      .map<LinkedDateItem>(goal => ({
        id: `goal_${goal.id}`,
        title: goal.title,
        date: new Date(goal.targetDate as Date),
        type: 'goal',
        actionUrl: '/goals',
        subtitle: 'Goal target date',
      }))
      .filter(item => {
        const timestamp = item.date.getTime();
        return timestamp >= monthStartTime && timestamp <= monthEndTime;
      });

    const examItems: LinkedDateItem[] = upcomingExams
      .map<LinkedDateItem>(exam => ({
        id: `exam_${exam.id}`,
        title: exam.name,
        date: new Date(exam.date),
        type: 'exam',
        actionUrl: '/study',
        subtitle: exam.subjectName ? `Exam • ${exam.subjectName}` : 'Exam',
      }))
      .filter(item => {
        const timestamp = item.date.getTime();
        return timestamp >= monthStartTime && timestamp <= monthEndTime;
      });

    const periodItems: LinkedDateItem[] = periodPredictions.map((date, index) => ({
      id: `period_${getDateKey(date)}_${index}`,
      title: 'Predicted period start',
      date,
      type: 'period',
      actionUrl: '/wellness',
      subtitle: 'Cycle insight',
    }));

    const holidayItems: LinkedDateItem[] = holidays.map(holiday => ({
      id: holiday.id,
      title: holiday.name,
      date: holiday.date,
      type: 'holiday',
      actionUrl: '/calendar',
      subtitle: 'Local holiday',
    }));

    return [...taskItems, ...goalItems, ...examItems, ...periodItems, ...holidayItems].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
  }, [tasks, goals, upcomingExams, periodPredictions, holidays, monthStartTime, monthEndTime]);

  const upcomingLinkedCount = useMemo(() => {
    const now = Date.now();
    const next24Hours = now + 24 * 60 * 60 * 1000;
    const eventCount = events.filter(event => {
      const timestamp = new Date(event.startTime).getTime();
      return timestamp > now && timestamp <= next24Hours;
    }).length;
    const linkedCount = linkedDateItems.filter(item => {
      if (item.type === 'holiday') return false;
      const timestamp = item.date.getTime();
      return timestamp > now && timestamp <= next24Hours;
    }).length;
    return eventCount + linkedCount;
  }, [events, linkedDateItems]);

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

  const handleTimeSlotClick = (date: Date, hour: number) => {
    setSelectedDate(date);
    setNewEvent(prev => ({
      ...prev,
      date: date.toISOString().split('T')[0],
      startTime: `${String(hour).padStart(2, '0')}:00`,
      endTime: `${String((hour + 1) % 24).padStart(2, '0')}:00`,
      allDay: false,
    }));
    setIsCreateModalOpen(true);
  };

  const handleTakeNotes = async (event: CalendarEvent) => {
    if (!user) return;
    try {
      await createNote(user.uid, {
        title: `Meeting Notes: ${event.title}`,
        content: `<h1>Meeting Notes: ${event.title}</h1><p><strong>Date:</strong> ${new Date(event.startTime).toLocaleDateString()}</p><p><strong>Attendees:</strong></p><ul><li></li></ul><p><strong>Notes:</strong></p><p></p><p><strong>Action Items:</strong></p><ul data-type="taskList"><li data-type="taskItem" data-checked="false"></li></ul>`,
        contentType: 'rich-text',
        category: 'work',
        linkedEvents: [event.id]
      });
      router.push('/notes');
    } catch (err) {
      console.error('Failed to create meeting notes:', err);
    }
  };

  const getLinkedItemsForDay = (date: Date) => {
    const dayKey = getDateKey(date);
    return linkedDateItems.filter(item => getDateKey(item.date) === dayKey);
  };

  // Get events for selected date
  const selectedDateEvents = selectedDate ? getEventsForDay(selectedDate) : [];
  const selectedDateLinkedItems = selectedDate ? getLinkedItemsForDay(selectedDate) : [];

  const handleAddToGoogle = (event: CalendarEvent) => {
    const url = getGoogleCalendarAddLink({
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      startTime: new Date(event.startTime),
      endTime: new Date(event.endTime),
      allDay: event.allDay,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleAddToApple = (event: CalendarEvent) => {
    downloadAppleCalendarEvent({
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      startTime: new Date(event.startTime),
      endTime: new Date(event.endTime),
      allDay: event.allDay,
    });
  };

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

  useEffect(() => {
    if (!user) return;
    if (profile?.preferences?.notifications?.calendarAlerts === false) return;

    const now = Date.now();
    const next24Hours = now + 24 * 60 * 60 * 1000;

    const reminderCandidates: Array<{
      key: string;
      title: string;
      body: string;
      actionUrl: string;
      timestamp: number;
    }> = [
      ...events.map(event => ({
        key: `event_${event.id}_${getDateKey(new Date(event.startTime))}`,
        title: 'Upcoming event reminder',
        body: `"${event.title}" starts within 24 hours.`,
        actionUrl: `/calendar?id=${event.id}`,
        timestamp: new Date(event.startTime).getTime(),
      })),
      ...linkedDateItems
        .filter(item => item.type !== 'holiday')
        .map(item => ({
          key: `${item.type}_${item.id}_${getDateKey(item.date)}`,
          title: 'Date-linked reminder',
          body: `"${item.title}" is coming up within 24 hours.`,
          actionUrl: item.actionUrl,
          timestamp: item.date.getTime(),
        })),
    ]
      .filter(item => item.timestamp > now && item.timestamp <= next24Hours)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, 8);

    if (reminderCandidates.length === 0) return;

    const savedRemindersRaw = localStorage.getItem('nexora-reminder-cache');
    let savedReminders: Record<string, number> = {};
    if (savedRemindersRaw) {
      try {
        savedReminders = JSON.parse(savedRemindersRaw) as Record<string, number>;
      } catch {
        savedReminders = {};
      }
    }
    const nextReminderCache = { ...savedReminders };
    const operations: Promise<unknown>[] = [];

    reminderCandidates.forEach(candidate => {
      if (reminderCacheRef.current.has(candidate.key) || nextReminderCache[candidate.key]) {
        return;
      }

      reminderCacheRef.current.add(candidate.key);
      nextReminderCache[candidate.key] = Date.now();
      operations.push(
        createNotification(user.uid, {
          type: 'calendar',
          title: candidate.title,
          body: candidate.body,
          actionUrl: candidate.actionUrl,
          data: { reminderKey: candidate.key },
        })
      );
    });

    if (operations.length === 0) return;

    localStorage.setItem('nexora-reminder-cache', JSON.stringify(nextReminderCache));
    void Promise.all(operations).catch(error => {
      console.error('Failed to create date reminders:', error);
    });
  }, [user, profile?.preferences?.notifications?.calendarAlerts, events, linkedDateItems]);

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

  // Edit event - open modal with event data
  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    const eventDate = new Date(event.startTime);
    setNewEvent({
      title: event.title,
      description: event.description || '',
      date: eventDate.toISOString().split('T')[0],
      startTime: eventDate.toTimeString().slice(0, 5),
      endTime: new Date(event.endTime).toTimeString().slice(0, 5),
      location: event.location || '',
      category: event.category,
      allDay: event.allDay,
    });
    setIsEditModalOpen(true);
  };

  // Save edited event
  const handleSaveEdit = async () => {
    if (!selectedEvent || !newEvent.title.trim() || !newEvent.date) return;

    setIsSaving(true);
    try {
      const startTime = newEvent.allDay
        ? new Date(newEvent.date)
        : new Date(`${newEvent.date}T${newEvent.startTime || '09:00'}`);

      const endTime = newEvent.allDay
        ? new Date(new Date(newEvent.date).setHours(23, 59, 59))
        : new Date(`${newEvent.date}T${newEvent.endTime || '10:00'}`);

      await updateEvent(selectedEvent.id, {
        title: newEvent.title,
        description: newEvent.description,
        startTime,
        endTime,
        allDay: newEvent.allDay,
        location: newEvent.location,
        category: newEvent.category,
      });

      setIsEditModalOpen(false);
      setSelectedEvent(null);
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
      console.error('Failed to update event:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    setIsDeleting(true);
    try {
      await deleteEvent(eventId);
      setIsEditModalOpen(false);
      setSelectedEvent(null);
    } catch (err) {
      console.error('Failed to delete event:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryColor = (category: EventCategory) => {
    return categoryOptions.find(c => c.value === category)?.color || 'bg-gray-500';
  };

  const getCategoryHex = (category: EventCategory) => {
    return categoryOptions.find(c => c.value === category)?.hex || '#6b7280';
  };

  // Show auth loading state
  if (authLoading) {
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
              <Button variant="glow" onClick={() => router.push('/auth/login')}>
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
            <Badge variant={supportsLocalHolidays(countryCode) ? 'green' : 'default'} size="sm">
              {supportsLocalHolidays(countryCode)
                ? `${countryCode} holidays on`
                : `${countryCode} holidays unavailable`}
            </Badge>
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
              <button
                onClick={() => { setViewMode('day'); if (!selectedDate) setSelectedDate(new Date()); }}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  viewMode === 'day' ? 'bg-dark-700 text-white' : 'text-dark-400 hover:text-white'
                )}
                title="Day View"
              >
                <CalendarDays className="w-4 h-4" />
              </button>
            </div>
            <Button variant="glow" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              New Event
            </Button>
          </div>
        </motion.div>

        {/* AI NLP Event Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <SmartEventInput
            onEventParsed={(parsedEvent) => {
              setNewEvent({
                title: parsedEvent.title,
                description: parsedEvent.description,
                date: parsedEvent.date,
                startTime: parsedEvent.startTime,
                endTime: parsedEvent.endTime,
                allDay: parsedEvent.allDay,
                location: parsedEvent.location,
                category: parsedEvent.category,
              });
              setIsCreateModalOpen(true);
            }}
          />
        </motion.div>

        {/* Main Content */}
        <div
          className={cn(
            'grid grid-cols-1 lg:grid-cols-4 gap-6 transition-opacity duration-300',
            (tasksLoading || goalsLoading || examsLoading || wellnessLoading) && 'opacity-90'
          )}
        >
          {/* Calendar Grid / Week View */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            {viewMode === 'month' ? (
              <Card variant="glass" className="p-4 min-h-[500px]">
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
                    const dayLinkedItems = getLinkedItemsForDay(date);
                    const holidayForDay = dayLinkedItems.find(item => item.type === 'holiday');
                    const linkedCount = dayLinkedItems.filter(item => item.type !== 'holiday').length;

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
                        {holidayForDay && (
                          <div className="text-[10px] px-1 py-0.5 rounded bg-neon-orange/20 text-neon-orange truncate mb-0.5">
                            {holidayForDay.title}
                          </div>
                        )}
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 2).map(event => (
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
                          {(dayEvents.length > 2 || linkedCount > 0) && (
                            <div className="text-[10px] text-dark-400 px-1">
                              +{Math.max(0, dayEvents.length - 2) + linkedCount} linked
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            ) : viewMode === 'week' ? (
              <WeekView
                currentDate={currentDate}
                events={events}
                onEventClick={handleEditEvent}
                onTimeSlotClick={handleTimeSlotClick}
              />
            ) : (
              /* Day View — Time Blocking */
              <Card variant="glass" className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    {(selectedDate || new Date()).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h3>
                  <div className="flex gap-1">
                    <button onClick={() => { const d = new Date(selectedDate || new Date()); d.setDate(d.getDate() - 1); setSelectedDate(d); }} className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => setSelectedDate(new Date())} className="px-2 py-1 text-xs rounded-lg bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20 transition-colors">Today</button>
                    <button onClick={() => { const d = new Date(selectedDate || new Date()); d.setDate(d.getDate() + 1); setSelectedDate(d); }} className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="space-y-0 max-h-[600px] overflow-y-auto scrollbar-thin">
                  {Array.from({ length: 18 }, (_, i) => i + 6).map(hour => {
                    const dayDate = selectedDate || new Date();
                    const dayEvents = (events || []).filter(e => {
                      const start = new Date(e.startTime);
                      return start.getFullYear() === dayDate.getFullYear() &&
                        start.getMonth() === dayDate.getMonth() &&
                        start.getDate() === dayDate.getDate() &&
                        start.getHours() === hour;
                    });
                    const isPast = (() => { const now = new Date(); const slotDate = new Date(dayDate); slotDate.setHours(hour, 0, 0, 0); return slotDate < now && dayDate.toDateString() === now.toDateString(); })();

                    return (
                      <div
                        key={hour}
                        onClick={() => { if (dayEvents.length === 0) handleTimeSlotClick(dayDate, hour); }}
                        className={cn(
                          'flex border-t border-glass-border min-h-[52px] group transition-colors',
                          dayEvents.length === 0 && 'cursor-pointer hover:bg-neon-cyan/5',
                          isPast && 'opacity-60'
                        )}
                      >
                        <div className="w-16 flex-shrink-0 py-2 pr-3 text-right">
                          <span className="text-xs font-mono text-dark-500">
                            {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                          </span>
                        </div>
                        <div className="flex-1 py-1 pl-3 border-l border-glass-border">
                          {dayEvents.length > 0 ? (
                            dayEvents.map(event => (
                              <button
                                key={event.id}
                                onClick={(e) => { e.stopPropagation(); handleEditEvent(event); }}
                                className={cn(
                                  'w-full text-left px-3 py-2 rounded-lg mb-1 border transition-all hover:scale-[1.01]',
                                  'bg-neon-cyan/10 border-neon-cyan/30 text-white'
                                )}
                                style={{ borderLeftColor: getCategoryHex(event.category), borderLeftWidth: '3px' }}
                              >
                                <p className="text-sm font-medium truncate">{event.title}</p>
                                <p className="text-[10px] text-dark-400">
                                  {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </button>
                            ))
                          ) : (
                            <div className="h-full flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs text-dark-500 flex items-center gap-1"><Plus className="w-3 h-3" /> Add event</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
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
                <div className="space-y-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-dark-500 mb-2">Events</p>
                    {selectedDateEvents.length > 0 ? (
                      <div className="space-y-3">
                        {selectedDateEvents.map(event => (
                          <div
                            key={event.id}
                            className="p-3 rounded-lg bg-dark-800/50 border-l-2 group"
                            style={{ borderColor: getCategoryHex(event.category) }}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="font-medium text-white text-sm flex-1">{event.title}</h4>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEditEvent(event)}
                                  className="p-1 hover:bg-dark-700 rounded text-dark-400 hover:text-neon-cyan"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEvent(event.id)}
                                  className="p-1 hover:bg-dark-700 rounded text-dark-400 hover:text-status-error"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <Badge variant="default" size="sm" className="mb-1">{event.category}</Badge>
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
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleTakeNotes(event)}
                                className="text-[10px] px-2 py-1 rounded-md bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30 transition-colors border border-neon-cyan/20 font-medium"
                              >
                                Take Notes
                              </button>
                              <button
                                onClick={() => handleAddToGoogle(event)}
                                className="text-[10px] px-2 py-1 rounded-md bg-dark-700/60 text-dark-300 hover:text-white transition-colors"
                              >
                                Add to Google
                              </button>
                              <button
                                onClick={() => handleAddToApple(event)}
                                className="text-[10px] px-2 py-1 rounded-md bg-dark-700/60 text-dark-300 hover:text-white transition-colors"
                              >
                                Add to Apple
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-dark-500 rounded-lg bg-dark-800/20">
                        <CalendarDays className="w-7 h-7 mx-auto mb-2 opacity-50" />
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

                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-dark-500 mb-2">Linked Timeline</p>
                    {selectedDateLinkedItems.length > 0 ? (
                      <div className="space-y-2">
                        {selectedDateLinkedItems.map(item => (
                          <a
                            key={item.id}
                            href={item.actionUrl}
                            className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-dark-800/30 hover:bg-dark-700/30 transition-colors"
                          >
                            <div>
                              <p className="text-sm text-white">{item.title}</p>
                              <p className="text-xs text-dark-400">{item.subtitle || item.type}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant={
                                  item.type === 'task'
                                    ? 'orange'
                                    : item.type === 'goal'
                                      ? 'cyan'
                                      : item.type === 'exam'
                                        ? 'purple'
                                        : item.type === 'period'
                                          ? 'pink'
                                          : 'green'
                                }
                                size="sm"
                              >
                                {item.type}
                              </Badge>
                              <ArrowUpRight className="w-3 h-3 text-dark-500" />
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-dark-500">No linked deadlines, exams, cycle insights, or holidays.</p>
                    )}
                  </div>
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
                <div className="flex items-center justify-between text-sm">
                  <span className="text-dark-400">Date-linked items</span>
                  <span className="text-white font-medium">
                    {linkedDateItems.filter(item => item.type !== 'holiday').length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-dark-400 inline-flex items-center gap-1">
                    <BellRing className="w-3.5 h-3.5 text-neon-orange" />
                    Upcoming reminders (24h)
                  </span>
                  <span className="text-white font-medium">{upcomingLinkedCount}</span>
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
                {(tasksLoading || goalsLoading || examsLoading || wellnessLoading) && (
                  <p className="text-[11px] text-dark-500 pt-1">Syncing linked dates...</p>
                )}
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

        {/* Edit Event Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedEvent(null);
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
          }}
          title="Edit Event"
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
                id="allDayEdit"
                checked={newEvent.allDay}
                onChange={(e) => setNewEvent(prev => ({ ...prev, allDay: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="allDayEdit" className="text-sm text-dark-300">All day event</label>
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
                variant="ghost"
                className="text-status-error"
                onClick={() => selectedEvent && handleDeleteEvent(selectedEvent.id)}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedEvent(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="glow"
                className="flex-1"
                onClick={handleSaveEdit}
                disabled={!newEvent.title.trim() || !newEvent.date || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </Modal>
      </PageContainer>
    </MainLayout>
  );
}
