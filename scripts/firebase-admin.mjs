import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const normalizePrivateKey = (privateKey) => {
  if (!privateKey) return '';
  return privateKey.replace(/\\n/g, '\n');
};

const readServiceAccountFromEnv = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  if (
    process.env.FIREBASE_PROJECT_ID
    && process.env.FIREBASE_CLIENT_EMAIL
    && process.env.FIREBASE_PRIVATE_KEY
  ) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    };
  }

  return null;
};

export const initFirebaseAdmin = () => {
  if (getApps().length > 0) {
    return { db: getFirestore(getApps()[0]) };
  }

  const serviceAccount = readServiceAccountFromEnv();
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;

  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId || projectId,
    });
  } else {
    initializeApp({
      credential: applicationDefault(),
      projectId,
    });
  }

  const db = getFirestore();
  db.settings({ ignoreUndefinedProperties: true });

  return { db };
};
