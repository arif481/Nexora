'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Calendar,
  Heart,
  Smile,
  Meh,
  Frown,
  Sparkles,
  Brain,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Star,
  Loader2,
  Search,
} from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState, LoadingSpinner } from '@/components/ui/Loading';
import { useUIStore } from '@/stores/uiStore';
import { cn, formatDate } from '@/lib/utils';
import { useJournal, useMoodTrend } from '@/hooks/useJournal';
import { useAuth } from '@/hooks/useAuth';

const moodOptions = [
  { value: 1, icon: Frown, label: 'Very Low', color: 'text-red-500' },
  { value: 2, icon: Frown, label: 'Low', color: 'text-neon-orange' },
  { value: 3, icon: Meh, label: 'Neutral', color: 'text-neon-purple' },
  { value: 4, icon: Smile, label: 'Good', color: 'text-neon-cyan' },
  { value: 5, icon: Smile, label: 'Great', color: 'text-neon-green' },
];

const getMoodIcon = (score: number) => {
  const mood = moodOptions.find(m => m.value === score) || moodOptions[2];
  return mood;
};

export default function JournalPage() {
  const { user, loading: authLoading } = useAuth();
  const { entries, loading, createEntry, updateEntry, deleteEntry } = useJournal();
  const moodTrend = useMoodTrend(7);
  
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { openAIPanel } = useUIStore();

  // Form state for new entry
  const [newEntry, setNewEntry] = useState({
    content: '',
    moodScore: 3,
    tags: '',
    gratitude: ['', '', ''],
    highlights: '',
  });

  // Filter entries by search
  const filteredEntries = useMemo(() => {
    if (!searchQuery) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter(entry =>
      entry.content?.toLowerCase().includes(query) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [entries, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalEntries = entries.length;
    const avgMood = totalEntries > 0 
      ? entries.reduce((sum, e) => sum + (e.mood?.score || 3), 0) / totalEntries 
      : 0;
    const thisWeek = entries.filter(e => {
      const entryDate = new Date(e.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo;
    }).length;
    
    return {
      totalEntries,
      avgMood: avgMood.toFixed(1),
      thisWeek,
      streak: calculateStreak(entries),
    };
  }, [entries]);

  // Calculate journaling streak
  function calculateStreak(entries: any[]) {
    if (entries.length === 0) return 0;
    
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedEntries.length; i++) {
      const entryDate = new Date(sortedEntries[i].date);
      entryDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (entryDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  // Create new entry
  const handleCreateEntry = async () => {
    if (!newEntry.content.trim()) return;
    
    setIsSaving(true);
    try {
      const gratitudeItems = newEntry.gratitude.filter(g => g.trim());
      
      await createEntry({
        content: newEntry.content,
        mood: { score: newEntry.moodScore, emotions: [], energyLevel: 5, stressLevel: 5 },
        tags: newEntry.tags ? newEntry.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        gratitude: gratitudeItems,
        highlights: newEntry.highlights ? [newEntry.highlights] : [],
        date: new Date(),
      });
      
      setIsCreateModalOpen(false);
      setNewEntry({
        content: '',
        moodScore: 3,
        tags: '',
        gratitude: ['', '', ''],
        highlights: '',
      });
    } catch (err) {
      console.error('Failed to create entry:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <MainLayout>
        <PageContainer title="Journal" subtitle="Reflect, grow, and understand yourself">
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-dark-400">Loading journal...</p>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <MainLayout>
        <PageContainer title="Journal" subtitle="Reflect, grow, and understand yourself">
          <EmptyState
            icon={<BookOpen className="w-12 h-12" />}
            title="Sign in to journal"
            description="Create an account to start your journaling journey"
            action={
              <Button variant="glow" onClick={() => window.location.href = '/auth/login'}>
                Sign In
              </Button>
            }
          />
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageContainer title="Journal" subtitle="Reflect, grow, and understand yourself">
        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-dark-400">Total Entries</span>
              <BookOpen className="w-5 h-5 text-neon-cyan" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalEntries}</p>
          </Card>

          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-dark-400">Avg Mood</span>
              <Heart className="w-5 h-5 text-neon-pink" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.avgMood}</p>
          </Card>

          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-dark-400">This Week</span>
              <Calendar className="w-5 h-5 text-neon-purple" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.thisWeek}</p>
          </Card>

          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-dark-400">Streak</span>
              <Star className="w-5 h-5 text-neon-orange" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.streak} days</p>
          </Card>
        </motion.div>

        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-3 mb-6"
        >
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <Button variant="glow" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            New Entry
          </Button>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Entries List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-4"
          >
            {filteredEntries.length > 0 ? (
              <AnimatePresence>
                {filteredEntries.map((entry, index) => {
                  const mood = getMoodIcon(entry.mood?.score || 3);
                  const MoodIcon = mood.icon;
                  const entryDate = new Date(entry.date);
                  
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index }}
                      onClick={() => {
                        setSelectedEntry(entry);
                        setIsViewModalOpen(true);
                      }}
                      className="cursor-pointer"
                    >
                      <Card variant="glass" className="p-4 hover:border-neon-cyan/30 transition-all">
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                            'bg-dark-800'
                          )}>
                            <MoodIcon className={cn('w-6 h-6', mood.color)} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-dark-400">
                                {formatDate(entryDate)}
                              </span>
                              <Badge variant="default" size="sm">
                                {mood.label}
                              </Badge>
                            </div>
                            
                            <p className="text-white line-clamp-3">
                              {entry.content}
                            </p>
                            
                            {entry.tags && entry.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {entry.tags.slice(0, 3).map((tag: string) => (
                                  <Badge key={tag} variant="default" size="sm">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            ) : entries.length > 0 ? (
              <EmptyState
                icon={<Search className="w-12 h-12" />}
                title="No entries found"
                description="Try adjusting your search query"
              />
            ) : (
              <EmptyState
                icon={<BookOpen className="w-12 h-12" />}
                title="Start your journal"
                description="Write your first entry to begin your reflection journey"
                action={
                  <Button variant="glow" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Write First Entry
                  </Button>
                }
              />
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            {/* Mood Trend */}
            <Card variant="glass" className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-5 h-5 text-neon-pink" />
                <h3 className="font-medium text-white">Mood Trend</h3>
              </div>
              <div className="flex items-end justify-between gap-2 h-24">
                {moodTrend.data.map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 flex-1">
                    <div 
                      className={cn(
                        'w-full rounded-t-lg transition-all',
                        day.mood.score >= 4 ? 'bg-neon-green' :
                        day.mood.score >= 3 ? 'bg-neon-cyan' :
                        day.mood.score >= 2 ? 'bg-neon-orange' : 'bg-red-500'
                      )}
                      style={{ height: `${(day.mood.score / 5) * 100}%`, minHeight: '4px' }}
                    />
                    <span className="text-[10px] text-dark-500">
                      {new Date(day.date).toLocaleDateString('en', { weekday: 'short' }).charAt(0)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* AI Insights */}
            <Card variant="glass" className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-neon-purple" />
                <h3 className="font-medium text-white">AI Insights</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-dark-800/50 border border-dark-700/50">
                  <p className="text-sm text-dark-300">
                    {entries.length === 0
                      ? "📝 Start journaling to receive personalized insights about your patterns and emotions."
                      : stats.streak >= 7
                      ? "🎉 Amazing streak! Consistent journaling helps build self-awareness."
                      : Number(stats.avgMood) >= 4
                      ? "😊 Your mood has been great lately! Keep up the positive mindset."
                      : "💭 Take a moment to reflect on what's affecting your mood."}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={openAIPanel}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Get AI Analysis
                </Button>
              </div>
            </Card>

            {/* Prompts */}
            <Card variant="glass" className="p-4">
              <h3 className="font-medium text-white mb-4">Writing Prompts</h3>
              <div className="space-y-2">
                {[
                  "What made you smile today?",
                  "What are you grateful for?",
                  "What challenge did you overcome?",
                  "How did you grow today?",
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setNewEntry(prev => ({ ...prev, content: prompt + '\n\n' }));
                      setIsCreateModalOpen(true);
                    }}
                    className="w-full text-left p-3 rounded-lg bg-dark-800/50 text-sm text-dark-300 hover:bg-dark-700/50 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Create Entry Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="New Journal Entry"
          size="lg"
        >
          <div className="space-y-4">
            {/* Mood Selection */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">How are you feeling?</label>
              <div className="flex justify-between gap-2">
                {moodOptions.map(({ value, icon: Icon, label, color }) => (
                  <button
                    key={value}
                    onClick={() => setNewEntry(prev => ({ ...prev, moodScore: value }))}
                    className={cn(
                      'flex-1 p-3 rounded-lg flex flex-col items-center gap-1 transition-all',
                      newEntry.moodScore === value
                        ? 'bg-neon-cyan/20 border border-neon-cyan'
                        : 'bg-dark-800 border border-dark-700 hover:border-dark-500'
                    )}
                  >
                    <Icon className={cn('w-6 h-6', color)} />
                    <span className="text-xs text-dark-400">{label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">What's on your mind?</label>
              <textarea
                placeholder="Write about your day, thoughts, feelings..."
                value={newEntry.content}
                onChange={(e) => setNewEntry(prev => ({ ...prev, content: e.target.value }))}
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white placeholder-dark-500 focus:border-neon-cyan outline-none resize-none"
                rows={6}
              />
            </div>

            {/* Gratitude */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">3 Things you're grateful for</label>
              <div className="space-y-2">
                {[0, 1, 2].map(i => (
                  <Input
                    key={i}
                    placeholder={`Gratitude ${i + 1}...`}
                    value={newEntry.gratitude[i]}
                    onChange={(e) => {
                      const newGratitude = [...newEntry.gratitude];
                      newGratitude[i] = e.target.value;
                      setNewEntry(prev => ({ ...prev, gratitude: newGratitude }));
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Tags */}
            <Input
              label="Tags (comma separated)"
              placeholder="reflection, growth, gratitude"
              value={newEntry.tags}
              onChange={(e) => setNewEntry(prev => ({ ...prev, tags: e.target.value }))}
            />

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="glow"
                className="flex-1"
                onClick={handleCreateEntry}
                disabled={!newEntry.content.trim() || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Entry'
                )}
              </Button>
            </div>
          </div>
        </Modal>

        {/* View Entry Modal */}
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedEntry(null);
          }}
          title="Journal Entry"
          size="lg"
        >
          {selectedEntry && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-dark-400">
                  {formatDate(new Date(selectedEntry.date))}
                </span>
                <Badge variant="default">
                  {getMoodIcon(selectedEntry.mood?.score || 3).label}
                </Badge>
              </div>
              
              <div className="p-4 rounded-lg bg-dark-800/50">
                <p className="text-white whitespace-pre-wrap">{selectedEntry.content}</p>
              </div>

              {selectedEntry.gratitude && selectedEntry.gratitude.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-dark-300 mb-2">Gratitude</h4>
                  <ul className="space-y-1">
                    {selectedEntry.gratitude.map((item: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-dark-400">
                        <Heart className="w-3 h-3 text-neon-pink" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedEntry.tags.map((tag: string) => (
                    <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedEntry(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </PageContainer>
    </MainLayout>
  );
}
