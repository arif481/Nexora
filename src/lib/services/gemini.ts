// Gemini AI Integration for real AI responses
/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini - API key from environment
const getGeminiClient = () => {
  const apiKey = typeof window !== 'undefined'
    ? localStorage.getItem('gemini_api_key') || process.env.NEXT_PUBLIC_GEMINI_API_KEY
    : process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new GoogleGenerativeAI(apiKey);
};

// System prompt for NOVA
const NOVA_SYSTEM_PROMPT = `You are NOVA, an intelligent AI assistant integrated into Nexora - a comprehensive life management platform. You help users with:

1. **Tasks & Productivity**: Help organize, prioritize, and manage to-dos
2. **Calendar & Scheduling**: Optimize schedules, plan events, find time slots
3. **Goals & Milestones**: Set SMART goals, track progress, provide motivation
4. **Finance & Budgets**: Analyze spending, suggest savings, track budgets
5. **Habits & Streaks**: Build routines, maintain streaks, suggest improvements
6. **Wellness & Health**: Track sleep, exercise, mood, provide wellness tips
7. **Focus & Time**: Pomodoro techniques, deep work scheduling, productivity tips
8. **Academic & Study Planner (via EduPlanr)**: Assist with managing syllabuses, assignments, and optimizing study sessions

IMPORTANT GUIDELINES:
- Be concise but helpful - users are busy
- Use markdown formatting for readability (bold, bullets, etc.)
- Provide actionable suggestions when possible
- Be encouraging and supportive
- Reference the user's actual data when provided in context
- Suggest specific features of Nexora when relevant
- Don't make up data - if you don't have information, say so
- Keep responses under 300 words unless asked for more detail

Always end with 1-3 relevant follow-up suggestions as a bullet list.`;

export interface AIContext {
  profile?: Record<string, any>;
  tasks?: Record<string, any>[];
  habits?: Record<string, any>[];
  events?: Record<string, any>[];
  goals?: Record<string, any>[];
  transactions?: Record<string, any>[];
  budgets?: Record<string, any>[];
  subjects?: Record<string, any>[];
  wellness?: Record<string, any>[];
  focusSessions?: Record<string, any>[];
  journal?: Record<string, any>[];
  notes?: Record<string, any>[];
  pathname?: string;
}

// Format context for the AI
const formatContextForAI = (context?: AIContext): string => {
  if (!context) return '';

  const parts: string[] = [];

  if (context.pathname) {
    parts.push(`\n**Current Context:**\nThe user is currently viewing the \`${context.pathname}\` route in the app. Tailor your advice or suggestions to this specific area if relevant.`);
  }

  if (context.profile) {
    const profile = context.profile;
    parts.push(`\n**User Profile Preferences:**
- Name: ${profile.displayName || 'User'}
- Gender: ${profile.gender || 'Not specified'}
- Country: ${profile.preferences?.country || 'Not set'}
- Timezone: ${profile.preferences?.timezone || 'Not set'}
- Currency: ${profile.preferences?.currency || 'USD'}`);
  }

  if (context.tasks && context.tasks.length > 0) {
    const pending = context.tasks.filter(t => t.status !== 'completed');
    const completed = context.tasks.filter(t => t.status === 'completed');
    parts.push(`\n**Tasks Overview:**
- Total Tasks: ${context.tasks.length}
- Pending: ${pending.length}
- Completed: ${completed.length}
${pending.slice(0, 5).map(t => `- ${t.priority === 'high' || t.priority === 'critical' ? '🔴' : '⚪'} ${t.title} (${t.priority})`).join('\n')}`);
  }

  if (context.habits && context.habits.length > 0) {
    parts.push(`\n**Habits:**
${context.habits.slice(0, 5).map(h => `- ${h.name}: ${h.currentStreak || 0} day streak`).join('\n')}`);
  }

  if (context.events && context.events.length > 0) {
    const today = new Date();
    const upcoming = context.events
      .filter(e => new Date(e.startTime) >= today)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 5);

    if (upcoming.length > 0) {
      parts.push(`\n**Upcoming Events:**
${upcoming.map(e => `- ${new Date(e.startTime).toLocaleDateString()}: ${e.title}`).join('\n')}`);
    }
  }

  if (context.goals && context.goals.length > 0) {
    const active = context.goals.filter(g => g.status !== 'completed');
    parts.push(`\n**Active Goals:**
${active.slice(0, 3).map(g => `- ${g.title}: ${g.progress || 0}% complete`).join('\n')}`);
  }

  if (context.transactions && context.transactions.length > 0) {
    const thisMonth = context.transactions.filter(t => {
      const date = new Date(t.date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    const income = thisMonth.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = thisMonth.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    parts.push(`\n**This Month's Finances:**
- Income: $${income.toLocaleString()}
- Expenses: $${expenses.toLocaleString()}
- Net: $${(income - expenses).toLocaleString()}`);
  }

  if (context.wellness && context.wellness.length > 0) {
    const recent = context.wellness
      .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
      .slice(0, 7);

    const avgStress = recent.reduce((sum, w) => sum + (w.stress?.level || 0), 0) / recent.length;
    const avgSleepMinutes = recent.reduce((sum, w) => sum + (w.sleep?.duration || 0), 0) / recent.length;
    const periodDays = recent.filter(w => w.period?.isPeriodDay).length;

    parts.push(`\n**Wellness (Last ${recent.length} entries):**
- Avg Stress: ${avgStress.toFixed(1)}/10
- Avg Sleep: ${(avgSleepMinutes / 60).toFixed(1)} hours
- Period Days Logged: ${periodDays}`);
  }

  if (context.subjects && context.subjects.length > 0) {
    const subjects = context.subjects.slice(0, 5);
    const upcomingExams: Array<{ subjectName: string; examName: string; date: Date }> = [];
    subjects.forEach(subject => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (subject.examDates || []).forEach((exam: any) => {
        const examDate = new Date(exam.date);
        if (!Number.isNaN(examDate.getTime()) && examDate >= new Date()) {
          upcomingExams.push({
            subjectName: subject.name,
            examName: exam.name,
            date: examDate,
          });
        }
      });
    });
    upcomingExams.sort((a, b) => a.date.getTime() - b.date.getTime());

    parts.push(`\n**Study Snapshot:**
${subjects.map(subject => `- ${subject.name}: ${subject.topics?.length || 0} topics, mastery ${subject.masteryLevel || 0}%`).join('\n')}
${upcomingExams.length > 0 ? `\nUpcoming Exams:\n${upcomingExams.slice(0, 4).map(exam => `- ${exam.date.toLocaleDateString()}: ${exam.examName} (${exam.subjectName})`).join('\n')}` : ''}`);
  }

  const eduplanrTasks = context.tasks?.filter(t => t.source === 'eduplanr') || [];
  const eduplanrEvents = context.events?.filter(e => e.source === 'eduplanr') || [];

  if (eduplanrTasks.length > 0 || eduplanrEvents.length > 0) {
    const pendingAcademic = eduplanrTasks.filter(t => t.status !== 'done');
    const upcomingSessions = eduplanrEvents.filter(e => new Date(e.startTime) >= new Date()).slice(0, 3);

    parts.push(`\n**EduPlanr Academic Context:**
The user is currently studying. Here is their academic dashboard from EduPlanr:
- Upcoming Assignments/Exams: ${pendingAcademic.length} pending
${pendingAcademic.slice(0, 3).map(t => `- ${t.title} ${t.dueDate ? `(Due: ${new Date(t.dueDate).toLocaleDateString()})` : ''}`).join('\n')}
- Scheduled Study Sessions: ${upcomingSessions.length} upcoming
${upcomingSessions.slice(0, 3).map(e => `- ${new Date(e.startTime).toLocaleDateString()}: ${e.title}`).join('\n')}
*AI Directive*: Provide academic advice to help them succeed when relevant, and suggest taking breaks if their wellness data indicates high stress or low sleep.`);
  }

  if (context.focusSessions && context.focusSessions.length > 0) {
    const thisWeek = context.focusSessions.filter(s => {
      const date = new Date(s.startTime || s.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    });

    const totalMinutes = thisWeek.reduce((sum, s) => sum + (s.duration || 0), 0);
    const completedSessions = thisWeek.filter(s => s.completed).length;

    parts.push(`\n**Focus Sessions (This Week):**
- Total Focus Time: ${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m
- Completed Sessions: ${completedSessions}/${thisWeek.length}`);
  }

  if (context.journal && context.journal.length > 0) {
    const recent = context.journal
      .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
      .slice(0, 3);

    const moods = recent.map(j => j.mood).filter(Boolean);
    parts.push(`\n**Recent Journal Entries:**
- Last ${recent.length} entries
${moods.length > 0 ? `- Moods: ${moods.join(', ')}` : ''}
${recent.map(j => `- ${new Date(j.date || j.createdAt).toLocaleDateString()}: "${(j.title || j.content?.substring(0, 50) || 'Entry')}..."`).join('\n')}`);
  }

  if (context.notes && context.notes.length > 0) {
    const recentNotes = context.notes
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 5);

    parts.push(`\n**Recent Notes:**
${recentNotes.map(n => `- ${n.title || 'Untitled'} (${n.folder || 'Unfiled'})`).join('\n')}`);
  }

  return parts.length > 0
    ? `\n\n---\n**USER'S CURRENT DATA:**${parts.join('\n')}\n---\n`
    : '';
};

// Extract suggestions from AI response
const extractSuggestions = (content: string): string[] => {
  const defaultSuggestions = ['Plan my day', 'Show my tasks', 'Track wellness'];

  // Try to find bullet points at the end of the response
  const lines = content.split('\n').filter(l => l.trim());
  const lastLines = lines.slice(-5);

  const suggestions: string[] = [];
  for (const line of lastLines) {
    const match = line.match(/^[-•*]\s*(.+)$/);
    if (match && match[1].length < 50) {
      suggestions.push(match[1].trim());
    }
  }

  return suggestions.length > 0 ? suggestions.slice(0, 4) : defaultSuggestions;
};

// Generate response using Gemini
export const generateGeminiResponse = async (
  userMessage: string,
  context?: AIContext,
  conversationHistory?: { role: string; content: string }[]
): Promise<{ content: string; suggestions: string[] }> => {
  const genAI = getGeminiClient();

  if (!genAI) {
    return {
      content: `I need an API key to provide AI-powered responses! 

To enable real AI features:
1. Go to **Settings** → **AI Settings**
2. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
3. Enter your API key and save

Once configured, I'll be able to:
- Analyze your tasks and suggest priorities
- Help plan your schedule
- Track your goals and habits
- Provide personalized insights
- Answer questions naturally

Would you like to set this up now?`,
      suggestions: ['Open Settings', 'Learn more about AI features', 'What can NOVA do?'],
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build conversation context
    const contextString = formatContextForAI(context);

    // Build history for multi-turn conversation
    const historyMessages = conversationHistory?.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user' as const,
      parts: [{ text: msg.content }],
    })) || [];

    // Start chat with system prompt and history
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: 'Please follow these instructions for our conversation.' }] },
        { role: 'model', parts: [{ text: NOVA_SYSTEM_PROMPT }] },
        ...historyMessages,
      ],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      },
    });

    // Send message with context
    const prompt = contextString
      ? `${userMessage}\n\n[Context about the user's data is provided below - use it to give personalized responses]${contextString}`
      : userMessage;

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const content = response.text();

    // Extract suggestions from the response
    const suggestions = extractSuggestions(content);

    return { content, suggestions };
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error('Gemini API error:', error);

    if (error.message?.includes('API key')) {
      return {
        content: 'Invalid API key. Please check your Gemini API key in Settings → AI Settings.',
        suggestions: ['Open Settings', 'Get API key'],
      };
    }

    if (error.message?.includes('quota') || error.message?.includes('rate')) {
      return {
        content: 'API rate limit reached. Please try again in a moment.',
        suggestions: ['Try again', 'What can NOVA do?'],
      };
    }

    return {
      content: `I encountered an error processing your request. Please try again.

Error: ${error.message || 'Unknown error'}`,
      suggestions: ['Try again', 'Check settings'],
    };
  }
};

export interface SyllabusMilestoneDraft {
  title: string;
  description?: string;
}

export interface SyllabusDraft {
  subjectName: string;
  summary?: string;
  milestones: SyllabusMilestoneDraft[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extractJsonObject = (text: string): any | null => {
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  const rawJson = cleaned.slice(start, end + 1);
  try {
    return JSON.parse(rawJson);
  } catch {
    return null;
  }
};

const fallbackSyllabusDraft = (text: string, fileName?: string): SyllabusDraft => {
  const lines = text
    .split('\n')
    .map(item => item.trim())
    .filter(item => item.length >= 4 && item.length <= 100);

  const topicLines = lines
    .filter(item => /^\d+[\).]/.test(item) || /^[-*]/.test(item) || /week|module|chapter|unit/i.test(item))
    .map(item => item.replace(/^\d+[\).]\s*/, '').replace(/^[-*]\s*/, '').trim())
    .slice(0, 12);

  const milestones = (topicLines.length > 0 ? topicLines : lines.slice(0, 8)).map(title => ({ title }));

  return {
    subjectName: fileName?.replace(/\.[^/.]+$/, '') || 'Imported Subject',
    summary: '',
    milestones,
  };
};

export const extractSyllabusDraft = async (params: {
  text?: string;
  file?: {
    name: string;
    mimeType: string;
    base64: string;
  };
}): Promise<SyllabusDraft> => {
  const text = params.text?.trim() || '';
  const file = params.file;

  if (!text && !file) {
    throw new Error('Provide syllabus text or a file first.');
  }

  const genAI = getGeminiClient();
  if (!genAI) {
    throw new Error('AI is not configured. Add a Gemini API key in Settings > AI Settings.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const instruction = `Extract a study plan from this syllabus.
Return JSON only with this exact schema:
{
  "subjectName": "string",
  "summary": "string",
  "milestones": [
    { "title": "string", "description": "string" }
  ]
}
Rules:
- Keep milestones concise and practical.
- Include 5 to 12 milestones.
- No markdown, no explanation, JSON only.`;

    const parts: any[] = [{ text: instruction }];
    if (text) {
      parts.push({ text: `SYLLABUS TEXT:\n${text.slice(0, 24000)}` });
    }
    if (file) {
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.base64,
        },
      });
    }

    const result = await model.generateContent(parts);
    const response = await result.response;
    const parsed = extractJsonObject(response.text());

    if (!parsed) {
      return fallbackSyllabusDraft(text, file?.name);
    }

    const subjectName =
      typeof parsed.subjectName === 'string' && parsed.subjectName.trim()
        ? parsed.subjectName.trim()
        : file?.name?.replace(/\.[^/.]+$/, '') || 'Imported Subject';

    const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : '';
    const milestones = Array.isArray(parsed.milestones)
      ? parsed.milestones
        .map((item: any) => ({
          title: typeof item?.title === 'string' ? item.title.trim() : '',
          description: typeof item?.description === 'string' ? item.description.trim() : undefined,
        }))
        .filter((item: SyllabusMilestoneDraft) => item.title.length > 0)
        .slice(0, 12)
      : [];

    if (milestones.length === 0) {
      return fallbackSyllabusDraft(text, file?.name);
    }

    return {
      subjectName,
      summary,
      milestones,
    };
  } catch (error: any) {
    console.error('Failed to extract syllabus:', error);

    if (error?.message?.includes('quota') || error?.message?.includes('rate')) {
      throw new Error('Gemini quota reached. Try again in a minute.');
    }

    return fallbackSyllabusDraft(text, file?.name);
  }
};

// Check if AI is configured
export const isAIConfigured = (): boolean => {
  const apiKey = typeof window !== 'undefined'
    ? localStorage.getItem('gemini_api_key') || process.env.NEXT_PUBLIC_GEMINI_API_KEY
    : process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  return !!apiKey;
};

// Save API key
export const saveGeminiApiKey = (apiKey: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gemini_api_key', apiKey);
  }
};

// Get API key (masked for display)
export const getGeminiApiKeyMasked = (): string | null => {
  if (typeof window === 'undefined') return null;
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) return null;
  return apiKey.substring(0, 6) + '...' + apiKey.substring(apiKey.length - 4);
};

// Remove API key
export const removeGeminiApiKey = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('gemini_api_key');
  }
};

// Validate API key by making a test request
export const validateGeminiApiKey = async (apiKey: string): Promise<boolean> => {
  // Basic format check first
  if (!apiKey || apiKey.length < 20) {
    console.error('API key too short');
    return false;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Use a minimal request to validate
    const result = await model.generateContent('Hi');
    const response = await result.response;

    // If we got a response, the key is valid
    return !!response.text();
  } catch (error: any) {
    console.error('API key validation failed:', error?.message || error);

    // Check for specific error types
    if (error?.message?.includes('API_KEY_INVALID') ||
      error?.message?.includes('invalid') ||
      error?.status === 400 ||
      error?.status === 401) {
      return false;
    }

    // For network errors or rate limits, assume key might be valid
    // but there's a temporary issue
    if (error?.message?.includes('network') ||
      error?.message?.includes('fetch') ||
      error?.message?.includes('quota') ||
      error?.message?.includes('rate')) {
      // Return true for network issues - key format is correct
      console.warn('Network issue during validation, assuming key is valid');
      return true;
    }

    return false;
  }
};
