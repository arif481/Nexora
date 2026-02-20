'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
    createContact as createService,
    updateContact as updateService,
    deleteContact as deleteService,
    subscribeToContacts,
    logInteraction as logInteractionService,
    subscribeToInteractions,
} from '@/lib/services/contacts';
import type { Contact, ContactInteraction } from '@/types';

export function useContacts() {
    const { user } = useAuth();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user) {
            setContacts([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToContacts(
            user.uid,
            (fetchedContacts) => {
                setContacts(fetchedContacts);
                setLoading(false);
                setError(null);
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    const createContact = useCallback(
        async (
            contactData: Partial<Omit<Contact, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
        ) => {
            if (!user) throw new Error('User not authenticated');
            return await createService(user.uid, contactData);
        },
        [user]
    );

    const updateContact = useCallback(
        async (contactId: string, updates: Partial<Contact>) => {
            await updateService(contactId, updates);
        },
        []
    );

    const deleteContact = useCallback(
        async (contactId: string) => {
            await deleteService(contactId);
        },
        []
    );

    const logInteraction = useCallback(
        async (
            contactId: string,
            interactionData: Partial<Omit<ContactInteraction, 'id' | 'userId' | 'contactId' | 'createdAt'>>
        ) => {
            if (!user) throw new Error('User not authenticated');
            return await logInteractionService(user.uid, contactId, interactionData);
        },
        [user]
    );

    return {
        contacts,
        loading,
        error,
        createContact,
        updateContact,
        deleteContact,
        logInteraction,
    };
}

export function useContactInteractions(contactId: string | null) {
    const { user } = useAuth();
    const [interactions, setInteractions] = useState<ContactInteraction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user || !contactId) {
            setInteractions([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToInteractions(
            user.uid,
            contactId,
            (fetched) => {
                setInteractions(fetched);
                setLoading(false);
                setError(null);
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user, contactId]);

    return {
        interactions,
        loading,
        error,
    };
}
