'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  ArrowLeft,
  HelpCircle,
  BookOpen,
  MessageCircle,
  Mail,
  ExternalLink,
  Keyboard,
  Zap,
  Shield,
  Settings,
} from 'lucide-react';

export default function HelpPage() {
  const router = useRouter();

  const helpSections = [
    {
      title: 'Getting Started',
      icon: Zap,
      items: [
        { question: 'How do I create my first task?', answer: 'Navigate to the Tasks page and click the "Add Task" button. Fill in the details and click Save.' },
        { question: 'How do I track habits?', answer: 'Go to Habits page, create a new habit, and mark it complete each day. The app tracks your streaks automatically.' },
        { question: 'What is Focus Mode?', answer: 'Focus Mode uses the Pomodoro technique - 25 minutes of focused work followed by a 5-minute break.' },
      ],
    },
    {
      title: 'Features',
      icon: BookOpen,
      items: [
        { question: 'How does the AI Assistant work?', answer: 'The AI uses Google Gemini to provide personalized advice. Set your API key in Settings > AI Settings.' },
        { question: 'Can I connect my Google Calendar?', answer: 'Yes! Go to Settings > Integrations and connect your Google account to sync events.' },
        { question: 'How do I track my wellness?', answer: 'Use the Wellness page to log mood, sleep, exercise, and nutrition. View trends over time.' },
      ],
    },
    {
      title: 'Keyboard Shortcuts',
      icon: Keyboard,
      items: [
        { question: 'Cmd/Ctrl + K', answer: 'Open command palette for quick actions' },
        { question: 'Cmd/Ctrl + N', answer: 'Create new item (context-aware)' },
        { question: 'Cmd/Ctrl + /', answer: 'Toggle sidebar' },
        { question: 'Escape', answer: 'Close modals and panels' },
      ],
    },
    {
      title: 'Privacy & Security',
      icon: Shield,
      items: [
        { question: 'Is my data secure?', answer: 'Yes, all data is stored in Firebase with secure authentication. We never share your personal data.' },
        { question: 'Can I export my data?', answer: 'Yes! Go to Settings → Data & Storage and click "Export All Data" to download all your data as a JSON file.' },
        { question: 'How do I delete my account?', answer: 'Go to Settings → Data & Storage and click "Delete Account" in the Danger Zone section. You will be asked to type DELETE to confirm.' },
      ],
    },
  ];

  return (
    <div className="min-h-screen p-4 lg:p-8 pb-24 lg:pb-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-white/60 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Help Center</h1>
          <p className="text-white/60 mt-2">Find answers to common questions</p>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card
            variant="glass"
            className="p-4 cursor-pointer hover:border-neon-cyan/50 transition-colors"
            onClick={() => router.push('/settings')}
          >
            <Settings className="w-6 h-6 text-neon-cyan mb-2" />
            <h3 className="font-medium text-white">Settings</h3>
            <p className="text-sm text-white/60">Configure your preferences</p>
          </Card>

          <Card
            variant="glass"
            className="p-4 cursor-pointer hover:border-neon-purple/50 transition-colors"
            onClick={() => window.open('https://github.com/arif481/Nexora', '_blank')}
          >
            <ExternalLink className="w-6 h-6 text-neon-purple mb-2" />
            <h3 className="font-medium text-white">GitHub</h3>
            <p className="text-sm text-white/60">View source & report issues</p>
          </Card>

          <Card
            variant="glass"
            className="p-4 cursor-pointer hover:border-neon-pink/50 transition-colors"
            onClick={() => window.open('mailto:support@nexora.app', '_blank')}
          >
            <Mail className="w-6 h-6 text-neon-pink mb-2" />
            <h3 className="font-medium text-white">Contact</h3>
            <p className="text-sm text-white/60">Get in touch with us</p>
          </Card>
        </motion.div>

        {/* FAQ Sections */}
        {helpSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (sectionIndex + 2) }}
          >
            <div className="flex items-center gap-3 mb-4">
              <section.icon className="w-5 h-5 text-neon-cyan" />
              <h2 className="text-lg font-semibold text-white">{section.title}</h2>
            </div>
            <Card variant="glass" className="divide-y divide-glass-border">
              {section.items.map((item, index) => (
                <div key={index} className="p-4">
                  <h3 className="font-medium text-white mb-2">{item.question}</h3>
                  <p className="text-sm text-white/60">{item.answer}</p>
                </div>
              ))}
            </Card>
          </motion.div>
        ))}

        {/* Still Need Help */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card variant="glass" className="p-6 text-center">
            <MessageCircle className="w-8 h-8 text-neon-purple mx-auto mb-3" />
            <h3 className="font-semibold text-white mb-2">Still need help?</h3>
            <p className="text-white/60 text-sm mb-4">
              Can&apos;t find what you&apos;re looking for? Open an issue on GitHub or contact us directly.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://github.com/arif481/Nexora/issues', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Issue
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.open('mailto:support@nexora.app', '_blank')}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email Support
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
