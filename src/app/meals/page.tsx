'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarDays,
    Utensils,
    ShoppingCart,
    Plus,
    Search,
    Clock,
    Users,
    CheckCircle2,
    Trash2,
    ExternalLink,
    Heart
} from 'lucide-react';
import { MainLayout, PageContainer } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useRecipes, useWeeklyMealPlan, useGroceries } from '@/hooks/useMeals';
import { cn } from '@/lib/utils';
import type { Recipe, MealPlan, GroceryItem, MealType } from '@/types';
import { LoadingSpinner } from '@/components/ui/Loading';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { AddRecipeModal } from '@/components/features/meals/AddRecipeModal';

type TabId = 'planner' | 'recipes' | 'groceries';

export default function MealsPage() {
    const [activeTab, setActiveTab] = useState<TabId>('planner');
    const [currentDate, setCurrentDate] = useState(new Date());

    const { recipes, loading: recipesLoading, updateRecipe } = useRecipes();
    const { plans, loading: plansLoading, setMealPlan } = useWeeklyMealPlan(currentDate);
    const { items: groceries, loading: groceriesLoading, addItem, updateItem, deleteItem } = useGroceries();

    const [isAddRecipeOpen, setIsAddRecipeOpen] = useState(false);
    const [groceryInput, setGroceryInput] = useState('');

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

    const handleAddGrocery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!groceryInput.trim()) return;
        await addItem({ name: groceryInput.trim(), checked: false, category: 'other', quantity: '' });
        setGroceryInput('');
    };

    const getPlanForDay = (date: Date) => {
        return plans.find(p => isSameDay(new Date(p.date), date));
    };

    const TABS: { id: TabId; label: string; icon: any }[] = [
        { id: 'planner', label: 'Weekly Planner', icon: CalendarDays },
        { id: 'recipes', label: 'Recipes', icon: Utensils },
        { id: 'groceries', label: 'Groceries', icon: ShoppingCart },
    ];

    return (
        <MainLayout>
            <PageContainer
                title="Meal Planner"
                subtitle="Plan your meals, manage recipes, and track groceries"
                actions={
                    activeTab === 'recipes' && (
                        <Button variant="glow" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsAddRecipeOpen(true)}>
                            Add Recipe
                        </Button>
                    )
                }
            >
                {/* Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none snap-x mt-4">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all snap-start whitespace-nowrap border text-white/70",
                                    isActive
                                        ? "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20"
                                        : "bg-glass-light hover:text-white hover:bg-glass-medium border-transparent"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="mt-6">
                    <AnimatePresence mode="wait">
                        {activeTab === 'planner' && (
                            <motion.div key="planner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                                <div className="flex items-center justify-between bg-glass-light border border-glass-border p-4 rounded-xl">
                                    <h3 className="text-white font-medium">
                                        Week of {format(weekStart, 'MMMM d, yyyy')}
                                    </h3>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setCurrentDate(addDays(currentDate, -7))}>Prev Week</Button>
                                        <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
                                        <Button variant="outline" size="sm" onClick={() => setCurrentDate(addDays(currentDate, 7))}>Next Week</Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                                    {weekDays.map(day => {
                                        const plan = getPlanForDay(day);
                                        const isToday = isSameDay(day, new Date());

                                        return (
                                            <Card key={day.toISOString()} variant="glass" className={cn(isToday && "border-neon-cyan/50 shadow-[0_0_15px_rgba(0,240,255,0.1)]")}>
                                                <CardContent className="p-4">
                                                    <h4 className={cn("text-sm font-semibold mb-3 flex items-center justify-between", isToday ? "text-neon-cyan" : "text-white/80")}>
                                                        {format(day, 'EEEE')}
                                                        <span className="text-xs font-normal text-white/40">{format(day, 'MMM d')}</span>
                                                    </h4>

                                                    <div className="space-y-3">
                                                        {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => {
                                                            const meal = plan?.meals?.find(m => m.type === type);
                                                            const recipe = meal?.recipeId ? recipes.find(r => r.id === meal.recipeId) : null;

                                                            return (
                                                                <div key={type} className="group relative">
                                                                    <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">{type}</div>
                                                                    <button className="w-full text-left p-2 rounded-lg bg-dark-800/50 border border-glass-border hover:border-neon-cyan/30 transition-colors group-hover:bg-glass-medium min-h-[40px] flex items-center">
                                                                        {meal ? (
                                                                            <span className="text-sm text-white/90 truncate">
                                                                                {recipe ? recipe.title : meal.customName}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-sm text-white/20 italic">Not planned</span>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'recipes' && (
                            <motion.div key="recipes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                {recipesLoading ? (
                                    <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>
                                ) : recipes.length === 0 ? (
                                    <Card variant="glass" className="py-20 text-center border-dashed">
                                        <CardContent className="flex flex-col items-center">
                                            <div className="w-16 h-16 rounded-full bg-glass-medium flex items-center justify-center mb-4">
                                                <Utensils className="w-8 h-8 text-white/20" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-white mb-2">No recipes yet</h3>
                                            <p className="text-white/50 max-w-sm mb-6">Start building your personal cookbook to plan meals quickly.</p>
                                            <Button variant="glow" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsAddRecipeOpen(true)}>
                                                Add Your First Recipe
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {recipes.map(recipe => (
                                            <div key={recipe.id} className="bg-glass-light border border-glass-border rounded-xl overflow-hidden hover:border-white/20 transition-all group flex flex-col h-full cursor-pointer">
                                                {recipe.imageUrl ? (
                                                    <div className="h-40 overflow-hidden relative">
                                                        <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); updateRecipe(recipe.id, { isFavorite: !recipe.isFavorite }) }}
                                                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-dark-900/60 backdrop-blur text-white hover:text-neon-pink transition-colors"
                                                        >
                                                            <Heart className={cn("w-4 h-4", recipe.isFavorite && "fill-neon-pink text-neon-pink")} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="h-40 bg-dark-800 flex flex-col items-center justify-center text-white/20 relative">
                                                        <Utensils className="w-8 h-8 mb-2" />
                                                        <span className="text-xs font-semibold uppercase tracking-wider">No Image</span>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); updateRecipe(recipe.id, { isFavorite: !recipe.isFavorite }) }}
                                                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-dark-900/60 backdrop-blur text-white hover:text-neon-pink transition-colors"
                                                        >
                                                            <Heart className={cn("w-4 h-4", recipe.isFavorite && "fill-neon-pink text-neon-pink")} />
                                                        </button>
                                                    </div>
                                                )}
                                                <div className="p-4 flex-1 flex flex-col">
                                                    <h4 className="font-semibold text-white group-hover:text-neon-cyan transition-colors line-clamp-2 leading-tight mb-2">
                                                        {recipe.title}
                                                    </h4>
                                                    <div className="flex items-center gap-3 text-xs text-white/50 mb-3 mt-auto pt-4 border-t border-glass-border">
                                                        {recipe.prepTime && recipe.cookTime && (
                                                            <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {recipe.prepTime + recipe.cookTime}m</div>
                                                        )}
                                                        {recipe.servings && (
                                                            <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {recipe.servings}</div>
                                                        )}
                                                        {recipe.sourceUrl && (
                                                            <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-auto hover:text-neon-cyan" onClick={e => e.stopPropagation()}>
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'groceries' && (
                            <motion.div key="groceries" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl">
                                <Card variant="glass">
                                    <CardContent className="p-6">
                                        <form onSubmit={handleAddGrocery} className="flex gap-2 mb-6">
                                            <div className="relative flex-1">
                                                <ShoppingCart className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                                <input
                                                    type="text"
                                                    value={groceryInput}
                                                    onChange={e => setGroceryInput(e.target.value)}
                                                    placeholder="Add item (e.g., 2 dozen eggs)"
                                                    className="w-full pl-10 pr-4 py-3 bg-dark-800 border border-glass-border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 transition-colors"
                                                />
                                            </div>
                                            <Button type="submit" variant="glow" disabled={!groceryInput.trim()}>Add</Button>
                                        </form>

                                        {groceriesLoading ? (
                                            <div className="py-10 flex justify-center"><LoadingSpinner /></div>
                                        ) : groceries.length === 0 ? (
                                            <div className="py-12 text-center text-white/40">Your grocery list is empty.</div>
                                        ) : (
                                            <div className="space-y-2">
                                                {groceries.map(item => (
                                                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-glass-medium border border-transparent hover:border-glass-border transition-colors group">
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => updateItem(item.id, { checked: !item.checked })}
                                                                className={cn(
                                                                    "w-5 h-5 rounded-md flex items-center justify-center border transition-colors",
                                                                    item.checked ? "bg-neon-cyan border-neon-cyan text-dark-950" : "border-white/30 group-hover:border-white/60"
                                                                )}
                                                            >
                                                                {item.checked && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                            </button>
                                                            <span className={cn("text-white/90", item.checked && "text-white/30 line-through")}>
                                                                {item.name} {item.quantity && <span className="text-white/40 text-sm ml-2">({item.quantity})</span>}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => deleteItem(item.id)}
                                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </PageContainer>

            <AddRecipeModal isOpen={isAddRecipeOpen} onClose={() => setIsAddRecipeOpen(false)} />
        </MainLayout>
    );
}
