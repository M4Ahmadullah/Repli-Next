import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

// Simplified private key parsing function
function parsePrivateKey(rawKey?: string): string | undefined {
  if (!rawKey) {
    return undefined;
  }

  try {
    // Simply trim and replace escaped newlines
    return rawKey
      .trim()
      .replace(/\\n/g, '\n')
  } catch {
    return undefined;
  }
}

// Comprehensive configuration validation
function validateFirebaseConfig() {
  const requiredEnvVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing Firebase configuration: ${missingVars.join(', ')}`);
  }
}

// Validate configuration before initialization
validateFirebaseConfig();

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID!,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
  privateKey: parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
}

// Initialize Firebase Admin
let app;
try {
  // Ensure privateKey is not undefined before initializing
  if (!firebaseAdminConfig.privateKey) {
    throw new Error('Invalid Firebase private key');
  }

  app = getApps().length === 0 
    ? initializeApp({
        credential: cert({
          projectId: firebaseAdminConfig.projectId,
          clientEmail: firebaseAdminConfig.clientEmail,
          privateKey: firebaseAdminConfig.privateKey,
        }),
        projectId: process.env.FIREBASE_PROJECT_ID,
      }, 'admin')
    : getApps()[0]
} catch (error) {
  throw error;
}

// Initialize services
export const adminDb = getFirestore(app)
export const adminAuth = getAuth(app)

export default app 