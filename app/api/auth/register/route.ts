import { NextRequest, NextResponse } from 'next/server';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { StudentDatabase } from '@/lib/firestore-database';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Create user with Firebase
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Sync user with database
    try {
      // Create initial student entry
      const studentData = {
        uid: user.uid,
        email: user.email || '',
        firstName: '',
        lastName: '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        provider: 'email',
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      await StudentDatabase.createStudent(studentData);
    } catch (syncError) {
      console.error('User sync failed:', syncError);
      // Continue with registration even if sync fails
    }

    // Return success response with user data
    return NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });

  } catch (error: any) {
    // Log error safely without exposing sensitive details
    console.error('Registration failed:', error.code || 'Unknown error');

    // Handle specific Firebase auth errors
    let errorMessage = 'An error occurred during registration';

    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'An account with this email already exists';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak';
    } else if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'Email/password accounts are not enabled';
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
