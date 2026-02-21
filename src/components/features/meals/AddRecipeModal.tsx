'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Utensils, Clock, Users, Link as LinkIcon, Image as ImageIcon, Plus, Trash2, Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRecipes } from '@/hooks/useMeals';
import { parseRecipeFromURL } from '@/lib/parsers/recipeParser';

interface AddRecipeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function AddRecipeModal({ isOpen, onClose, onSuccess }: AddRecipeModalProps) {
    const { createRecipe } = useRecipes();
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState('');
    const [prepTime, setPrepTime] = useState('');
    const [cookTime, setCookTime] = useState('');
    const [servings, setServings] = useState('');
    const [sourceUrl, setSourceUrl] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [ingredientInput, setIngredientInput] = useState('');
    const [ingredients, setIngredients] = useState<string[]>([]);
    const [instructionInput, setInstructionInput] = useState('');
    const [instructions, setInstructions] = useState<string[]>([]);
    const [importing, setImporting] = useState(false);

    const handleImportFromURL = async () => {
        if (!sourceUrl.trim()) return;
        setImporting(true);
        try {
            const result = await parseRecipeFromURL(sourceUrl.trim());
            if (result) {
                if (result.title && !title) setTitle(result.title);
                if (result.prepTime) setPrepTime(String(result.prepTime));
                if (result.cookTime) setCookTime(String(result.cookTime));
                if (result.servings) setServings(String(result.servings));
                if (result.ingredients?.length) setIngredients(result.ingredients);
                if (result.instructions?.length) setInstructions(result.instructions);
            }
        } catch (err) {
            console.error('Failed to parse recipe URL:', err);
        } finally {
            setImporting(false);
        }
    };

    const handleAddIngredient = (e: React.FormEvent) => {
        e.preventDefault();
        if (ingredientInput.trim()) {
            setIngredients([...ingredients, ingredientInput.trim()]);
            setIngredientInput('');
        }
    };

    const handleAddInstruction = (e: React.FormEvent) => {
        e.preventDefault();
        if (instructionInput.trim()) {
            setInstructions([...instructions, instructionInput.trim()]);
            setInstructionInput('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setLoading(true);
        try {
            await createRecipe({
                title: title.trim(),
                prepTime: prepTime ? Number(prepTime) : undefined,
                cookTime: cookTime ? Number(cookTime) : undefined,
                servings: servings ? Number(servings) : undefined,
                sourceUrl: sourceUrl.trim() || undefined,
                imageUrl: imageUrl.trim() || undefined,
                ingredients,
                instructions,
                isFavorite: false,
            });
            if (onSuccess) onSuccess();
            handleClose();
        } catch (error) {
            console.error('Failed to create recipe:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setPrepTime('');
        setCookTime('');
        setServings('');
        setSourceUrl('');
        setImageUrl('');
        setIngredients([]);
        setInstructions([]);
        setIngredientInput('');
        setInstructionInput('');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-dark-800 border border-glass-border rounded-2xl shadow-glass-lg overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-glass-border">
                            <h2 className="text-xl font-semibold text-white">Add Recipe</h2>
                            <button
                                onClick={handleClose}
                                className="p-2 text-white/50 hover:text-white hover:bg-glass-medium rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-8">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/70">Recipe Title *</label>
                                    <div className="relative">
                                        <Utensils className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                        <input
                                            type="text"
                                            required
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="e.g., Spicy Basil Chicken"
                                            className="w-full pl-9 pr-4 py-3 bg-glass-light border border-glass-border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white/70">Prep Time</label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                            <input
                                                type="number"
                                                min="0"
                                                value={prepTime}
                                                onChange={(e) => setPrepTime(e.target.value)}
                                                placeholder="mins"
                                                className="w-full pl-9 pr-4 py-3 bg-glass-light border border-glass-border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 transition-colors text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white/70">Cook Time</label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                            <input
                                                type="number"
                                                min="0"
                                                value={cookTime}
                                                onChange={(e) => setCookTime(e.target.value)}
                                                placeholder="mins"
                                                className="w-full pl-9 pr-4 py-3 bg-glass-light border border-glass-border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 transition-colors text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2 lg:col-span-2">
                                        <label className="text-sm font-medium text-white/70">Servings</label>
                                        <div className="relative">
                                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                            <input
                                                type="number"
                                                min="1"
                                                value={servings}
                                                onChange={(e) => setServings(e.target.value)}
                                                placeholder="e.g., 4"
                                                className="w-full pl-9 pr-4 py-3 bg-glass-light border border-glass-border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 transition-colors text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white/70">Source URL</label>
                                        <div className="relative">
                                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                            <input
                                                type="url"
                                                value={sourceUrl}
                                                onChange={(e) => setSourceUrl(e.target.value)}
                                                placeholder="https://..."
                                                className="w-full pl-9 pr-4 py-3 bg-glass-light border border-glass-border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 transition-colors text-sm"
                                            />
                                        </div>
                                        {sourceUrl.trim() && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleImportFromURL}
                                                disabled={importing}
                                                className="mt-1 text-xs"
                                            >
                                                {importing ? (
                                                    <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Parsing...</>
                                                ) : (
                                                    <><Wand2 className="w-3 h-3 mr-1" /> Auto-fill from URL</>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white/70">Image URL</label>
                                        <div className="relative">
                                            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                            <input
                                                type="url"
                                                value={imageUrl}
                                                onChange={(e) => setImageUrl(e.target.value)}
                                                placeholder="https://..."
                                                className="w-full pl-9 pr-4 py-3 bg-glass-light border border-glass-border rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 transition-colors text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full h-px bg-glass-border" />

                            {/* Ingredients */}
                            <div className="space-y-4">
                                <label className="text-sm font-medium text-white/70">Ingredients</label>
                                <form onSubmit={handleAddIngredient} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={ingredientInput}
                                        onChange={(e) => setIngredientInput(e.target.value)}
                                        placeholder="e.g., 2 cups flour"
                                        className="flex-1 bg-glass-light border border-glass-border rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-neon-cyan/50"
                                    />
                                    <Button type="submit" variant="outline" size="sm" disabled={!ingredientInput.trim()}>
                                        <Plus className="w-4 h-4" /> Add
                                    </Button>
                                </form>

                                {ingredients.length > 0 && (
                                    <ul className="space-y-2">
                                        {ingredients.map((ing, i) => (
                                            <li key={i} className="flex items-center justify-between p-2 rounded-lg bg-glass-light border border-glass-border text-sm text-white/90">
                                                <span>{ing}</span>
                                                <button onClick={() => setIngredients(ingredients.filter((_, idx) => idx !== i))} className="text-white/40 hover:text-red-400">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="w-full h-px bg-glass-border" />

                            {/* Instructions */}
                            <div className="space-y-4">
                                <label className="text-sm font-medium text-white/70">Instructions</label>
                                <form onSubmit={handleAddInstruction} className="flex gap-2">
                                    <textarea
                                        value={instructionInput}
                                        onChange={(e) => setInstructionInput(e.target.value)}
                                        placeholder="e.g., Preheat oven to 350°F..."
                                        className="flex-1 min-h-[40px] bg-glass-light border border-glass-border rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-neon-cyan/50 resize-y"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleAddInstruction(e);
                                            }
                                        }}
                                    />
                                    <Button type="submit" variant="outline" size="sm" disabled={!instructionInput.trim()}>
                                        <Plus className="w-4 h-4" /> Add Step
                                    </Button>
                                </form>

                                {instructions.length > 0 && (
                                    <ul className="space-y-2">
                                        {instructions.map((inst, i) => (
                                            <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-glass-light border border-glass-border text-sm text-white/90">
                                                <span className="w-5 h-5 rounded-full bg-neon-cyan/20 text-neon-cyan flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">
                                                    {i + 1}
                                                </span>
                                                <span className="flex-1">{inst}</span>
                                                <button onClick={() => setInstructions(instructions.filter((_, idx) => idx !== i))} className="text-white/40 hover:text-red-400 mt-0.5">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                        </div>

                        <div className="p-6 border-t border-glass-border bg-dark-800/50 flex justify-end gap-3">
                            <Button variant="ghost" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                variant="glow"
                                disabled={!title.trim() || loading}
                            >
                                {loading ? 'Saving...' : 'Save Recipe'}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
