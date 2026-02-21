// CSV / JSON file parser for bulk import
// Zero dependencies — uses native APIs

export interface FieldMapping {
    sourceField: string;
    targetField: string;
}

export interface ParseResult<T> {
    data: T[];
    headers: string[];
    errors: string[];
    totalRows: number;
}

/**
 * Parse CSV text into array of objects.
 * Handles quoted fields, commas inside quotes, and newlines inside quotes.
 */
function parseCSVText(text: string): { headers: string[]; rows: Record<string, string>[] } {
    const lines: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === '"') {
            if (inQuotes && text[i + 1] === '"') {
                current += '"';
                i++; // skip escaped quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === '\n' && !inQuotes) {
            lines.push(current.replace(/\r$/, ''));
            current = '';
        } else {
            current += ch;
        }
    }
    if (current.trim()) lines.push(current.replace(/\r$/, ''));

    if (lines.length === 0) return { headers: [], rows: [] };

    const splitRow = (line: string): string[] => {
        const fields: string[] = [];
        let field = '';
        let inQ = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQ && line[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQ = !inQ;
                }
            } else if (ch === ',' && !inQ) {
                fields.push(field.trim());
                field = '';
            } else {
                field += ch;
            }
        }
        fields.push(field.trim());
        return fields;
    };

    const headers = splitRow(lines[0]);
    const rows = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
            const values = splitRow(line);
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => {
                obj[h] = values[i] || '';
            });
            return obj;
        });

    return { headers, rows };
}

/**
 * Read a File as text.
 */
function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/**
 * Parse a CSV file with field mapping.
 */
export async function parseCSVFile<T extends Record<string, unknown>>(
    file: File,
    fieldMap: Record<string, string> // sourceHeader → targetField
): Promise<ParseResult<T>> {
    const text = await readFileAsText(file);
    const { headers, rows } = parseCSVText(text);
    const errors: string[] = [];
    const data: T[] = [];

    rows.forEach((row, idx) => {
        try {
            const mapped: Record<string, unknown> = {};
            Object.entries(fieldMap).forEach(([source, target]) => {
                const value = row[source];
                if (value !== undefined && value !== '') {
                    mapped[target] = value;
                }
            });
            if (Object.keys(mapped).length > 0) {
                data.push(mapped as T);
            }
        } catch {
            errors.push(`Row ${idx + 2}: Parse error`);
        }
    });

    return { data, headers, errors, totalRows: rows.length };
}

/**
 * Parse a JSON file (array of objects).
 */
export async function parseJSONFile<T>(file: File): Promise<ParseResult<T>> {
    const text = await readFileAsText(file);
    const errors: string[] = [];

    try {
        const parsed = JSON.parse(text);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        const headers = arr.length > 0 ? Object.keys(arr[0]) : [];
        return { data: arr as T[], headers, errors, totalRows: arr.length };
    } catch {
        errors.push('Invalid JSON format');
        return { data: [], headers: [], errors, totalRows: 0 };
    }
}

/**
 * Auto-detect CSV headers and suggest field mappings.
 */
export function suggestFieldMappings(
    headers: string[],
    targetType: 'tasks' | 'contacts' | 'transactions' | 'flashcards'
): Record<string, string> {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const map: Record<string, string> = {};

    const patterns: Record<string, Record<string, string[]>> = {
        tasks: {
            title: ['title', 'name', 'task', 'summary', 'content', 'text', 'subject'],
            description: ['description', 'details', 'notes', 'body', 'note'],
            priority: ['priority', 'importance', 'level', 'urgency'],
            dueDate: ['duedate', 'due', 'deadline', 'date', 'dueon'],
            status: ['status', 'state', 'done', 'completed', 'complete'],
        },
        contacts: {
            name: ['name', 'fullname', 'displayname', 'firstname', 'givenname', 'contactname'],
            email: ['email', 'emailaddress', 'mail', 'emailaddress1'],
            phone: ['phone', 'phonenumber', 'telephone', 'mobile', 'cell', 'primaryphone'],
            address: ['address', 'streetaddress', 'homeaddress', 'location'],
            birthday: ['birthday', 'birthdate', 'dateofbirth', 'dob'],
            notes: ['notes', 'note', 'description', 'memo'],
        },
        transactions: {
            amount: ['amount', 'total', 'price', 'value', 'sum', 'debit', 'credit'],
            description: ['description', 'memo', 'narrative', 'details', 'payee', 'merchant', 'name'],
            date: ['date', 'transactiondate', 'posteddate', 'valuedate', 'bookingdate'],
            category: ['category', 'type', 'group', 'label'],
        },
        flashcards: {
            front: ['front', 'question', 'term', 'word', 'prompt'],
            back: ['back', 'answer', 'definition', 'response', 'meaning'],
            difficulty: ['difficulty', 'level', 'hardness'],
        },
    };

    const targetPatterns = patterns[targetType] || {};

    headers.forEach(header => {
        const norm = normalize(header);
        for (const [targetField, synonyms] of Object.entries(targetPatterns)) {
            if (synonyms.some(s => norm.includes(s) || s.includes(norm))) {
                if (!Object.values(map).includes(targetField)) {
                    map[header] = targetField;
                }
                break;
            }
        }
    });

    return map;
}
