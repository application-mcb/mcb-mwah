import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from 'firebase-admin/auth';
import { RegistrarDatabase } from '@/lib/registrar-database';

// Initialize Firebase Admin Auth
let adminAuth: any = null;

try {
  const { getAuth } = require('firebase-admin/auth');
  const { initializeApp, getApps, cert } = require('firebase-admin/app');
  
  const firebaseAdminConfig = {
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  };

  const app = getApps().length === 0 ? initializeApp(firebaseAdminConfig) : getApps()[0];
  adminAuth = getAuth(app);
} catch (error) {
  console.error('Firebase Admin initialization failed:', error);
}

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Firebase Admin not initialized. Please check environment variables.' },
        { status: 500 }
      );
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Check if user has registrar role
    const hasRegistrarRole = await RegistrarDatabase.hasRegistrarRole(uid);

    if (!hasRegistrarRole) {
      return NextResponse.json(
        { error: 'Access denied. Registrar role required.' },
        { status: 403 }
      );
    }

    // Get registrar data
    const registrar = await RegistrarDatabase.getRegistrar(uid);

    if (!registrar) {
      return NextResponse.json(
        { error: 'Registrar not found' },
        { status: 404 }
      );
    }

    // Update last login
    await RegistrarDatabase.updateLastLogin(uid);

    return NextResponse.json({
      success: true,
      registrar: {
        uid: registrar.uid,
        email: registrar.email,
        firstName: registrar.firstName,
        lastName: registrar.lastName,
        role: registrar.role
      }
    });

  } catch (error: any) {
    console.error('Role verification failed:', error);

    if (error.code === 'auth/invalid-token') {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Role verification failed: ' + error.message },
      { status: 500 }
    );
  }
}
