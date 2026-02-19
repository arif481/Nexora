// Finance CSV import/export utilities

export interface CSVRow {
    [key: string]: string;
}

export interface ColumnMapping {
    date: string;
    description: string;
    amount: string;
    type?: string; // 'income' or 'expense' column
    category?: string;
}

/** Parse a CSV file into an array of row objects */
export function parseCSV(file: File): Promise<CSVRow[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split(/\r?\n/).filter(Boolean);
                if (lines.length < 2) {
                    resolve([]);
                    return;
                }
                const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                const rows: CSVRow[] = lines.slice(1).map(line => {
                    // Handle quoted commas
                    const values = line.match(/(".*?"|[^,]+)(?=,|$)/g) || line.split(',');
                    const row: CSVRow = {};
                    headers.forEach((h, i) => {
                        row[h] = (values[i] || '').trim().replace(/^"|"$/g, '');
                    });
                    return row;
                });
                resolve(rows);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

export interface MappedTransaction {
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: Date;
}

/** Convert CSV rows to transaction objects using a column mapping */
export function mapRowsToTransactions(
    rows: CSVRow[],
    mapping: ColumnMapping
): MappedTransaction[] {
    return rows
        .map(row => {
            const rawAmount = parseFloat((row[mapping.amount] || '0').replace(/[^0-9.-]/g, ''));
            if (isNaN(rawAmount)) return null;

            let type: 'income' | 'expense' = rawAmount >= 0 ? 'income' : 'expense';
            if (mapping.type && row[mapping.type]) {
                const typeVal = row[mapping.type].toLowerCase();
                if (typeVal.includes('credit') || typeVal.includes('income') || typeVal.includes('deposit')) {
                    type = 'income';
                } else {
                    type = 'expense';
                }
            }

            const rawDate = row[mapping.date];
            const parsedDate = rawDate ? new Date(rawDate) : new Date();

            return {
                description: row[mapping.description] || 'Imported transaction',
                amount: Math.abs(rawAmount),
                type,
                category: mapping.category ? (row[mapping.category] || 'other').toLowerCase() : 'other',
                date: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
            } as MappedTransaction;
        })
        .filter((t): t is MappedTransaction => t !== null);
}

/** Export transactions to a downloadable CSV string */
export function exportTransactionsToCSV(
    transactions: Array<{
        date: Date;
        description?: string;
        amount: number;
        type: string;
        category: string;
        currency?: string;
    }>
): void {
    const headers = ['Date', 'Description', 'Amount', 'Type', 'Category', 'Currency'];
    const rows = transactions.map(t => [
        (t.date instanceof Date ? t.date : new Date(t.date)).toISOString().split('T')[0],
        `"${(t.description || '').replace(/"/g, '""')}"`,
        t.type === 'expense' ? `-${t.amount}` : `${t.amount}`,
        t.type,
        t.category,
        t.currency || 'USD',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexora-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}
