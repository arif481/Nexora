'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import {
  X,
  Sparkles,
  Send,
  Mic,
  Paperclip,
  Minimize2,
  Maximize2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Zap,
  Brain,
  Lightbulb,
  Bot,
  User,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { AIThinkingAnimation } from '../ui/Loading';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

const quickActions = [
  { label: 'Plan my day', icon: Zap },
  { label: 'Analyze my habits', icon: Brain },
  { label: 'Suggest focus time', icon: Lightbulb },
];

const initialMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Hello! I'm Nexora, your AI assistant. I'm here to help you stay organized, productive, and balanced. How can I assist you today?",
    timestamp: new Date(),
    suggestions: ['Plan my day', 'What are my priorities?', 'How am I doing this week?'],
  },
];

export function AIAssistantPanel() {
  const { aiPanelOpen, toggleAIPanel, aiMinimized, setAIMinimized } = useUIStore();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    // Simulate AI response (in real app, call AI API)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getAIResponse(input.trim()),
        timestamp: new Date(),
        suggestions: ['Tell me more', 'What else?', 'Show my tasks'],
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsThinking(false);
    }, 1500);
  };

  const getAIResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('plan') || lowerQuery.includes('day')) {
      return "Based on your schedule and energy patterns, here's my suggested plan for today:\n\n🌅 **Morning (High Energy)**\n• 9:00 AM - Deep work on project proposal\n• 11:00 AM - Team standup\n\n☀️ **Afternoon (Medium Energy)**\n• 1:00 PM - Review and respond to emails\n• 3:00 PM - Research task\n\n🌙 **Evening (Recovery)**\n• 5:00 PM - Light admin work\n• 6:00 PM - Journal reflection\n\nWould you like me to create these as calendar blocks?";
    }
    
    if (lowerQuery.includes('priority') || lowerQuery.includes('important')) {
      return "Looking at your tasks and deadlines, here are your top priorities:\n\n🔴 **Critical**\n• Complete project proposal (Due: Today)\n\n🟠 **High Priority**\n• Review budget report (Due: Tomorrow)\n• Prepare presentation slides (Due: Friday)\n\n🟡 **Medium Priority**\n• Update documentation\n• Schedule team meeting\n\nYour project proposal is most urgent. Would you like me to help break it down into smaller steps?";
    }

    if (lowerQuery.includes('habit') || lowerQuery.includes('analyze')) {
      return "Here's your habit analysis for this week:\n\n✅ **Strong Performance**\n• Morning meditation: 6/7 days (86%)\n• Reading: 5/7 days (71%)\n\n⚠️ **Needs Attention**\n• Exercise: 3/7 days (43%)\n• Sleep schedule: Irregular patterns detected\n\n💡 **Insight**: Your exercise habit tends to drop on busy workdays. Consider scheduling shorter 15-min sessions on those days.\n\nWould you like personalized suggestions to improve your exercise consistency?";
    }

    return "I understand you're asking about that. Based on my analysis of your patterns and data, I can provide insights tailored to your needs. Could you tell me a bit more about what specific aspect you'd like me to focus on? I can help with:\n\n• Task planning and prioritization\n• Habit tracking and improvement\n• Schedule optimization\n• Wellness recommendations\n• Learning and study planning";
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
    inputRef.current?.focus();
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
    handleSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {aiPanelOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
            height: aiMinimized ? 'auto' : '600px',
          }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-50',
            'w-[calc(100%-2rem)] max-w-md',
            'backdrop-blur-2xl bg-dark-200/95 border border-glass-border rounded-2xl',
            'shadow-glass-lg flex flex-col overflow-hidden'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-glass-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Nexora AI</h3>
                <p className="text-xs text-white/40">Your personal assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setAIMinimized(!aiMinimized)}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-glass-medium transition-colors"
              >
                {aiMinimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={toggleAIPanel}
                className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-glass-medium transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!aiMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    )}
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        message.role === 'user'
                          ? 'bg-neon-cyan/20 text-neon-cyan'
                          : 'bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 text-neon-purple'
                      )}
                    >
                      {message.role === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div
                      className={cn(
                        'flex-1 max-w-[85%]',
                        message.role === 'user' ? 'text-right' : ''
                      )}
                    >
                      <div
                        className={cn(
                          'inline-block p-3 rounded-2xl text-sm',
                          message.role === 'user'
                            ? 'bg-neon-cyan/10 text-white rounded-tr-none'
                            : 'bg-glass-medium text-white/90 rounded-tl-none'
                        )}
                      >
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      </div>

                      {/* Suggestions */}
                      {message.role === 'assistant' && message.suggestions && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {message.suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestion(suggestion)}
                              className="px-3 py-1.5 rounded-full text-xs bg-glass-light border border-glass-border text-white/60 hover:text-white hover:border-neon-cyan/30 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Actions for AI messages */}
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mt-2">
                          <button className="p-1 rounded text-white/30 hover:text-white/60 transition-colors">
                            <Copy className="w-3 h-3" />
                          </button>
                          <button className="p-1 rounded text-white/30 hover:text-neon-green transition-colors">
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button className="p-1 rounded text-white/30 hover:text-neon-red transition-colors">
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                          <button className="p-1 rounded text-white/30 hover:text-white/60 transition-colors">
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Thinking indicator */}
                {isThinking && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-neon-purple" />
                    </div>
                    <div className="p-3 rounded-2xl rounded-tl-none bg-glass-medium">
                      <AIThinkingAnimation />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions */}
              {messages.length === 1 && (
                <div className="px-4 pb-2">
                  <p className="text-xs text-white/40 mb-2">Quick actions</p>
                  <div className="flex flex-wrap gap-2">
                    {quickActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickAction(action.label)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-glass-light border border-glass-border text-sm text-white/70 hover:text-white hover:border-neon-purple/30 transition-colors"
                      >
                        <action.icon className="w-4 h-4" />
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-glass-border">
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask me anything..."
                      rows={1}
                      className={cn(
                        'w-full px-4 py-3 pr-20 rounded-xl resize-none',
                        'bg-glass-light border border-glass-border',
                        'text-white placeholder-white/40',
                        'focus:outline-none focus:border-neon-purple/50',
                        'transition-colors'
                      )}
                      style={{ maxHeight: '120px' }}
                    />
                    <div className="absolute right-2 bottom-2 flex items-center gap-1">
                      <button className="p-1.5 rounded-lg text-white/40 hover:text-white/60 transition-colors">
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg text-white/40 hover:text-white/60 transition-colors">
                        <Mic className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleSend}
                    disabled={!input.trim() || isThinking}
                    className="h-12 w-12"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Floating AI Button */}
      {!aiPanelOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleAIPanel}
          className={cn(
            'fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-50',
            'w-14 h-14 rounded-2xl',
            'bg-gradient-to-br from-neon-purple to-neon-pink',
            'flex items-center justify-center',
            'shadow-glow-purple',
            'transition-shadow hover:shadow-lg'
          )}
        >
          <Sparkles className="w-6 h-6 text-white" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
