'use client';

import { useState, useCallback, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import {
    Upload, FileText, CheckCircle, AlertCircle, X,
    ChevronDown, ArrowRight, Loader2,
} from 'lucide-react';
import { parseCSVFile, parseJSONFile, suggestFieldMappings } from '@/lib/importers/csvParser';
import { useTasks } from '@/hooks/useTasks';
import { useContacts } from '@/hooks/useContacts';
import { useTransactions } from '@/hooks/useFinance';

type ImportType = 'tasks' | 'contacts' | 'transactions' | 'flashcards';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export function BulkImportModal({ isOpen, onClose }: Props) {
    const [importType, setImportType] = useState<ImportType>('tasks');
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [fieldMap, setFieldMap] = useState<Record<string, string>>({});
    const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
    const [totalRows, setTotalRows] = useState(0);
    const [errors, setErrors] = useState<string[]>([]);
    const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'done'>('upload');
    const [importing, setImporting] = useState(false);
    const [importedCount, setImportedCount] = useState(0);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { createTask } = useTasks();
    const { createContact } = useContacts();
    const { createTransaction } = useTransactions();

    const targetFields: Record<ImportType, { key: string; label: string; required?: boolean }[]> = {
        tasks: [
            { key: 'title', label: 'Title', required: true },
            { key: 'description', label: 'Description' },
            { key: 'priority', label: 'Priority' },
            { key: 'dueDate', label: 'Due Date' },
            { key: 'status', label: 'Status' },
        ],
        contacts: [
            { key: 'name', label: 'Name', required: true },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'address', label: 'Address' },
            { key: 'birthday', label: 'Birthday' },
            { key: 'notes', label: 'Notes' },
        ],
        transactions: [
            { key: 'amount', label: 'Amount', required: true },
            { key: 'description', label: 'Description' },
            { key: 'date', label: 'Date', required: true },
            { key: 'category', label: 'Category' },
        ],
        flashcards: [
            { key: 'front', label: 'Front (Question)', required: true },
            { key: 'back', label: 'Back (Answer)', required: true },
            { key: 'difficulty', label: 'Difficulty' },
        ],
    };

    const handleFile = useCallback(async (f: File) => {
        setFile(f);
        setErrors([]);

        const isJSON = f.name.endsWith('.json');
        const result = isJSON
            ? await parseJSONFile(f)
            : await parseCSVFile(f, {}); // empty map to get raw data

        if (result.errors.length > 0) {
            setErrors(result.errors);
            return;
        }

        setHeaders(result.headers);
        setTotalRows(result.totalRows);

        // Auto-suggest field mappings
        const suggested = suggestFieldMappings(result.headers, importType);
        setFieldMap(suggested);

        // For JSON, data is already parsed
        if (isJSON) {
            setPreviewData(result.data.slice(0, 5) as Record<string, unknown>[]);
        } else {
            // Re-parse with identity map to get raw preview
            const rawResult = await parseCSVFile<Record<string, unknown>>(
                f,
                Object.fromEntries(result.headers.map(h => [h, h]))
            );
            setPreviewData(rawResult.data.slice(0, 5));
        }

        setStep('map');
    }, [importType]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f && (f.name.endsWith('.csv') || f.name.endsWith('.json'))) {
            handleFile(f);
        } else {
            setErrors(['Please upload a .csv or .json file']);
        }
    }, [handleFile]);

    const handleImport = async () => {
        if (!file) return;
        setImporting(true);
        setImportedCount(0);

        try {
            const isJSON = file.name.endsWith('.json');
            let data: Record<string, unknown>[];

            if (isJSON) {
                const result = await parseJSONFile<Record<string, unknown>>(file);
                // Apply field mapping to JSON
                data = result.data.map(row => {
                    const mapped: Record<string, unknown> = {};
                    Object.entries(fieldMap).forEach(([src, target]) => {
                        if (row[src] !== undefined) mapped[target] = row[src];
                    });
                    // Also accept direct target field names
                    Object.keys(row).forEach(k => {
                        if (targetFields[importType].some(f => f.key === k) && !mapped[k]) {
                            mapped[k] = row[k];
                        }
                    });
                    return mapped;
                });
            } else {
                const result = await parseCSVFile<Record<string, unknown>>(file, fieldMap);
                data = result.data;
            }

            let count = 0;
            for (const item of data) {
                try {
                    switch (importType) {
                        case 'tasks':
                            if (item.title) {
                                await createTask({
                                    title: String(item.title),
                                    description: item.description ? String(item.description) : undefined,
                                    priority: (['low', 'medium', 'high', 'critical'].includes(String(item.priority || '').toLowerCase())
                                        ? String(item.priority).toLowerCase() as 'low' | 'medium' | 'high'
                                        : 'medium'),
                                    status: 'todo',
                                    dueDate: item.dueDate ? new Date(String(item.dueDate)) : undefined,
                                });
                                count++;
                            }
                            break;
                        case 'contacts':
                            if (item.name) {
                                await createContact({
                                    name: String(item.name),
                                    email: item.email ? String(item.email) : undefined,
                                    phone: item.phone ? String(item.phone) : undefined,
                                    address: item.address ? String(item.address) : undefined,
                                    relationship: 'other',
                                    notes: item.notes ? String(item.notes) : undefined,
                                });
                                count++;
                            }
                            break;
                        case 'transactions':
                            if (item.amount && item.date) {
                                const amount = parseFloat(String(item.amount).replace(/[^0-9.-]/g, ''));
                                if (!isNaN(amount)) {
                                    await createTransaction({
                                        amount: Math.abs(amount),
                                        type: amount < 0 ? 'expense' : 'income',
                                        category: item.category ? String(item.category) : 'Other',
                                        description: item.description ? String(item.description) : undefined,
                                        date: new Date(String(item.date)),
                                        currency: 'USD',
                                        recurring: false,
                                        tags: [],
                                        attachments: [],
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    } as any);
                                    count++;
                                }
                            }
                            break;
                    }
                } catch {
                    // Skip failed rows silently
                }
                setImportedCount(count);
            }

            setImportedCount(count);
            setStep('done');
        } catch (err) {
            setErrors([`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`]);
        } finally {
            setImporting(false);
        }
    };

    const reset = () => {
        setFile(null);
        setHeaders([]);
        setFieldMap({});
        setPreviewData([]);
        setTotalRows(0);
        setErrors([]);
        setStep('upload');
        setImporting(false);
        setImportedCount(0);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Import Data">
            <div className="space-y-4">
                {/* Import Type Selector */}
                {step === 'upload' && (
                    <>
                        <div>
                            <label className="block text-sm text-white/60 mb-2">What are you importing?</label>
                            <div className="grid grid-cols-2 gap-2">
                                {([
                                    { key: 'tasks', label: '📋 Tasks', desc: 'From Todoist, Notion, etc.' },
                                    { key: 'contacts', label: '👥 Contacts', desc: 'From Google, Outlook, etc.' },
                                    { key: 'transactions', label: '💰 Transactions', desc: 'Bank statements, CSVs' },
                                    { key: 'flashcards', label: '🎴 Flashcards', desc: 'From Anki, Quizlet' },
                                ] as const).map(t => (
                                    <button
                                        key={t.key}
                                        onClick={() => setImportType(t.key)}
                                        className={cn(
                                            'p-3 rounded-xl border text-left transition-all',
                                            importType === t.key
                                                ? 'bg-neon-cyan/10 border-neon-cyan/50 text-white'
                                                : 'bg-dark-800/40 border-dark-700 text-dark-400 hover:border-dark-500'
                                        )}
                                    >
                                        <p className="text-sm font-medium">{t.label}</p>
                                        <p className="text-[10px] mt-0.5 opacity-60">{t.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Drop Zone */}
                        <div
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                                dragOver
                                    ? 'border-neon-cyan bg-neon-cyan/5'
                                    : 'border-dark-600 hover:border-dark-400'
                            )}
                        >
                            <Upload className={cn('w-8 h-8 mx-auto mb-3', dragOver ? 'text-neon-cyan' : 'text-dark-500')} />
                            <p className="text-sm text-white/70">Drop CSV or JSON file here</p>
                            <p className="text-xs text-dark-500 mt-1">or click to browse</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.json"
                                className="hidden"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleFile(f);
                                }}
                            />
                        </div>
                    </>
                )}

                {/* Column Mapping */}
                {step === 'map' && (
                    <>
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-neon-cyan" />
                            <span className="text-sm text-white">{file?.name}</span>
                            <span className="text-xs text-dark-400">({totalRows} rows)</span>
                            <button onClick={reset} className="ml-auto p-1 rounded hover:bg-dark-700"><X className="w-3 h-3 text-dark-400" /></button>
                        </div>

                        <div>
                            <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Column Mapping</p>
                            <div className="space-y-2 max-h-[250px] overflow-y-auto scrollbar-thin">
                                {headers.map(header => (
                                    <div key={header} className="flex items-center gap-2">
                                        <span className="text-xs text-dark-300 w-28 truncate" title={header}>{header}</span>
                                        <ArrowRight className="w-3 h-3 text-dark-600 flex-shrink-0" />
                                        <select
                                            value={fieldMap[header] || ''}
                                            onChange={(e) => setFieldMap(prev => {
                                                const next = { ...prev };
                                                if (e.target.value) next[header] = e.target.value;
                                                else delete next[header];
                                                return next;
                                            })}
                                            className="flex-1 px-2 py-1.5 rounded-lg bg-dark-800 border border-dark-700 text-white text-xs focus:outline-none focus:border-neon-cyan"
                                        >
                                            <option value="">— Skip —</option>
                                            {targetFields[importType].map(f => (
                                                <option key={f.key} value={f.key}>
                                                    {f.label}{f.required ? ' *' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Preview */}
                        {previewData.length > 0 && (
                            <div>
                                <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Preview (first 5 rows)</p>
                                <div className="overflow-x-auto rounded-lg border border-dark-700">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="bg-dark-800">
                                                {headers.slice(0, 5).map(h => (
                                                    <th key={h} className="px-2 py-1.5 text-left text-dark-400 font-medium">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.map((row, i) => (
                                                <tr key={i} className="border-t border-dark-800">
                                                    {headers.slice(0, 5).map(h => (
                                                        <td key={h} className="px-2 py-1.5 text-dark-300 truncate max-w-[120px]">
                                                            {String(row[h] || '')}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={reset}>Back</Button>
                            <Button
                                variant="glow"
                                className="flex-1"
                                onClick={handleImport}
                                disabled={Object.keys(fieldMap).length === 0 || importing}
                            >
                                {importing ? (
                                    <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Importing... ({importedCount})</>
                                ) : (
                                    <>Import {totalRows} rows</>
                                )}
                            </Button>
                        </div>
                    </>
                )}

                {/* Done */}
                {step === 'done' && (
                    <div className="text-center py-6">
                        <CheckCircle className="w-12 h-12 text-neon-green mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-white">Import Complete!</h3>
                        <p className="text-sm text-dark-400 mt-1">
                            Successfully imported {importedCount} of {totalRows} rows as {importType}.
                        </p>
                        <div className="flex gap-2 mt-4 justify-center">
                            <Button variant="ghost" onClick={reset}>Import More</Button>
                            <Button variant="glow" onClick={handleClose}>Done</Button>
                        </div>
                    </div>
                )}

                {/* Errors */}
                {errors.length > 0 && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                        <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            <span className="text-sm text-red-400 font-medium">Errors</span>
                        </div>
                        {errors.map((err, i) => (
                            <p key={i} className="text-xs text-red-300/80">{err}</p>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
}
