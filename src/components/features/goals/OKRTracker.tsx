'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import {
    Target, Plus, Trash2, TrendingUp, CheckCircle2,
    AlertTriangle, Clock, Award, ChevronDown, ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Objective, KeyResult } from '@/types';

interface OKRTrackerProps {
    objectives: Objective[];
    onAddObjective: (data: Omit<Objective, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    onUpdateObjective: (id: string, updates: Partial<Objective>) => Promise<void>;
    onDeleteObjective: (id: string) => Promise<void>;
}

const STATUS_CONFIG = {
    on_track: { label: 'On Track', color: 'text-neon-green', bg: 'bg-neon-green/20', icon: CheckCircle2 },
    at_risk: { label: 'At Risk', color: 'text-neon-orange', bg: 'bg-neon-orange/20', icon: AlertTriangle },
    behind: { label: 'Behind', color: 'text-status-error', bg: 'bg-status-error/20', icon: Clock },
    achieved: { label: 'Achieved', color: 'text-neon-cyan', bg: 'bg-neon-cyan/20', icon: Award },
};

export function OKRTracker({ objectives, onAddObjective, onUpdateObjective, onDeleteObjective }: OKRTrackerProps) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [editingKR, setEditingKR] = useState<{ objId: string; krId: string } | null>(null);
    const [krValue, setKrValue] = useState('');

    const [form, setForm] = useState({
        title: '',
        description: '',
        timeframe: 'quarterly' as const,
        color: '#06b6d4',
        keyResults: [{ title: '', targetValue: 100, unit: '%' }] as { title: string; targetValue: number; unit: string }[],
    });

    const handleAddKeyResultField = () => {
        setForm(f => ({
            ...f,
            keyResults: [...f.keyResults, { title: '', targetValue: 100, unit: '%' }],
        }));
    };

    const handleRemoveKeyResultField = (idx: number) => {
        setForm(f => ({ ...f, keyResults: f.keyResults.filter((_, i) => i !== idx) }));
    };

    const handleSubmit = async () => {
        if (!form.title.trim() || form.keyResults.filter(kr => kr.title.trim()).length === 0) return;

        const now = new Date();
        const endDate = new Date(now);
        if (form.timeframe === 'quarterly') endDate.setMonth(endDate.getMonth() + 3);
        else if (form.timeframe === 'monthly') endDate.setMonth(endDate.getMonth() + 1);
        else endDate.setFullYear(endDate.getFullYear() + 1);

        await onAddObjective({
            userId: '', // Will be set by service
            title: form.title,
            description: form.description,
            timeframe: form.timeframe,
            startDate: now,
            endDate,
            status: 'on_track',
            color: form.color,
            keyResults: form.keyResults
                .filter(kr => kr.title.trim())
                .map((kr, i) => ({
                    id: `kr_${Date.now()}_${i}`,
                    title: kr.title,
                    targetValue: kr.targetValue,
                    currentValue: 0,
                    unit: kr.unit,
                    progress: 0,
                    status: 'not_started' as const,
                })),
        });

        setIsAddOpen(false);
        setForm({
            title: '',
            description: '',
            timeframe: 'quarterly',
            color: '#06b6d4',
            keyResults: [{ title: '', targetValue: 100, unit: '%' }],
        });
    };

    const handleUpdateKRProgress = async (objId: string, krId: string, newValue: number) => {
        const obj = objectives.find(o => o.id === objId);
        if (!obj) return;

        const updatedKRs = obj.keyResults.map(kr => {
            if (kr.id !== krId) return kr;
            const progress = Math.min(100, Math.round((newValue / kr.targetValue) * 100));
            return {
                ...kr,
                currentValue: newValue,
                progress,
                status: progress >= 100 ? 'completed' as const : progress > 0 ? 'in_progress' as const : 'not_started' as const,
            };
        });

        // Auto-update objective status based on KR progress
        const avgProgress = updatedKRs.reduce((s, kr) => s + kr.progress, 0) / updatedKRs.length;
        let status: Objective['status'] = 'on_track';
        if (avgProgress >= 100) status = 'achieved';
        else if (avgProgress < 30) status = 'behind';
        else if (avgProgress < 60) status = 'at_risk';

        await onUpdateObjective(objId, { keyResults: updatedKRs, status });
        setEditingKR(null);
        setKrValue('');
    };

    const getOverallProgress = (obj: Objective) => {
        if (obj.keyResults.length === 0) return 0;
        return Math.round(obj.keyResults.reduce((s, kr) => s + kr.progress, 0) / obj.keyResults.length);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Target className="w-5 h-5 text-neon-cyan" />
                        OKR Framework
                    </h3>
                    <p className="text-sm text-dark-400">Track Objectives & Key Results</p>
                </div>
                <Button variant="glow" size="sm" onClick={() => setIsAddOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
                    Add Objective
                </Button>
            </div>

            {/* Objectives List */}
            <div className="space-y-4">
                {objectives.map(obj => {
                    const isExpanded = expandedId === obj.id;
                    const progress = getOverallProgress(obj);
                    const statusCfg = STATUS_CONFIG[obj.status];
                    const StatusIcon = statusCfg.icon;

                    return (
                        <Card key={obj.id} variant="glass" className="overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: obj.color }} />
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-white">{obj.title}</h4>
                                            <Badge className={cn('text-[10px]', statusCfg.bg, statusCfg.color)} size="sm">
                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                {statusCfg.label}
                                            </Badge>
                                        </div>
                                        {obj.description && <p className="text-sm text-dark-400">{obj.description}</p>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setExpandedId(isExpanded ? null : obj.id)} className="p-1.5 rounded-lg hover:bg-dark-700/50">
                                            {isExpanded ? <ChevronUp className="w-4 h-4 text-dark-400" /> : <ChevronDown className="w-4 h-4 text-dark-400" />}
                                        </button>
                                        <button onClick={() => onDeleteObjective(obj.id)} className="p-1.5 rounded-lg hover:bg-red-500/20">
                                            <Trash2 className="w-4 h-4 text-dark-400 hover:text-status-error" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mb-1">
                                    <div className="flex-1">
                                        <Progress value={progress} variant="cyan" size="sm" />
                                    </div>
                                    <span className="text-sm font-medium" style={{ color: obj.color }}>{progress}%</span>
                                </div>
                                <div className="flex gap-4 text-xs text-dark-500 mt-2">
                                    <span className="capitalize">{obj.timeframe}</span>
                                    <span>{obj.keyResults.length} Key Results</span>
                                </div>

                                {/* Expanded Key Results */}
                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-dark-700/50 space-y-3">
                                        {obj.keyResults.map(kr => (
                                            <div key={kr.id} className="p-3 rounded-xl bg-dark-800/50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-sm text-white font-medium">{kr.title}</p>
                                                    <span className="text-xs text-dark-400">
                                                        {kr.currentValue}/{kr.targetValue} {kr.unit}
                                                    </span>
                                                </div>
                                                <Progress value={kr.progress} variant={kr.progress >= 100 ? 'green' : 'cyan'} size="sm" />

                                                {editingKR?.objId === obj.id && editingKR?.krId === kr.id ? (
                                                    <div className="flex gap-2 mt-2">
                                                        <Input
                                                            type="number"
                                                            placeholder="New value"
                                                            value={krValue}
                                                            onChange={(e) => setKrValue(e.target.value)}
                                                            className="flex-1"
                                                        />
                                                        <Button size="sm" variant="glow" onClick={() => handleUpdateKRProgress(obj.id, kr.id, Number(krValue))}>
                                                            Save
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => { setEditingKR({ objId: obj.id, krId: kr.id }); setKrValue(String(kr.currentValue)); }}
                                                        className="text-xs text-neon-cyan hover:underline mt-2 flex items-center gap-1"
                                                    >
                                                        <TrendingUp className="w-3 h-3" />
                                                        Update Progress
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}

                {objectives.length === 0 && (
                    <div className="py-12 text-center text-dark-400 bg-dark-800/20 rounded-2xl border border-dashed border-dark-700">
                        <Target className="w-8 h-8 mx-auto mb-3 text-dark-500" />
                        <p>No objectives set. Create your first OKR to start tracking meaningful goals.</p>
                    </div>
                )}
            </div>

            {/* Add Objective Modal */}
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create Objective">
                <div className="space-y-4">
                    <Input
                        label="Objective Title"
                        placeholder="e.g., Improve Physical Fitness"
                        value={form.title}
                        onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                    />
                    <Input
                        label="Description (optional)"
                        placeholder="Why this matters..."
                        value={form.description}
                        onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                    />

                    <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">Timeframe</label>
                        <select
                            className="w-full bg-dark-800 border border-dark-600 rounded-xl p-3 text-sm text-white"
                            value={form.timeframe}
                            onChange={(e) => setForm(f => ({ ...f, timeframe: e.target.value as any }))}
                        >
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-dark-300">Key Results</label>
                            <Button variant="ghost" size="sm" onClick={handleAddKeyResultField} leftIcon={<Plus className="w-3 h-3" />}>
                                Add KR
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {form.keyResults.map((kr, i) => (
                                <div key={i} className="flex gap-2 items-start">
                                    <div className="flex-1 space-y-2">
                                        <Input
                                            placeholder={`Key Result ${i + 1}`}
                                            value={kr.title}
                                            onChange={(e) => {
                                                const krs = [...form.keyResults];
                                                krs[i] = { ...krs[i], title: e.target.value };
                                                setForm(f => ({ ...f, keyResults: krs }));
                                            }}
                                        />
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                placeholder="Target"
                                                value={kr.targetValue.toString()}
                                                onChange={(e) => {
                                                    const krs = [...form.keyResults];
                                                    krs[i] = { ...krs[i], targetValue: Number(e.target.value) };
                                                    setForm(f => ({ ...f, keyResults: krs }));
                                                }}
                                            />
                                            <Input
                                                placeholder="Unit"
                                                value={kr.unit}
                                                onChange={(e) => {
                                                    const krs = [...form.keyResults];
                                                    krs[i] = { ...krs[i], unit: e.target.value };
                                                    setForm(f => ({ ...f, keyResults: krs }));
                                                }}
                                            />
                                        </div>
                                    </div>
                                    {form.keyResults.length > 1 && (
                                        <Button variant="ghost" size="sm" onClick={() => handleRemoveKeyResultField(i)}>
                                            <Trash2 className="w-4 h-4 text-dark-400" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" className="flex-1" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button variant="glow" className="flex-1" disabled={!form.title.trim()} onClick={handleSubmit}>
                            Create Objective
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
