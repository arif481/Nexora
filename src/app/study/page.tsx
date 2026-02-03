'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  BookOpen,
  Brain,
  Layers,
  Plus,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Clock,
  Target,
  TrendingUp,
  Flame,
  Star,
  Sparkles,
  Check,
  X,
  MoreHorizontal,
  Edit3,
  Trash2,
  FolderOpen,
  Tag,
  Calendar,
  Zap,
  Award,
  BarChart3,
  Timer,
  Lightbulb,
  RefreshCw,
} from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Progress, CircularProgress } from '@/components/ui/Progress';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/Loading';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

// Types
interface Flashcard {
  id: string;
  front: string;
  back: string;
  deckId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  nextReview: Date;
  repetitions: number;
  easeFactor: number;
  interval: number;
  lastReviewed?: Date;
}

interface Deck {
  id: string;
  name: string;
  description?: string;
  color: string;
  cardCount: number;
  dueCount: number;
  masteredCount: number;
  createdAt: Date;
  tags: string[];
}

interface StudySession {
  id: string;
  deckId: string;
  startTime: Date;
  endTime?: Date;
  cardsStudied: number;
  correctAnswers: number;
}

// Mock data
const mockDecks: Deck[] = [
  {
    id: '1',
    name: 'JavaScript Fundamentals',
    description: 'Core JS concepts and syntax',
    color: '#f7df1e',
    cardCount: 50,
    dueCount: 12,
    masteredCount: 35,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    tags: ['programming', 'web'],
  },
  {
    id: '2',
    name: 'Spanish Vocabulary',
    description: 'Common Spanish words and phrases',
    color: '#ef4444',
    cardCount: 120,
    dueCount: 28,
    masteredCount: 80,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    tags: ['language', 'spanish'],
  },
  {
    id: '3',
    name: 'React Hooks',
    description: 'useState, useEffect, and custom hooks',
    color: '#61dafb',
    cardCount: 30,
    dueCount: 5,
    masteredCount: 22,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    tags: ['programming', 'react'],
  },
  {
    id: '4',
    name: 'Medical Terminology',
    description: 'Common medical terms and definitions',
    color: '#10b981',
    cardCount: 200,
    dueCount: 45,
    masteredCount: 120,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    tags: ['medical', 'science'],
  },
];

const mockFlashcards: Flashcard[] = [
  {
    id: '1',
    front: 'What is a closure in JavaScript?',
    back: 'A closure is a function that has access to variables in its outer (enclosing) lexical scope, even after the outer function has returned.',
    deckId: '1',
    difficulty: 'medium',
    nextReview: new Date(),
    repetitions: 3,
    easeFactor: 2.5,
    interval: 4,
  },
  {
    id: '2',
    front: 'What does "const" do in JavaScript?',
    back: 'const declares a block-scoped variable that cannot be reassigned. However, if the variable is an object or array, its properties/elements can still be modified.',
    deckId: '1',
    difficulty: 'easy',
    nextReview: new Date(),
    repetitions: 5,
    easeFactor: 2.7,
    interval: 10,
  },
  {
    id: '3',
    front: 'Hola',
    back: 'Hello',
    deckId: '2',
    difficulty: 'easy',
    nextReview: new Date(),
    repetitions: 8,
    easeFactor: 2.8,
    interval: 21,
  },
];

export default function StudyPage() {
  const [decks, setDecks] = useState<Deck[]>(mockDecks);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [isStudying, setIsStudying] = useState(false);
  const [isCreateDeckOpen, setIsCreateDeckOpen] = useState(false);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const { openAIPanel } = useUIStore();

  // Stats
  const stats = useMemo(() => {
    const totalCards = decks.reduce((sum, d) => sum + d.cardCount, 0);
    const totalDue = decks.reduce((sum, d) => sum + d.dueCount, 0);
    const totalMastered = decks.reduce((sum, d) => sum + d.masteredCount, 0);
    const masteryRate = totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0;

    return { totalCards, totalDue, totalMastered, masteryRate };
  }, [decks]);

  const DeckCard = ({ deck }: { deck: Deck }) => {
    const masteryPercent = deck.cardCount > 0
      ? Math.round((deck.masteredCount / deck.cardCount) * 100)
      : 0;

    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'group relative rounded-xl overflow-hidden cursor-pointer',
          'bg-dark-900/50 border border-dark-700/50 backdrop-blur-sm',
          'hover:border-opacity-50 transition-all'
        )}
        style={{ borderColor: `${deck.color}30` }}
        onClick={() => setSelectedDeck(deck)}
      >
        {/* Color accent */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: deck.color }}
        />

        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div
              className="p-2.5 rounded-xl"
              style={{ backgroundColor: `${deck.color}20` }}
            >
              <Layers className="w-5 h-5" style={{ color: deck.color }} />
            </div>
            <div className="flex items-center gap-2">
              {deck.dueCount > 0 && (
                <Badge variant="orange" size="sm">
                  {deck.dueCount} due
                </Badge>
              )}
              <button
                onClick={e => { e.stopPropagation(); }}
                className="p-1.5 rounded-lg hover:bg-dark-700/50 opacity-0 group-hover:opacity-100 transition-all"
              >
                <MoreHorizontal className="w-4 h-4 text-dark-400" />
              </button>
            </div>
          </div>

          <h3 className="font-semibold text-white mb-1">{deck.name}</h3>
          {deck.description && (
            <p className="text-sm text-dark-400 line-clamp-1 mb-3">{deck.description}</p>
          )}

          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-dark-500" />
              <span className="text-xs text-dark-400">{deck.cardCount} cards</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-neon-green" />
              <span className="text-xs text-dark-400">{deck.masteredCount} mastered</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-dark-500">Mastery</span>
            <span className="text-xs font-medium" style={{ color: deck.color }}>
              {masteryPercent}%
            </span>
          </div>
          <Progress value={masteryPercent} variant="cyan" size="sm" />

          {/* Tags */}
          {deck.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {deck.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-dark-800/50 text-xs text-dark-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <MainLayout>
      <PageContainer title="Study" subtitle="Master knowledge with spaced repetition">
        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">Total Cards</span>
              <Layers className="w-6 h-6 text-neon-cyan" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalCards}</p>
            <p className="text-xs text-dark-500">across {decks.length} decks</p>
          </Card>

          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">Due Today</span>
              <Clock className="w-6 h-6 text-neon-orange" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalDue}</p>
            <p className="text-xs text-dark-500">cards to review</p>
          </Card>

          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">Mastered</span>
              <Star className="w-6 h-6 text-neon-green" />
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalMastered}</p>
            <p className="text-xs text-dark-500">cards learned</p>
          </Card>

          <Card variant="glass" className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-dark-400">Mastery Rate</span>
              <CircularProgress value={stats.masteryRate} size={48} strokeWidth={4} />
            </div>
            <p className="text-2xl font-bold text-white">{stats.masteryRate}%</p>
            <p className="text-xs text-dark-500">overall progress</p>
          </Card>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Decks Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Your Decks</h2>
              <Button variant="glow" size="sm" onClick={() => setIsCreateDeckOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                New Deck
              </Button>
            </div>

            {decks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {decks.map(deck => (
                  <DeckCard key={deck.id} deck={deck} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Layers className="w-12 h-12" />}
                title="No decks yet"
                description="Create your first deck to start studying"
                action={
                  <Button variant="glow" onClick={() => setIsCreateDeckOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Create Deck
                  </Button>
                }
              />
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Quick Study */}
            <Card variant="glass">
              <CardHeader
                title="Quick Study"
                icon={<Zap className="w-5 h-5 text-neon-cyan" />}
              />
              <CardContent className="space-y-3">
                {stats.totalDue > 0 ? (
                  <>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10 border border-neon-cyan/20 text-center">
                      <p className="text-3xl font-bold text-white mb-1">{stats.totalDue}</p>
                      <p className="text-sm text-dark-400">cards due for review</p>
                    </div>
                    <Button
                      variant="glow"
                      className="w-full"
                      onClick={() => setIsStudying(true)}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Start Review Session
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Check className="w-8 h-8 text-neon-green mx-auto mb-2" />
                    <p className="text-sm text-dark-400">All caught up! No cards due.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Study Streak */}
            <Card variant="glass">
              <CardHeader
                title="Study Streak"
                icon={<Flame className="w-5 h-5 text-neon-orange" />}
              />
              <CardContent>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-neon-orange">7</p>
                    <p className="text-xs text-dark-400">day streak</p>
                  </div>
                  <div className="w-px h-12 bg-dark-700" />
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">142</p>
                    <p className="text-xs text-dark-400">cards this week</p>
                  </div>
                </div>
                <div className="flex justify-center gap-1">
                  {[1, 1, 1, 1, 1, 1, 1].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        i < 7 ? 'bg-neon-orange/20' : 'bg-dark-800/50'
                      )}
                    >
                      {i < 7 && <Flame className="w-4 h-4 text-neon-orange" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card variant="glass">
              <CardHeader
                title="AI Insights"
                icon={<Brain className="w-5 h-5 text-neon-purple" />}
              />
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-neon-green/10 border border-neon-green/20">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-neon-green" />
                    <span className="text-xs font-medium text-neon-green">Improving!</span>
                  </div>
                  <p className="text-sm text-dark-300">
                    Your retention rate for JavaScript improved 15% this week.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-dark-800/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Lightbulb className="w-4 h-4 text-neon-orange" />
                    <span className="text-xs font-medium text-dark-200">Suggestion</span>
                  </div>
                  <p className="text-sm text-dark-400">
                    Best study time: 9-11 AM based on your performance patterns.
                  </p>
                </div>

                <Button variant="ghost" size="sm" className="w-full" onClick={openAIPanel}>
                  <Sparkles className="w-4 h-4 mr-1" />
                  Generate Study Plan
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Study Session Modal */}
        <Modal
          isOpen={isStudying}
          onClose={() => setIsStudying(false)}
          title="Study Session"
          size="lg"
        >
          <StudySession
            deck={selectedDeck || decks[0]}
            cards={mockFlashcards}
            onClose={() => setIsStudying(false)}
          />
        </Modal>

        {/* Deck Details Modal */}
        <Modal
          isOpen={!!selectedDeck && !isStudying}
          onClose={() => setSelectedDeck(null)}
          title={selectedDeck?.name || 'Deck Details'}
          size="lg"
        >
          {selectedDeck && (
            <DeckDetails
              deck={selectedDeck}
              cards={mockFlashcards.filter(c => c.deckId === selectedDeck.id)}
              onStudy={() => setIsStudying(true)}
              onAddCard={() => setIsAddCardOpen(true)}
              onClose={() => setSelectedDeck(null)}
            />
          )}
        </Modal>

        {/* Create Deck Modal */}
        <Modal
          isOpen={isCreateDeckOpen}
          onClose={() => setIsCreateDeckOpen(false)}
          title="Create New Deck"
          size="md"
        >
          <CreateDeckForm onClose={() => setIsCreateDeckOpen(false)} />
        </Modal>

        {/* Add Card Modal */}
        <Modal
          isOpen={isAddCardOpen}
          onClose={() => setIsAddCardOpen(false)}
          title="Add Flashcard"
          size="md"
        >
          <AddCardForm
            deckId={selectedDeck?.id || ''}
            onClose={() => setIsAddCardOpen(false)}
          />
        </Modal>
      </PageContainer>
    </MainLayout>
  );
}

// Study Session Component
function StudySession({
  deck,
  cards,
  onClose,
}: {
  deck: Deck;
  cards: Flashcard[];
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<Record<string, 'easy' | 'good' | 'hard' | 'again'>>({});
  const [isComplete, setIsComplete] = useState(false);

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  const handleAnswer = (quality: 'easy' | 'good' | 'hard' | 'again') => {
    setResults(prev => ({ ...prev, [currentCard.id]: quality }));

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setIsComplete(true);
    }
  };

  if (isComplete) {
    const correct = Object.values(results).filter(r => r === 'easy' || r === 'good').length;
    const accuracy = Math.round((correct / cards.length) * 100);

    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 rounded-full bg-neon-green/20 flex items-center justify-center mx-auto mb-4">
          <Award className="w-10 h-10 text-neon-green" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Session Complete!</h3>
        <p className="text-dark-400 mb-6">You reviewed {cards.length} cards</p>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-dark-800/30">
            <p className="text-2xl font-bold text-neon-green">{accuracy}%</p>
            <p className="text-sm text-dark-400">Accuracy</p>
          </div>
          <div className="p-4 rounded-xl bg-dark-800/30">
            <p className="text-2xl font-bold text-white">{correct}/{cards.length}</p>
            <p className="text-sm text-dark-400">Correct</p>
          </div>
        </div>

        <Button variant="glow" onClick={onClose}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-dark-400">
            Card {currentIndex + 1} of {cards.length}
          </span>
          <span className="text-sm text-dark-400">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} variant="cyan" size="sm" />
      </div>

      {/* Flashcard */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className={cn(
          'relative min-h-[300px] rounded-2xl cursor-pointer transition-all duration-500',
          'bg-gradient-to-br border',
          isFlipped
            ? 'from-neon-purple/10 to-neon-cyan/10 border-neon-purple/30'
            : 'from-dark-800/50 to-dark-900/50 border-dark-700/50'
        )}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="absolute inset-0 p-8 flex flex-col items-center justify-center">
          <span className="text-xs text-dark-500 mb-4">
            {isFlipped ? 'Answer' : 'Question'}
          </span>
          <p className="text-xl text-center text-white">
            {isFlipped ? currentCard.back : currentCard.front}
          </p>
          {!isFlipped && (
            <p className="text-sm text-dark-500 mt-6">Click to reveal answer</p>
          )}
        </div>
      </div>

      {/* Answer Buttons */}
      {isFlipped && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-4 gap-3 mt-6"
        >
          <button
            onClick={() => handleAnswer('again')}
            className="p-3 rounded-xl bg-status-error/10 border border-status-error/30 hover:bg-status-error/20 transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-status-error mx-auto mb-1" />
            <span className="text-sm text-status-error">Again</span>
          </button>
          <button
            onClick={() => handleAnswer('hard')}
            className="p-3 rounded-xl bg-neon-orange/10 border border-neon-orange/30 hover:bg-neon-orange/20 transition-colors"
          >
            <span className="text-lg mb-1">😓</span>
            <span className="text-sm text-neon-orange block">Hard</span>
          </button>
          <button
            onClick={() => handleAnswer('good')}
            className="p-3 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 hover:bg-neon-cyan/20 transition-colors"
          >
            <span className="text-lg mb-1">👍</span>
            <span className="text-sm text-neon-cyan block">Good</span>
          </button>
          <button
            onClick={() => handleAnswer('easy')}
            className="p-3 rounded-xl bg-neon-green/10 border border-neon-green/30 hover:bg-neon-green/20 transition-colors"
          >
            <span className="text-lg mb-1">🎯</span>
            <span className="text-sm text-neon-green block">Easy</span>
          </button>
        </motion.div>
      )}
    </div>
  );
}

// Deck Details Component
function DeckDetails({
  deck,
  cards,
  onStudy,
  onAddCard,
  onClose,
}: {
  deck: Deck;
  cards: Flashcard[];
  onStudy: () => void;
  onAddCard: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-dark-800/30 text-center">
          <Layers className="w-5 h-5 text-neon-cyan mx-auto mb-2" />
          <p className="text-xl font-bold text-white">{deck.cardCount}</p>
          <p className="text-xs text-dark-400">Total Cards</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/30 text-center">
          <Clock className="w-5 h-5 text-neon-orange mx-auto mb-2" />
          <p className="text-xl font-bold text-white">{deck.dueCount}</p>
          <p className="text-xs text-dark-400">Due Today</p>
        </div>
        <div className="p-4 rounded-xl bg-dark-800/30 text-center">
          <Star className="w-5 h-5 text-neon-green mx-auto mb-2" />
          <p className="text-xl font-bold text-white">{deck.masteredCount}</p>
          <p className="text-xs text-dark-400">Mastered</p>
        </div>
      </div>

      {/* Cards Preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-dark-200">Cards Preview</h4>
          <Button variant="ghost" size="sm" onClick={onAddCard}>
            <Plus className="w-4 h-4 mr-1" />
            Add Card
          </Button>
        </div>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {cards.slice(0, 5).map(card => (
            <div
              key={card.id}
              className="p-3 rounded-lg bg-dark-800/30 flex items-center justify-between"
            >
              <p className="text-sm text-white truncate flex-1">{card.front}</p>
              <Badge
                variant={
                  card.difficulty === 'easy'
                    ? 'green'
                    : card.difficulty === 'medium'
                    ? 'orange'
                    : 'default'
                }
                size="sm"
              >
                {card.difficulty}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="ghost" className="flex-1" onClick={onClose}>
          Close
        </Button>
        <Button variant="glow" className="flex-1" onClick={onStudy}>
          <Play className="w-4 h-4 mr-1" />
          Study Now
        </Button>
      </div>
    </div>
  );
}

// Create Deck Form
function CreateDeckForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#00f0ff');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const colors = ['#00f0ff', '#a855f7', '#f97316', '#10b981', '#ec4899', '#f7df1e'];

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  return (
    <form onSubmit={e => { e.preventDefault(); onClose(); }} className="space-y-4">
      <Input
        label="Deck Name"
        placeholder="e.g., Spanish Vocabulary"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Description</label>
        <textarea
          placeholder="What will you learn?"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
          className={cn(
            'w-full px-4 py-3 rounded-xl text-sm',
            'bg-dark-800/50 border border-dark-700/50',
            'text-white placeholder:text-dark-500',
            'focus:outline-none focus:ring-2 focus:ring-neon-cyan/50'
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-dark-200 mb-2">Color</label>
        <div className="flex gap-2">
          {colors.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                'w-10 h-10 rounded-xl transition-all',
                color === c && 'ring-2 ring-white ring-offset-2 ring-offset-dark-900'
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Tags</label>
        <div className="flex gap-2">
          <Input
            placeholder="Add a tag"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
            className="flex-1"
          />
          <Button type="button" variant="outline" onClick={addTag}>
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map(tag => (
              <Badge key={tag} variant="outline">
                #{tag}
                <button
                  type="button"
                  onClick={() => setTags(tags.filter(t => t !== tag))}
                  className="ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="glow">Create Deck</Button>
      </div>
    </form>
  );
}

// Add Card Form
function AddCardForm({ deckId, onClose }: { deckId: string; onClose: () => void }) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');

  return (
    <form onSubmit={e => { e.preventDefault(); onClose(); }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Front (Question)</label>
        <textarea
          placeholder="Enter the question or prompt"
          value={front}
          onChange={e => setFront(e.target.value)}
          rows={3}
          required
          className={cn(
            'w-full px-4 py-3 rounded-xl text-sm',
            'bg-dark-800/50 border border-dark-700/50',
            'text-white placeholder:text-dark-500',
            'focus:outline-none focus:ring-2 focus:ring-neon-cyan/50'
          )}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Back (Answer)</label>
        <textarea
          placeholder="Enter the answer"
          value={back}
          onChange={e => setBack(e.target.value)}
          rows={3}
          required
          className={cn(
            'w-full px-4 py-3 rounded-xl text-sm',
            'bg-dark-800/50 border border-dark-700/50',
            'text-white placeholder:text-dark-500',
            'focus:outline-none focus:ring-2 focus:ring-neon-cyan/50'
          )}
        />
      </div>

      <div className="p-4 rounded-xl bg-neon-purple/10 border border-neon-purple/20">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-neon-purple" />
          <span className="text-sm font-medium text-neon-purple">AI Assist</span>
        </div>
        <p className="text-sm text-dark-300">
          Paste text and AI will generate flashcards automatically
        </p>
        <Button variant="ghost" size="sm" className="mt-2">
          Generate Cards
        </Button>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="glow">Add Card</Button>
      </div>
    </form>
  );
}
