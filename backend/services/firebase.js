const admin = require('firebase-admin');

let app;

function initializeFirebase() {
  if (app) return app;

  // Prefer dedicated FIREBASE_* envs; fallback to GOOGLE_* if not provided
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY;

  if (privateKey && privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (!clientEmail || !privateKey || !projectId) {
    console.warn('⚠️ Firebase credentials not fully set. Firestore features will be disabled until configured.');
    return null;
  }

  try {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log('✅ Firebase initialized');
    return app;
  } catch (err) {
    // If already initialized
    if (err.code === 'app/duplicate-app') {
      return admin.app();
    }
    console.error('❌ Failed to initialize Firebase:', err.message);
    return null;
  }
}

function getFirestore() {
  const instance = initializeFirebase();
  if (!instance) return null;
  return admin.firestore();
}

module.exports = {
  initializeFirebase,
  getFirestore,
};
