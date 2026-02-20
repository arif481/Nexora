'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Plus, Trash2, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import type { InvestmentPortfolio } from '@/types';
import { useInvestments } from '@/hooks/useInvestments';

export function InvestmentTracker() {
    const { portfolios, addPortfolio, deletePortfolio } = useInvestments();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [form, setForm] = useState({
        name: '',
        type: 'stocks',
        costBasis: '',
        totalValue: ''
    });

    const handleSubmit = async () => {
        if (!form.name || !form.totalValue) return;

        await addPortfolio({
            name: form.name,
            type: form.type as any,
            costBasis: parseFloat(form.costBasis) || parseFloat(form.totalValue),
            totalValue: parseFloat(form.totalValue),
            holdings: [],
        });

        setIsAddOpen(false);
        setForm({ name: '', type: 'stocks', costBasis: '', totalValue: '' });
    };

    const calculateReturn = (current: number, cost: number) => {
        if (!cost) return 0;
        return ((current - cost) / cost) * 100;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-white">Investment Portfolios</h3>
                    <p className="text-sm text-dark-400">Track your assets and net returns</p>
                </div>
                <Button variant="glow" size="sm" onClick={() => setIsAddOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
                    Add Portfolio
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {portfolios.map(portfolio => {
                    const returns = calculateReturn(portfolio.totalValue, portfolio.costBasis);
                    const isPositive = returns >= 0;

                    return (
                        <Card key={portfolio.id} variant="glass" className="p-5 border" style={{ borderColor: isPositive ? 'rgba(34,197,94,0.2)' : 'rgba(249,115,22,0.2)' }}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-semibold text-white">{portfolio.name}</h4>
                                    <p className="text-xs text-dark-400 capitalize">{portfolio.type.replace('_', ' ')}</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => deletePortfolio(portfolio.id)}>
                                    <Trash2 className="w-4 h-4 text-status-error" />
                                </Button>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-dark-400">Total Value</span>
                                    <span className="font-medium text-white">${portfolio.totalValue.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-dark-400">Cost Basis</span>
                                    <span className="font-medium text-dark-300">${portfolio.costBasis.toLocaleString()}</span>
                                </div>

                                <div className="pt-2 border-t border-dark-700/50 mt-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-dark-400">Net Return</span>
                                        <div className="flex items-center gap-1">
                                            {isPositive ? <TrendingUp className="w-4 h-4 text-neon-green" /> : <TrendingDown className="w-4 h-4 text-neon-orange" />}
                                            <span className={isPositive ? "font-medium text-neon-green" : "font-medium text-neon-orange"}>
                                                {returns > 0 ? '+' : ''}{returns.toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })}

                {portfolios.length === 0 && (
                    <div className="col-span-full py-12 text-center text-dark-400 bg-dark-800/20 rounded-2xl border border-dashed border-dark-700">
                        <TrendingUp className="w-8 h-8 mx-auto mb-3 text-dark-500" />
                        <p>No portfolios tracked yet. Add one to start monitoring your investments.</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Portfolio">
                <div className="space-y-4">
                    <Input label="Portfolio Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Fidelity 401k or Crypto Wallet" />
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-dark-400 mb-1 block">Type</label>
                            <select className="w-full bg-dark-800 border border-dark-600 rounded-xl p-2.5 text-sm text-white" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                                <option value="stocks">Stocks/ETFs</option>
                                <option value="crypto">Cryptocurrency</option>
                                <option value="real_estate">Real Estate</option>
                                <option value="retirement">Retirement Account</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Total Cost Basis" type="number" value={form.costBasis} onChange={e => setForm(f => ({ ...f, costBasis: e.target.value }))} placeholder="Amount invested" />
                        <Input label="Current Total Value" type="number" value={form.totalValue} onChange={e => setForm(f => ({ ...f, totalValue: e.target.value }))} placeholder="Present value" />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" className="flex-1" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button variant="glow" className="flex-1" onClick={handleSubmit}>Save</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
