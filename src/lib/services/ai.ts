// AI Chat Service - Real-time Firestore operations for AI conversations
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  limit,
  getDocs,
  getDoc,
  arrayUnion,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  metadata?: {
    context?: string;
    sources?: string[];
    model?: string;
  };
}

export interface AIConversation {
  id: string;
  userId: string;
  title: string;
  lastMessage: string;
  messageCount: number;
  starred: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIConversationWithMessages extends AIConversation {
  messages: AIMessage[];
}

// Collection name for AI conversations
const AI_CONVERSATIONS = 'aiConversations';

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: Timestamp | Date | null | undefined): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp instanceof Date ? timestamp : new Date(timestamp);
};

// Convert conversation from Firestore
const convertConversationFromFirestore = (doc: any): AIConversation => {
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    title: data.title || 'New Conversation',
    lastMessage: data.lastMessage || '',
    messageCount: data.messageCount || 0,
    starred: data.starred || false,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
  };
};

// Convert message from Firestore
const convertMessageFromFirestore = (msg: any, index: number): AIMessage => {
  return {
    id: msg.id || `msg-${index}`,
    role: msg.role,
    content: msg.content,
    timestamp: convertTimestamp(msg.timestamp),
    suggestions: msg.suggestions,
    metadata: msg.metadata,
  };
};

// Subscribe to user's conversations
export const subscribeToConversations = (
  userId: string,
  callback: (conversations: AIConversation[]) => void
) => {
  const conversationsRef = collection(db, AI_CONVERSATIONS);
  const q = query(
    conversationsRef,
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const conversations = snapshot.docs.map(convertConversationFromFirestore);
    callback(conversations);
  });
};

// Get a single conversation with messages
export const getConversation = async (conversationId: string): Promise<AIConversationWithMessages | null> => {
  const conversationRef = doc(db, AI_CONVERSATIONS, conversationId);
  const snapshot = await getDoc(conversationRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  const data = snapshot.data();
  const conversation = convertConversationFromFirestore(snapshot);
  const messages = (data.messages || []).map(convertMessageFromFirestore);
  
  return {
    ...conversation,
    messages,
  };
};

// Subscribe to a conversation's messages
export const subscribeToConversation = (
  conversationId: string,
  callback: (conversation: AIConversationWithMessages | null) => void
) => {
  const conversationRef = doc(db, AI_CONVERSATIONS, conversationId);

  return onSnapshot(conversationRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    
    const data = snapshot.data();
    const conversation = convertConversationFromFirestore(snapshot);
    const messages = (data.messages || []).map(convertMessageFromFirestore);
    
    callback({
      ...conversation,
      messages,
    });
  });
};

// Create a new conversation
export const createConversation = async (
  userId: string,
  initialMessage?: string
): Promise<string> => {
  const conversationsRef = collection(db, AI_CONVERSATIONS);
  
  const messages: any[] = [];
  
  // Add welcome message
  messages.push({
    id: `msg-${Date.now()}`,
    role: 'assistant',
    content: "Hello! I'm NOVA, your AI-powered life assistant. I can help you with tasks, planning, goals, finances, wellness, and much more. What would you like to accomplish today?",
    timestamp: new Date(),
    suggestions: [
      'Plan my day',
      'Show my tasks',
      'Analyze my spending',
      'Check my goals',
    ],
  });
  
  // Add user's initial message if provided
  if (initialMessage) {
    messages.push({
      id: `msg-${Date.now() + 1}`,
      role: 'user',
      content: initialMessage,
      timestamp: new Date(),
    });
  }
  
  const newConversation = {
    userId,
    title: initialMessage ? generateTitle(initialMessage) : 'New Conversation',
    lastMessage: initialMessage || "Hello! I'm NOVA...",
    messageCount: messages.length,
    starred: false,
    messages,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(conversationsRef, newConversation);
  return docRef.id;
};

// Generate a title from the first message
const generateTitle = (message: string): string => {
  const words = message.split(' ').slice(0, 5).join(' ');
  return words.length > 30 ? words.substring(0, 30) + '...' : words;
};

// Add a message to a conversation
export const addMessageToConversation = async (
  conversationId: string,
  message: Omit<AIMessage, 'id' | 'timestamp'>
): Promise<void> => {
  const conversationRef = doc(db, AI_CONVERSATIONS, conversationId);
  
  const newMessage = {
    id: `msg-${Date.now()}`,
    role: message.role,
    content: message.content,
    timestamp: new Date(),
    suggestions: message.suggestions,
    metadata: message.metadata,
  };
  
  await updateDoc(conversationRef, {
    messages: arrayUnion(newMessage),
    lastMessage: message.content.substring(0, 100),
    messageCount: (await getDoc(conversationRef)).data()?.messageCount + 1 || 1,
    updatedAt: serverTimestamp(),
  });
};

// Toggle star on a conversation
export const toggleConversationStar = async (conversationId: string, starred: boolean): Promise<void> => {
  const conversationRef = doc(db, AI_CONVERSATIONS, conversationId);
  await updateDoc(conversationRef, { starred });
};

// Delete a conversation
export const deleteConversation = async (conversationId: string): Promise<void> => {
  const conversationRef = doc(db, AI_CONVERSATIONS, conversationId);
  await deleteDoc(conversationRef);
};

// Update conversation title
export const updateConversationTitle = async (conversationId: string, title: string): Promise<void> => {
  const conversationRef = doc(db, AI_CONVERSATIONS, conversationId);
  await updateDoc(conversationRef, { title });
};

// Generate AI response based on context
// Note: This is a simple rule-based response generator
// In production, you would integrate with OpenAI, Anthropic, or other AI APIs
export const generateAIResponse = async (
  userMessage: string,
  context?: {
    tasks?: any[];
    habits?: any[];
    events?: any[];
    goals?: any[];
    transactions?: any[];
  }
): Promise<{ content: string; suggestions: string[] }> => {
  const lowerMessage = userMessage.toLowerCase();
  
  let response = '';
  let suggestions: string[] = [];

  if (lowerMessage.includes('task') || lowerMessage.includes('todo')) {
    const taskCount = context?.tasks?.length || 0;
    const pendingTasks = context?.tasks?.filter(t => t.status !== 'completed') || [];
    
    if (taskCount === 0) {
      response = "You don't have any tasks yet. Would you like me to help you create some tasks to get organized?";
      suggestions = ['Create a task', 'Plan my day', 'What can you help with?'];
    } else {
      response = `You have ${pendingTasks.length} pending task${pendingTasks.length !== 1 ? 's' : ''}.\n\n`;
      
      const highPriority = pendingTasks.filter(t => t.priority === 'high' || t.priority === 'critical');
      if (highPriority.length > 0) {
        response += `📋 **High Priority Tasks:**\n`;
        highPriority.slice(0, 3).forEach((task, i) => {
          response += `${i + 1}. ${task.title}\n`;
        });
        response += '\n';
      }
      
      response += 'Would you like me to help you prioritize or break down any tasks?';
      suggestions = ['Show all tasks', 'Add a new task', 'Help me prioritize', 'Clear completed'];
    }
  } else if (lowerMessage.includes('plan') || lowerMessage.includes('schedule') || lowerMessage.includes('day')) {
    const todayEvents = context?.events?.filter(e => {
      const eventDate = new Date(e.startTime);
      const today = new Date();
      return eventDate.toDateString() === today.toDateString();
    }) || [];
    
    if (todayEvents.length === 0) {
      response = "You have no events scheduled for today. This is a great opportunity to focus on deep work or tackle important tasks.\n\nWould you like me to suggest a productive schedule?";
    } else {
      response = `Here's your schedule for today:\n\n`;
      todayEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      todayEvents.forEach(event => {
        const time = new Date(event.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        response += `• ${time} - ${event.title}\n`;
      });
      response += '\nWould you like me to help optimize your schedule?';
    }
    suggestions = ['Block focus time', 'View calendar', 'Add event', 'Adjust schedule'];
  } else if (lowerMessage.includes('spend') || lowerMessage.includes('money') || lowerMessage.includes('finance') || lowerMessage.includes('budget')) {
    const transactions = context?.transactions || [];
    const thisMonth = transactions.filter(t => {
      const date = new Date(t.date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    
    const income = thisMonth.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = thisMonth.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    if (transactions.length === 0) {
      response = "You haven't recorded any transactions yet. Start tracking your finances to get personalized insights and budget recommendations.";
      suggestions = ['Add income', 'Add expense', 'Set up budget', 'Learn more'];
    } else {
      response = `💰 **This Month's Overview:**\n• Income: $${income.toLocaleString()}\n• Expenses: $${expenses.toLocaleString()}\n• Balance: $${(income - expenses).toLocaleString()}\n\n`;
      
      if (income > 0) {
        const savingsRate = Math.round(((income - expenses) / income) * 100);
        response += `Your savings rate is ${savingsRate}%. `;
        if (savingsRate >= 20) {
          response += "Great job maintaining healthy savings!";
        } else if (savingsRate >= 0) {
          response += "Consider ways to increase your savings rate.";
        } else {
          response += "You're spending more than you earn. Let's work on a budget.";
        }
      }
    }
    suggestions = ['View detailed report', 'Adjust budgets', 'Add expense', 'Savings tips'];
  } else if (lowerMessage.includes('goal') || lowerMessage.includes('target')) {
    const goals = context?.goals || [];
    const activeGoals = goals.filter(g => g.status !== 'completed');
    
    if (goals.length === 0) {
      response = "You haven't set any goals yet. Goals help you stay focused and motivated. Would you like to create your first goal?";
      suggestions = ['Create a goal', 'Goal ideas', 'What makes a good goal?'];
    } else {
      response = `🎯 **Your Active Goals:**\n\n`;
      activeGoals.slice(0, 3).forEach(goal => {
        const progress = goal.progress || 0;
        response += `**${goal.title}**\n📈 Progress: ${progress}%\n\n`;
      });
      response += `You have ${activeGoals.length} active goal${activeGoals.length !== 1 ? 's' : ''}. Would you like to review or update any?`;
    }
    suggestions = ['Update goal', 'Add milestone', 'View all goals', 'Create new goal'];
  } else if (lowerMessage.includes('habit') || lowerMessage.includes('streak')) {
    const habits = context?.habits || [];
    
    if (habits.length === 0) {
      response = "You haven't created any habits yet. Building habits is key to lasting change. Would you like to start with a simple daily habit?";
      suggestions = ['Create a habit', 'Habit ideas', 'How habits work'];
    } else {
      response = `🔥 **Your Habits:**\n\n`;
      habits.slice(0, 5).forEach(habit => {
        const streak = habit.currentStreak || 0;
        response += `• ${habit.name}: ${streak} day streak\n`;
      });
      response += '\nConsistency is key! Would you like tips to maintain your streaks?';
    }
    suggestions = ['Log habit', 'View analytics', 'Add new habit', 'Set reminder'];
  } else if (lowerMessage.includes('wellness') || lowerMessage.includes('health') || lowerMessage.includes('sleep')) {
    response = "Wellness tracking helps you understand patterns in your health. You can track:\n\n";
    response += "• 😴 Sleep quality and duration\n";
    response += "• 🏃 Exercise and activity\n";
    response += "• 🍎 Nutrition and meals\n";
    response += "• 💧 Water intake\n";
    response += "• 🧘 Stress and mood\n\n";
    response += "Would you like to log any wellness data?";
    suggestions = ['Log sleep', 'Track exercise', 'Log meal', 'Check wellness'];
  } else if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
    response = "I'm NOVA, your AI-powered life assistant! Here's how I can help:\n\n";
    response += "📋 **Tasks** - Organize, prioritize, and track your to-dos\n";
    response += "📅 **Calendar** - Schedule optimization and event management\n";
    response += "🎯 **Goals** - Set, track, and achieve your objectives\n";
    response += "💰 **Finance** - Budget tracking and spending insights\n";
    response += "🔥 **Habits** - Build routines and maintain streaks\n";
    response += "❤️ **Wellness** - Health metrics and recommendations\n";
    response += "📚 **Study** - Track learning and academic progress\n";
    response += "⏱️ **Focus** - Pomodoro timer and distraction blocking\n\n";
    response += "Just ask me anything naturally!";
    suggestions = ['Plan my day', 'Show my tasks', 'Check my goals', 'Track wellness'];
  } else {
    response = "I understand you're asking about \"" + userMessage.substring(0, 50) + "\".\n\n";
    response += "I can help you with tasks, planning, goals, finances, habits, wellness, and more. Could you be more specific about what you'd like to accomplish?\n\n";
    response += "Try asking things like:\n";
    response += "• \"What are my tasks for today?\"\n";
    response += "• \"Help me plan my day\"\n";
    response += "• \"How am I doing with my goals?\"\n";
    response += "• \"Analyze my spending this month\"";
    suggestions = ['Show my tasks', 'Plan my week', 'Check finances', 'View goals'];
  }

  return { content: response, suggestions };
};
