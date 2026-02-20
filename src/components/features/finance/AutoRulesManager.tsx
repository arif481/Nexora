'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Plus, Trash2, Zap, ArrowRight, Settings } from 'lucide-react';
import type { AutoRule } from '@/types';
import { useAutoRules } from '@/hooks/useAutoRules';

export function AutoRulesManager() {
    const { rules, addRule, deleteRule } = useAutoRules();
    const [isAddOpen, setIsAddOpen] = useState(false);

    const [form, setForm] = useState({
        name: '',
        matchField: 'description',
        matchOperator: 'contains',
        matchValue: '',
        actionType: 'categorize',
        actionValue: ''
    });

    const handleSubmit = async () => {
        if (!form.name || !form.matchValue || !form.actionValue) return;

        await addRule({
            name: form.name,
            isActive: true,
            conditions: [{
                field: form.matchField as 'description' | 'amount' | 'merchant' | 'account',
                operator: form.matchOperator as any,
                value: form.matchValue
            }],
            actions: [{
                type: form.actionType as any,
                value: form.actionValue
            }],
            matchType: 'all'
        });

        setIsAddOpen(false);
        setForm({
            name: '', matchField: 'description', matchOperator: 'contains', matchValue: '', actionType: 'categorize', actionValue: ''
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-white">Auto-Rules Engine</h3>
                    <p className="text-sm text-dark-400">Automate your transaction processing</p>
                </div>
                <Button variant="glow" size="sm" onClick={() => setIsAddOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
                    New Rule
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {rules.map(rule => (
                    <Card key={rule.id} variant="glass" className="p-4 border border-neon-cyan/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-10 h-10 rounded-full bg-neon-cyan/10 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-neon-cyan" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-white mb-1">{rule.name}</h4>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-dark-300">
                                    <span className="px-2 py-1 bg-dark-800 rounded">
                                        If {rule.conditions[0]?.field} <span className="text-neon-cyan">{rule.conditions[0]?.operator.replace('_', ' ')}</span> "{rule.conditions[0]?.value}"
                                    </span>
                                    <ArrowRight className="w-3 h-3 text-dark-400" />
                                    <span className="px-2 py-1 bg-dark-800 rounded">
                                        Then <span className="text-neon-cyan">{rule.actions[0]?.type}</span> as "{rule.actions[0]?.value}"
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${rule.isActive ? 'bg-neon-green/20 text-neon-green' : 'bg-dark-600 text-dark-400'}`}>
                                {rule.isActive ? 'Active' : 'Paused'}
                            </span>
                            <Button variant="ghost" size="sm" onClick={() => deleteRule(rule.id)}>
                                <Trash2 className="w-4 h-4 text-status-error" />
                            </Button>
                        </div>
                    </Card>
                ))}

                {rules.length === 0 && (
                    <div className="py-12 text-center text-dark-400 bg-dark-800/20 rounded-2xl border border-dashed border-dark-700">
                        <Settings className="w-8 h-8 mx-auto mb-3 text-dark-500" />
                        <p>No rules active. Set up auto-categorization to save time.</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create Automation Rule">
                <div className="space-y-4">
                    <Input label="Rule Title" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Auto-tag Starbucks" />

                    <div className="p-4 rounded-xl border border-dark-600 space-y-4">
                        <h4 className="text-sm font-medium text-white mb-2">Condition (IF)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <select className="w-full bg-dark-800 border border-dark-600 rounded-xl p-2.5 text-sm text-white" value={form.matchField} onChange={e => setForm(f => ({ ...f, matchField: e.target.value }))}>
                                <option value="description">Description (Name)</option>
                                <option value="amount">Amount</option>
                            </select>
                            <select className="w-full bg-dark-800 border border-dark-600 rounded-xl p-2.5 text-sm text-white" value={form.matchOperator} onChange={e => setForm(f => ({ ...f, matchOperator: e.target.value }))}>
                                <option value="contains">Contains</option>
                                <option value="equals">Equals Exact</option>
                                <option value="starts_with">Starts With</option>
                            </select>
                            <Input label="" placeholder="e.g. Starbucks" value={form.matchValue} onChange={e => setForm(f => ({ ...f, matchValue: e.target.value }))} className="h-[42px] mt-0.5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-neon-cyan/30 bg-neon-cyan/5 space-y-4">
                        <h4 className="text-sm font-medium text-neon-cyan mb-2">Action (THEN)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <select className="w-full bg-dark-800 border border-neon-cyan/30 rounded-xl p-2.5 text-sm text-white" value={form.actionType} onChange={e => setForm(f => ({ ...f, actionType: e.target.value }))}>
                                <option value="categorize">Set Category</option>
                                <option value="add_tag">Add Tag</option>
                                <option value="flag_review">Flag For Review</option>
                            </select>
                            <Input label="" placeholder="e.g. food" value={form.actionValue} onChange={e => setForm(f => ({ ...f, actionValue: e.target.value }))} className="h-[42px] mt-0.5" />
                        </div>
                        <p className="text-xs text-dark-400">For 'categorize', enter valid category IDs, like 'food' or 'entertainment'.</p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" className="flex-1" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button variant="glow" className="flex-1" onClick={handleSubmit}>Create Rule</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
