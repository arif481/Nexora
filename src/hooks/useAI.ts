'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useTasks } from './useTasks';
import { useHabits } from './useHabits';
import { useCalendar } from './useCalendar';
import { useGoals } from './useGoals';
import { useTransactions } from './useFinance';
import {
  subscribeToConversations,
  subscribeToConversation,
  createConversation,
  addMessageToConversation,
  toggleConversationStar,
  deleteConversation as deleteConversationService,
  generateAIResponse,
  type AIConversation,
  type AIConversationWithMessages,
  type AIMessage,
} from '@/lib/services/ai';

export function useAIConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToConversations(user.uid, (data) => {
      setConversations(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const createNewConversation = useCallback(async (initialMessage?: string) => {
    if (!user) return null;
    try {
      const id = await createConversation(user.uid, initialMessage);
      return id;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      return null;
    }
  }, [user]);

  const toggleStar = useCallback(async (conversationId: string, starred: boolean) => {
    try {
      await toggleConversationStar(conversationId, starred);
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  }, []);

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      await deleteConversationService(conversationId);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  }, []);

  return {
    conversations,
    loading,
    createNewConversation,
    toggleStar,
    deleteConversation,
  };
}

export function useAIChat(conversationId: string | null) {
  const { user } = useAuth();
  const { tasks } = useTasks();
  const { habits } = useHabits();
  const { events } = useCalendar();
  const { goals } = useGoals();
  const { transactions } = useTransactions();
  
  const [conversation, setConversation] = useState<AIConversationWithMessages | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!conversationId) {
      setConversation(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToConversation(conversationId, (data) => {
      setConversation(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [conversationId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId || !content.trim() || sending) return;

    setSending(true);
    try {
      // Add user message
      await addMessageToConversation(conversationId, {
        role: 'user',
        content: content.trim(),
      });

      // Generate AI response with context
      const context = {
        tasks,
        habits,
        events,
        goals,
        transactions,
      };
      
      const aiResponse = await generateAIResponse(content, context);

      // Add AI response
      await addMessageToConversation(conversationId, {
        role: 'assistant',
        content: aiResponse.content,
        suggestions: aiResponse.suggestions,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  }, [conversationId, sending, tasks, habits, events, goals, transactions]);

  return {
    conversation,
    messages: conversation?.messages || [],
    loading,
    sending,
    sendMessage,
  };
}

// Simple AI hook for the floating panel
export function useSimpleAI() {
  const { tasks } = useTasks();
  const { habits } = useHabits();
  const { events } = useCalendar();
  const { goals } = useGoals();
  const { transactions } = useTransactions();
  
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm Nexora, your AI assistant. I'm here to help you stay organized, productive, and balanced. How can I assist you today?",
      timestamp: new Date(),
      suggestions: ['Plan my day', 'What are my priorities?', 'How am I doing this week?'],
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isThinking) return;

    // Add user message
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsThinking(true);

    try {
      // Generate AI response with context
      const context = {
        tasks,
        habits,
        events,
        goals,
        transactions,
      };
      
      const aiResponse = await generateAIResponse(content, context);

      // Add AI response
      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date(),
        suggestions: aiResponse.suggestions,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to generate response:', error);
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
        suggestions: ['Try again', 'Help'],
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  }, [isThinking, tasks, habits, events, goals, transactions]);

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hello! I'm Nexora, your AI assistant. How can I help you today?",
        timestamp: new Date(),
        suggestions: ['Plan my day', 'What are my priorities?', 'Show my tasks'],
      },
    ]);
  }, []);

  return {
    messages,
    isThinking,
    sendMessage,
    clearMessages,
  };
}
