import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { ReceiptScan } from '@/types';
import {
    subscribeToReceiptScans,
    createReceiptScan,
    updateReceiptScan,
    deleteReceiptScan as removeReceiptScan,
} from '@/lib/services/receipts';
import { generateGeminiResponse } from '@/lib/services/gemini';
import { uploadFile } from '@/lib/services/storage';
import { parseReceiptPhoto } from '@/lib/parsers/foodPhotoParser';

export function useReceipts() {
    const { user } = useAuth();
    const [receipts, setReceipts] = useState<ReceiptScan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!user) {
            setReceipts([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const unsubscribe = subscribeToReceiptScans(
            user.uid,
            (fetched) => {
                setReceipts(fetched);
                setLoading(false);
            },
            (err) => {
                setError(err.message);
                setReceipts([]);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    const processReceiptImage = useCallback(
        async (file: File): Promise<string> => {
            if (!user) throw new Error('User not authenticated');

            setIsProcessing(true);
            setError(null);

            try {
                // First upload the image so we have a URL
                const imageUrl = await uploadFile(file, `receipts/${user.uid}`);

                // Convert the image file to base64 to send to Gemini if possible 
                // OR ask the user for manually typing if not utilizing complete multimodal 
                // in this scope, but let's implement the prompt logic for text at least
                // A complete Gemini Vision implementation would pass the image bytes.

                const parsed = await parseReceiptPhoto(file);

                if (!parsed) {
                    throw new Error('Failed to parse receipt image using AI Vision.');
                }

                const newReceipt: Omit<ReceiptScan, 'id' | 'userId' | 'createdAt'> = {
                    merchantName: parsed.merchant || 'Unknown',
                    totalAmount: parsed.total || 0,
                    date: parsed.date ? new Date(parsed.date) : new Date(),
                    lineItems: (parsed.items || []).map((item: any) => ({
                        description: item.name || 'Unknown Item',
                        amount: item.price || 0,
                        quantity: 1,
                    })),
                    imageUrl,
                    status: 'processed'
                };

                return await createReceiptScan(user.uid, newReceipt);
            } catch (err: any) {
                setError(err.message);
                throw err;
            } finally {
                setIsProcessing(false);
            }
        },
        [user]
    );

    const editReceipt = useCallback(async (id: string, updates: Partial<ReceiptScan>) => {
        try {
            await updateReceiptScan(id, updates);
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    }, []);

    const deleteReceipt = useCallback(async (id: string) => {
        try {
            await removeReceiptScan(id);
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    }, []);

    return {
        receipts,
        loading,
        error,
        isProcessing,
        processReceiptImage,
        editReceipt,
        deleteReceipt,
    };
}
