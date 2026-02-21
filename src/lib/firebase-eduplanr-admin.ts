import * as admin from 'firebase-admin';

export function getEduPlanrAdmin() {
    const appName = 'eduplanr-admin';

    if (admin.apps.length > 0) {
        const existingApp = admin.apps.find(app => app?.name === appName);
        if (existingApp) return existingApp;
    }

    const serviceAccountJson = process.env.EDUPLANR_FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccountJson) {
        console.warn('EDUPLANR_FIREBASE_SERVICE_ACCOUNT not set. EduPlanr sync will use application default credentials if available.');
        return admin.initializeApp({
            credential: admin.credential.applicationDefault()
        }, appName);
    }

    try {
        const parsedCredentials = typeof serviceAccountJson === 'string'
            ? JSON.parse(serviceAccountJson)
            : serviceAccountJson;

        return admin.initializeApp({
            credential: admin.credential.cert(parsedCredentials)
        }, appName);
    } catch (err) {
        console.error('Failed to parse EDUPLANR_FIREBASE_SERVICE_ACCOUNT logic:', err);
        throw err;
    }
}
