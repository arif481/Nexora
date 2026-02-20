'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Plus, Link as LinkIcon, ArrowDown, Settings2, Trash2, Zap } from 'lucide-react';
import type { Habit } from '@/types';
import { useHabits } from '@/hooks/useHabits';

export function HabitStacking({ habits }: { habits: (Habit & { icon?: string; color?: string })[] }) {
    const { updateHabit } = useHabits();
    const [isAddOpen, setIsAddOpen] = useState(false);

    const [form, setForm] = useState({
        triggerHabitId: '',
        targetHabitId: '',
    });

    // Calculate habit stacks
    const stacks = useMemo(() => {
        // A stack is determined by target habits having another habit's ID in their triggers array.
        // For visualization, we group them into chains.
        type Node = Habit & { icon?: string; color?: string };

        // Create adjacency list
        const adj = new Map<string, string[]>(); // trigger -> targets
        const inDegree = new Map<string, number>();

        habits.forEach(h => {
            if (!adj.has(h.id)) adj.set(h.id, []);
            if (!inDegree.has(h.id)) inDegree.set(h.id, 0);

            h.triggers?.forEach(triggerId => {
                // Find if trigger is an actual habit ID
                if (habits.some(trigger => trigger.id === triggerId)) {
                    if (!adj.has(triggerId)) adj.set(triggerId, []);
                    adj.get(triggerId)!.push(h.id);
                    inDegree.set(h.id, (inDegree.get(h.id) || 0) + 1);
                }
            });
        });

        // Find roots (inDegree 0, but has outgoing edges) to start chains
        const chains: Node[][] = [];

        // Visit function for DFS to extract chains (simplified)
        const visited = new Set<string>();

        const dfs = (nodeId: string, currentChain: Node[]) => {
            const node = habits.find(h => h.id === nodeId);
            if (!node) return;

            currentChain.push(node);
            visited.add(nodeId);

            const nextNodes = adj.get(nodeId) || [];
            if (nextNodes.length > 0) {
                // Pick first target for simple stacking 1-to-1 visualize
                dfs(nextNodes[0], currentChain);
            } else {
                if (currentChain.length > 1) {
                    chains.push([...currentChain]);
                }
            }
        };

        habits.forEach(h => {
            if ((inDegree.get(h.id) || 0) === 0 && (adj.get(h.id) || []).length > 0 && !visited.has(h.id)) {
                dfs(h.id, []);
            }
        });

        return chains;
    }, [habits]);

    const handleCreateStack = async () => {
        if (!form.triggerHabitId || !form.targetHabitId || form.triggerHabitId === form.targetHabitId) return;

        const targetHabit = habits.find(h => h.id === form.targetHabitId);
        if (!targetHabit) return;

        const existingTriggers = targetHabit.triggers || [];
        if (!existingTriggers.includes(form.triggerHabitId)) {
            await updateHabit(targetHabit.id, {
                triggers: [...existingTriggers, form.triggerHabitId],
            });
        }

        setIsAddOpen(false);
        setForm({ triggerHabitId: '', targetHabitId: '' });
    };

    const handleRemoveStackLink = async (targetHabitId: string, triggerIdToRemove: string) => {
        const targetHabit = habits.find(h => h.id === targetHabitId);
        if (!targetHabit) return;

        const newTriggers = (targetHabit.triggers || []).filter(t => t !== triggerIdToRemove);
        await updateHabit(targetHabit.id, { triggers: newTriggers });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <LinkIcon className="w-5 h-5 text-neon-purple" />
                        Habit Stacking
                    </h3>
                    <p className="text-sm text-dark-400">Anchor new habits to existing well-established ones</p>
                </div>
                <Button variant="glow" size="sm" onClick={() => setIsAddOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
                    Create Stack
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stacks.length > 0 ? stacks.map((chain, i) => (
                    <Card key={i} variant="glass" className="p-5 border border-neon-purple/20">
                        <h4 className="font-semibold text-white mb-4">Routine Stack #{i + 1}</h4>
                        <div className="space-y-2">
                            {chain.map((habit, j) => (
                                <div key={habit.id}>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-dark-800/50 border border-dark-700">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center" style={{ color: habit.color || '#a855f7' }}>
                                                {j + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{habit.name}</p>
                                                {j === 0 ? (
                                                    <p className="text-xs text-neon-purple">Anchor Habit</p>
                                                ) : (
                                                    <p className="text-xs text-dark-400">Target Habit</p>
                                                )}
                                            </div>
                                        </div>
                                        {j > 0 && (
                                            <Button variant="ghost" size="sm" onClick={() => handleRemoveStackLink(habit.id, chain[j - 1].id)}>
                                                <Trash2 className="w-4 h-4 text-dark-400 hover:text-status-error" />
                                            </Button>
                                        )}
                                    </div>
                                    {j < chain.length - 1 && (
                                        <div className="flex justify-center py-1">
                                            <ArrowDown className="w-4 h-4 text-dark-500" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                )) : (
                    <div className="col-span-full py-12 text-center text-dark-400 bg-dark-800/20 rounded-2xl border border-dashed border-dark-700">
                        <LinkIcon className="w-8 h-8 mx-auto mb-3 text-dark-500" />
                        <p>No habit stacks created yet. Connect habits to build powerful routines.</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create Habit Stack">
                <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-dark-600 bg-dark-800/30">
                        <label className="text-sm font-medium text-dark-200 block mb-2">1. When I finish...</label>
                        <select
                            className="w-full bg-dark-800 border border-dark-600 rounded-xl p-3 text-sm text-white"
                            value={form.triggerHabitId}
                            onChange={e => setForm(f => ({ ...f, triggerHabitId: e.target.value }))}
                        >
                            <option value="" disabled>Select an anchor habit</option>
                            {habits.map(h => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-dark-400 mt-2">Pick an existing habit you already do consistently.</p>
                    </div>

                    <div className="flex justify-center -my-2 relative z-10">
                        <div className="w-8 h-8 rounded-full bg-dark-900 border border-dark-600 flex items-center justify-center">
                            <ArrowDown className="w-4 h-4 text-neon-purple" />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-neon-purple/30 bg-neon-purple/5">
                        <label className="text-sm font-medium text-neon-purple block mb-2">2. I will immediately...</label>
                        <select
                            className="w-full bg-dark-800 border border-neon-purple/30 rounded-xl p-3 text-sm text-white"
                            value={form.targetHabitId}
                            onChange={e => setForm(f => ({ ...f, targetHabitId: e.target.value }))}
                        >
                            <option value="" disabled>Select a new habit to stack</option>
                            {habits.map(h => (
                                <option key={h.id} value={h.id} disabled={h.id === form.triggerHabitId}>{h.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-dark-400 mt-2">Pick the new habit you are trying to build.</p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" className="flex-1" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button variant="glow" className="flex-1 text-neon-purple" onClick={handleCreateStack}>Link Habits</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
