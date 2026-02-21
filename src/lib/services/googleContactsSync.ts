// Google Contacts Sync Service
// Uses People API v1 (completely free via OAuth)

import type { Contact } from '@/types';

const PEOPLE_BASE = 'https://people.googleapis.com/v1';

/**
 * Fetch contacts from the user's Google account.
 * Returns up to 200 contacts with basic fields.
 */
export async function fetchGoogleContacts(
    accessToken: string
): Promise<Partial<Contact>[]> {
    try {
        const params = new URLSearchParams({
            personFields: 'names,emailAddresses,phoneNumbers,addresses,birthdays,photos',
            pageSize: '200',
            sortOrder: 'FIRST_NAME_ASCENDING',
        });

        const res = await fetch(`${PEOPLE_BASE}/people/me/connections?${params}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) {
            throw new Error(`Google People API error: ${res.status}`);
        }

        const data = await res.json();

        return (data.connections || [])
            .filter((person: Record<string, any>) => person.names?.length)
            .map((person: Record<string, any>) => {
                const name = person.names?.[0]?.displayName || '';
                const email = person.emailAddresses?.[0]?.value || undefined;
                const phone = person.phoneNumbers?.[0]?.value || undefined;
                const address = person.addresses?.[0]?.formattedValue || undefined;
                const birthday = person.birthdays?.[0]?.date;

                let birthdayDate: Date | undefined;
                if (birthday?.year && birthday?.month && birthday?.day) {
                    birthdayDate = new Date(birthday.year, birthday.month - 1, birthday.day);
                }

                return {
                    name,
                    email,
                    phone,
                    address,
                    birthday: birthdayDate || undefined,
                    relationship: 'other' as const,
                };
            });
    } catch (err) {
        console.error('Failed to fetch Google Contacts:', err);
        return [];
    }
}

/**
 * Check for duplicate contacts (by name or email).
 */
export function findDuplicates(
    imported: Partial<Contact>[],
    existing: Contact[]
): { unique: Partial<Contact>[]; duplicates: Partial<Contact>[] } {
    const existingEmails = new Set(existing.map(c => c.email?.toLowerCase()).filter(Boolean));
    const existingNames = new Set(existing.map(c => c.name.toLowerCase()));

    const unique: Partial<Contact>[] = [];
    const duplicates: Partial<Contact>[] = [];

    for (const contact of imported) {
        const emailMatch = contact.email && existingEmails.has(contact.email.toLowerCase());
        const nameMatch = contact.name && existingNames.has(contact.name.toLowerCase());

        if (emailMatch || nameMatch) {
            duplicates.push(contact);
        } else {
            unique.push(contact);
        }
    }

    return { unique, duplicates };
}
