import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    setDoc,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../firebase';
import type { Recipe, MealPlan, GroceryItem } from '@/types';

const convertTimestamp = (timestamp: Timestamp | Date | null | undefined): Date | undefined => {
    if (!timestamp) return undefined;
    if (timestamp instanceof Timestamp) {
        return timestamp.toDate();
    }
    return timestamp instanceof Date ? timestamp : new Date(timestamp);
};

// --- Recipes ---

const convertRecipeFromFirestore = (doc: any): Recipe => {
    const data = doc.data();
    return {
        id: doc.id,
        userId: data.userId,
        title: data.title,
        sourceUrl: data.sourceUrl,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        servings: data.servings,
        ingredients: data.ingredients || [],
        instructions: data.instructions || [],
        tags: data.tags || [],
        imageUrl: data.imageUrl,
        notes: data.notes,
        isFavorite: data.isFavorite || false,
        createdAt: convertTimestamp(data.createdAt) || new Date(),
        updatedAt: convertTimestamp(data.updatedAt) || new Date(),
    };
};

export const createRecipe = async (
    userId: string,
    recipeData: Partial<Omit<Recipe, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<string> => {
    if (!recipeData.title) throw new Error('Recipe title is required');

    const recipesRef = collection(db, COLLECTIONS.RECIPES);

    const newRecipe = {
        userId,
        title: recipeData.title,
        sourceUrl: recipeData.sourceUrl || null,
        prepTime: recipeData.prepTime || null,
        cookTime: recipeData.cookTime || null,
        servings: recipeData.servings || null,
        ingredients: recipeData.ingredients || [],
        instructions: recipeData.instructions || [],
        tags: recipeData.tags || [],
        imageUrl: recipeData.imageUrl || null,
        notes: recipeData.notes || null,
        isFavorite: recipeData.isFavorite || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(recipesRef, newRecipe);
    return docRef.id;
};

export const updateRecipe = async (recipeId: string, updates: Partial<Recipe>): Promise<void> => {
    const recipeRef = doc(db, COLLECTIONS.RECIPES, recipeId);
    const cleanUpdates: Record<string, any> = {};
    Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) cleanUpdates[key] = value;
    });

    await updateDoc(recipeRef, { ...cleanUpdates, updatedAt: serverTimestamp() });
};

export const deleteRecipe = async (recipeId: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.RECIPES, recipeId));
};

export const subscribeToRecipes = (
    userId: string,
    callback: (recipes: Recipe[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    const recipesRef = collection(db, COLLECTIONS.RECIPES);
    const q = query(recipesRef, where('userId', '==', userId), orderBy('title', 'asc'));

    return onSnapshot(
        q,
        (snapshot) => callback(snapshot.docs.map(convertRecipeFromFirestore)),
        (error) => {
            console.error('Error subscribing to recipes:', error);
            if (onError) onError(error);
        }
    );
};

// --- Meal Plans ---

const convertMealPlanFromFirestore = (doc: any): MealPlan => {
    const data = doc.data();
    return {
        id: doc.id,
        userId: data.userId,
        date: convertTimestamp(data.date) || new Date(),
        meals: data.meals || [],
        notes: data.notes,
        updatedAt: convertTimestamp(data.updatedAt) || new Date(),
    };
};

export const setMealPlan = async (
    userId: string,
    dateStr: string, // YYYY-MM-DD
    planData: Partial<Omit<MealPlan, 'id' | 'userId' | 'date' | 'updatedAt'>>
): Promise<void> => {
    const planRef = doc(db, COLLECTIONS.MEAL_PLANS, `${userId}_${dateStr}`);

    const newPlan = {
        userId,
        date: Timestamp.fromDate(new Date(dateStr)),
        meals: planData.meals || [],
        notes: planData.notes || null,
        updatedAt: serverTimestamp(),
    };

    await setDoc(planRef, newPlan, { merge: true });
};

export const subscribeToMealPlans = (
    userId: string,
    startDate: Date,
    endDate: Date,
    callback: (plans: MealPlan[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    const plansRef = collection(db, COLLECTIONS.MEAL_PLANS);
    // Compare date stamps to fetch the range
    const q = query(
        plansRef,
        where('userId', '==', userId),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'asc')
    );

    return onSnapshot(
        q,
        (snapshot) => callback(snapshot.docs.map(convertMealPlanFromFirestore)),
        (error) => {
            console.error('Error subscribing to meal plans:', error);
            if (onError) onError(error);
        }
    );
};

// --- Grocery List ---

const convertGroceryFromFirestore = (doc: any): GroceryItem => {
    const data = doc.data();
    return {
        id: doc.id,
        userId: data.userId,
        name: data.name,
        category: data.category || 'other',
        quantity: data.quantity || '',
        checked: data.checked || false,
        createdAt: convertTimestamp(data.createdAt) || new Date(),
    };
};

export const addGroceryItem = async (
    userId: string,
    itemData: Partial<Omit<GroceryItem, 'id' | 'userId' | 'createdAt'>>
): Promise<string> => {
    if (!itemData.name) throw new Error('Grocery item name is required');
    const groceriesRef = collection(db, COLLECTIONS.GROCERY_LIST);
    const docRef = await addDoc(groceriesRef, {
        userId,
        name: itemData.name,
        category: itemData.category || 'other',
        quantity: itemData.quantity || '',
        checked: itemData.checked || false,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
};

export const updateGroceryItem = async (itemId: string, updates: Partial<GroceryItem>): Promise<void> => {
    const itemRef = doc(db, COLLECTIONS.GROCERY_LIST, itemId);
    const cleanUpdates: Record<string, any> = {};
    Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) cleanUpdates[key] = value;
    });
    await updateDoc(itemRef, cleanUpdates);
};

export const deleteGroceryItem = async (itemId: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.GROCERY_LIST, itemId));
};

export const subscribeToGroceries = (
    userId: string,
    callback: (items: GroceryItem[]) => void,
    onError?: (error: Error) => void
): (() => void) => {
    const groceriesRef = collection(db, COLLECTIONS.GROCERY_LIST);
    const q = query(groceriesRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));

    return onSnapshot(
        q,
        (snapshot) => callback(snapshot.docs.map(convertGroceryFromFirestore)),
        (error) => {
            console.error('Error subscribing to grocery list:', error);
            if (onError) onError(error);
        }
    );
};
