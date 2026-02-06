// Gemini AI Integration for real AI responses
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
  tasks?: any[];
  habits?: any[];
  events?: any[];
  goals?: any[];
  transactions?: any[];
  budgets?: any[];
  wellness?: any[];
  focusSessions?: any[];
}

// Format context for the AI
const formatContextForAI = (context?: AIContext): string => {
  if (!context) return '';
  
  const parts: string[] = [];
  
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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
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
  } catch (error: any) {
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
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    await model.generateContent('Hello, test');
    return true;
  } catch (error) {
    console.error('API key validation failed:', error);
    return false;
  }
};
