// Firebase Admin SDK configuration
// This file should only be used in API routes or server-side code

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Helper function to format private key from environment variable
const formatPrivateKey = (key: string | undefined): string | undefined => {
  if (!key) return undefined;
  
  // Trim whitespace
  let formattedKey = key.trim();
  
  // Remove surrounding quotes (single, double, or backticks) if present
  formattedKey = formattedKey.replace(/^["'`]|["'`]$/g, '');
  
  // Handle multiple types of newline escapes
  // Replace escaped newlines with actual newlines (handles \n from env vars)
  formattedKey = formattedKey.replace(/\\n/g, '\n');
  
  // Also handle cases where newlines might be literal strings
  formattedKey = formattedKey.replace(/\\\\n/g, '\\n');
  
  // Ensure the key starts with BEGIN PRIVATE KEY
  if (!formattedKey.includes('BEGIN PRIVATE KEY') && !formattedKey.includes('BEGIN RSA PRIVATE KEY')) {
    console.error('Firebase Admin: Private key format is invalid - missing BEGIN header');
    return undefined;
  }
  
  // Ensure the key ends with END PRIVATE KEY
  if (!formattedKey.includes('END PRIVATE KEY') && !formattedKey.includes('END RSA PRIVATE KEY')) {
    console.error('Firebase Admin: Private key format is invalid - missing END footer');
    return undefined;
  }
  
  return formattedKey;
};

// Get environment variables
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
const privateKey = formatPrivateKey(rawPrivateKey);

let app;

// Initialize Firebase Admin SDK with proper error handling
try {
  // Validate required environment variables
  if (!projectId) {
    console.error('Firebase Admin SDK: FIREBASE_PROJECT_ID is missing');
  }
  
  if (!clientEmail) {
    console.error('Firebase Admin SDK: FIREBASE_CLIENT_EMAIL is missing');
  }
  
  if (!rawPrivateKey) {
    console.error('Firebase Admin SDK: FIREBASE_PRIVATE_KEY environment variable is not set');
    console.error('Please add FIREBASE_PRIVATE_KEY to your .env.local file');
  } else if (!privateKey) {
    console.error('Firebase Admin SDK: FIREBASE_PRIVATE_KEY is invalid or improperly formatted');
    console.error('The private key must be a valid PEM format starting with "-----BEGIN PRIVATE KEY-----"');
  }
  
  if (!projectId || !clientEmail || !privateKey) {
    console.error('Firebase Admin SDK: Cannot initialize - missing or invalid configuration');
    console.error('The app will start but Firebase Admin features will not work');
    
    // Create a dummy app that won't work but won't crash the app
    // This allows the app to start even if Firebase Admin isn't configured
    app = getApps().find(a => a.name === 'firebase-admin-dummy') 
      || initializeApp({ projectId: projectId || 'dummy' }, 'firebase-admin-dummy');
  } else {
    // Initialize Firebase Admin SDK with environment variables
    const firebaseAdminConfig = {
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    };

    // Initialize Firebase Admin (server-side only)
    app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0];
  }
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error('Firebase Admin SDK initialization error:', errorMessage);
  
  if (errorMessage.includes('Invalid PEM') || errorMessage.includes('private key')) {
    console.error('');
    console.error('TROUBLESHOOTING TIPS:');
    console.error('1. Check that FIREBASE_PRIVATE_KEY in your .env.local file contains the full key');
    console.error('2. The key should start with "-----BEGIN PRIVATE KEY-----"');
    console.error('3. If your key contains \\n, make sure it\'s properly escaped');
    console.error('4. Remove any extra quotes around the key value');
    console.error('');
  }
  
  // Fallback to dummy app if initialization fails
  app = getApps().find(a => a.name === 'firebase-admin-dummy') 
    || initializeApp({ projectId: projectId || 'dummy' }, 'firebase-admin-dummy');
}

// Initialize Firebase Admin Auth
export const auth = getAuth(app);
export default app;
