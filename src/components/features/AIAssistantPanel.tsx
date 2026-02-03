'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { useSimpleAI } from '@/hooks/useAI';
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

const quickActions = [
  { label: 'Plan my day', icon: Zap },
  { label: 'Analyze my habits', icon: Brain },
  { label: 'Suggest focus time', icon: Lightbulb },
];

export function AIAssistantPanel() {
  const { aiPanelOpen, toggleAIPanel, aiMinimized, setAIMinimized } = useUIStore();
  const { messages, isThinking, sendMessage, clearMessages } = useSimpleAI();
  const [input, setInput] = useState('');
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
    const messageContent = input.trim();
    setInput('');
    await sendMessage(messageContent);
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
    inputRef.current?.focus();
  };

  const handleSuggestion = async (suggestion: string) => {
    await sendMessage(suggestion);
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
