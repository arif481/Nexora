'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Plus, Trash2, Play, Pause, ArrowRight, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AutomationRule {
    id: string;
    name: string;
    trigger: string;
    action: string;
    enabled: boolean;
    triggerType: 'habit_complete' | 'task_complete' | 'time_of_day' | 'wellness_log' | 'finance_threshold';
    actionType: 'create_task' | 'log_wellness' | 'send_notification' | 'add_habit_entry';
    createdAt: Date;
}

interface AutomationRulesProps {
    rules: AutomationRule[];
    onAddRule: (rule: Omit<AutomationRule, 'id' | 'createdAt'>) => void;
    onToggleRule: (id: string, enabled: boolean) => void;
    onDeleteRule: (id: string) => void;
}

const TRIGGER_OPTIONS = [
    { value: 'habit_complete', label: 'When a habit is completed', icon: '✅' },
    { value: 'task_complete', label: 'When a task is finished', icon: '📋' },
    { value: 'time_of_day', label: 'At a specific time', icon: '⏰' },
    { value: 'wellness_log', label: 'When a wellness entry is logged', icon: '💪' },
    { value: 'finance_threshold', label: 'When spending exceeds threshold', icon: '💰' },
];

const ACTION_OPTIONS = [
    { value: 'create_task', label: 'Create a new task', icon: '📝' },
    { value: 'log_wellness', label: 'Log a wellness entry', icon: '🏃' },
    { value: 'send_notification', label: 'Send a notification', icon: '🔔' },
    { value: 'add_habit_entry', label: 'Mark a habit complete', icon: '✨' },
];

export function AutomationRules({ rules, onAddRule, onToggleRule, onDeleteRule }: AutomationRulesProps) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [form, setForm] = useState({
        name: '',
        trigger: '',
        action: '',
        triggerType: 'habit_complete' as AutomationRule['triggerType'],
        actionType: 'create_task' as AutomationRule['actionType'],
    });

    const handleSubmit = () => {
        if (!form.name.trim() || !form.trigger.trim() || !form.action.trim()) return;
        onAddRule({ ...form, enabled: true });
        setIsAddOpen(false);
        setForm({ name: '', trigger: '', action: '', triggerType: 'habit_complete', actionType: 'create_task' });
    };

    return (
        <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-neon-orange" />
                    <h3 className="text-lg font-semibold text-white">AI Automation Rules</h3>
                </div>
                <Button variant="glow" size="sm" onClick={() => setIsAddOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
                    New Rule
                </Button>
            </CardHeader>
            <CardContent>
                <AnimatePresence mode="popLayout">
                    {rules.length === 0 ? (
                        <div className="py-8 text-center text-dark-400 border border-dashed border-dark-700 rounded-xl">
                            <Zap className="w-8 h-8 mx-auto mb-3 text-dark-500" />
                            <p className="text-sm">No automation rules yet</p>
                            <p className="text-xs text-dark-500 mt-1">Create IFTTT-style rules to automate your workflow</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {rules.map(rule => (
                                <motion.div
                                    key={rule.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className={cn(
                                        'p-4 rounded-xl border transition-all',
                                        rule.enabled
                                            ? 'bg-dark-800/50 border-neon-cyan/20'
                                            : 'bg-dark-900/30 border-dark-700/30 opacity-60'
                                    )}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Sparkles className={cn('w-4 h-4', rule.enabled ? 'text-neon-cyan' : 'text-dark-500')} />
                                                <h4 className="text-sm font-medium text-white">{rule.name}</h4>
                                                <Badge variant={rule.enabled ? 'cyan' : 'default'} size="sm">
                                                    {rule.enabled ? 'Active' : 'Paused'}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="text-dark-400 bg-dark-700/50 px-2 py-1 rounded-md">{rule.trigger}</span>
                                                <ArrowRight className="w-3 h-3 text-neon-orange" />
                                                <span className="text-dark-400 bg-dark-700/50 px-2 py-1 rounded-md">{rule.action}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 ml-2">
                                            <button
                                                onClick={() => onToggleRule(rule.id, !rule.enabled)}
                                                className="p-1.5 rounded-lg hover:bg-dark-700/50"
                                                title={rule.enabled ? 'Pause rule' : 'Enable rule'}
                                            >
                                                {rule.enabled
                                                    ? <Pause className="w-4 h-4 text-neon-orange" />
                                                    : <Play className="w-4 h-4 text-neon-green" />}
                                            </button>
                                            <button
                                                onClick={() => onDeleteRule(rule.id)}
                                                className="p-1.5 rounded-lg hover:bg-red-500/20"
                                            >
                                                <Trash2 className="w-4 h-4 text-dark-400 hover:text-status-error" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </CardContent>

            {/* Add Rule Modal */}
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create Automation Rule">
                <div className="space-y-4">
                    <Input
                        label="Rule Name"
                        placeholder="e.g., Post-workout wellness log"
                        value={form.name}
                        onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    />

                    <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">When... (Trigger)</label>
                        <select
                            className="w-full bg-dark-800 border border-dark-600 rounded-xl p-3 text-sm text-white mb-2"
                            value={form.triggerType}
                            onChange={(e) => setForm(f => ({ ...f, triggerType: e.target.value as any }))}
                        >
                            {TRIGGER_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.icon} {o.label}</option>
                            ))}
                        </select>
                        <Input
                            placeholder="Specific condition (e.g., 'Morning Run' is completed)"
                            value={form.trigger}
                            onChange={(e) => setForm(f => ({ ...f, trigger: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">Then... (Action)</label>
                        <select
                            className="w-full bg-dark-800 border border-dark-600 rounded-xl p-3 text-sm text-white mb-2"
                            value={form.actionType}
                            onChange={(e) => setForm(f => ({ ...f, actionType: e.target.value as any }))}
                        >
                            {ACTION_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.icon} {o.label}</option>
                            ))}
                        </select>
                        <Input
                            placeholder="Specific action (e.g., Log 30min cardio in Wellness)"
                            value={form.action}
                            onChange={(e) => setForm(f => ({ ...f, action: e.target.value }))}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" className="flex-1" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button variant="glow" className="flex-1" disabled={!form.name.trim()} onClick={handleSubmit}>
                            Create Rule
                        </Button>
                    </div>
                </div>
            </Modal>
        </Card>
    );
}
