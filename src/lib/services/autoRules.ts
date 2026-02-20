import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    getDocs,
    writeBatch,
    Timestamp,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';
import type { AutoRule } from '@/types';

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: Timestamp | Date | null | undefined): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Timestamp) return timestamp.toDate();
    return timestamp instanceof Date ? timestamp : new Date(timestamp);
};

// Convert AutoRule from Firestore
const convertRuleFromFirestore = (doc: any): AutoRule => {
    const data = doc.data();
    return {
        id: doc.id,
        userId: data.userId,
        name: data.name,
        isActive: data.isActive ?? true,
        conditions: data.conditions || [],
        actions: data.actions || [],
        matchType: data.matchType || 'all',
        lastTriggeredAt: data.lastTriggeredAt ? convertTimestamp(data.lastTriggeredAt) : undefined,
        createdAt: convertTimestamp(data.createdAt),
    };
};

export const createAutoRule = async (
    userId: string,
    ruleData: Omit<AutoRule, 'id' | 'userId' | 'createdAt' | 'lastTriggeredAt'>
): Promise<string> => {
    const rulesRef = collection(db, COLLECTIONS.AUTO_RULES);
    const newRule = {
        userId,
        name: ruleData.name,
        isActive: ruleData.isActive ?? true,
        conditions: ruleData.conditions,
        actions: ruleData.actions,
        matchType: ruleData.matchType,
        createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(rulesRef, newRule);
    return docRef.id;
};

export const updateAutoRule = async (
    ruleId: string,
    updates: Partial<AutoRule>
): Promise<void> => {
    const ruleRef = doc(db, COLLECTIONS.AUTO_RULES, ruleId);
    await updateDoc(ruleRef, {
        ...updates,
        updatedAt: serverTimestamp(),
    });
};

export const deleteAutoRule = async (ruleId: string): Promise<void> => {
    const ruleRef = doc(db, COLLECTIONS.AUTO_RULES, ruleId);
    await deleteDoc(ruleRef);
};

export const subscribeToAutoRules = (
    userId: string,
    callback: (rules: AutoRule[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    const rulesRef = collection(db, COLLECTIONS.AUTO_RULES);
    const q = query(rulesRef, where('userId', '==', userId));

    return onSnapshot(
        q,
        (snapshot) => {
            const rules = snapshot.docs.map(convertRuleFromFirestore);
            // Sort by creation date descending
            rules.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            callback(rules);
        },
        (error) => {
            console.error('Error subscribing to auto rules:', error);
            if (onError) onError(error);
        }
    );
};

// Evaluate a single transaction against all active rules
export const evaluateRulesForTransaction = async (
    userId: string,
    transaction: any,
    rules: AutoRule[]
): Promise<Partial<any> | null> => {
    if (!rules || rules.length === 0) return null;

    const activeRules = rules.filter(r => r.isActive);
    if (activeRules.length === 0) return null;

    const updates: any = {};
    let ruleTriggered = false;

    for (const rule of activeRules) {
        let isMatch = false;

        // Check conditions
        const conditionMatches = rule.conditions.map(condition => {
            let fieldValue: any;

            switch (condition.field) {
                case 'description':
                    fieldValue = (transaction.description || '').toLowerCase();
                    break;
                case 'amount':
                    fieldValue = transaction.amount;
                    break;
                case 'merchant':
                    // Attempt to extract merchant from description or specific field if exists
                    fieldValue = (transaction.merchant || transaction.description || '').toLowerCase();
                    break;
                case 'account':
                    fieldValue = (transaction.accountId || '').toLowerCase();
                    break;
            }

            const conditionValue = typeof condition.value === 'string'
                ? condition.value.toLowerCase()
                : condition.value;

            switch (condition.operator) {
                case 'equals':
                    return fieldValue === conditionValue;
                case 'contains':
                    return typeof fieldValue === 'string' && fieldValue.includes(String(conditionValue));
                case 'starts_with':
                    return typeof fieldValue === 'string' && fieldValue.startsWith(String(conditionValue));
                case 'greater_than':
                    return typeof fieldValue === 'number' && typeof conditionValue === 'number' && fieldValue > conditionValue;
                case 'less_than':
                    return typeof fieldValue === 'number' && typeof conditionValue === 'number' && fieldValue < conditionValue;
                default:
                    return false;
            }
        });

        // Evaluate matchType
        if (rule.matchType === 'all') {
            isMatch = conditionMatches.every(m => m === true);
        } else {
            isMatch = conditionMatches.some(m => m === true);
        }

        // Apply actions if matched
        if (isMatch) {
            ruleTriggered = true;
            for (const action of rule.actions) {
                switch (action.type) {
                    case 'categorize':
                        updates.category = action.value;
                        break;
                    case 'add_tag':
                        if (!updates.tags) updates.tags = [...(transaction.tags || [])];
                        if (!updates.tags.includes(action.value)) {
                            updates.tags.push(action.value);
                        }
                        break;
                    case 'flag_review':
                        updates.needsReview = true;
                        break;
                    // link_goal handled separately or by adding to a goals array
                }
            }

            // Mark rule as triggered
            await updateDoc(doc(db, COLLECTIONS.AUTO_RULES, rule.id), {
                lastTriggeredAt: serverTimestamp()
            }).catch(console.error);
        }
    }

    return ruleTriggered ? updates : null;
};
