'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Camera, Upload, Check, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useReceipts } from '@/hooks/useReceipts';
import type { ReceiptScan } from '@/types';

export function ReceiptScanner() {
    const { receipts, isProcessing, processReceiptImage, deleteReceipt } = useReceipts();
    const [isScanOpen, setIsScanOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            await processReceiptImage(file);
            setIsScanOpen(false);
        } catch (err) {
            console.error('Failed to process receipt', err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-white">Receipt Scanner</h3>
                    <p className="text-sm text-dark-400">AI-powered receipt data extraction</p>
                </div>
                <Button variant="glow" size="sm" onClick={() => setIsScanOpen(true)} leftIcon={<Camera className="w-4 h-4" />}>
                    Scan Receipt
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {receipts.map(receipt => (
                    <Card key={receipt.id} variant="glass" className="overflow-hidden">
                        <div className="h-32 bg-dark-800 relative group overflow-hidden border-b border-dark-700">
                            {receipt.imageUrl ? (
                                <img src={receipt.imageUrl} alt="Receipt" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-dark-500" />
                                </div>
                            )}
                            <div className="absolute top-2 right-2">
                                <Button variant="ghost" size="sm" className="bg-black/50 hover:bg-black/80" onClick={() => deleteReceipt(receipt.id)}>
                                    <Trash2 className="w-4 h-4 text-status-error" />
                                </Button>
                            </div>
                        </div>
                        <CardContent className="p-4 space-y-2">
                            <h4 className="font-semibold text-white truncate" title={receipt.merchantName}>{receipt.merchantName}</h4>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-dark-400">{new Date(receipt.date).toLocaleDateString()}</span>
                                <span className="font-medium text-neon-green">${receipt.totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2 pt-2 text-xs text-dark-400 border-t border-dark-700/50">
                                <Check className="w-3 h-3 text-neon-cyan" />
                                <span>AI Processed</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {receipts.length === 0 && (
                    <div className="col-span-full py-12 text-center text-dark-400 bg-dark-800/20 rounded-2xl border border-dashed border-dark-700">
                        <Camera className="w-8 h-8 mx-auto mb-3 text-dark-500" />
                        <p>No receipts scanned. Snap a picture of a receipt to auto-extract data.</p>
                    </div>
                )}
            </div>

            <Modal isOpen={isScanOpen} onClose={() => { if (!isProcessing) setIsScanOpen(false); }} title="Scan New Receipt">
                <div className="space-y-6 text-center py-4">
                    <div className="mx-auto w-24 h-24 rounded-full bg-neon-cyan/10 flex items-center justify-center mb-6">
                        <Camera className="w-10 h-10 text-neon-cyan" />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-lg font-medium text-white">Upload Receipt Image</h3>
                        <p className="text-sm text-dark-400 pb-4">Take a photo or upload an image file of your receipt. NOVA will automatically extract the merchant, total amount, and date.</p>
                    </div>

                    <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        disabled={isProcessing}
                    />

                    <div className="flex gap-3 pt-6">
                        <Button variant="outline" className="flex-1" onClick={() => setIsScanOpen(false)} disabled={isProcessing}>
                            Cancel
                        </Button>
                        <Button variant="glow" className="flex-1 text-center" disabled={isProcessing} onClick={() => fileInputRef.current?.click()}>
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2 inline" />
                                    Select Image
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
