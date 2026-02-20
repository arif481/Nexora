'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
    createRecipe as createRecipeService,
    updateRecipe as updateRecipeService,
    deleteRecipe as deleteRecipeService,
    subscribeToRecipes,
    setMealPlan as setMealPlanService,
    subscribeToMealPlans,
    addGroceryItem as addGroceryItemService,
    updateGroceryItem as updateGroceryItemService,
    deleteGroceryItem as deleteGroceryItemService,
    subscribeToGroceries,
} from '@/lib/services/meals';
import type { Recipe, MealPlan, GroceryItem } from '@/types';
import { startOfWeek, endOfWeek } from 'date-fns';

export function useRecipes() {
    const { user } = useAuth();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user) {
            setRecipes([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToRecipes(
            user.uid,
            (data) => {
                setRecipes(data);
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

    const createRecipe = useCallback(
        async (recipeData: Partial<Omit<Recipe, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
            if (!user) throw new Error('User not authenticated');
            return await createRecipeService(user.uid, recipeData);
        },
        [user]
    );

    const updateRecipe = useCallback(
        async (recipeId: string, updates: Partial<Recipe>) => {
            await updateRecipeService(recipeId, updates);
        },
        []
    );

    const deleteRecipe = useCallback(
        async (recipeId: string) => {
            await deleteRecipeService(recipeId);
        },
        []
    );

    return {
        recipes,
        loading,
        error,
        createRecipe,
        updateRecipe,
        deleteRecipe,
    };
}

export function useWeeklyMealPlan(currentDate: Date) {
    const { user } = useAuth();
    const [plans, setPlans] = useState<MealPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user) {
            setPlans([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
        const end = endOfWeek(currentDate, { weekStartsOn: 1 }); // Sunday

        const unsubscribe = subscribeToMealPlans(
            user.uid,
            start,
            end,
            (data) => {
                setPlans(data);
                setLoading(false);
                setError(null);
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user, currentDate]);

    const setMealPlan = useCallback(
        async (dateStr: string, planData: Partial<Omit<MealPlan, 'id' | 'userId' | 'date' | 'updatedAt'>>) => {
            if (!user) throw new Error('User not authenticated');
            await setMealPlanService(user.uid, dateStr, planData);
        },
        [user]
    );

    return {
        plans,
        loading,
        error,
        setMealPlan,
    };
}

export function useGroceries() {
    const { user } = useAuth();
    const [items, setItems] = useState<GroceryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!user) {
            setItems([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToGroceries(
            user.uid,
            (data) => {
                setItems(data);
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

    const addItem = useCallback(
        async (itemData: Partial<Omit<GroceryItem, 'id' | 'userId' | 'createdAt'>>) => {
            if (!user) throw new Error('User not authenticated');
            return await addGroceryItemService(user.uid, itemData);
        },
        [user]
    );

    const updateItem = useCallback(
        async (itemId: string, updates: Partial<GroceryItem>) => {
            await updateGroceryItemService(itemId, updates);
        },
        []
    );

    const deleteItem = useCallback(
        async (itemId: string) => {
            await deleteGroceryItemService(itemId);
        },
        []
    );

    return {
        items,
        loading,
        error,
        addItem,
        updateItem,
        deleteItem,
    };
}
