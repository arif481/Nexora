'use client';

import React, { useMemo } from 'react';
import { Activity, ArrowDownCircle, ArrowUpCircle, CheckCircle, AlertCircle, Loader2, Wifi, WifiOff, BookOpen, RefreshCw } from 'lucide-react';
import type { SyncState } from '@/hooks/useAutoEduPlanrSync';

interface SyncMonitorProps {
    syncState: SyncState;
    isConnected: boolean;
    onManualSync?: () => void;
    compact?: boolean;
}

export default function SyncMonitor({ syncState, isConnected, onManualSync, compact = false }: SyncMonitorProps) {
    const statusConfig = useMemo(() => {
        switch (syncState.status) {
            case 'syncing':
                return {
                    icon: <Loader2 className="w-4 h-4 animate-spin" />,
                    color: 'text-cyan-400',
                    bgColor: 'bg-cyan-500/10',
                    borderColor: 'border-cyan-500/30',
                    pulseColor: 'bg-cyan-400',
                    label: syncState.direction === 'push' ? 'Pushing...' : syncState.direction === 'pull' ? 'Pulling...' : 'Syncing...',
                };
            case 'success':
                return {
                    icon: <CheckCircle className="w-4 h-4" />,
                    color: 'text-emerald-400',
                    bgColor: 'bg-emerald-500/10',
                    borderColor: 'border-emerald-500/30',
                    pulseColor: 'bg-emerald-400',
                    label: 'Synced',
                };
            case 'error':
                return {
                    icon: <AlertCircle className="w-4 h-4" />,
                    color: 'text-red-400',
                    bgColor: 'bg-red-500/10',
                    borderColor: 'border-red-500/30',
                    pulseColor: 'bg-red-400',
                    label: 'Error',
                };
            default:
                return {
                    icon: <Activity className="w-4 h-4" />,
                    color: 'text-slate-400',
                    bgColor: 'bg-slate-500/10',
                    borderColor: 'border-slate-500/20',
                    pulseColor: 'bg-slate-400',
                    label: 'Idle',
                };
        }
    }, [syncState.status, syncState.direction]);

    const timeAgo = (date: Date | null) => {
        if (!date) return 'Never';
        const diff = Date.now() - date.getTime();
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        return `${Math.floor(diff / 3600000)}h ago`;
    };

    if (!isConnected) {
        if (compact) return null;
        return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-500 text-xs">
                <WifiOff className="w-3.5 h-3.5" />
                <span>EduPlanr not connected</span>
            </div>
        );
    }

    // ─── Compact mode (for header/navbar) ───
    if (compact) {
        return (
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${statusConfig.bgColor} ${statusConfig.borderColor} border ${statusConfig.color} transition-all duration-300`}>
                <div className="relative">
                    <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.pulseColor}`} />
                    {syncState.status === 'syncing' && (
                        <div className={`absolute inset-0 w-1.5 h-1.5 rounded-full ${statusConfig.pulseColor} animate-ping opacity-75`} />
                    )}
                </div>
                <BookOpen className="w-3 h-3" />
                <span className="font-medium">{statusConfig.label}</span>
            </div>
        );
    }

    // ─── Full mode (for dashboard/settings) ───
    return (
        <div className={`relative overflow-hidden rounded-xl border ${statusConfig.borderColor} ${statusConfig.bgColor} backdrop-blur-sm transition-all duration-500`}>
            {/* Animated background gradient */}
            {syncState.status === 'syncing' && (
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent animate-shimmer"
                        style={{ animation: 'shimmer 2s ease-in-out infinite' }} />
                </div>
            )}

            <div className="relative p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <div className={`w-2.5 h-2.5 rounded-full ${statusConfig.pulseColor}`} />
                            {(syncState.status === 'syncing' || syncState.status === 'success') && (
                                <div className={`absolute inset-0 w-2.5 h-2.5 rounded-full ${statusConfig.pulseColor} animate-ping opacity-75`} />
                            )}
                        </div>
                        <span className={`text-sm font-semibold ${statusConfig.color}`}>
                            Nexora ↔ EduPlanr Bridge
                        </span>
                    </div>
                    {onManualSync && (
                        <button
                            onClick={onManualSync}
                            disabled={syncState.status === 'syncing'}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
                        >
                            <RefreshCw className={`w-3 h-3 ${syncState.status === 'syncing' ? 'animate-spin' : ''}`} />
                            Sync Now
                        </button>
                    )}
                </div>

                {/* Data Flow Visualization */}
                <div className="flex items-center justify-between gap-3 mb-3">
                    {/* Nexora Node */}
                    <div className="flex flex-col items-center gap-1 min-w-[70px]">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${syncState.direction === 'push' ? 'bg-cyan-500/20 ring-2 ring-cyan-400/50' : 'bg-slate-700/50'} transition-all duration-300`}>
                            <Wifi className="w-5 h-5 text-cyan-400" />
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">Nexora</span>
                    </div>

                    {/* Data Flow Arrows */}
                    <div className="flex-1 flex flex-col items-center gap-0.5">
                        <div className="flex items-center gap-1">
                            <ArrowUpCircle className={`w-3.5 h-3.5 transition-all duration-300 ${syncState.direction === 'push' ? 'text-cyan-400 scale-125' : 'text-slate-600'}`} />
                            <div className="flex gap-[2px]">
                                {[0, 1, 2, 3, 4].map(i => (
                                    <div
                                        key={`up-${i}`}
                                        className={`w-1 h-1 rounded-full transition-all ${syncState.status === 'syncing' && syncState.direction === 'push'
                                                ? 'bg-cyan-400 animate-pulse'
                                                : 'bg-slate-700'
                                            }`}
                                        style={syncState.status === 'syncing' ? { animationDelay: `${i * 150}ms` } : {}}
                                    />
                                ))}
                            </div>
                            <span className="text-[9px] text-slate-600">{syncState.pushCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <ArrowDownCircle className={`w-3.5 h-3.5 transition-all duration-300 ${syncState.direction === 'pull' ? 'text-purple-400 scale-125' : 'text-slate-600'}`} />
                            <div className="flex gap-[2px]">
                                {[0, 1, 2, 3, 4].map(i => (
                                    <div
                                        key={`down-${i}`}
                                        className={`w-1 h-1 rounded-full transition-all ${syncState.status === 'syncing' && syncState.direction === 'pull'
                                                ? 'bg-purple-400 animate-pulse'
                                                : 'bg-slate-700'
                                            }`}
                                        style={syncState.status === 'syncing' ? { animationDelay: `${i * 150}ms` } : {}}
                                    />
                                ))}
                            </div>
                            <span className="text-[9px] text-slate-600">{syncState.pullCount}</span>
                        </div>
                    </div>

                    {/* EduPlanr Node */}
                    <div className="flex flex-col items-center gap-1 min-w-[70px]">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${syncState.direction === 'pull' ? 'bg-purple-500/20 ring-2 ring-purple-400/50' : 'bg-slate-700/50'} transition-all duration-300`}>
                            <BookOpen className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">EduPlanr</span>
                    </div>
                </div>

                {/* Status Footer */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-3">
                        <span>↓ {timeAgo(syncState.lastPullAt)}</span>
                        <span>↑ {timeAgo(syncState.lastPushAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        {statusConfig.icon}
                        <span className={statusConfig.color}>{statusConfig.label}</span>
                    </div>
                </div>

                {/* Error display */}
                {syncState.lastError && (
                    <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                        {syncState.lastError}
                    </div>
                )}
            </div>

            {/* CSS for shimmer animation */}
            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}
