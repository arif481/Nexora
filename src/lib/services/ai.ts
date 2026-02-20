/* eslint-disable @typescript-eslint/no-explicit-any */
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conversations = snapshot.docs.map((doc: any) => convertConversationFromFirestore(doc));
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages = (data.messages || []).map((msg: any, index: number) => convertMessageFromFirestore(msg, index));

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages = (data.messages || []).map((msg: any, index: number) => convertMessageFromFirestore(msg, index));

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // Build message object without undefined values (Firestore doesn't accept undefined in arrayUnion)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newMessage: Record<string, any> = {
    id: `msg-${Date.now()}`,
    role: message.role,
    content: message.content,
    timestamp: new Date(),
  };

  // Only add optional fields if they have values
  if (message.suggestions && message.suggestions.length > 0) {
    newMessage.suggestions = message.suggestions;
  }
  if (message.metadata) {
    newMessage.metadata = message.metadata;
  }

  await updateDoc(conversationRef, {
    messages: arrayUnion(newMessage),
    lastMessage: message.content.substring(0, 100),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// Save AI feedback for a message
export const saveAIFeedback = async (
  userId: string,
  messageId: string,
  feedback: 'up' | 'down',
  conversationId?: string
): Promise<void> => {
  try {
    const feedbackRef = collection(db, 'aiFeedback');
    await addDoc(feedbackRef, {
      userId,
      messageId,
      feedback,
      conversationId: conversationId || null,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to save feedback:', error);
    // Don't throw - feedback is non-critical
  }
};

// Import Gemini for real AI responses
import { generateGeminiResponse, AIContext } from './gemini';

// Generate AI response - uses Gemini when configured, otherwise shows setup prompt
export const generateAIResponse = async (
  userMessage: string,
  context?: {
    tasks?: any[];
    habits?: any[];
    events?: any[];
    goals?: any[];
    transactions?: any[];
    pathname?: string;
  },
  conversationHistory?: { role: string; content: string }[]
): Promise<{ content: string; suggestions: string[] }> => {
  // Use Gemini AI for real responses
  return generateGeminiResponse(userMessage, context as AIContext, conversationHistory);
};
