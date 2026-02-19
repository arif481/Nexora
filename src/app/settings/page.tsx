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
  Apple,
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
import { useAutoSync } from '@/hooks/useAutoSync';
import type { GenderIdentity } from '@/types';
import { db } from '@/lib/firebase';
import { collection, getDoc, getDocs, query, where, doc } from 'firebase/firestore';
import type { IntegrationKey } from '@/lib/services/integrations';
import {
  COMMON_CURRENCIES,
  COMMON_TIMEZONES,
  COUNTRY_OPTIONS,
  getCountryPreference,
} from '@/lib/constants/regional';

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
  const { profile: userProfile, updateProfile, updatePreferences } = useUser();
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    gender: 'prefer-not-to-say' as GenderIdentity,
    phone: '',
    location: '',
    bio: '',
    country: 'US',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    currency: 'USD',
  });

  // Initialize form from user data
  const displayName = user?.displayName || userProfile?.displayName || 'User';
  const displayEmail = user?.email || '';
  const photoURL = user?.photoURL || undefined;

  // Initialize form with user data
  useEffect(() => {
    if (userProfile) {
      const preferredCountry = getCountryPreference(userProfile.preferences?.country);
      setFormData({
        name: userProfile.displayName || '',
        gender: userProfile.gender || 'prefer-not-to-say',
        phone: userProfile.phone || '',
        location: userProfile.location || '',
        bio: userProfile.bio || '',
        country: preferredCountry.code,
        timezone: userProfile.preferences?.timezone || preferredCountry.timezone,
        currency: userProfile.preferences?.currency || preferredCountry.currency,
      });
    }
  }, [userProfile]);

  const handleChange = <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    onDirty();
  };

  const handleCountryChange = (countryCode: string) => {
    const country = getCountryPreference(countryCode);
    setFormData(prev => ({
      ...prev,
      country: country.code,
      timezone: country.timezone,
      currency: country.currency,
    }));
    onDirty();
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      await Promise.all([
        updateProfile({
          displayName: formData.name || displayName,
          gender: formData.gender,
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio,
        }),
        updatePreferences({
          country: formData.country,
          timezone: formData.timezone,
          currency: formData.currency,
        }),
      ]);
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
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Gender</label>
            <select
              value={formData.gender}
              onChange={e => handleChange('gender', e.target.value as GenderIdentity)}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white focus:border-neon-cyan outline-none"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non-binary">Non-binary</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
            <p className="text-xs text-dark-500 mt-1">
              Period tracker is available in Wellness when Female is selected.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Country</label>
            <select
              value={formData.country}
              onChange={e => handleCountryChange(e.target.value)}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white focus:border-neon-cyan outline-none"
            >
              {COUNTRY_OPTIONS.map(option => (
                <option key={option.code} value={option.code}>
                  {option.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-dark-500 mt-1">
              Used for timezone defaults, local holidays, and regional insights.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Timezone</label>
            <select
              value={formData.timezone}
              onChange={e => handleChange('timezone', e.target.value)}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white focus:border-neon-cyan outline-none"
            >
              {COMMON_TIMEZONES.map(timezone => (
                <option key={timezone} value={timezone}>
                  {timezone}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Currency</label>
            <select
              value={formData.currency}
              onChange={e => handleChange('currency', e.target.value)}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white focus:border-neon-cyan outline-none"
            >
              {COMMON_CURRENCIES.map(currencyCode => (
                <option key={currencyCode} value={currencyCode}>
                  {currencyCode}
                </option>
              ))}
            </select>
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
  const { profile, updatePreferences } = useUser();
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [privacySettings, setPrivacySettings] = useState({
    analyticsEnabled: true,
    dataCollection: true,
    localStorageOnly: false,
    encryptionEnabled: true,
  });

  useEffect(() => {
    const stored = profile?.preferences?.privacy;
    if (!stored) return;
    setPrivacySettings(prev => ({ ...prev, ...stored }));
  }, [profile]);

  const updateSetting = (key: keyof typeof privacySettings, value: boolean) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
    onDirty();
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      await updatePreferences({ privacy: privacySettings });
      setSaveMsg('Privacy settings saved.');
      setTimeout(() => setSaveMsg(null), 3000);
    } catch {
      setSaveMsg('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

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

      {/* Privacy Toggles */}
      <Card variant="glass">
        <CardHeader title="Privacy Controls" icon={<Eye className="w-5 h-5 text-neon-purple" />} />
        <CardContent className="p-6 space-y-4">
          <SettingToggle
            label="Firebase Analytics"
            description="Allow anonymous usage analytics to help improve the app."
            value={privacySettings.analyticsEnabled}
            onChange={value => updateSetting('analyticsEnabled', value)}
            icon={Target}
          />
          <SettingToggle
            label="Data Collection"
            description="Allow the app to collect usage patterns for AI insights."
            value={privacySettings.dataCollection}
            onChange={value => updateSetting('dataCollection', value)}
            icon={Database}
          />
          <SettingToggle
            label="Local Storage Only"
            description="Prefer storing non-essential data locally instead of in the cloud."
            value={privacySettings.localStorageOnly}
            onChange={value => updateSetting('localStorageOnly', value)}
            icon={Smartphone}
          />
          <div className="flex items-center justify-end gap-3 pt-2">
            {saveMsg && (
              <span className={cn(
                'text-sm',
                saveMsg.includes('saved') ? 'text-neon-green' : 'text-status-error'
              )}>
                {saveMsg}
              </span>
            )}
            <Button variant="glow" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4 mr-1" /> Save Privacy Settings</>
              )}
            </Button>
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
  const { profile, updatePreferences } = useUser();
  const {
    integrations,
    loading,
    supportedIntegrations,
    isGoogleCalendarConnected,
    isAppleCalendarConnected,
    connectGoogleCalendar,
    connectAppleCalendar,
    connectProvider,
    disconnect,
  } = useIntegrations();
  const { jobs, logs, loading: syncLoading, requestSync } = useAutoSync();

  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [permissionSettings, setPermissionSettings] = useState({
    allowHealthDataSync: true,
    allowFinanceDataSync: true,
    allowCalendarDataSync: true,
    allowTaskDataSync: true,
    allowLocationDataSync: false,
    allowBackgroundSync: true,
    allowAIExternalDataAccess: true,
  });

  useEffect(() => {
    const persisted = profile?.preferences?.dataPermissions;
    if (!persisted) return;
    setPermissionSettings(prev => ({
      ...prev,
      ...persisted,
    }));
  }, [profile]);

  const providerIconMap: Record<IntegrationKey, any> = {
    googleCalendar: Calendar,
    appleCalendar: Apple,
    appleHealth: Heart,
    healthConnect: Smartphone,
    fitbit: Heart,
    googleFit: Target,
    plaid: CreditCard,
    todoist: Check,
    notion: FileText,
    mobileBridge: Smartphone,
  };

  const providerDefaults: Record<IntegrationKey, Record<string, unknown>> = {
    googleCalendar: {
      syncMode: 'two-way',
      platform: 'web',
      autoImport: { calendar: true },
    },
    appleCalendar: {
      syncMode: 'add-only',
      platform: 'ios',
      autoImport: { calendar: true },
    },
    appleHealth: {
      provider: 'apple-health',
      syncMode: 'pull',
      platform: 'ios',
      metrics: ['steps', 'sleep', 'workouts', 'heart-rate', 'cycle'],
      autoImport: { wellness: true },
    },
    healthConnect: {
      provider: 'health-connect',
      syncMode: 'pull',
      platform: 'android',
      metrics: ['steps', 'sleep', 'active-minutes', 'heart-rate'],
      autoImport: { wellness: true },
    },
    fitbit: {
      provider: 'fitbit',
      syncMode: 'pull',
      platform: 'cloud',
      metrics: ['steps', 'sleep', 'workouts', 'resting-heart-rate'],
      autoImport: { wellness: true },
    },
    googleFit: {
      provider: 'google-fit',
      syncMode: 'pull',
      platform: 'android',
      metrics: ['steps', 'sleep', 'workouts'],
      autoImport: { wellness: true },
    },
    plaid: {
      provider: 'plaid',
      syncMode: 'pull',
      platform: 'cloud',
      autoImport: { finance: true },
    },
    todoist: {
      provider: 'todoist',
      syncMode: 'two-way',
      platform: 'cloud',
      autoImport: { tasks: true },
    },
    notion: {
      provider: 'notion',
      syncMode: 'pull',
      platform: 'cloud',
      autoImport: { tasks: true },
    },
    mobileBridge: {
      provider: 'nexora-mobile-bridge',
      syncMode: 'push',
      platform: 'cloud',
      appInstalled: false,
      platforms: ['ios', 'android'],
      autoImport: { wellness: true, calendar: true },
    },
  };

  const toDate = (value: unknown): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as any).toDate === 'function') {
      return (value as any).toDate();
    }
    const parsed = new Date(value as any);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const getDetailText = (providerKey: IntegrationKey, fallback: string): string => {
    const integration = integrations[providerKey];
    if (!integration) return fallback;
    if ('email' in integration && integration.email) return integration.email;
    if ('accountLabel' in integration && integration.accountLabel) return integration.accountLabel;
    if ('institution' in integration && integration.institution) return integration.institution;
    if ('provider' in integration && integration.provider) return `provider: ${integration.provider}`;
    return fallback;
  };

  const updatePermission = (key: keyof typeof permissionSettings, value: boolean) => {
    setPermissionSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSavePermissions = async () => {
    setSavingPermissions(true);
    setSaveMessage(null);
    try {
      await updatePreferences({
        dataPermissions: permissionSettings,
      });
      setSaveMessage('Automatic collection permissions saved.');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save data permissions:', error);
      setSaveMessage('Failed to save permissions');
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleConnect = async (providerKey: IntegrationKey) => {
    try {
      if (providerKey === 'googleCalendar') {
        connectGoogleCalendar();
        return;
      }
      if (providerKey === 'appleCalendar') {
        await connectAppleCalendar();
        return;
      }
      await connectProvider(providerKey, providerDefaults[providerKey]);
    } catch (error) {
      console.error(`Failed to connect ${providerKey}:`, error);
    }
  };

  const handleDisconnect = async (key: string) => {
    setDisconnecting(key);
    try {
      await disconnect(key as IntegrationKey);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    } finally {
      setDisconnecting(null);
    }
  };

  const handleManualSync = async (providerKey: IntegrationKey) => {
    setSyncing(providerKey);
    try {
      await requestSync(providerKey);
    } catch (error) {
      console.error('Failed to request sync:', error);
    } finally {
      setSyncing(null);
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
            <div className="space-y-3">
              {supportedIntegrations.map(provider => {
                const integration = integrations[provider.key];
                const isComingSoon = provider.setupStatus === 'coming-soon';
                const needsConfig = provider.setupStatus === 'needs-config';
                const connected = provider.key === 'googleCalendar'
                  ? isGoogleCalendarConnected
                  : provider.key === 'appleCalendar'
                    ? isAppleCalendarConnected
                    : integration?.connected ?? false;
                const Icon = providerIconMap[provider.key] || Link2;
                const lastSynced = toDate(integration?.lastSynced);
                const status = integration?.status || (connected ? 'idle' : 'disconnected');

                return (
                  <div
                    key={provider.key}
                    className={cn(
                      'p-4 rounded-xl bg-dark-800/30 border border-dark-700/40',
                      isComingSoon && 'opacity-60'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'p-2 rounded-lg mt-0.5',
                          connected ? 'bg-neon-cyan/20' : 'bg-dark-700/50'
                        )}>
                          <Icon className={cn(
                            'w-5 h-5',
                            connected ? 'text-neon-cyan' : 'text-dark-300'
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white">{provider.name}</p>
                            {isComingSoon && (
                              <Badge variant="default" size="sm" className="text-[10px]">Coming Soon</Badge>
                            )}
                            {needsConfig && !connected && (
                              <Badge variant="orange" size="sm" className="text-[10px]">Needs Config</Badge>
                            )}
                          </div>
                          <p className="text-xs text-dark-400">
                            {isComingSoon
                              ? provider.description
                              : needsConfig && !connected
                                ? 'Requires OAuth environment variable setup'
                                : getDetailText(provider.key, provider.description)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={connected ? 'green' : 'default'} size="sm">
                              {connected ? 'Connected' : isComingSoon ? 'Unavailable' : 'Not connected'}
                            </Badge>
                            <Badge variant="outline" size="sm">{provider.platform}</Badge>
                            {connected && (
                              <Badge variant={status === 'error' ? 'orange' : 'cyan'} size="sm">
                                {status}
                              </Badge>
                            )}
                          </div>
                          {lastSynced && (
                            <p className="text-[11px] text-dark-500 mt-1">
                              Last sync: {lastSynced.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {connected && !isComingSoon && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManualSync(provider.key)}
                            disabled={syncing === provider.key}
                          >
                            {syncing === provider.key ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Sync now'
                            )}
                          </Button>
                        )}
                        {connected ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDisconnect(provider.key)}
                            disabled={disconnecting === provider.key}
                          >
                            {disconnecting === provider.key ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Disconnect'
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConnect(provider.key)}
                            disabled={isComingSoon}
                          >
                            {isComingSoon ? 'Unavailable' : 'Connect'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader title="Automatic Collection Permissions" icon={<Shield className="w-5 h-5 text-neon-purple" />} />
        <CardContent className="p-6 space-y-4">
          <SettingToggle
            label="Health Data Sync"
            description="Allow importing wellness metrics from Apple Health, Health Connect, Fitbit, and Google Fit."
            value={permissionSettings.allowHealthDataSync}
            onChange={value => updatePermission('allowHealthDataSync', value)}
            icon={Heart}
          />
          <SettingToggle
            label="Finance Data Sync"
            description="Allow secure transaction imports from connected finance providers."
            value={permissionSettings.allowFinanceDataSync}
            onChange={value => updatePermission('allowFinanceDataSync', value)}
            icon={CreditCard}
          />
          <SettingToggle
            label="Calendar Data Sync"
            description="Allow automatic calendar event ingestion and updates."
            value={permissionSettings.allowCalendarDataSync}
            onChange={value => updatePermission('allowCalendarDataSync', value)}
            icon={Calendar}
          />
          <SettingToggle
            label="Task Data Sync"
            description="Allow importing tasks and milestones from external productivity apps."
            value={permissionSettings.allowTaskDataSync}
            onChange={value => updatePermission('allowTaskDataSync', value)}
            icon={Target}
          />
          <SettingToggle
            label="Background Sync"
            description="Allow background sync jobs to keep data fresh automatically."
            value={permissionSettings.allowBackgroundSync}
            onChange={value => updatePermission('allowBackgroundSync', value)}
            icon={RefreshCw}
          />
          <SettingToggle
            label="AI Access to Synced Data"
            description="Allow AI to use imported external data for more personalized insights."
            value={permissionSettings.allowAIExternalDataAccess}
            onChange={value => updatePermission('allowAIExternalDataAccess', value)}
            icon={Brain}
          />
          <SettingToggle
            label="Location Context Sync"
            description="Allow optional location context for commute and reminder suggestions."
            value={permissionSettings.allowLocationDataSync}
            onChange={value => updatePermission('allowLocationDataSync', value)}
            icon={MapPin}
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            {saveMessage && (
              <span className={cn(
                'text-sm',
                saveMessage.includes('saved') ? 'text-neon-green' : 'text-status-error'
              )}>
                {saveMessage}
              </span>
            )}
            <Button
              variant="glow"
              size="sm"
              onClick={handleSavePermissions}
              disabled={savingPermissions}
            >
              {savingPermissions ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save Permissions
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader title="Sync Activity" icon={<RefreshCw className="w-5 h-5 text-neon-cyan" />} />
        <CardContent className="p-6">
          {syncLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-neon-cyan animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-white">Recent Sync Jobs</p>
                {jobs.length === 0 ? (
                  <p className="text-xs text-dark-500">No sync jobs yet.</p>
                ) : (
                  jobs.slice(0, 6).map(job => (
                    <div key={job.id} className="p-2.5 rounded-lg bg-dark-800/40 border border-dark-700/50">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-white">{job.provider}</p>
                        <Badge
                          variant={
                            job.status === 'succeeded'
                              ? 'green'
                              : job.status === 'failed'
                                ? 'orange'
                                : 'default'
                          }
                          size="sm"
                        >
                          {job.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-dark-500 mt-1">
                        {job.createdAt.toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-white">Recent Sync Logs</p>
                {logs.length === 0 ? (
                  <p className="text-xs text-dark-500">No sync logs yet.</p>
                ) : (
                  logs.slice(0, 6).map(log => (
                    <div key={log.id} className="p-2.5 rounded-lg bg-dark-800/40 border border-dark-700/50">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-white">{log.message}</p>
                        <Badge
                          variant={
                            log.level === 'error'
                              ? 'orange'
                              : log.level === 'warning'
                                ? 'yellow'
                                : 'cyan'
                          }
                          size="sm"
                        >
                          {log.level}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-dark-500 mt-1">
                        {log.provider} • {log.createdAt.toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Data Section
function DataSection() {
  const router = useRouter();
  const { user, logout, deleteAccount } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
        'integrationSyncJobs',
        'integrationSyncLogs',
        'integrationMappings',
        'integrationSyncInbox',
      ];
      const userDocumentCollections = ['userIntegrations', 'userLinkedAccounts'];

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

      for (const collectionName of userDocumentCollections) {
        try {
          const snapshot = await getDoc(doc(db, collectionName, user.uid));
          exportData[collectionName] = snapshot.exists()
            ? {
              id: snapshot.id,
              ...snapshot.data(),
            }
            : null;
        } catch (err) {
          console.log(`Skipping ${collectionName}:`, err);
          exportData[collectionName] = null;
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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      window.location.href = '/Nexora/auth/login';
    } catch (error: any) {
      console.error('Delete account error:', error);
      if (error?.code === 'auth/requires-recent-login') {
        setDeleteError('For security, please sign out and sign back in, then try again.');
      } else {
        setDeleteError(error?.message || 'Failed to delete account. Please try again.');
      }
      setIsDeleting(false);
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

      {/* Danger Zone - Delete Account */}
      <Card variant="glass" className="border-status-error/30">
        <CardHeader title="Danger Zone" icon={<AlertTriangle className="w-5 h-5 text-status-error" />} />
        <CardContent className="p-6">
          <p className="text-sm text-dark-400 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <Button
            variant="outline"
            className="border-status-error/50 text-status-error hover:bg-status-error/10"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirmText('');
          setDeleteError(null);
        }}
        title="Delete Account"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-status-error/10 border border-status-error/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-status-error shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-status-error">This action is permanent</p>
                <p className="text-xs text-dark-400 mt-1">
                  All your tasks, habits, goals, journal entries, financial data, and every other piece of data will be permanently deleted. This cannot be reversed.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-dark-400 mb-2">
              Type <span className="text-white font-mono font-bold">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE here"
              className="w-full px-4 py-3 rounded-xl bg-dark-800/50 border border-dark-700/50 focus:border-status-error/50 focus:ring-1 focus:ring-status-error/30 outline-none text-white placeholder-dark-500 transition-all"
              disabled={isDeleting}
            />
          </div>

          {deleteError && (
            <p className="text-sm text-status-error">{deleteError}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmText('');
                setDeleteError(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="border-status-error/50 text-status-error hover:bg-status-error/20"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'DELETE' || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete My Account
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
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
