'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Progress } from '@/components/ui/Progress';
import { Plus, Trash2, TrendingDown } from 'lucide-react';
import type { Debt } from '@/types';
import { useDebts } from '@/hooks/useDebts';

export function DebtTracker() {
    const { debts, addDebt, deleteDebt, editDebt } = useDebts();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [form, setForm] = useState({
        name: '', type: 'credit_card', totalAmount: '', currentBalance: '', interestRate: '', minimumPayment: ''
    });

    const handleSubmit = async () => {
        if (!form.name || !form.currentBalance) return;
        await addDebt({
            name: form.name,
            type: form.type as any,
            totalAmount: parseFloat(form.totalAmount) || parseFloat(form.currentBalance),
            currentBalance: parseFloat(form.currentBalance),
            interestRate: parseFloat(form.interestRate) || 0,
            minimumPayment: parseFloat(form.minimumPayment) || 0,
            dueDate: new Date(),
            strategy: 'avalanche',
            isPaidOff: false,
        });
        setIsAddOpen(false);
        setForm({ name: '', type: 'credit_card', totalAmount: '', currentBalance: '', interestRate: '', minimumPayment: '' });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-white">Debt Tracker</h3>
                    <p className="text-sm text-dark-400">Snowball & Avalanche payoff plans</p>
                </div>
                <Button variant="glow" size="sm" onClick={() => setIsAddOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
                    Add Debt
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {debts.map(debt => {
                    const progress = debt.totalAmount > 0 ? ((debt.totalAmount - debt.currentBalance) / debt.totalAmount) * 100 : 0;
                    return (
                        <Card key={debt.id} variant="glass" className="p-5 border border-neon-orange/20">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-semibold text-white">{debt.name}</h4>
                                    <p className="text-xs text-dark-400 capitalize">{debt.type.replace('_', ' ')}</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => deleteDebt(debt.id)}>
                                    <Trash2 className="w-4 h-4 text-status-error" />
                                </Button>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-dark-400">Balance</span>
                                    <span className="font-medium text-neon-orange">${debt.currentBalance.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-dark-400">Interest Rate (APR)</span>
                                    <span className="font-medium text-white">{debt.interestRate}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-dark-400">Min Payment</span>
                                    <span className="font-medium text-white">${debt.minimumPayment}</span>
                                </div>

                                <div className="pt-2">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-dark-400">Payoff Progress</span>
                                        <span className="text-white">{progress.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={progress} variant="orange" className="h-2" />
                                </div>
                            </div>
                        </Card>
                    );
                })}
                {debts.length === 0 && (
                    <div className="col-span-full py-12 text-center text-dark-400 bg-dark-800/20 rounded-2xl border border-dashed border-dark-700">
                        <TrendingDown className="w-8 h-8 mx-auto mb-3 text-dark-500" />
                        <p>No debts tracked yet. Add one to start your payoff plan.</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Debt">
                <div className="space-y-4">
                    <Input label="Debt Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Chase Sapphire" />
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm text-dark-400 mb-1 block">Type</label>
                            <select className="w-full bg-dark-800 border border-dark-600 rounded-xl p-2.5 text-sm text-white" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                                <option value="credit_card">Credit Card</option>
                                <option value="student_loan">Student Loan</option>
                                <option value="mortgage">Mortgage</option>
                                <option value="auto_loan">Auto Loan</option>
                                <option value="personal">Personal Loan</option>
                            </select>
                        </div>
                        <Input label="Current Balance" type="number" value={form.currentBalance} onChange={e => setForm(f => ({ ...f, currentBalance: e.target.value }))} placeholder="0.00" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Interest Rate (%)" type="number" step="0.1" value={form.interestRate} onChange={e => setForm(f => ({ ...f, interestRate: e.target.value }))} placeholder="0.00" />
                        <Input label="Minimum Payment" type="number" value={form.minimumPayment} onChange={e => setForm(f => ({ ...f, minimumPayment: e.target.value }))} placeholder="0.00" />
                    </div>
                    <Input label="Total Original Amount (Optional)" type="number" value={form.totalAmount} onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))} placeholder="0.00" />

                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" className="flex-1" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button variant="glow" className="flex-1" onClick={handleSubmit}>Save</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
