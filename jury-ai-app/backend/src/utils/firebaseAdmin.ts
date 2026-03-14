import admin from 'firebase-admin';

let initialized = false;

const initFirebaseAdmin = () => {
  if (initialized || admin.apps.length > 0) {
    initialized = true;
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    })
  });

  initialized = true;
};

export const verifyFirebaseIdToken = async (idToken: string) => {
  initFirebaseAdmin();
  return admin.auth().verifyIdToken(idToken, true);
};
