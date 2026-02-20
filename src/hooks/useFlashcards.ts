'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { Flashcard } from '@/types';
import {
    subscribeToFlashcards,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
} from '@/lib/services/flashcards';

export function useFlashcards(subjectId: string) {
    const { user } = useAuth();
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user || !subjectId) {
            setCards([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const unsubscribe = subscribeToFlashcards(
            user.uid,
            subjectId,
            (fetchedCards) => {
                setCards(fetchedCards);
                setLoading(false);
            },
            (err) => {
                console.error('Flashcards error:', err);
                setError(err.message);
                setCards([]);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user, subjectId]);

    const addCard = useCallback(
        async (data: Omit<Flashcard, 'id' | 'createdAt'>) => {
            if (!user) throw new Error('Not authenticated');
            await createFlashcard(user.uid, data);
        },
        [user]
    );

    const editCard = useCallback(
        async (cardId: string, updates: Partial<Flashcard>) => {
            await updateFlashcard(cardId, updates);
        },
        []
    );

    const removeCard = useCallback(
        async (cardId: string) => {
            await deleteFlashcard(cardId);
        },
        []
    );

    return { cards, loading, error, addCard, editCard, removeCard };
}
