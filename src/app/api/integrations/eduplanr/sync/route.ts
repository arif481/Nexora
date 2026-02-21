import { NextResponse } from 'next/server';
import { getEduPlanrAdmin } from '@/lib/firebase-eduplanr-admin';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, syncToken } = body;

        if (!email || !syncToken) {
            return NextResponse.json({ error: 'Email and Sync Token are required' }, { status: 400 });
        }

        const adminApp = getEduPlanrAdmin();
        const db = adminApp.firestore();

        // Find user in EduPlanr by email
        const usersSnapshot = await db.collection('users').where('email', '==', email).limit(1).get();

        if (usersSnapshot.empty) {
            return NextResponse.json({ error: 'EduPlanr account not found for this email address. Please make sure you are using the correct email.' }, { status: 404 });
        }

        const userDoc = usersSnapshot.docs[0];
        const userData = userDoc.data();

        if (!userData.syncToken || userData.syncToken !== syncToken) {
            return NextResponse.json({ error: 'Invalid Sync Token or no token configured in EduPlanr. Please generate one in your EduPlanr settings.' }, { status: 401 });
        }

        const eduPlanrUserId = userDoc.id;
        // Fetch Study Sessions (last 30 days and upcoming)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const sessionsSnapshot = await db.collection('sessions')
            .where('userId', '==', eduPlanrUserId)
            .where('startTime', '>=', thirtyDaysAgo)
            .get();

        const events = sessionsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: `eduplanr-session-${doc.id}`,
                title: data.title || 'Study Session',
                description: data.notes || '',
                startTime: data.startTime?.toDate().toISOString(),
                endTime: data.endTime?.toDate().toISOString(),
                allDay: false,
                source: 'eduplanr',
                category: 'learning',
                energyRequired: 'medium',
                isFlexible: false,
                externalId: doc.id,
            };
        });

        // Fetch Academic Tasks / Assignments
        const tasksSnapshot = await db.collection('tasks')
            .where('userId', '==', eduPlanrUserId)
            .get();

        const tasks = tasksSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: `eduplanr-task-${doc.id}`,
                title: data.title,
                description: data.description || '',
                status: data.status === 'completed' ? 'done' : 'todo',
                priority: data.priority === 'critical' ? 'critical' : data.priority === 'high' ? 'high' : 'medium',
                energyLevel: 'medium',
                dueDate: data.dueDate?.toDate().toISOString(),
                source: 'eduplanr',
                category: 'academic',
                externalId: doc.id,
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                events,
                tasks,
            }
        });

    } catch (error: any) {
        console.error('EduPlanr Sync API Route Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
