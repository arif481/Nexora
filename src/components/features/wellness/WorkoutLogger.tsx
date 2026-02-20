'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dumbbell, Plus, Trash2, Clock, Activity, Target } from 'lucide-react';
import type { Exercise, ExerciseSet } from '@/types';

interface WorkoutLoggerProps {
    initialExercises?: Exercise[];
    onSave: (exercises: Exercise[]) => void;
    onCancel: () => void;
}

export function WorkoutLogger({ initialExercises = [], onSave, onCancel }: WorkoutLoggerProps) {
    const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
    const [currentExercise, setCurrentExercise] = useState<Partial<Exercise>>({
        type: '',
        duration: 30,
        intensity: 'medium',
        sets: [{ reps: 10, weight: 0 }],
    });

    const [isAddingMode, setIsAddingMode] = useState(initialExercises.length === 0);

    const handleAddSet = () => {
        setCurrentExercise(prev => ({
            ...prev,
            sets: [...(prev.sets || []), { reps: 10, weight: 0, duration: 0 }]
        }));
    };

    const handleUpdateSet = (index: number, field: keyof ExerciseSet, value: number) => {
        setCurrentExercise(prev => {
            const newSets = [...(prev.sets || [])];
            newSets[index] = { ...newSets[index], [field]: value };
            return { ...prev, sets: newSets };
        });
    };

    const handleRemoveSet = (index: number) => {
        setCurrentExercise(prev => ({
            ...prev,
            sets: prev.sets?.filter((_, i) => i !== index),
        }));
    };

    const handleSaveExercise = () => {
        if (!currentExercise.type) return;

        // Auto-calculate duration from sets if needed, but we just use the field
        const newExercise: Exercise = {
            id: crypto.randomUUID(),
            type: currentExercise.type,
            duration: currentExercise.duration || 30,
            intensity: currentExercise.intensity as any || 'medium',
            sets: currentExercise.sets,
            notes: currentExercise.notes,
        };

        setExercises([...exercises, newExercise]);

        // Reset form
        setCurrentExercise({
            type: '',
            duration: 30,
            intensity: 'medium',
            sets: [{ reps: 10, weight: 0 }],
        });
        setIsAddingMode(false);
    };

    const handleRemoveExercise = (id: string) => {
        setExercises(exercises.filter(e => e.id !== id));
    };

    return (
        <div className="space-y-6">
            {exercises.length > 0 && !isAddingMode && (
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-dark-300">Today's Workout</h4>
                    <div className="space-y-3">
                        {exercises.map((exercise) => (
                            <div key={exercise.id} className="p-4 rounded-xl bg-dark-800/50 border border-dark-700">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <Dumbbell className="w-5 h-5 text-neon-orange" />
                                        <h5 className="font-medium text-white">{exercise.type}</h5>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => handleRemoveExercise(exercise.id!)}>
                                        <Trash2 className="w-4 h-4 text-dark-400 hover:text-status-error" />
                                    </Button>
                                </div>

                                <div className="flex gap-4 text-xs text-dark-400 mb-3">
                                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {exercise.duration}m</span>
                                    <span className="flex items-center gap-1 capitalize"><Activity className="w-3.5 h-3.5" /> {exercise.intensity}</span>
                                </div>

                                {exercise.sets && exercise.sets.length > 0 && (
                                    <div className="space-y-1.5 pt-3 border-t border-dark-700/50">
                                        <div className="grid grid-cols-3 text-[10px] font-medium text-dark-500 uppercase tracking-wider px-2">
                                            <span>Set</span>
                                            <span className="text-center">lbs/kg</span>
                                            <span className="text-right">Reps/Sec</span>
                                        </div>
                                        {exercise.sets.map((set, idx) => (
                                            <div key={idx} className="grid grid-cols-3 text-sm text-dark-300 bg-dark-800/80 p-2 rounded-lg">
                                                <span className="text-dark-500 font-medium">{idx + 1}</span>
                                                <span className="text-center">{set.weight || '-'}</span>
                                                <span className="text-right">{set.reps ? `${set.reps} reps` : set.duration ? `${set.duration}s` : '-'}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <Button variant="outline" className="w-full mt-2" onClick={() => setIsAddingMode(true)} leftIcon={<Plus className="w-4 h-4" />}>
                        Add Another Exercise
                    </Button>
                </div>
            )}

            {isAddingMode && (
                <div className="p-4 rounded-xl border border-dark-600 bg-dark-900 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-white flex items-center gap-2">
                            <Target className="w-4 h-4 text-neon-cyan" /> New Exercise
                        </h4>
                        {exercises.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => setIsAddingMode(false)}>Cancel</Button>
                        )}
                    </div>
                    <Input
                        label="Exercise Name"
                        placeholder="e.g. Barbell Squats"
                        value={currentExercise.type || ''}
                        onChange={(e) => setCurrentExercise({ ...currentExercise, type: e.target.value })}
                    />

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-dark-300 mb-2">Duration (min)</label>
                            <Input
                                type="number"
                                value={currentExercise.duration?.toString() || '0'}
                                onChange={(e) => setCurrentExercise({ ...currentExercise, duration: Number(e.target.value) })}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-dark-300 mb-2">Intensity</label>
                            <select
                                className="w-full bg-dark-800 border border-dark-600 rounded-xl p-3 text-sm text-white focus:border-neon-cyan"
                                value={currentExercise.intensity}
                                onChange={(e) => setCurrentExercise({ ...currentExercise, intensity: e.target.value as any })}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-dark-700/50">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-dark-300">Sets</label>
                            <Button variant="ghost" size="sm" onClick={handleAddSet} leftIcon={<Plus className="w-4 h-4" />}>Add Set</Button>
                        </div>

                        {currentExercise.sets?.map((set, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <div className="w-8 text-center text-dark-500 font-medium text-sm">{idx + 1}</div>
                                <div className="flex-1 relative">
                                    <Input
                                        type="number"
                                        placeholder="Weight"
                                        value={set.weight?.toString() || ''}
                                        onChange={(e) => handleUpdateSet(idx, 'weight', Number(e.target.value))}
                                    />
                                    <span className="absolute right-3 top-3 text-xs text-dark-500 pointer-events-none">lbs</span>
                                </div>
                                <div className="flex-1 relative">
                                    <Input
                                        type="number"
                                        placeholder="Reps"
                                        value={set.reps?.toString() || ''}
                                        onChange={(e) => handleUpdateSet(idx, 'reps', Number(e.target.value))}
                                    />
                                    <span className="absolute right-3 top-3 text-xs text-dark-500 pointer-events-none">reps</span>
                                </div>
                                <Button variant="ghost" size="sm" className="px-2" onClick={() => handleRemoveSet(idx)}>
                                    <Trash2 className="w-4 h-4 text-dark-400" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <Button variant="glow" className="w-full mt-4" disabled={!currentExercise.type} onClick={handleSaveExercise}>
                        Save Exercise
                    </Button>
                </div>
            )}

            {exercises.length > 0 && !isAddingMode && (
                <div className="flex gap-3 pt-6 mt-6 border-t border-dark-700/50">
                    <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
                    <Button variant="glow" className="flex-1" onClick={() => onSave(exercises)}>Log Full Workout</Button>
                </div>
            )}
        </div>
    );
}
