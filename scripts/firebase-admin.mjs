import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const normalizePrivateKey = (privateKey) => {
  if (!privateKey) return '';
  return privateKey.replace(/\\n/g, '\n');
};

const getProjectId = () => (
  process.env.FIREBASE_PROJECT_ID
  || process.env.GCLOUD_PROJECT
  || process.env.GOOGLE_CLOUD_PROJECT
  || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);

const readServiceAccountFromEnv = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (error) {
      throw new Error(
        `FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  const projectId = getProjectId();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  const hasAnySplitCredential = Boolean(projectId || clientEmail || privateKey);

  if (hasAnySplitCredential) {
    const missing = [];
    if (!projectId) missing.push('FIREBASE_PROJECT_ID (or GCLOUD_PROJECT)');
    if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
    if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');

    if (missing.length > 0) {
      throw new Error(
        `Incomplete Firebase worker credentials. Missing: ${missing.join(', ')}. ` +
        'Set all required values or provide FIREBASE_SERVICE_ACCOUNT_JSON.'
      );
    }

    return {
      projectId,
      clientEmail,
      privateKey: normalizePrivateKey(privateKey),
    };
  }

  return null;
};

export const initFirebaseAdmin = () => {
  if (getApps().length > 0) {
    return { db: getFirestore(getApps()[0]) };
  }

  const serviceAccount = readServiceAccountFromEnv();
  const projectId = getProjectId();

  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId || projectId,
    });
  } else {
    if (!projectId && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      throw new Error(
        'Unable to detect a Project Id in the current environment. ' +
        'Set FIREBASE_PROJECT_ID (or GCLOUD_PROJECT) and Firebase credentials, or provide GOOGLE_APPLICATION_CREDENTIALS.'
      );
    }

    initializeApp({
      credential: applicationDefault(),
      projectId,
    });
  }

  const db = getFirestore();
  db.settings({ ignoreUndefinedProperties: true });

  return { db };
};
