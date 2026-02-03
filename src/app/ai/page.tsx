'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Sparkles,
  Brain,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Plus,
  MessageSquare,
  Clock,
  ChevronLeft,
  ChevronRight,
  Settings,
  Zap,
  Lightbulb,
  Code,
  FileText,
  Calendar,
  CheckSquare,
  Target,
  Wallet,
  Heart,
  Flame,
  MoreHorizontal,
  Star,
  Bookmark,
  Share,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Wand2,
  Image,
  Link2,
  ArrowRight,
} from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  actions?: MessageAction[];
  suggestions?: string[];
  metadata?: {
    context?: string;
    sources?: string[];
  };
}

interface MessageAction {
  label: string;
  icon: any;
  action: () => void;
}

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
  starred?: boolean;
}

interface SuggestionPrompt {
  icon: any;
  label: string;
  prompt: string;
  category: string;
  color: string;
}

// Suggestion prompts
const suggestionPrompts: SuggestionPrompt[] = [
  {
    icon: CheckSquare,
    label: 'Manage my tasks',
    prompt: 'Help me organize and prioritize my tasks for today',
    category: 'Productivity',
    color: '#00f0ff',
  },
  {
    icon: Calendar,
    label: 'Plan my day',
    prompt: 'Create a productive schedule for my day based on my upcoming events',
    category: 'Planning',
    color: '#a855f7',
  },
  {
    icon: Target,
    label: 'Track my goals',
    prompt: 'Review my current goals and suggest next steps to achieve them',
    category: 'Goals',
    color: '#22c55e',
  },
  {
    icon: Wallet,
    label: 'Analyze finances',
    prompt: 'Analyze my spending patterns and suggest ways to save money',
    category: 'Finance',
    color: '#f97316',
  },
  {
    icon: Flame,
    label: 'Build habits',
    prompt: 'Help me build better habits and maintain my streaks',
    category: 'Habits',
    color: '#ec4899',
  },
  {
    icon: Heart,
    label: 'Wellness check',
    prompt: 'Give me personalized wellness recommendations based on my data',
    category: 'Wellness',
    color: '#ef4444',
  },
  {
    icon: Code,
    label: 'Write code',
    prompt: 'Help me write or debug code',
    category: 'Development',
    color: '#3b82f6',
  },
  {
    icon: FileText,
    label: 'Draft content',
    prompt: 'Help me write professional content',
    category: 'Writing',
    color: '#fbbf24',
  },
];

// Mock conversations
const mockConversations: Conversation[] = [
  {
    id: '1',
    title: 'Weekly Planning',
    lastMessage: 'Here\'s your optimized schedule for the week...',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    messageCount: 12,
    starred: true,
  },
  {
    id: '2',
    title: 'Budget Analysis',
    lastMessage: 'Based on your spending patterns, I recommend...',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    messageCount: 8,
  },
  {
    id: '3',
    title: 'Fitness Goals',
    lastMessage: 'Great progress! You\'ve completed 85% of your...',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    messageCount: 15,
    starred: true,
  },
  {
    id: '4',
    title: 'Project Ideas',
    lastMessage: 'Here are some innovative project ideas based on...',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    messageCount: 6,
  },
];

// Mock initial messages
const mockMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Hello! I\'m NOVA, your AI-powered life assistant. I can help you with tasks, planning, goals, finances, wellness, and much more. What would you like to accomplish today?',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    suggestions: [
      'Plan my day',
      'Show my tasks',
      'Analyze my spending',
      'Check my goals',
    ],
  },
];

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(content);
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const generateAIResponse = (userMessage: string): Message => {
    const lowerMessage = userMessage.toLowerCase();
    
    let response = '';
    let suggestions: string[] = [];

    if (lowerMessage.includes('task') || lowerMessage.includes('todo')) {
      response = `I've analyzed your tasks and here's what I found:\n\n📋 **Today's Priority Tasks:**\n1. Complete project proposal (High Priority)\n2. Review team feedback (Medium)\n3. Schedule client meeting (Low)\n\n✅ You have 3 tasks due today and 5 tasks scheduled for this week. Would you like me to help you reorganize priorities or break down any complex tasks?`;
      suggestions = ['Add a new task', 'Reschedule tasks', 'Mark task complete', 'View all tasks'];
    } else if (lowerMessage.includes('plan') || lowerMessage.includes('schedule') || lowerMessage.includes('day')) {
      response = `Based on your calendar and energy patterns, here's an optimized schedule:\n\n🌅 **Morning (9-12)**\n• Deep work: Project proposal (your peak focus time)\n• Team standup at 10am\n\n🌤️ **Afternoon (12-5)**\n• Lunch & short walk (recharge)\n• Meetings & collaborative work\n• Email & quick tasks\n\n🌙 **Evening**\n• Personal time & habit completion\n\nI've noticed you're most productive in the morning. Would you like me to protect those hours for focused work?`;
      suggestions = ['Block focus time', 'View calendar', 'Add event', 'Adjust schedule'];
    } else if (lowerMessage.includes('spend') || lowerMessage.includes('money') || lowerMessage.includes('finance') || lowerMessage.includes('budget')) {
      response = `Here's your financial snapshot:\n\n💰 **This Month's Overview:**\n• Income: $3,500\n• Expenses: $2,180 (62%)\n• Savings: $1,320 (38%)\n\n📊 **Top Spending Categories:**\n1. Housing: $1,200 (55%)\n2. Food: $340 (16%)\n3. Transport: $185 (8%)\n\n💡 **Insight:** You're spending 15% less than last month! Your food budget is on track, but entertainment is at 93% of budget. Consider waiting on non-essential purchases.`;
      suggestions = ['View detailed report', 'Adjust budgets', 'Add expense', 'Savings tips'];
    } else if (lowerMessage.includes('goal') || lowerMessage.includes('target')) {
      response = `Let me check on your goals:\n\n🎯 **Active Goals Progress:**\n\n**Learn Spanish** (Personal Development)\n📈 Progress: 45% | Deadline: 3 months\n✓ 3/5 milestones completed\n\n**Run a Marathon** (Health & Fitness)\n📈 Progress: 68% | Deadline: 2 months\n✓ 4/6 milestones completed\n\n**Save $10K** (Financial)\n📈 Progress: 75% | On track!\n\n🏆 You're making great progress! The marathon goal might need attention - shall I create a training plan?`;
      suggestions = ['Update goal', 'Add milestone', 'View all goals', 'Create new goal'];
    } else if (lowerMessage.includes('habit') || lowerMessage.includes('streak')) {
      response = `Your habit performance is looking great! 🔥\n\n**Active Streaks:**\n• Morning Meditation: 12 days 🧘\n• Daily Reading: 8 days 📚\n• Exercise: 5 days 💪\n• Journaling: 15 days ✍️\n\n**Today's Habits:**\n✅ Meditation (completed)\n✅ Exercise (completed)\n⬜ Reading (30 min remaining)\n⬜ Journal entry\n\nYou're on a roll! Just 2 habits left to maintain your streak. The reading habit shows your best consistency this month.`;
      suggestions = ['Log habit', 'View analytics', 'Add new habit', 'Set reminder'];
    } else if (lowerMessage.includes('wellness') || lowerMessage.includes('health')) {
      response = `Here's your wellness summary:\n\n❤️ **Health Metrics Today:**\n• Steps: 6,842 / 10,000 (68%)\n• Water: 1.5L / 2.5L (60%)\n• Sleep: 7.2h (Good quality)\n• Heart Rate: 68 bpm (Normal)\n\n🧠 **Mood & Energy:**\nYour energy levels peak around 10am. I've noticed your mood correlates positively with sleep quality.\n\n💡 **Recommendations:**\n1. Take a 15-min walk to reach your step goal\n2. Drink 2 more glasses of water\n3. Consider an earlier bedtime for optimal recovery`;
      suggestions = ['Log activity', 'Track mood', 'Sleep analysis', 'Wellness tips'];
    } else {
      response = `I understand you're asking about "${userMessage}". Here's how I can help:\n\nI can assist you with:\n• 📋 **Task Management** - Organize, prioritize, and track tasks\n• 📅 **Planning** - Schedule optimization and time blocking\n• 🎯 **Goals** - Set, track, and achieve your objectives\n• 💰 **Finance** - Budget tracking and spending insights\n• 🏃 **Habits** - Build routines and maintain streaks\n• ❤️ **Wellness** - Health metrics and recommendations\n\nJust ask naturally, and I'll provide personalized insights based on your data!`;
      suggestions = ['Show my tasks', 'Plan my week', 'Check finances', 'View goals'];
    }

    return {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      suggestions,
    };
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNewChat = () => {
    setMessages(mockMessages);
    setCurrentConversation(null);
  };

  const MessageBubble = ({ message }: { message: Message }) => {
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
            <span className="text-xs text-dark-500">{formatTime(message.timestamp)}</span>
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
              {message.content.split('\n').map((line, i) => (
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
              <button className="p-1.5 rounded-lg hover:bg-dark-700/50 text-dark-400 hover:text-white transition-colors">
                <ThumbsUp className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded-lg hover:bg-dark-700/50 text-dark-400 hover:text-white transition-colors">
                <ThumbsDown className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded-lg hover:bg-dark-700/50 text-dark-400 hover:text-white transition-colors">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Suggestions */}
          {!isUser && message.suggestions && message.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {message.suggestions.map((suggestion, i) => (
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
                {conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => setCurrentConversation(conv.id)}
                    className={cn(
                      'w-full p-3 rounded-xl text-left transition-all group',
                      currentConversation === conv.id
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
                    <div className="flex items-center gap-2 mt-2 text-xs text-dark-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatRelativeTime(conv.timestamp)}</span>
                      <span>•</span>
                      <span>{conv.messageCount} messages</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Sidebar Footer */}
              <div className="p-4 border-t border-dark-700/50">
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-dark-800/50 transition-colors">
                  <Settings className="w-5 h-5 text-dark-400" />
                  <span className="text-sm text-dark-300">AI Settings</span>
                </button>
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

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsListening(!isListening)}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  isListening
                    ? 'bg-neon-cyan/20 text-neon-cyan'
                    : 'hover:bg-dark-700/50 text-dark-400'
                )}
              >
                {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsSpeaking(!isSpeaking)}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  isSpeaking
                    ? 'bg-neon-purple/20 text-neon-purple'
                    : 'hover:bg-dark-700/50 text-dark-400'
                )}
              >
                {isSpeaking ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <button className="p-2 rounded-lg hover:bg-dark-700/50 text-dark-400 transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {messages.length === 1 ? (
              // Welcome state with suggestions
              <div className="h-full flex flex-col items-center justify-center">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center mb-8"
                >
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">How can I help you today?</h2>
                  <p className="text-dark-400">I can assist with tasks, planning, goals, finances, and more.</p>
                </motion.div>

                {/* Suggestion Prompts Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl w-full">
                  {suggestionPrompts.map((prompt, i) => {
                    const Icon = prompt.icon;
                    return (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => handleSend(prompt.prompt)}
                        className="p-4 rounded-xl bg-dark-800/50 border border-dark-700/50 hover:border-neon-cyan/30 text-left transition-all group"
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                          style={{ backgroundColor: `${prompt.color}20` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: prompt.color }} />
                        </div>
                        <p className="font-medium text-white text-sm mb-1">{prompt.label}</p>
                        <p className="text-xs text-dark-500">{prompt.category}</p>
                        <ArrowRight className="w-4 h-4 text-dark-500 group-hover:text-neon-cyan absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all" />
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Messages
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.map(message => (
                  <MessageBubble key={message.id} message={message} />
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-dark-800/50 rounded-2xl px-4 py-3 border border-dark-700/50">
                      <div className="flex gap-1">
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
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
                  disabled={!inputValue.trim() || isTyping}
                  className="px-6"
                >
                  {isTyping ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-dark-500 text-center mt-2">
                NOVA can make mistakes. Consider verifying important information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
