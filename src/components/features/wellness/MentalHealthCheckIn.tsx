'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Heart, Activity, Smile, Frown, Meh, Brain, Flame, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StressData } from '@/types';

interface MentalHealthCheckInProps {
    initialData?: StressData;
    onSave: (data: StressData) => void;
    onCancel: () => void;
}

const COMMON_TRIGGERS = ['Work', 'Finances', 'Health', 'Relationships', 'Lack of Sleep', 'News/Social Media'];
const COMMON_COPING = ['Meditation', 'Exercise', 'Talking to someone', 'Deep breathing', 'Taking a walk', 'Reading'];

export function MentalHealthCheckIn({ initialData, onSave, onCancel }: MentalHealthCheckInProps) {
    const [step, setStep] = useState(1);
    const [data, setData] = useState<Partial<StressData>>({
        level: initialData?.level || 5, // 1-10 (10 = highest stress)
        triggers: initialData?.triggers || [],
        copingMethods: initialData?.copingMethods || [],
        notes: initialData?.notes || '',
    });

    const handleToggleTrigger = (trigger: string) => {
        setData(prev => ({
            ...prev,
            triggers: prev.triggers?.includes(trigger)
                ? prev.triggers.filter(t => t !== trigger)
                : [...(prev.triggers || []), trigger]
        }));
    };

    const handleToggleCoping = (method: string) => {
        setData(prev => ({
            ...prev,
            copingMethods: prev.copingMethods?.includes(method)
                ? prev.copingMethods.filter(m => m !== method)
                : [...(prev.copingMethods || []), method]
        }));
    };

    const handleSave = () => {
        onSave({
            level: data.level || 5,
            triggers: data.triggers || [],
            copingMethods: data.copingMethods || [],
            notes: data.notes || '',
        });
    };

    const currentMood = Math.max(1, 11 - (data.level || 5)); // Reverse stress to get mood (1-10)

    return (
        <div className="space-y-6">
            {/* Step Indicators */}
            <div className="flex items-center justify-between mb-8 px-4">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex flex-col items-center">
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300",
                            step >= s ? "bg-neon-pink text-dark-900" : "bg-dark-800 text-dark-400"
                        )}>
                            {s}
                        </div>
                        <span className="text-xs text-dark-400 mt-2">{s === 1 ? 'Energy' : s === 2 ? 'Factors' : 'Journal'}</span>
                    </div>
                ))}
                {/* Lines between steps */}
                <div className="absolute left-10 right-10 top-4 h-0.5 bg-dark-800 -z-10" />
                <div
                    className="absolute left-10 h-0.5 bg-neon-pink -z-10 transition-all duration-300"
                    style={{ width: `${(step - 1) * 35}%`, right: 'auto' }}
                />
            </div>

            {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-medium text-white">How are you feeling right now?</h3>
                        <p className="text-sm text-dark-400">Select your current stress and energy level.</p>
                    </div>

                    <div className="flex justify-center py-6">
                        {currentMood >= 8 ? (
                            <Smile className="w-24 h-24 text-neon-green" />
                        ) : currentMood >= 5 ? (
                            <Meh className="w-24 h-24 text-neon-cyan" />
                        ) : (
                            <Frown className="w-24 h-24 text-neon-orange" />
                        )}
                    </div>

                    <div className="px-4 space-y-4">
                        <input
                            type="range"
                            min="1"
                            max="10"
                            className="w-full accent-neon-pink"
                            value={data.level}
                            onChange={(e) => setData({ ...data, level: parseInt(e.target.value) })}
                        />
                        <div className="flex justify-between text-xs font-medium uppercase tracking-wider">
                            <span className="text-neon-green">Low Stress</span>
                            <span className={data.level! > 5 ? "text-neon-orange" : "text-dark-400"}>Medium</span>
                            <span className="text-status-error">High Stress</span>
                        </div>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div>
                        <h4 className="flex items-center gap-2 text-sm font-medium text-white mb-3">
                            <Flame className="w-4 h-4 text-neon-orange" />
                            What's triggering your stress? (Optional)
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {COMMON_TRIGGERS.map(t => (
                                <button
                                    key={t}
                                    onClick={() => handleToggleTrigger(t)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                                        data.triggers?.includes(t)
                                            ? "bg-neon-orange/20 border-neon-orange text-neon-orange"
                                            : "bg-dark-800 border-dark-700 text-dark-300 hover:border-dark-500"
                                    )}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="flex items-center gap-2 text-sm font-medium text-white mb-3 mt-8">
                            <Heart className="w-4 h-4 text-neon-pink" />
                            What are you doing to cope? (Optional)
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {COMMON_COPING.map(c => (
                                <button
                                    key={c}
                                    onClick={() => handleToggleCoping(c)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                                        data.copingMethods?.includes(c)
                                            ? "bg-neon-pink/20 border-neon-pink text-neon-pink"
                                            : "bg-dark-800 border-dark-700 text-dark-300 hover:border-dark-500"
                                    )}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                    <div className="text-center space-y-2 mb-4">
                        <Heart className="w-8 h-8 text-neon-pink mx-auto mb-2" />
                        <h3 className="text-xl font-medium text-white">Mood Journal</h3>
                        <p className="text-sm text-dark-400">Write down any thoughts affecting your mental space today.</p>
                    </div>

                    <textarea
                        className="w-full h-40 bg-dark-900 border border-dark-700 rounded-xl p-4 text-sm text-white focus:border-neon-pink focus:outline-none focus:ring-1 focus:ring-neon-pink resize-none transition-colors"
                        placeholder="I feel..."
                        value={data.notes}
                        onChange={(e) => setData({ ...data, notes: e.target.value })}
                    />
                </div>
            )}

            <div className="flex justify-between pt-6 border-t border-dark-800">
                <Button variant="ghost" onClick={step === 1 ? onCancel : () => setStep(step - 1)}>
                    {step === 1 ? 'Cancel' : 'Back'}
                </Button>
                <Button variant="glow" onClick={step === 3 ? handleSave : () => setStep(step + 1)}>
                    {step === 3 ? 'Finish Check-in' : 'Next Step'}
                </Button>
            </div>
        </div>
    );
}
