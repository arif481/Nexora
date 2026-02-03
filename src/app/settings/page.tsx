'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Bell,
  Shield,
  Palette,
  Moon,
  Sun,
  Globe,
  Keyboard,
  Database,
  Cloud,
  Download,
  Trash2,
  LogOut,
  ChevronRight,
  Check,
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Link2,
  Github,
  Twitter,
  Linkedin,
  Eye,
  EyeOff,
  Lock,
  Smartphone,
  Monitor,
  Sparkles,
  Brain,
  Zap,
  Volume2,
  VolumeX,
  Clock,
  Target,
  Heart,
  CreditCard,
  HelpCircle,
  MessageSquare,
  FileText,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Info,
  Save,
  Loader2,
} from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useIntegrations, useLinkedAccounts } from '@/hooks/useIntegrations';

type SettingsSection =
  | 'profile'
  | 'appearance'
  | 'notifications'
  | 'privacy'
  | 'ai'
  | 'integrations'
  | 'data'
  | 'about';

interface SettingItem {
  id: string;
  label: string;
  description?: string;
  type: 'toggle' | 'select' | 'input' | 'button' | 'link';
  value?: any;
  options?: { label: string; value: string }[];
  action?: () => void;
}

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [isDirty, setIsDirty] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'ai', label: 'AI Settings', icon: Brain },
    { id: 'integrations', label: 'Integrations', icon: Link2 },
    { id: 'data', label: 'Data & Storage', icon: Database },
    { id: 'about', label: 'About', icon: Info },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSection onDirty={() => setIsDirty(true)} />;
      case 'appearance':
        return <AppearanceSection onDirty={() => setIsDirty(true)} />;
      case 'notifications':
        return <NotificationsSection onDirty={() => setIsDirty(true)} />;
      case 'privacy':
        return <PrivacySection onDirty={() => setIsDirty(true)} />;
      case 'ai':
        return <AISettingsSection onDirty={() => setIsDirty(true)} />;
      case 'integrations':
        return <IntegrationsSection />;
      case 'data':
        return <DataSection />;
      case 'about':
        return <AboutSection />;
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <PageContainer title="Settings" subtitle="Customize your Nexora experience">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <Card variant="glass" className="p-2">
              <nav className="space-y-1">
                {sections.map(section => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;

                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id as SettingsSection)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all',
                        isActive
                          ? 'bg-neon-cyan/20 text-neon-cyan'
                          : 'text-dark-300 hover:bg-dark-800/50 hover:text-white'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{section.label}</span>
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </button>
                  );
                })}
              </nav>

              {/* Danger Zone */}
              <div className="mt-4 pt-4 border-t border-dark-700/50">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-status-error hover:bg-status-error/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </Card>
          </motion.div>

          {/* Content Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3"
          >
            {renderSection()}

            {/* Save Bar */}
            {isDirty && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
              >
                <Card variant="glass" className="px-6 py-3 flex items-center gap-4">
                  <span className="text-sm text-dark-300">You have unsaved changes</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsDirty(false)}>
                      Discard
                    </Button>
                    <Button variant="glow" size="sm" onClick={() => setIsDirty(false)}>
                      <Save className="w-4 h-4 mr-1" />
                      Save Changes
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </div>
      </PageContainer>
    </MainLayout>
  );
}

// Profile Section
function ProfileSection({ onDirty }: { onDirty: () => void }) {
  const [profile, setProfile] = useState({
    name: 'Alex Johnson',
    email: 'alex@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    bio: 'Product designer and developer. Building the future of productivity.',
    timezone: 'America/Los_Angeles',
  });

  const handleChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    onDirty();
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card variant="glass">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <Avatar
                src="/avatar.jpg"
                name={profile.name}
                size="xl"
                className="w-24 h-24"
              />
              <button className="absolute bottom-0 right-0 p-2 rounded-full bg-neon-cyan text-dark-900 hover:bg-neon-cyan/80 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-white">{profile.name}</h2>
              <p className="text-dark-400">{profile.email}</p>
              <Badge variant="cyan" size="sm" className="mt-2">
                Pro Plan
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card variant="glass">
        <CardHeader title="Personal Information" icon={<User className="w-5 h-5 text-neon-cyan" />} />
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={profile.name}
              onChange={e => handleChange('name', e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
            />
            <Input
              label="Email"
              type="email"
              value={profile.email}
              onChange={e => handleChange('email', e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
            />
            <Input
              label="Phone"
              value={profile.phone}
              onChange={e => handleChange('phone', e.target.value)}
              leftIcon={<Phone className="w-4 h-4" />}
            />
            <Input
              label="Location"
              value={profile.location}
              onChange={e => handleChange('location', e.target.value)}
              leftIcon={<MapPin className="w-4 h-4" />}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Bio</label>
            <textarea
              value={profile.bio}
              onChange={e => handleChange('bio', e.target.value)}
              rows={3}
              className={cn(
                'w-full px-4 py-3 rounded-xl text-sm',
                'bg-dark-800/50 border border-dark-700/50',
                'text-white placeholder:text-dark-500',
                'focus:outline-none focus:ring-2 focus:ring-neon-cyan/50'
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <ConnectedAccountsCard />
    </div>
  );
}

// Connected Accounts Component - Shows Google sign-in status
function ConnectedAccountsCard() {
  const { 
    linkedAccounts, 
    loading, 
    isGoogleLinked, 
    connectAccount,
    disconnectAccount 
  } = useLinkedAccounts();

  return (
    <Card variant="glass">
      <CardHeader title="Connected Account" icon={<Link2 className="w-5 h-5 text-neon-purple" />} />
      <CardContent className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-neon-cyan animate-spin" />
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 rounded-xl bg-dark-800/30">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-dark-300" />
              <div>
                <span className="font-medium text-white">Google</span>
                {isGoogleLinked && linkedAccounts.google?.email && (
                  <p className="text-xs text-dark-400">{linkedAccounts.google.email}</p>
                )}
              </div>
            </div>
            {isGoogleLinked ? (
              <Badge variant="green" size="sm">Connected</Badge>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => connectAccount('google')}
              >
                Sign in with Google
              </Button>
            )}
          </div>
        )}
        <p className="text-xs text-dark-500 mt-3">
          Sign in with Google to link your account and access Google Calendar sync.
        </p>
      </CardContent>
    </Card>
  );
}

// Appearance Section
function AppearanceSection({ onDirty }: { onDirty: () => void }) {
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [accentColor, setAccentColor] = useState('#00f0ff');
  const [fontSize, setFontSize] = useState('medium');
  const [compactMode, setCompactMode] = useState(false);
  const [animations, setAnimations] = useState(true);

  const accentColors = [
    { name: 'Cyan', value: '#00f0ff' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Blue', value: '#3b82f6' },
  ];

  return (
    <div className="space-y-6">
      {/* Theme */}
      <Card variant="glass">
        <CardHeader title="Theme" icon={<Palette className="w-5 h-5 text-neon-cyan" />} />
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'system', label: 'System', icon: Monitor },
            ].map(option => (
              <button
                key={option.id}
                onClick={() => {
                  setTheme(option.id as typeof theme);
                  onDirty();
                }}
                className={cn(
                  'p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2',
                  theme === option.id
                    ? 'border-neon-cyan bg-neon-cyan/10'
                    : 'border-dark-700/50 hover:border-dark-600'
                )}
              >
                <option.icon
                  className={cn(
                    'w-6 h-6',
                    theme === option.id ? 'text-neon-cyan' : 'text-dark-400'
                  )}
                />
                <span
                  className={cn(
                    'text-sm font-medium',
                    theme === option.id ? 'text-neon-cyan' : 'text-dark-300'
                  )}
                >
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Accent Color */}
      <Card variant="glass">
        <CardHeader title="Accent Color" icon={<Sparkles className="w-5 h-5 text-neon-purple" />} />
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-3">
            {accentColors.map(color => (
              <button
                key={color.value}
                onClick={() => {
                  setAccentColor(color.value);
                  onDirty();
                }}
                className={cn(
                  'w-12 h-12 rounded-xl transition-all flex items-center justify-center',
                  accentColor === color.value && 'ring-2 ring-white ring-offset-2 ring-offset-dark-900'
                )}
                style={{ backgroundColor: color.value }}
              >
                {accentColor === color.value && <Check className="w-5 h-5 text-white" />}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Display Options */}
      <Card variant="glass">
        <CardHeader title="Display" icon={<Monitor className="w-5 h-5 text-neon-orange" />} />
        <CardContent className="p-6 space-y-4">
          <SettingToggle
            label="Compact Mode"
            description="Reduce spacing and show more content"
            value={compactMode}
            onChange={value => {
              setCompactMode(value);
              onDirty();
            }}
          />
          <SettingToggle
            label="Animations"
            description="Enable smooth transitions and animations"
            value={animations}
            onChange={value => {
              setAnimations(value);
              onDirty();
            }}
          />
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">Font Size</label>
            <div className="flex gap-2">
              {['small', 'medium', 'large'].map(size => (
                <button
                  key={size}
                  onClick={() => {
                    setFontSize(size);
                    onDirty();
                  }}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm capitalize transition-all',
                    fontSize === size
                      ? 'bg-neon-cyan/20 text-neon-cyan'
                      : 'bg-dark-800/50 text-dark-300 hover:text-white'
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Notifications Section
function NotificationsSection({ onDirty }: { onDirty: () => void }) {
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    soundEnabled: true,
    taskReminders: true,
    calendarAlerts: true,
    habitReminders: true,
    focusMode: true,
    aiInsights: true,
    weeklyDigest: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    onDirty();
  };

  return (
    <div className="space-y-6">
      {/* General Notifications */}
      <Card variant="glass">
        <CardHeader title="General" icon={<Bell className="w-5 h-5 text-neon-cyan" />} />
        <CardContent className="p-6 space-y-4">
          <SettingToggle
            label="Push Notifications"
            description="Receive notifications on your device"
            value={settings.pushNotifications}
            onChange={value => updateSetting('pushNotifications', value)}
          />
          <SettingToggle
            label="Email Notifications"
            description="Receive important updates via email"
            value={settings.emailNotifications}
            onChange={value => updateSetting('emailNotifications', value)}
          />
          <SettingToggle
            label="Sound Effects"
            description="Play sounds for notifications"
            value={settings.soundEnabled}
            onChange={value => updateSetting('soundEnabled', value)}
            icon={settings.soundEnabled ? Volume2 : VolumeX}
          />
        </CardContent>
      </Card>

      {/* Feature Notifications */}
      <Card variant="glass">
        <CardHeader title="Feature Notifications" icon={<Zap className="w-5 h-5 text-neon-purple" />} />
        <CardContent className="p-6 space-y-4">
          <SettingToggle
            label="Task Reminders"
            description="Get reminded about upcoming tasks"
            value={settings.taskReminders}
            onChange={value => updateSetting('taskReminders', value)}
          />
          <SettingToggle
            label="Calendar Alerts"
            description="Notifications for events and meetings"
            value={settings.calendarAlerts}
            onChange={value => updateSetting('calendarAlerts', value)}
          />
          <SettingToggle
            label="Habit Reminders"
            description="Daily reminders for your habits"
            value={settings.habitReminders}
            onChange={value => updateSetting('habitReminders', value)}
          />
          <SettingToggle
            label="Focus Mode Alerts"
            description="Notifications when sessions end"
            value={settings.focusMode}
            onChange={value => updateSetting('focusMode', value)}
          />
          <SettingToggle
            label="AI Insights"
            description="Proactive suggestions from AI"
            value={settings.aiInsights}
            onChange={value => updateSetting('aiInsights', value)}
          />
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card variant="glass">
        <CardHeader title="Quiet Hours" icon={<Moon className="w-5 h-5 text-neon-orange" />} />
        <CardContent className="p-6 space-y-4">
          <SettingToggle
            label="Enable Quiet Hours"
            description="Pause notifications during specific hours"
            value={settings.quietHoursEnabled}
            onChange={value => updateSetting('quietHoursEnabled', value)}
          />
          {settings.quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="time"
                label="Start Time"
                value={settings.quietHoursStart}
                onChange={e => updateSetting('quietHoursStart', e.target.value)}
              />
              <Input
                type="time"
                label="End Time"
                value={settings.quietHoursEnd}
                onChange={e => updateSetting('quietHoursEnd', e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Privacy Section
function PrivacySection({ onDirty }: { onDirty: () => void }) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [settings, setSettings] = useState({
    twoFactor: true,
    biometric: false,
    activityTracking: true,
    dataSharing: false,
    publicProfile: false,
  });

  return (
    <div className="space-y-6">
      {/* Security */}
      <Card variant="glass">
        <CardHeader title="Security" icon={<Shield className="w-5 h-5 text-neon-cyan" />} />
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-dark-800/30">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-dark-400" />
              <div>
                <p className="font-medium text-white">Password</p>
                <p className="text-sm text-dark-400">Last changed 30 days ago</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(true)}>
              Change
            </Button>
          </div>
          <SettingToggle
            label="Two-Factor Authentication"
            description="Add an extra layer of security"
            value={settings.twoFactor}
            onChange={value => {
              setSettings(prev => ({ ...prev, twoFactor: value }));
              onDirty();
            }}
          />
          <SettingToggle
            label="Biometric Login"
            description="Use fingerprint or face recognition"
            value={settings.biometric}
            onChange={value => {
              setSettings(prev => ({ ...prev, biometric: value }));
              onDirty();
            }}
          />
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card variant="glass">
        <CardHeader title="Privacy" icon={<Eye className="w-5 h-5 text-neon-purple" />} />
        <CardContent className="p-6 space-y-4">
          <SettingToggle
            label="Activity Tracking"
            description="Track your usage to improve recommendations"
            value={settings.activityTracking}
            onChange={value => {
              setSettings(prev => ({ ...prev, activityTracking: value }));
              onDirty();
            }}
          />
          <SettingToggle
            label="Data Sharing"
            description="Share anonymous data to improve Nexora"
            value={settings.dataSharing}
            onChange={value => {
              setSettings(prev => ({ ...prev, dataSharing: value }));
              onDirty();
            }}
          />
          <SettingToggle
            label="Public Profile"
            description="Allow others to find and view your profile"
            value={settings.publicProfile}
            onChange={value => {
              setSettings(prev => ({ ...prev, publicProfile: value }));
              onDirty();
            }}
          />
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card variant="glass">
        <CardHeader title="Active Sessions" icon={<Smartphone className="w-5 h-5 text-neon-orange" />} />
        <CardContent className="p-6 space-y-3">
          {[
            { device: 'MacBook Pro', location: 'San Francisco, CA', current: true },
            { device: 'iPhone 15 Pro', location: 'San Francisco, CA', current: false },
            { device: 'Chrome on Windows', location: 'New York, NY', current: false },
          ].map((session, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg bg-dark-800/30"
            >
              <div className="flex items-center gap-3">
                <Monitor className="w-5 h-5 text-dark-400" />
                <div>
                  <p className="text-sm font-medium text-white">
                    {session.device}
                    {session.current && (
                      <Badge variant="green" size="sm" className="ml-2">Current</Badge>
                    )}
                  </p>
                  <p className="text-xs text-dark-400">{session.location}</p>
                </div>
              </div>
              {!session.current && (
                <Button variant="ghost" size="sm" className="text-status-error">
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
        size="sm"
      >
        <div className="space-y-4">
          <Input type="password" label="Current Password" placeholder="••••••••" />
          <Input type="password" label="New Password" placeholder="••••••••" />
          <Input type="password" label="Confirm Password" placeholder="••••••••" />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </Button>
            <Button variant="glow" onClick={() => setShowPasswordModal(false)}>
              Update Password
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// AI Settings Section
function AISettingsSection({ onDirty }: { onDirty: () => void }) {
  const [settings, setSettings] = useState({
    aiEnabled: true,
    proactiveInsights: true,
    learningEnabled: true,
    voiceAssistant: false,
    aiTone: 'balanced',
    responseLength: 'medium',
  });

  return (
    <div className="space-y-6">
      {/* AI Features */}
      <Card variant="glass">
        <CardHeader title="AI Features" icon={<Brain className="w-5 h-5 text-neon-cyan" />} />
        <CardContent className="p-6 space-y-4">
          <SettingToggle
            label="AI Assistant"
            description="Enable AI-powered features throughout Nexora"
            value={settings.aiEnabled}
            onChange={value => {
              setSettings(prev => ({ ...prev, aiEnabled: value }));
              onDirty();
            }}
          />
          <SettingToggle
            label="Proactive Insights"
            description="Receive AI suggestions without asking"
            value={settings.proactiveInsights}
            onChange={value => {
              setSettings(prev => ({ ...prev, proactiveInsights: value }));
              onDirty();
            }}
          />
          <SettingToggle
            label="Learning Mode"
            description="Let AI learn from your patterns"
            value={settings.learningEnabled}
            onChange={value => {
              setSettings(prev => ({ ...prev, learningEnabled: value }));
              onDirty();
            }}
          />
          <SettingToggle
            label="Voice Assistant"
            description="Enable voice commands and responses"
            value={settings.voiceAssistant}
            onChange={value => {
              setSettings(prev => ({ ...prev, voiceAssistant: value }));
              onDirty();
            }}
          />
        </CardContent>
      </Card>

      {/* AI Personality */}
      <Card variant="glass">
        <CardHeader title="AI Personality" icon={<Sparkles className="w-5 h-5 text-neon-purple" />} />
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-3">Tone</label>
            <div className="flex gap-2">
              {[
                { id: 'professional', label: 'Professional' },
                { id: 'balanced', label: 'Balanced' },
                { id: 'casual', label: 'Casual' },
              ].map(tone => (
                <button
                  key={tone.id}
                  onClick={() => {
                    setSettings(prev => ({ ...prev, aiTone: tone.id }));
                    onDirty();
                  }}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm transition-all',
                    settings.aiTone === tone.id
                      ? 'bg-neon-cyan/20 text-neon-cyan'
                      : 'bg-dark-800/50 text-dark-300 hover:text-white'
                  )}
                >
                  {tone.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-3">Response Length</label>
            <div className="flex gap-2">
              {[
                { id: 'concise', label: 'Concise' },
                { id: 'medium', label: 'Medium' },
                { id: 'detailed', label: 'Detailed' },
              ].map(length => (
                <button
                  key={length.id}
                  onClick={() => {
                    setSettings(prev => ({ ...prev, responseLength: length.id }));
                    onDirty();
                  }}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm transition-all',
                    settings.responseLength === length.id
                      ? 'bg-neon-cyan/20 text-neon-cyan'
                      : 'bg-dark-800/50 text-dark-300 hover:text-white'
                  )}
                >
                  {length.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Data */}
      <Card variant="glass">
        <CardHeader title="AI Data" icon={<Database className="w-5 h-5 text-neon-orange" />} />
        <CardContent className="p-6">
          <div className="p-4 rounded-xl bg-dark-800/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-dark-400">Trained on</span>
              <span className="text-sm text-white">1,247 interactions</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-dark-400">Last updated</span>
              <span className="text-sm text-white">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-dark-400">Accuracy score</span>
              <span className="text-sm text-neon-green">94%</span>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-1" />
              Retrain
            </Button>
            <Button variant="ghost" size="sm" className="text-status-error">
              <Trash2 className="w-4 h-4 mr-1" />
              Clear AI Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Integrations Section with real data
function IntegrationsSection() {
  const { 
    integrations,
    loading,
    isGoogleCalendarConnected,
    connectGoogleCalendar,
    disconnect,
  } = useIntegrations();
  
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const integrationsList = [
    { 
      name: 'Google Calendar', 
      key: 'googleCalendar' as const,
      icon: Calendar, 
      connected: isGoogleCalendarConnected, 
      description: 'Sync your events with Nexora',
      details: integrations.googleCalendar?.email,
      onConnect: connectGoogleCalendar,
    },
  ];

  const handleDisconnect = async (key: string) => {
    setDisconnecting(key);
    try {
      await disconnect(key as keyof typeof integrations);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card variant="glass">
        <CardHeader title="Connected Apps" icon={<Link2 className="w-5 h-5 text-neon-cyan" />} />
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-neon-cyan animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {integrationsList.map(integration => (
                <div
                  key={integration.name}
                  className="flex items-center justify-between p-4 rounded-xl bg-dark-800/30"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      integration.connected ? "bg-neon-cyan/20" : "bg-dark-700/50"
                    )}>
                      <integration.icon className={cn(
                        "w-5 h-5",
                        integration.connected ? "text-neon-cyan" : "text-dark-300"
                      )} />
                    </div>
                    <div>
                      <p className="font-medium text-white">{integration.name}</p>
                      <p className="text-xs text-dark-400">
                        {integration.connected && integration.details 
                          ? integration.details 
                          : integration.description}
                      </p>
                    </div>
                  </div>
                  {integration.connected ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="green" size="sm">Connected</Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDisconnect(integration.key)}
                        disabled={disconnecting === integration.key}
                      >
                        {disconnecting === integration.key ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Disconnect'
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={integration.onConnect}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader title="API Access" icon={<Keyboard className="w-5 h-5 text-neon-purple" />} />
        <CardContent className="p-6">
          <div className="p-4 rounded-xl bg-dark-800/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-dark-400">API Key</span>
              <Button variant="ghost" size="sm">
                <Eye className="w-4 h-4 mr-1" />
                Reveal
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-lg bg-dark-900 text-neon-cyan font-mono text-sm">
                nx_••••••••••••••••••••
              </code>
              <Button variant="outline" size="sm">Copy</Button>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-1" />
              Regenerate
            </Button>
            <Button variant="ghost" size="sm">
              <ExternalLink className="w-4 h-4 mr-1" />
              API Docs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Data Section
function DataSection() {
  return (
    <div className="space-y-6">
      {/* Storage */}
      <Card variant="glass">
        <CardHeader title="Storage" icon={<Cloud className="w-5 h-5 text-neon-cyan" />} />
        <CardContent className="p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-dark-400">Used Storage</span>
              <span className="text-sm text-white">2.4 GB of 10 GB</span>
            </div>
            <div className="h-3 bg-dark-800 rounded-full overflow-hidden">
              <div className="h-full w-[24%] bg-gradient-to-r from-neon-cyan to-neon-purple rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Notes', size: '1.2 GB', color: '#00f0ff' },
              { label: 'Attachments', size: '800 MB', color: '#a855f7' },
              { label: 'Journal', size: '300 MB', color: '#f97316' },
              { label: 'Other', size: '100 MB', color: '#22c55e' },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-lg bg-dark-800/30 text-center">
                <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: item.color }} />
                <p className="text-sm font-medium text-white">{item.size}</p>
                <p className="text-xs text-dark-400">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Data */}
      <Card variant="glass">
        <CardHeader title="Export Data" icon={<Download className="w-5 h-5 text-neon-purple" />} />
        <CardContent className="p-6">
          <p className="text-sm text-dark-400 mb-4">
            Download all your data in a portable format. This includes tasks, notes, journal entries, and settings.
          </p>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-1" />
              Export as JSON
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-1" />
              Export as CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card variant="glass" className="border-status-error/30">
        <CardHeader
          title="Danger Zone"
          icon={<AlertTriangle className="w-5 h-5 text-status-error" />}
        />
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-status-error/10 border border-status-error/20">
            <div>
              <p className="font-medium text-white">Clear All Data</p>
              <p className="text-sm text-dark-400">Delete all your local data</p>
            </div>
            <Button variant="outline" size="sm" className="border-status-error text-status-error">
              Clear
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-status-error/10 border border-status-error/20">
            <div>
              <p className="font-medium text-white">Delete Account</p>
              <p className="text-sm text-dark-400">Permanently delete your account and all data</p>
            </div>
            <Button variant="outline" size="sm" className="border-status-error text-status-error">
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// About Section
function AboutSection() {
  return (
    <div className="space-y-6">
      {/* App Info */}
      <Card variant="glass">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-purple mx-auto mb-4 flex items-center justify-center">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Nexora</h2>
          <p className="text-dark-400 mb-4">Your AI-Powered Life Operating System</p>
          <Badge variant="cyan">Version 1.0.0</Badge>
        </CardContent>
      </Card>

      {/* Links */}
      <Card variant="glass">
        <CardHeader title="Resources" icon={<HelpCircle className="w-5 h-5 text-neon-cyan" />} />
        <CardContent className="p-6 space-y-2">
          {[
            { label: 'Documentation', icon: FileText },
            { label: 'Support Center', icon: MessageSquare },
            { label: 'Privacy Policy', icon: Shield },
            { label: 'Terms of Service', icon: FileText },
            { label: 'Changelog', icon: RefreshCw },
          ].map(link => (
            <button
              key={link.label}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-dark-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <link.icon className="w-5 h-5 text-dark-400" />
                <span className="text-white">{link.label}</span>
              </div>
              <ExternalLink className="w-4 h-4 text-dark-500" />
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Credits */}
      <Card variant="glass">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-dark-400">
            Made with 💜 by the Nexora Team
          </p>
          <p className="text-xs text-dark-500 mt-2">
            © 2024 Nexora. All rights reserved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Setting Toggle Component
function SettingToggle({
  label,
  description,
  value,
  onChange,
  icon: Icon,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  icon?: any;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-5 h-5 text-dark-400" />}
        <div>
          <p className="font-medium text-white">{label}</p>
          {description && <p className="text-sm text-dark-400">{description}</p>}
        </div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          'w-12 h-6 rounded-full transition-colors relative',
          value ? 'bg-neon-cyan' : 'bg-dark-700'
        )}
      >
        <div
          className={cn(
            'w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform',
            value ? 'translate-x-6' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}
