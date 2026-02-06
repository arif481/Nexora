'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  Trash2,
  Plus,
  MessageSquare,
  Clock,
  ChevronLeft,
  ChevronRight,
  Star,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Image,
  Link2,
  LogIn,
} from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner, EmptyState } from '@/components/ui/Loading';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useAIConversations, useAIChat } from '@/hooks/useAI';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { useCalendar } from '@/hooks/useCalendar';
import { useGoals } from '@/hooks/useGoals';
import { useTransactions } from '@/hooks/useFinance';
import { generateAIResponse, saveAIFeedback } from '@/lib/services/ai';

// Suggestion prompts for new conversations
const suggestionPrompts = [
  {
    icon: '📋',
    label: 'Manage my tasks',
    prompt: 'Help me organize and prioritize my tasks for today',
  },
  {
    icon: '📅',
    label: 'Plan my day',
    prompt: 'Create a productive schedule for my day based on my upcoming events',
  },
  {
    icon: '🎯',
    label: 'Track my goals',
    prompt: 'Review my current goals and suggest next steps to achieve them',
  },
  {
    icon: '💰',
    label: 'Analyze finances',
    prompt: 'Analyze my spending patterns and suggest ways to save money',
  },
  {
    icon: '🔥',
    label: 'Build habits',
    prompt: 'Help me build better habits and maintain my streaks',
  },
  {
    icon: '❤️',
    label: 'Wellness check',
    prompt: 'Give me personalized wellness recommendations based on my data',
  },
];

export default function AIPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { conversations, loading: conversationsLoading, createNewConversation, toggleStar, deleteConversation } = useAIConversations();
  const { tasks } = useTasks();
  const { habits } = useHabits();
  const { events } = useCalendar();
  const { goals } = useGoals();
  const { transactions } = useTransactions();
  
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const { conversation, messages, loading: chatLoading, sending, sendMessage } = useAIChat(currentConversationId);
  
  const [inputValue, setInputValue] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({});
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [localSending, setLocalSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, localMessages]);

  // Initialize local messages for new chat (before conversation is created)
  useEffect(() => {
    if (!currentConversationId && localMessages.length === 0) {
      setLocalMessages([
        {
          id: '1',
          role: 'assistant',
          content: "Hello! I'm NOVA, your AI-powered life assistant. I can help you with tasks, planning, goals, finances, wellness, and much more. What would you like to accomplish today?",
          timestamp: new Date(),
          suggestions: [
            'Plan my day',
            'Show my tasks',
            'Analyze my spending',
            'Check my goals',
          ],
        },
      ]);
    }
  }, [currentConversationId, localMessages.length]);

  // Reset local messages when switching to an existing conversation
  useEffect(() => {
    if (currentConversationId) {
      setLocalMessages([]);
    }
  }, [currentConversationId]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleSend = async (content: string = inputValue) => {
    if (!content.trim() || sending || localSending) return;
    
    const messageContent = content.trim();
    setInputValue('');

    if (!currentConversationId) {
      // New conversation - handle locally first
      setLocalSending(true);
      
      // Add user message to local state
      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: messageContent,
        timestamp: new Date(),
      };
      setLocalMessages(prev => [...prev, userMessage]);

      try {
        // Generate AI response with context
        const context = { tasks, habits, events, goals, transactions };
        const aiResponse = await generateAIResponse(messageContent, context);
        
        // Add AI response to local state
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiResponse.content,
          timestamp: new Date(),
          suggestions: aiResponse.suggestions,
        };
        setLocalMessages(prev => [...prev, assistantMessage]);

        // Create conversation in Firebase
        if (user) {
          const newConversationId = await createNewConversation(messageContent);
          if (newConversationId) {
            setCurrentConversationId(newConversationId);
          }
        }
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        setLocalSending(false);
      }
    } else {
      // Existing conversation - use the hook
      await sendMessage(messageContent);
    }
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    setLocalMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hello! I'm NOVA, your AI-powered life assistant. What would you like to accomplish today?",
        timestamp: new Date(),
        suggestions: ['Plan my day', 'Show my tasks', 'Analyze my spending', 'Check my goals'],
      },
    ]);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (messageId: string, type: 'up' | 'down') => {
    setFeedbackGiven(prev => ({ ...prev, [messageId]: type }));
    // Save feedback to Firebase
    if (user) {
      saveAIFeedback(user.uid, messageId, type, currentConversationId || undefined);
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    await deleteConversation(convId);
    if (currentConversationId === convId) {
      handleNewChat();
    }
  };

  const displayMessages = currentConversationId ? messages : localMessages;
  const isLoading = authLoading || conversationsLoading;
  const isSendingMessage = sending || localSending;

  // Show loading state
  if (isLoading) {
    return (
      <MainLayout>
        <PageContainer title="AI Assistant" subtitle="Your intelligent life companion">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Loading AI assistant...</p>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <MainLayout>
        <PageContainer title="AI Assistant" subtitle="Your intelligent life companion">
          <Card variant="glass" className="max-w-md mx-auto p-8 text-center">
            <LogIn className="w-12 h-12 text-neon-cyan mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Sign in to chat with NOVA</h3>
            <p className="text-dark-400 mb-6">
              Get personalized AI assistance for tasks, planning, goals, and more.
            </p>
            <Button variant="glow" onClick={() => router.push('/auth/login')}>
              Sign In
            </Button>
          </Card>
        </PageContainer>
      </MainLayout>
    );
  }

  const MessageBubble = ({ message }: { message: any }) => {
    const isUser = message.role === 'user';

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('flex gap-3', isUser && 'flex-row-reverse')}
      >
        {/* Avatar */}
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            isUser
              ? 'bg-gradient-to-br from-neon-cyan to-neon-purple'
              : 'bg-gradient-to-br from-neon-purple to-neon-pink'
          )}
        >
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <Sparkles className="w-4 h-4 text-white" />
          )}
        </div>

        {/* Content */}
        <div className={cn('flex-1 max-w-[80%]', isUser && 'flex flex-col items-end')}>
          {/* Name & Time */}
          <div className={cn('flex items-center gap-2 mb-1', isUser && 'flex-row-reverse')}>
            <span className="text-sm font-medium text-white">
              {isUser ? 'You' : 'NOVA'}
            </span>
            <span className="text-xs text-dark-500">{formatTime(new Date(message.timestamp))}</span>
          </div>

          {/* Message */}
          <div
            className={cn(
              'rounded-2xl px-4 py-3',
              isUser
                ? 'bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/30'
                : 'bg-dark-800/50 border border-dark-700/50'
            )}
          >
            <div className="prose prose-invert prose-sm max-w-none">
              {message.content.split('\n').map((line: string, i: number) => (
                <p key={i} className="mb-2 last:mb-0 text-dark-100 leading-relaxed whitespace-pre-wrap">
                  {line}
                </p>
              ))}
            </div>
          </div>

          {/* Actions */}
          {!isUser && (
            <div className="flex items-center gap-1 mt-2">
              <button
                onClick={() => handleCopy(message.content, message.id)}
                className="p-1.5 rounded-lg hover:bg-dark-700/50 text-dark-400 hover:text-white transition-colors"
                title="Copy"
              >
                {copiedId === message.id ? (
                  <Check className="w-4 h-4 text-neon-green" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <button 
                onClick={() => handleFeedback(message.id, 'up')}
                className={`p-1.5 rounded-lg hover:bg-dark-700/50 transition-colors ${
                  feedbackGiven[message.id] === 'up' ? 'text-neon-green' : 'text-dark-400 hover:text-white'
                }`}
                title="Good response"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleFeedback(message.id, 'down')}
                className={`p-1.5 rounded-lg hover:bg-dark-700/50 transition-colors ${
                  feedbackGiven[message.id] === 'down' ? 'text-red-400' : 'text-dark-400 hover:text-white'
                }`}
                title="Poor response"
              >
                <ThumbsDown className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Suggestions */}
          {!isUser && message.suggestions && message.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {message.suggestions.map((suggestion: string, i: number) => (
                <button
                  key={i}
                  onClick={() => handleSend(suggestion)}
                  className="px-3 py-1.5 rounded-full text-xs bg-dark-800/50 text-dark-200 hover:text-white hover:bg-dark-700/50 border border-dark-700/50 hover:border-neon-cyan/30 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-2rem)] overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence mode="wait">
          {isSidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-dark-700/50 bg-dark-900/50 flex flex-col"
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-dark-700/50">
                <Button variant="glow" className="w-full" onClick={handleNewChat}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Chat
                </Button>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                <p className="px-3 py-2 text-xs text-dark-500 uppercase font-medium">Recent</p>
                {conversations.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-dark-500 text-center">
                    No conversations yet
                  </p>
                ) : (
                  conversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => setCurrentConversationId(conv.id)}
                      className={cn(
                        'w-full p-3 rounded-xl text-left transition-all group',
                        currentConversationId === conv.id
                          ? 'bg-neon-cyan/10 border border-neon-cyan/30'
                          : 'hover:bg-dark-800/50 border border-transparent'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-4 h-4 text-dark-400" />
                        <span className="text-sm font-medium text-white truncate flex-1">
                          {conv.title}
                        </span>
                        {conv.starred && <Star className="w-3 h-3 text-neon-orange fill-neon-orange" />}
                      </div>
                      <p className="text-xs text-dark-400 truncate">{conv.lastMessage}</p>
                      <div className="flex items-center justify-between gap-2 mt-2 text-xs text-dark-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatRelativeTime(new Date(conv.updatedAt))}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(conv.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-dark-700/50 rounded transition-all"
                        >
                          <Trash2 className="w-3 h-3 text-dark-400 hover:text-neon-red" />
                        </button>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <header className="flex items-center justify-between px-6 py-4 border-b border-dark-700/50 bg-dark-900/50">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg hover:bg-dark-700/50 transition-colors"
              >
                {isSidebarOpen ? (
                  <ChevronLeft className="w-5 h-5 text-dark-300" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-dark-300" />
                )}
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white flex items-center gap-2">
                    NOVA
                    <Badge variant="purple" size="sm">AI</Badge>
                  </h1>
                  <p className="text-xs text-dark-400">Your intelligent life assistant</p>
                </div>
              </div>
            </div>
          </header>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto">
            {displayMessages.length === 0 || (displayMessages.length === 1 && displayMessages[0].role === 'assistant') ? (
              /* Welcome Screen with Suggestions */
              <div className="max-w-3xl mx-auto px-6 py-12">
                <div className="text-center mb-12">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-pink mx-auto mb-6 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-3">How can I help you today?</h2>
                  <p className="text-dark-400">
                    I can help you manage tasks, plan your day, track goals, analyze finances, and more.
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {suggestionPrompts.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleSend(item.prompt)}
                      className="p-4 rounded-xl bg-dark-800/50 border border-dark-700/50 hover:border-neon-cyan/30 hover:bg-dark-700/50 transition-all text-left group"
                    >
                      <span className="text-2xl mb-2 block">{item.icon}</span>
                      <span className="text-sm font-medium text-white group-hover:text-neon-cyan transition-colors">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Chat Messages */
              <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
                {displayMessages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}

                {/* Typing indicator */}
                {isSendingMessage && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                          className="w-2 h-2 rounded-full bg-neon-purple"
                        />
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                          className="w-2 h-2 rounded-full bg-neon-cyan"
                        />
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                          className="w-2 h-2 rounded-full bg-neon-pink"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-dark-700/50 bg-dark-900/50">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Ask NOVA anything..."
                    className="w-full px-4 py-3 pr-24 rounded-xl bg-dark-800/50 border border-dark-700/50 focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/30 outline-none text-white placeholder-dark-500 transition-all"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button className="p-2 rounded-lg hover:bg-dark-700/50 text-dark-400 hover:text-white transition-colors">
                      <Image className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-dark-700/50 text-dark-400 hover:text-white transition-colors">
                      <Link2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <Button
                  variant="glow"
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isSendingMessage}
                  className="px-6"
                >
                  {isSendingMessage ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-dark-500 text-center mt-2">
                NOVA uses your data to provide personalized insights. Responses are generated locally.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
