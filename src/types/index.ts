// ===== User Types =====
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  gender?: GenderIdentity;
  phone?: string;
  location?: string;
  bio?: string;
  createdAt: Date;
  lastLoginAt: Date;
  preferences: UserPreferences;
  stats: UserStats;
}

export type GenderIdentity = 'female' | 'male' | 'non-binary' | 'prefer-not-to-say';

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
  language: string;
  timezone: string;
  country: string;
  currency: string;
  compactMode?: boolean;
  animations?: boolean;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
  dataPermissions: DataPermissionSettings;
  aiPersonality: AIPersonality;
}

export interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  taskReminders: boolean;
  calendarAlerts: boolean;
  insightNotifications: boolean;
  focusModeExceptions: string[];
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface PrivacySettings {
  dataCollection: boolean;
  analyticsEnabled: boolean;
  localStorageOnly: boolean;
  encryptionEnabled: boolean;
}

export interface DataPermissionSettings {
  allowHealthDataSync: boolean;
  allowFinanceDataSync: boolean;
  allowCalendarDataSync: boolean;
  allowTaskDataSync: boolean;
  allowLocationDataSync: boolean;
  allowBackgroundSync: boolean;
  allowAIExternalDataAccess: boolean;
}

export interface AIPersonality {
  name: string;
  tone: 'professional' | 'friendly' | 'motivational' | 'calm';
  verbosity: 'concise' | 'balanced' | 'detailed';
  proactivity: 'low' | 'medium' | 'high';
}

export interface UserStats {
  level: number;
  experience: number;
  streakDays: number;
  tasksCompleted: number;
  focusMinutes: number;
  journalEntries: number;
  habitsCompleted: number;
}

// ===== Task Types =====
export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  energyLevel: EnergyLevel;
  dueDate?: Date;
  dueTime?: string;
  estimatedDuration?: number; // minutes
  actualDuration?: number;
  tags: string[];
  category?: string;
  subtasks: Subtask[];
  dependencies: string[]; // task IDs
  recurrence?: RecurrenceRule;
  reminders: Reminder[];
  contextTriggers: ContextTrigger[];
  notes?: string;
  attachments: Attachment[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  aiSuggestions?: AISuggestion[];
}

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'snoozed';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type EnergyLevel = 'high' | 'medium' | 'low';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: Date;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endDate?: Date;
  occurrences?: number;
}

export interface Reminder {
  id: string;
  type: 'time' | 'location' | 'context';
  triggerAt?: Date;
  location?: Location;
  contextTrigger?: ContextTrigger;
  message?: string;
  sent: boolean;
}

export interface ContextTrigger {
  type: 'location' | 'time' | 'activity' | 'device' | 'person';
  condition: string;
  value: string;
}

export interface Location {
  name: string;
  latitude: number;
  longitude: number;
  radius?: number;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploadedAt: Date;
}

export interface AISuggestion {
  id: string;
  type: 'reschedule' | 'priority' | 'breakdown' | 'delegate' | 'context';
  suggestion: string;
  reasoning: string;
  confidence: number;
  createdAt: Date;
  applied: boolean;
}

// ===== Calendar Types =====
export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  location?: string;
  attendees: Attendee[];
  recurrence?: RecurrenceRule;
  reminders: Reminder[];
  color?: string;
  category: EventCategory;
  energyRequired: EnergyLevel;
  isFlexible: boolean;
  linkedTaskId?: string;
  externalId?: string; // for synced calendars
  source: 'nexora' | 'google' | 'outlook' | 'apple';
  createdAt: Date;
  updatedAt: Date;
}

export type EventCategory = 'work' | 'personal' | 'health' | 'social' | 'learning' | 'rest' | 'other';

export interface Attendee {
  email: string;
  name?: string;
  status: 'pending' | 'accepted' | 'declined' | 'tentative';
}

export interface FocusBlock {
  id: string;
  userId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  type: 'deep-work' | 'shallow-work' | 'meeting' | 'break' | 'rest';
  linkedTaskIds: string[];
  completed: boolean;
  actualFocusMinutes?: number;
  distractions?: number;
}

// ===== Notes & Knowledge Base Types =====
export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  contentType: 'text' | 'markdown' | 'rich-text';
  summary?: string;
  tags: string[];
  category?: string;
  linkedNotes: string[];
  linkedTasks: string[];
  linkedEvents: string[];
  attachments: Attachment[];
  aiTags: string[];
  embeddings?: number[];
  isPinned: boolean;
  isArchived: boolean;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
}

export interface KnowledgeNode {
  id: string;
  userId: string;
  type: 'concept' | 'fact' | 'procedure' | 'resource' | 'person' | 'place';
  title: string;
  description: string;
  connections: KnowledgeConnection[];
  sources: string[]; // note IDs
  confidence: number;
  lastReviewed: Date;
  reviewCount: number;
}

export interface KnowledgeConnection {
  targetId: string;
  relationship: string;
  strength: number;
}

// ===== Journal Types =====
export interface JournalEntry {
  id: string;
  userId: string;
  date: Date;
  mood: MoodEntry;
  content: string;
  gratitude: string[];
  highlights: string[];
  challenges: string[];
  learnings: string[];
  goals: string[];
  tags: string[];
  attachments: Attachment[];
  aiInsights?: AIInsight[];
  isEncrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MoodEntry {
  score: number; // 1-10
  emotions: string[];
  energyLevel: number; // 1-10
  stressLevel: number; // 1-10
  sleepQuality?: number; // 1-10
  notes?: string;
}

export interface AIInsight {
  id: string;
  type: 'pattern' | 'suggestion' | 'warning' | 'celebration';
  content: string;
  relatedEntries: string[];
  createdAt: Date;
}

// ===== Habit Types =====
export interface Habit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  targetDays: number[];
  targetTime?: string;
  duration?: number; // minutes
  reminderEnabled: boolean;
  reminderTime?: string;
  cue?: string;
  routine: string;
  reward?: string;
  identity: string; // "I am a person who..."
  streak: number;
  longestStreak: number;
  completions: HabitCompletion[];
  triggers: string[];
  isPositive: boolean; // true for building, false for breaking
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  createdAt: Date;
  updatedAt: Date;
}

export type HabitCategory = 'health' | 'productivity' | 'learning' | 'social' | 'mindfulness' | 'creativity' | 'finance' | 'other';
export type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'custom';

export interface HabitCompletion {
  date: Date;
  completed: boolean;
  notes?: string;
  duration?: number;
  quality?: number; // 1-5
}

// ===== Study & Academic Types =====
export interface Subject {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  topics: Topic[];
  resources: Resource[];
  examDates: ExamDate[];
  grades: Grade[];
  studyTime: number; // total minutes
  masteryLevel: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
}

export interface Topic {
  id: string;
  name: string;
  description?: string;
  masteryLevel: number;
  lastStudied?: Date;
  studyTime: number;
  resources: string[];
  notes: string[];
  weakAreas: string[];
}

export interface Resource {
  id: string;
  title: string;
  type: 'textbook' | 'video' | 'article' | 'paper' | 'course' | 'other';
  url?: string;
  notes?: string;
  rating?: number;
  completed: boolean;
}

export interface ExamDate {
  id: string;
  name: string;
  date: Date;
  type: 'quiz' | 'midterm' | 'final' | 'assignment' | 'project';
  topics: string[];
  preparationStatus: number; // 0-100
}

export interface Grade {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  date: Date;
  type: string;
}

// ===== Wellness Types =====
export interface WellnessEntry {
  id: string;
  userId: string;
  date: Date;
  sleep: SleepData;
  activity: ActivityData;
  nutrition: NutritionData;
  stress: StressData;
  period?: PeriodData;
  focusSessions: FocusSession[];
  createdAt: Date;
}

export interface SleepData {
  bedTime?: Date;
  wakeTime?: Date;
  duration: number; // minutes
  quality: number; // 1-10
  interruptions: number;
  notes?: string;
}

export interface ActivityData {
  steps?: number;
  activeMinutes: number;
  exercises: Exercise[];
}

export interface Exercise {
  type: string;
  duration: number;
  intensity: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface NutritionData {
  meals: Meal[];
  waterIntake: number; // ml
  notes?: string;
}

export interface Meal {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time: Date;
  description?: string;
  healthRating?: number; // 1-5
}

export interface StressData {
  level: number; // 1-10
  triggers: string[];
  copingMethods: string[];
  notes?: string;
}

export interface PeriodData {
  isPeriodDay: boolean;
  flowLevel: 0 | 1 | 2 | 3 | 4; // 0 = none, 4 = very heavy
  painLevel: number; // 0-10
  moodScore: number; // 1-10
  symptoms: string[];
  comfortPreferences: string[];
  cycleLength: number; // days
  notes?: string;
}

export interface FocusSession {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  type: 'pomodoro' | 'deep-work' | 'flow';
  taskId?: string;
  distractions: number;
  quality: number; // 1-5
}

// ===== Finance Types =====
export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  date: Date;
  recurring: boolean;
  recurrenceRule?: RecurrenceRule;
  tags: string[];
  attachments: Attachment[];
  externalSource?: string;
  externalId?: string;
  importedAt?: Date;
  lastSyncedAt?: Date;
  createdAt: Date;
}

export interface Budget {
  id: string;
  userId: string;
  name: string;
  amount: number;
  spent: number;
  category: string;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  alerts: BudgetAlert[];
}

export interface BudgetAlert {
  threshold: number; // percentage
  triggered: boolean;
  triggeredAt?: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  name: string;
  amount: number;
  currency: string;
  billingCycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextBillingDate: Date;
  category: string;
  isActive: boolean;
  reminder: boolean;
  reminderDays: number;
  notes?: string;
}

// ===== AI Context Types =====
export interface UserContext {
  userId: string;
  timestamp: Date;
  location?: Location;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number;
  currentActivity?: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  energyLevel: number;
  moodEstimate: number;
  focusState: 'focused' | 'distracted' | 'transitioning' | 'resting';
  upcomingEvents: CalendarEvent[];
  pendingTasks: Task[];
  recentActivities: Activity[];
}

export interface Activity {
  type: string;
  timestamp: Date;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface AIMemory {
  id: string;
  userId: string;
  type: 'fact' | 'preference' | 'pattern' | 'goal' | 'relationship';
  content: string;
  confidence: number;
  sources: string[];
  createdAt: Date;
  lastConfirmed: Date;
  expiresAt?: Date;
}

export interface Prediction {
  id: string;
  userId: string;
  type: 'task-completion' | 'mood' | 'energy' | 'focus' | 'stress';
  prediction: string;
  confidence: number;
  reasoning: string;
  timeframe: Date;
  outcome?: string;
  accuracy?: number;
  createdAt: Date;
}

// ===== Communication Types =====
export interface Email {
  id: string;
  userId: string;
  from: string;
  to: string[];
  subject: string;
  body: string;
  receivedAt: Date;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
  aiPriority?: 'high' | 'medium' | 'low';
  extractedTasks: Task[];
  extractedDeadlines: Date[];
  suggestedReplies: string[];
  labels: string[];
}

// ===== Notification Types =====
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority: 'high' | 'medium' | 'low';
  read: boolean;
  actionUrl?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export type NotificationType = 
  | 'task-reminder'
  | 'calendar-alert'
  | 'habit-reminder'
  | 'ai-insight'
  | 'achievement'
  | 'wellness-alert'
  | 'deadline-warning'
  | 'system';

// ===== Gamification Types =====
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  requirement: AchievementRequirement;
  unlockedAt?: Date;
}

export interface AchievementRequirement {
  type: string;
  target: number;
  current: number;
}

export interface Level {
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
  perks: string[];
  badge: string;
}

// ===== Settings Types =====
export interface AppSettings {
  general: GeneralSettings;
  appearance: AppearanceSettings;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
  integrations: IntegrationSettings;
  ai: AISettings;
}

export interface GeneralSettings {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  weekStartsOn: 0 | 1 | 6; // Sunday, Monday, Saturday
  defaultView: 'dashboard' | 'tasks' | 'calendar';
}

export interface AppearanceSettings {
  theme: 'dark' | 'light' | 'system';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
  compactMode: boolean;
}

export interface IntegrationSettings {
  googleCalendar: boolean;
  outlook: boolean;
  notion: boolean;
  todoist: boolean;
  spotify: boolean;
}

export interface AISettings {
  enabled: boolean;
  personality: AIPersonality;
  suggestions: boolean;
  autoScheduling: boolean;
  contextAwareness: boolean;
  learningEnabled: boolean;
}
