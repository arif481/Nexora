import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db, COLLECTIONS } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';

/**
 * Cleanup script to remove duplicated subjects from Nexora.
 * Run this directly in the browser console while logged into Nexora by calling window.cleanupDuplicateSubjects().
 */
export async function cleanupDuplicateSubjects() {
    console.log('Starting duplicate subject cleanup...');
    const userId = getAuth().currentUser?.uid;
    if (!userId) {
        console.error('You must be logged in to run this script.');
        return;
    }

    try {
        const subjectsRef = collection(db, COLLECTIONS.SUBJECTS);
        const q = query(subjectsRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);

        const subjectsByName = new Map<string, any[]>();

        snapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            const name = data.name.trim().toLowerCase();
            if (!subjectsByName.has(name)) {
                subjectsByName.set(name, []);
            }
            subjectsByName.get(name)!.push({ id: docSnap.id, ...data, ref: docSnap.ref });
        });

        let deletedCount = 0;
        const toDeleteIds = new Set<string>();

        Array.from(subjectsByName.entries()).forEach(async ([name, duplicates]) => {
            if (duplicates.length > 1) {
                console.log(`Found ${duplicates.length} instances of "${name}"`);

                // Keep the one created earliest
                duplicates.sort((a: any, b: any) => {
                    const timeA = a.createdAt?.seconds || 0;
                    const timeB = b.createdAt?.seconds || 0;
                    return timeA - timeB; // ascending
                });

                const original = duplicates[0];
                const toDelete = duplicates.slice(1);

                for (const item of toDelete) {
                    console.log(`Deleting duplicate ID: ${item.id}`);
                    await deleteDoc(item.ref);
                    toDeleteIds.add(item.id);
                    deletedCount++;
                }
            }
        });

        console.log(`Cleanup complete. Deleted ${deletedCount} duplicate subjects.`);

        // Cleanup integration mappings pointing to deleted subjects
        const mappingsRef = collection(db, COLLECTIONS.INTEGRATION_MAPPINGS);
        const mapSnap = await getDocs(query(mappingsRef, where('userId', '==', userId), where('provider', '==', 'eduplanr')));

        let deletedMapsCount = 0;
        for (const mDoc of mapSnap.docs) {
            const data = mDoc.data();
            if (data.entityType === 'subject' && toDeleteIds.has(data.internalId)) {
                await deleteDoc(mDoc.ref);
                deletedMapsCount++;
            }
        }
        console.log(`Deleted ${deletedMapsCount} invalid integration mappings.`);

    } catch (e) {
        console.error('Error during cleanup:', e);
    }
}

if (typeof window !== 'undefined') {
    (window as any).cleanupDuplicateSubjects = cleanupDuplicateSubjects;
}
