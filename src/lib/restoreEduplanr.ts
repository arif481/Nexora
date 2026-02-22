import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { db as nexoraDb, COLLECTIONS as NEXORA_COLLECTIONS } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';

const EDUPLANR_PUSH_URL = process.env.NEXT_PUBLIC_EDUPLANR_PUSH_URL || 'https://edu-planr.vercel.app/api/nexora-push';

/**
 * Emergency Restore Script
 * If native EduPlanr subjects were accidentally deleted by the duplicate cleaner,
 * this script finds the copies that Nexora pulled and pushes them back to EduPlanr.
 */
export async function emergencyRestoreEduPlanrSubjects() {
    console.log('Starting emergency restoration of EduPlanr subjects...');

    const user = getAuth().currentUser;
    if (!user) {
        console.error('You must be logged into Nexora to run the restore script.');
        return;
    }

    try {
        // 1. Get Integration Token
        const integrationDoc = await getDocs(query(collection(nexoraDb, NEXORA_COLLECTIONS.USER_INTEGRATIONS), where('__name__', '==', user.uid)));
        const eduData = integrationDoc.docs[0]?.data()?.eduplanr;

        if (!eduData?.email || !eduData?.syncToken) {
            console.error('Cannot restore: missing EduPlanr sync token.');
            return;
        }

        // 2. Fetch all subjects currently in Nexora that were originally from EduPlanr
        // Because the sync bug meant Nexora pulled the native EduPlanr ones before they were deleted
        const subjectsRef = collection(nexoraDb, NEXORA_COLLECTIONS.SUBJECTS);
        const q = query(subjectsRef, where('userId', '==', user.uid));
        const snapshot = await getDocs(q);

        const subjectsToRestore = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            // Format dates
            createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate().toISOString() : d.data().createdAt,
            updatedAt: d.data().updatedAt?.toDate ? d.data().updatedAt.toDate().toISOString() : d.data().updatedAt,
        }));

        console.log(`Found ${subjectsToRestore.length} subjects in Nexora to push back to EduPlanr.`);

        // 3. Push to EduPlanr
        const payload = { subjects: subjectsToRestore };

        const response = await fetch(EDUPLANR_PUSH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: eduData.email,
                syncToken: eduData.syncToken,
                payload,
            }),
        });

        if (!response.ok) {
            console.error('Failed to push restored subjects to EduPlanr:', await response.text());
        } else {
            console.log('Successfully pushed restored subjects to EduPlanr! Please refresh EduPlanr.');
        }

    } catch (e) {
        console.error('Emergency restore failed:', e);
    }
}

if (typeof window !== 'undefined') {
    (window as any).emergencyRestoreEduPlanrSubjects = emergencyRestoreEduPlanrSubjects;
}
