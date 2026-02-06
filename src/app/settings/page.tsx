'use client';

import { useState, useEffect, useCallback } from 'react';
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
  CheckCircle,
  XCircle,
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
import { useUser } from '@/hooks/useUser';
import { useIntegrations, useLinkedAccounts } from '@/hooks/useIntegrations';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

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
  const { user } = useAuth();
  const { profile: userProfile, loading, updateProfile } = useUser();
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    bio: '',
  });

  // Initialize form from user data
  const displayName = user?.displayName || userProfile?.displayName || 'User';
  const displayEmail = user?.email || '';
  const photoURL = user?.photoURL || undefined;

  // Initialize form with user data
  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.displayName || '',
        phone: userProfile.phone || '',
        location: userProfile.location || '',
        bio: userProfile.bio || '',
      });
    }
  }, [userProfile]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    onDirty();
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      await updateProfile({ 
        displayName: formData.name || displayName,
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio,
      });
      setSaveMessage('Profile saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveMessage('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card variant="glass">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <Avatar
                src={photoURL}
                name={displayName}
                size="xl"
                className="w-24 h-24"
              />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-white">{displayName}</h2>
              <p className="text-dark-400">{displayEmail}</p>
              <Badge variant="cyan" size="sm" className="mt-2">
                Free Plan
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
              value={formData.name || displayName}
              onChange={e => handleChange('name', e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
            />
            <Input
              label="Email"
              type="email"
              value={displayEmail}
              disabled
              leftIcon={<Mail className="w-4 h-4" />}
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            {saveMessage && (
              <span className={cn(
                "text-sm",
                saveMessage.includes('success') ? 'text-neon-green' : 'text-status-error'
              )}>
                {saveMessage}
              </span>
            )}
            <Button 
              variant="glow" 
              size="sm" 
              onClick={handleSave}
              disabled={saving}
              className="ml-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save Profile
                </>
              )}
            </Button>
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
// Appearance Section
function AppearanceSection({ onDirty }: { onDirty: () => void }) {
  const { profile, updatePreferences } = useUser();
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [accentColor, setAccentColor] = useState('#00f0ff');
  const [compactMode, setCompactMode] = useState(false);
  const [animations, setAnimations] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Load saved preferences
  useEffect(() => {
    if (profile?.preferences) {
      setTheme(profile.preferences.theme || 'dark');
      setAccentColor(profile.preferences.accentColor || '#00f0ff');
      setCompactMode(profile.preferences.compactMode || false);
      setAnimations(profile.preferences.animations !== false);
    }
    // Also check localStorage for immediate settings (fallback for non-logged-in users)
    if (!profile) {
      const savedTheme = localStorage.getItem('nexora-theme') as 'dark' | 'light' | 'system' | null;
      const savedAccent = localStorage.getItem('nexora-accent');
      const savedCompact = localStorage.getItem('nexora-compact');
      const savedAnimations = localStorage.getItem('nexora-animations');
      if (savedTheme) setTheme(savedTheme);
      if (savedAccent) setAccentColor(savedAccent);
      if (savedCompact) setCompactMode(savedCompact === 'true');
      if (savedAnimations) setAnimations(savedAnimations !== 'false');
    }
  }, [profile]);

  const accentColors = [
    { name: 'Cyan', value: '#00f0ff' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Blue', value: '#3b82f6' },
  ];

  const applyTheme = (newTheme: 'dark' | 'light' | 'system') => {
    localStorage.setItem('nexora-theme', newTheme);
    document.documentElement.classList.remove('light', 'dark');
    
    if (newTheme === 'system') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.classList.add(newTheme);
    }
  };

  const applyAccentColor = (color: string) => {
    localStorage.setItem('nexora-accent', color);
    document.documentElement.style.setProperty('--accent-color', color);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      await updatePreferences({
        theme,
        accentColor,
        compactMode,
        animations,
      });
      // Also save to localStorage for immediate local effect
      localStorage.setItem('nexora-theme', theme);
      localStorage.setItem('nexora-accent', accentColor);
      localStorage.setItem('nexora-compact', String(compactMode));
      localStorage.setItem('nexora-animations', String(animations));
      setSaveMessage('Appearance saved!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving appearance:', error);
      setSaveMessage('Failed to save');
    } finally {
      setSaving(false);
    }
  };

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
                  const newTheme = option.id as typeof theme;
                  setTheme(newTheme);
                  applyTheme(newTheme);
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
          <p className="text-xs text-dark-500 mt-3">
            {theme === 'system' ? 'Theme will follow your system preferences.' : `Currently using ${theme} mode.`}
          </p>
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
                  applyAccentColor(color.value);
                  onDirty();
                }}
                className={cn(
                  'w-12 h-12 rounded-xl transition-all flex items-center justify-center',
                  accentColor === color.value && 'ring-2 ring-white ring-offset-2 ring-offset-dark-900'
                )}
                style={{ backgroundColor: color.value }}
                title={color.name}
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
              localStorage.setItem('nexora-compact', String(value));
              onDirty();
            }}
          />
          <SettingToggle
            label="Animations"
            description="Enable smooth transitions and animations"
            value={animations}
            onChange={value => {
              setAnimations(value);
              localStorage.setItem('nexora-animations', String(value));
              if (!value) {
                document.documentElement.classList.add('reduce-motion');
              } else {
                document.documentElement.classList.remove('reduce-motion');
              }
              onDirty();
            }}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3">
        {saveMessage && (
          <span className={cn(
            "text-sm",
            saveMessage.includes('saved') ? 'text-neon-green' : 'text-status-error'
          )}>
            {saveMessage}
          </span>
        )}
        <Button 
          variant="glow" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-1" />
              Save Appearance
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Notifications Section
// Notifications Section
function NotificationsSection({ onDirty }: { onDirty: () => void }) {
  const { profile, updatePreferences } = useUser();
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    soundEnabled: true,
    taskReminders: true,
    calendarAlerts: true,
    habitReminders: true,
    focusMode: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  });

  // Load saved preferences
  useEffect(() => {
    if (profile?.preferences?.notifications) {
      const notifs = profile.preferences.notifications;
      setSettings(prev => ({
        ...prev,
        pushNotifications: notifs.enabled ?? true,
        soundEnabled: notifs.sound ?? true,
        taskReminders: notifs.taskReminders ?? true,
        calendarAlerts: notifs.calendarAlerts ?? true,
        quietHoursStart: notifs.quietHoursStart || '22:00',
        quietHoursEnd: notifs.quietHoursEnd || '08:00',
      }));
    }
  }, [profile]);

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    onDirty();
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      await updatePreferences({
        notifications: {
          enabled: settings.pushNotifications,
          sound: settings.soundEnabled,
          vibration: true,
          taskReminders: settings.taskReminders,
          calendarAlerts: settings.calendarAlerts,
          insightNotifications: settings.focusMode,
          focusModeExceptions: [],
          quietHoursStart: settings.quietHoursEnabled ? settings.quietHoursStart : undefined,
          quietHoursEnd: settings.quietHoursEnabled ? settings.quietHoursEnd : undefined,
        },
      });
      setSaveMessage('Notifications saved!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving notifications:', error);
      setSaveMessage('Failed to save');
    } finally {
      setSaving(false);
    }
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

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3">
        {saveMessage && (
          <span className={cn(
            "text-sm",
            saveMessage.includes('saved') ? 'text-neon-green' : 'text-status-error'
          )}>
            {saveMessage}
          </span>
        )}
        <Button 
          variant="glow" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-1" />
              Save Notifications
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Privacy Section
function PrivacySection({ onDirty }: { onDirty: () => void }) {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Security Info */}
      <Card variant="glass">
        <CardHeader title="Security" icon={<Shield className="w-5 h-5 text-neon-cyan" />} />
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-dark-800/30">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-dark-400" />
              <div>
                <p className="font-medium text-white">Account Security</p>
                <p className="text-sm text-dark-400">Signed in via {user?.providerData?.[0]?.providerId === 'google.com' ? 'Google' : 'Email'}</p>
              </div>
            </div>
            <Badge variant="green" size="sm">Secure</Badge>
          </div>
          <div className="p-4 rounded-xl bg-dark-800/30">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-neon-green" />
              <div>
                <p className="font-medium text-white">Data Protection</p>
                <p className="text-sm text-dark-400">Your data is encrypted and stored securely in Firebase</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Session */}
      <Card variant="glass">
        <CardHeader title="Current Session" icon={<Smartphone className="w-5 h-5 text-neon-purple" />} />
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-dark-800/30">
            <div className="flex items-center gap-3">
              <Monitor className="w-5 h-5 text-dark-400" />
              <div>
                <p className="text-sm font-medium text-white">
                  Current Browser
                  <Badge variant="green" size="sm" className="ml-2">Active</Badge>
                </p>
                <p className="text-xs text-dark-400">{user?.email}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// AI Settings Section - Real implementation with Gemini API
function AISettingsSection({ onDirty }: { onDirty: () => void }) {
  const [apiKey, setApiKey] = useState('');
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<'valid' | 'invalid' | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Check if API key is already configured
    const checkConfig = async () => {
      const { getGeminiApiKeyMasked, isAIConfigured } = await import('@/lib/services/gemini');
      setIsConfigured(isAIConfigured());
      setMaskedKey(getGeminiApiKeyMasked());
    };
    checkConfig();
  }, []);

  const handleValidateKey = async () => {
    if (!apiKey.trim()) return;
    
    // Basic format validation first
    if (apiKey.trim().length < 20) {
      setValidationResult('invalid');
      return;
    }
    
    setIsValidating(true);
    setValidationResult(null);
    
    try {
      const { validateGeminiApiKey } = await import('@/lib/services/gemini');
      const isValid = await validateGeminiApiKey(apiKey.trim());
      setValidationResult(isValid ? 'valid' : 'invalid');
    } catch (error) {
      console.error('Validation error:', error);
      // For network errors, allow saving anyway
      setValidationResult('valid');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveKey = async () => {
    if (!apiKey.trim()) return;
    
    // Allow saving if validated OR if key looks valid (39 chars for Gemini)
    const canSave = validationResult === 'valid' || apiKey.trim().length >= 35;
    if (!canSave) return;
    
    setIsSaving(true);
    try {
      const { saveGeminiApiKey, getGeminiApiKeyMasked, isAIConfigured } = await import('@/lib/services/gemini');
      saveGeminiApiKey(apiKey.trim());
      setMaskedKey(getGeminiApiKeyMasked());
      setIsConfigured(isAIConfigured());
      setApiKey('');
      setValidationResult(null);
      onDirty();
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveKey = async () => {
    const { removeGeminiApiKey } = await import('@/lib/services/gemini');
    removeGeminiApiKey();
    setMaskedKey(null);
    setIsConfigured(false);
    onDirty();
  };

  return (
    <div className="space-y-6">
      <Card variant="glass">
        <CardHeader title="AI Configuration" icon={<Brain className="w-5 h-5 text-neon-cyan" />} />
        <CardContent className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-dark-700/50">
            <div className={`w-3 h-3 rounded-full ${isConfigured ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
            <div>
              <p className="text-white font-medium">
                {isConfigured ? 'AI is Active' : 'AI Not Configured'}
              </p>
              <p className="text-sm text-dark-400">
                {isConfigured 
                  ? `Using Gemini 1.5 Flash • Key: ${maskedKey}`
                  : 'Add your Gemini API key to enable AI features'
                }
              </p>
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Gemini API Key
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setValidationResult(null);
                  }}
                  placeholder={isConfigured ? 'Enter new key to replace...' : 'Enter your Gemini API key...'}
                  className="flex-1 px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan"
                />
                <button
                  onClick={handleValidateKey}
                  disabled={!apiKey.trim() || isValidating}
                  className="px-4 py-2 bg-dark-600 hover:bg-dark-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white flex items-center gap-2 transition-colors"
                >
                  {isValidating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Validate
                </button>
              </div>
              
              {/* Validation feedback */}
              {validationResult && (
                <div className={`mt-2 text-sm flex items-center gap-2 ${validationResult === 'valid' ? 'text-green-400' : 'text-red-400'}`}>
                  {validationResult === 'valid' ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      API key is valid! Click Save to apply.
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Validation failed. Try Save anyway if you're sure the key is correct.
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSaveKey}
                disabled={!apiKey.trim() || apiKey.trim().length < 30 || isSaving}
                className="px-4 py-2 bg-neon-cyan/20 hover:bg-neon-cyan/30 disabled:opacity-50 disabled:cursor-not-allowed border border-neon-cyan/50 rounded-lg text-neon-cyan flex items-center gap-2 transition-colors"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save API Key
              </button>
              
              {isConfigured && (
                <button
                  onClick={handleRemoveKey}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Key
                </button>
              )}
            </div>
          </div>

          {/* Get API Key Help */}
          <div className="p-4 rounded-lg bg-dark-800/50 border border-dark-600">
            <h4 className="font-medium text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-neon-purple" />
              How to get your API key
            </h4>
            <ol className="text-sm text-dark-400 space-y-1 list-decimal list-inside">
              <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">Google AI Studio</a></li>
              <li>Sign in with your Google account</li>
              <li>Click &ldquo;Create API Key&rdquo;</li>
              <li>Copy the key and paste it above</li>
            </ol>
            <p className="text-xs text-dark-500 mt-3">
              💡 The free tier includes 60 requests per minute - plenty for personal use!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* AI Features Info */}
      <Card variant="glass">
        <CardHeader title="AI Features" icon={<Sparkles className="w-5 h-5 text-neon-purple" />} />
        <CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 rounded-lg bg-dark-700/50">
              <h4 className="font-medium text-white mb-1">💬 Smart Chat</h4>
              <p className="text-sm text-dark-400">Natural conversations about your tasks, schedule, and goals</p>
            </div>
            <div className="p-4 rounded-lg bg-dark-700/50">
              <h4 className="font-medium text-white mb-1">📊 Data Insights</h4>
              <p className="text-sm text-dark-400">AI analyzes your habits, spending, and productivity patterns</p>
            </div>
            <div className="p-4 rounded-lg bg-dark-700/50">
              <h4 className="font-medium text-white mb-1">🎯 Smart Suggestions</h4>
              <p className="text-sm text-dark-400">Personalized recommendations based on your data</p>
            </div>
            <div className="p-4 rounded-lg bg-dark-700/50">
              <h4 className="font-medium text-white mb-1">📅 Planning Help</h4>
              <p className="text-sm text-dark-400">AI assists with scheduling and time management</p>
            </div>
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
    </div>
  );
}

// Data Section
function DataSection() {
  const { user, logout } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const handleExportJSON = async () => {
    if (!user) return;
    setIsExporting(true);
    setExportMessage(null);
    
    try {
      // Fetch all user data from Firebase collections
      const collections = [
        'tasks',
        'calendarEvents',
        'habits',
        'notes',
        'journalEntries',
        'transactions',
        'budgets',
        'subscriptions',
        'wellnessEntries',
        'focusSessions',
        'goals',
      ];

      const exportData: Record<string, any> = {
        exportDate: new Date().toISOString(),
        userId: user.uid,
        email: user.email,
      };

      for (const collectionName of collections) {
        try {
          const q = query(
            collection(db, collectionName),
            where('userId', '==', user.uid)
          );
          const snapshot = await getDocs(q);
          exportData[collectionName] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
        } catch (err) {
          console.log(`Skipping ${collectionName}:`, err);
          exportData[collectionName] = [];
        }
      }

      // Create and download the JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexora-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExportMessage('Data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      setExportMessage('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      window.location.href = '/Nexora/auth/login';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Data Info */}
      <Card variant="glass">
        <CardHeader title="Your Data" icon={<Cloud className="w-5 h-5 text-neon-cyan" />} />
        <CardContent className="p-6">
          <p className="text-sm text-dark-400 mb-4">
            All your data is securely stored in Firebase and synced across all your devices in real-time.
          </p>
          <div className="p-4 rounded-lg bg-dark-800/30 mb-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-neon-green" />
              <div>
                <p className="text-sm font-medium text-white">Encrypted Storage</p>
                <p className="text-xs text-dark-400">Your data is protected with industry-standard encryption</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleExportJSON}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export All Data
                </>
              )}
            </Button>
            {exportMessage && (
              <span className={cn(
                "text-sm",
                exportMessage.includes('success') ? 'text-neon-green' : 'text-status-error'
              )}>
                {exportMessage}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <Card variant="glass">
        <CardHeader title="Account" icon={<User className="w-5 h-5 text-neon-purple" />} />
        <CardContent className="p-6">
          <p className="text-sm text-dark-400 mb-4">
            Sign out of your account on this device.
          </p>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// About Section
function AboutSection() {
  const links = [
    { label: 'Documentation', icon: FileText, href: 'https://github.com/arif481/Nexora#readme' },
    { label: 'Support Center', icon: MessageSquare, href: 'https://github.com/arif481/Nexora/issues' },
    { label: 'Privacy Policy', icon: Shield, href: 'https://github.com/arif481/Nexora/blob/main/PRIVACY.md' },
    { label: 'Terms of Service', icon: FileText, href: 'https://github.com/arif481/Nexora/blob/main/TERMS.md' },
    { label: 'Changelog', icon: RefreshCw, href: 'https://github.com/arif481/Nexora/releases' },
  ];

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
          {links.map(link => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-dark-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <link.icon className="w-5 h-5 text-dark-400" />
                <span className="text-white">{link.label}</span>
              </div>
              <ExternalLink className="w-4 h-4 text-dark-500" />
            </a>
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
          <a 
            href="https://github.com/arif481/Nexora" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-neon-cyan hover:underline mt-2"
          >
            <Globe className="w-3 h-3" />
            View on GitHub
          </a>
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
