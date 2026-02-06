'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Brain, 
  Zap, 
  Shield,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Intelligence',
    description: 'Contextual understanding that learns your patterns and preferences',
    color: 'neon-cyan',
  },
  {
    icon: Zap,
    title: 'Unified Life OS',
    description: 'One platform for tasks, calendar, notes, habits, wellness, and more',
    color: 'neon-purple',
  },
  {
    icon: Sparkles,
    title: 'Smart Automation',
    description: 'Intelligent suggestions and automatic organization',
    color: 'neon-pink',
  },
  {
    icon: Shield,
    title: 'Private & Secure',
    description: 'Your data stays yours with end-to-end encryption',
    color: 'neon-green',
  },
];

export default function HomePage() {
  const router = useRouter();

  // For now, redirect to dashboard (later this will check auth)
  // useEffect(() => {
  //   router.push('/dashboard');
  // }, [router]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-dark-950">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-neon-cyan/5 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 lg:px-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan to-neon-purple rounded-lg blur opacity-50" />
              <div className="relative bg-dark-900 p-2 rounded-lg">
                <Brain className="w-6 h-6 text-neon-cyan" />
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
              Nexora
            </span>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <Button variant="ghost" size="sm" onClick={() => router.push('/auth/login')}>
              Sign In
            </Button>
            <Button variant="glow" size="sm" onClick={() => router.push('/auth/signup')}>
              Get Started
            </Button>
          </motion.div>
        </header>

        {/* Hero Section */}
        <main className="px-6 lg:px-12 pt-20 pb-32">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              {/* Badge */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-dark-800/50 border border-neon-cyan/20 backdrop-blur-sm"
              >
                <Sparkles className="w-4 h-4 text-neon-cyan animate-pulse" />
                <span className="text-sm text-dark-200">AI-Powered Life Operating System</span>
              </motion.div>

              {/* Heading */}
              <h1 className="text-5xl lg:text-7xl font-bold mb-6 tracking-tight">
                <span className="text-white">Your Life,</span>
                <br />
                <span className="bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto]">
                  Orchestrated by AI
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-xl text-dark-300 max-w-2xl mx-auto mb-10 leading-relaxed">
                Nexora is your intelligent companion that understands you deeply. 
                Manage tasks, calendar, notes, habits, wellness, and finances in one 
                unified AI-powered platform.
              </p>

              {/* CTA Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Button 
                  variant="glow" 
                  size="lg" 
                  onClick={() => router.push('/dashboard')}
                  className="group"
                >
                  Enter Dashboard
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  variant="glass" 
                  size="lg" 
                  onClick={() => router.push('/auth/signup')}
                >
                  Create Account
                </Button>
              </motion.div>
            </motion.div>

            {/* Features Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="group relative p-6 rounded-2xl bg-dark-900/50 border border-dark-700/50 backdrop-blur-sm hover:border-neon-cyan/30 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-neon-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                  
                  <div className={`relative w-12 h-12 mb-4 rounded-xl bg-${feature.color}/10 flex items-center justify-center`}>
                    <feature.icon className={`w-6 h-6 text-${feature.color}`} />
                  </div>
                  
                  <h3 className="relative text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="relative text-sm text-dark-400">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* Dashboard Preview Placeholder */}
            <motion.div 
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="mt-24 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent z-10 pointer-events-none" />
              <div className="relative rounded-2xl overflow-hidden border border-dark-700/50 bg-dark-900/30 backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/5 via-neon-purple/5 to-neon-pink/5" />
                <div className="p-8 lg:p-12">
                  <div className="grid grid-cols-4 gap-4 opacity-60">
                    {/* Placeholder widgets */}
                    {[...Array(8)].map((_, i) => (
                      <div 
                        key={i}
                        className={`h-32 rounded-xl bg-dark-800/50 ${
                          i === 0 || i === 4 ? 'col-span-2' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="absolute bottom-0 left-0 right-0 px-6 py-4 lg:px-12">
          <div className="flex items-center justify-between text-sm text-dark-500">
            <span>© {new Date().getFullYear()} Nexora. All rights reserved.</span>
            <div className="flex items-center gap-6">
              <a href="/privacy" className="hover:text-neon-cyan transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-neon-cyan transition-colors">Terms</a>
              <a href="/help" className="hover:text-neon-cyan transition-colors">Help</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
