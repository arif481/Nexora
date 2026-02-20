'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, RotateCcw, CheckCircle2, XCircle, Brain,
    ChevronLeft, ChevronRight, Trash2, Sparkles, Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Flashcard } from '@/types';

interface FlashcardDeckProps {
    cards: Flashcard[];
    subjectId: string;
    subjectColor?: string;
    onAddCard: (card: Omit<Flashcard, 'id' | 'createdAt'>) => Promise<void>;
    onUpdateCard: (cardId: string, updates: Partial<Flashcard>) => Promise<void>;
    onDeleteCard: (cardId: string) => Promise<void>;
}

// SM-2 algorithm
function sm2(card: Flashcard, quality: number): Partial<Flashcard> {
    // quality: 0-5 (0=complete blackout, 5=perfect recall)
    let { easeFactor, interval, repetitions } = card;

    if (quality >= 3) {
        if (repetitions === 0) interval = 1;
        else if (repetitions === 1) interval = 6;
        else interval = Math.round(interval * easeFactor);
        repetitions++;
    } else {
        repetitions = 0;
        interval = 1;
    }

    easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    return {
        easeFactor,
        interval,
        repetitions,
        nextReview,
        lastReview: new Date(),
        difficulty: quality >= 4 ? 'easy' : quality >= 3 ? 'medium' : 'hard',
    };
}

export function FlashcardDeck({ cards, subjectId, subjectColor = '#06b6d4', onAddCard, onUpdateCard, onDeleteCard }: FlashcardDeckProps) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0, total: 0 });
    const [isSessionComplete, setIsSessionComplete] = useState(false);
    const [newCard, setNewCard] = useState({ front: '', back: '' });

    // Cards due for review
    const dueCards = useMemo(() => {
        const now = new Date();
        return cards
            .filter(c => new Date(c.nextReview) <= now)
            .sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime());
    }, [cards]);

    const currentCard = dueCards[currentIndex];

    const handleAnswer = useCallback(async (quality: number) => {
        if (!currentCard) return;

        const updates = sm2(currentCard, quality);
        await onUpdateCard(currentCard.id, updates);

        setSessionStats(prev => ({
            correct: prev.correct + (quality >= 3 ? 1 : 0),
            incorrect: prev.incorrect + (quality < 3 ? 1 : 0),
            total: prev.total + 1,
        }));

        setIsFlipped(false);

        if (currentIndex >= dueCards.length - 1) {
            setIsSessionComplete(true);
        } else {
            setCurrentIndex(prev => prev + 1);
        }
    }, [currentCard, currentIndex, dueCards.length, onUpdateCard]);

    const handleAddCard = async () => {
        if (!newCard.front.trim() || !newCard.back.trim()) return;

        const nextReview = new Date();

        await onAddCard({
            subjectId,
            front: newCard.front,
            back: newCard.back,
            difficulty: 'medium',
            interval: 0,
            easeFactor: 2.5,
            repetitions: 0,
            nextReview,
        });

        setNewCard({ front: '', back: '' });
        setIsAddOpen(false);
    };

    const resetSession = () => {
        setCurrentIndex(0);
        setSessionStats({ correct: 0, incorrect: 0, total: 0 });
        setIsSessionComplete(false);
        setIsFlipped(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Layers className="w-5 h-5" style={{ color: subjectColor }} />
                        Flashcards
                    </h3>
                    <p className="text-sm text-dark-400">
                        {dueCards.length} cards due · {cards.length} total
                    </p>
                </div>
                <Button variant="glow" size="sm" onClick={() => setIsAddOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
                    Add Card
                </Button>
            </div>

            {/* Session Complete */}
            {isSessionComplete && (
                <Card variant="glass" className="p-8 text-center">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-neon-cyan" />
                    <h3 className="text-xl font-bold text-white mb-2">Session Complete!</h3>
                    <p className="text-dark-400 mb-6">
                        You reviewed {sessionStats.total} cards
                    </p>
                    <div className="flex justify-center gap-8 mb-6">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-neon-green">{sessionStats.correct}</p>
                            <p className="text-xs text-dark-400">Correct</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-status-error">{sessionStats.incorrect}</p>
                            <p className="text-xs text-dark-400">Need Review</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-neon-cyan">
                                {sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0}%
                            </p>
                            <p className="text-xs text-dark-400">Accuracy</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={resetSession} leftIcon={<RotateCcw className="w-4 h-4" />}>
                        Start Another Round
                    </Button>
                </Card>
            )}

            {/* Active Review */}
            {!isSessionComplete && dueCards.length > 0 && currentCard && (
                <div className="space-y-4">
                    {/* Progress */}
                    <div className="flex items-center gap-3 text-sm text-dark-400">
                        <span>{currentIndex + 1} / {dueCards.length}</span>
                        <div className="flex-1 h-1.5 bg-dark-800 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{ width: `${((currentIndex + 1) / dueCards.length) * 100}%`, backgroundColor: subjectColor }}
                            />
                        </div>
                    </div>

                    {/* Card */}
                    <div
                        className="relative cursor-pointer select-none"
                        style={{ perspective: '1000px' }}
                        onClick={() => setIsFlipped(!isFlipped)}
                    >
                        <motion.div
                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                            transition={{ duration: 0.5, type: 'spring', damping: 20 }}
                            style={{ transformStyle: 'preserve-3d' }}
                            className="relative min-h-[240px]"
                        >
                            {/* Front */}
                            <div
                                className={cn(
                                    'absolute inset-0 rounded-2xl p-8',
                                    'bg-dark-900/80 border border-dark-700 backdrop-blur-sm',
                                    'flex flex-col items-center justify-center text-center',
                                    isFlipped && 'invisible'
                                )}
                                style={{ backfaceVisibility: 'hidden' }}
                            >
                                <Brain className="w-6 h-6 mb-4 text-dark-500" />
                                <p className="text-lg text-white font-medium leading-relaxed">{currentCard.front}</p>
                                <p className="text-xs text-dark-500 mt-6">Tap to flip</p>
                            </div>

                            {/* Back */}
                            <div
                                className={cn(
                                    'absolute inset-0 rounded-2xl p-8',
                                    'border backdrop-blur-sm',
                                    'flex flex-col items-center justify-center text-center',
                                    !isFlipped && 'invisible'
                                )}
                                style={{
                                    backfaceVisibility: 'hidden',
                                    transform: 'rotateY(180deg)',
                                    backgroundColor: `${subjectColor}10`,
                                    borderColor: `${subjectColor}40`,
                                }}
                            >
                                <CheckCircle2 className="w-6 h-6 mb-4" style={{ color: subjectColor }} />
                                <p className="text-lg text-white font-medium leading-relaxed">{currentCard.back}</p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Answer Buttons */}
                    {isFlipped && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-3 gap-3"
                        >
                            <Button
                                variant="outline"
                                className="border-status-error/30 text-status-error hover:bg-status-error/10"
                                onClick={() => handleAnswer(1)}
                            >
                                <XCircle className="w-4 h-4 mr-1.5" />
                                Again
                            </Button>
                            <Button
                                variant="outline"
                                className="border-neon-orange/30 text-neon-orange hover:bg-neon-orange/10"
                                onClick={() => handleAnswer(3)}
                            >
                                Good
                            </Button>
                            <Button
                                variant="outline"
                                className="border-neon-green/30 text-neon-green hover:bg-neon-green/10"
                                onClick={() => handleAnswer(5)}
                            >
                                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                Easy
                            </Button>
                        </motion.div>
                    )}
                </div>
            )}

            {/* No due cards */}
            {!isSessionComplete && dueCards.length === 0 && (
                <Card variant="glass" className="p-8 text-center">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-neon-green" />
                    <h3 className="text-lg font-semibold text-white mb-2">All caught up!</h3>
                    <p className="text-dark-400">
                        {cards.length > 0
                            ? 'No cards due for review right now. Check back later.'
                            : 'Add your first flashcard to start studying.'}
                    </p>
                </Card>
            )}

            {/* Card List */}
            {cards.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-dark-700/50">
                    <h4 className="text-sm font-medium text-dark-400 mb-3">All Cards ({cards.length})</h4>
                    {cards.slice(0, 10).map(card => (
                        <div key={card.id} className="flex items-center justify-between p-3 rounded-xl bg-dark-800/40 group">
                            <div className="flex-1 min-w-0 mr-4">
                                <p className="text-sm text-white truncate">{card.front}</p>
                                <p className="text-xs text-dark-400 truncate">{card.back}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    'text-[10px] px-2 py-0.5 rounded-full font-medium',
                                    card.difficulty === 'easy' ? 'bg-neon-green/20 text-neon-green' :
                                        card.difficulty === 'hard' ? 'bg-status-error/20 text-status-error' :
                                            'bg-neon-orange/20 text-neon-orange'
                                )}>
                                    {card.difficulty}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => onDeleteCard(card.id)}
                                >
                                    <Trash2 className="w-3.5 h-3.5 text-dark-400" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {cards.length > 10 && (
                        <p className="text-xs text-dark-500 text-center pt-2">+ {cards.length - 10} more cards</p>
                    )}
                </div>
            )}

            {/* Add Card Modal */}
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Flashcard">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">Front (Question)</label>
                        <textarea
                            className="w-full h-24 bg-dark-800 border border-dark-600 rounded-xl p-3 text-sm text-white focus:border-neon-cyan focus:outline-none resize-none"
                            placeholder="What does SM-2 stand for?"
                            value={newCard.front}
                            onChange={(e) => setNewCard(prev => ({ ...prev, front: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">Back (Answer)</label>
                        <textarea
                            className="w-full h-24 bg-dark-800 border border-dark-600 rounded-xl p-3 text-sm text-white focus:border-neon-cyan focus:outline-none resize-none"
                            placeholder="SuperMemo 2 — a spaced repetition algorithm"
                            value={newCard.back}
                            onChange={(e) => setNewCard(prev => ({ ...prev, back: e.target.value }))}
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button variant="glow" className="flex-1" disabled={!newCard.front.trim() || !newCard.back.trim()} onClick={handleAddCard}>
                            Add Card
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
