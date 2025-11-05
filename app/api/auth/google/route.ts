import { NextRequest, NextResponse } from 'next/server';
import { StudentDatabase } from '@/lib/firestore-database';
import { RegistrarDatabase } from '@/lib/registrar-database';

export async function POST(request: NextRequest) {
  try {
    const { firebaseUser } = await request.json();

    if (!firebaseUser || !firebaseUser.uid || !firebaseUser.email) {
      return NextResponse.json(
        { error: 'Invalid user data' },
        { status: 400 }
      );
    }

    // Sync user with database
    try {
      // Check if student already exists
      let userData = await StudentDatabase.getStudent(firebaseUser.uid);

      if (!userData) {
        // If student doesn't exist, create a basic entry
        const basicStudentData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          firstName: '',
          lastName: '',
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || '',
          provider: 'google',
          createdAt: new Date(),
          lastLogin: new Date(),
        };

        await StudentDatabase.createStudent(basicStudentData);
        // Get the created student data (which will be serialized)
        userData = await StudentDatabase.getStudent(firebaseUser.uid);
      } else {
        // Update last login time
        await StudentDatabase.updateLastLogin(firebaseUser.uid);
      }
    } catch (syncError) {
      console.error('User sync failed:', syncError);
      // Continue with authentication even if sync fails
    }

    // Check if user is a registrar first
    let isRegistrar = false;
    try {
      isRegistrar = await RegistrarDatabase.hasRegistrarRole(firebaseUser.uid);
    } catch (registrarError) {
      console.error('Registrar check failed:', registrarError);
      // Continue with authentication even if registrar check fails
    }

    // If user is a registrar, redirect to registrar dashboard
    if (isRegistrar) {
      return NextResponse.json({
        success: true,
        user: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        },
        isRegistrar: true,
        redirectTo: '/registrar',
      });
    }

    // Check if user has a complete profile (for students)
    let hasCompleteProfile = false;
    try {
      const userData = await StudentDatabase.getStudent(firebaseUser.uid);
      hasCompleteProfile = !!(userData && userData.firstName && userData.lastName);
    } catch (profileError) {
      console.error('Profile check failed:', profileError);
      // Continue with authentication even if profile check fails
    }

    // Return success response with user data and profile status
    return NextResponse.json({
      success: true,
      user: {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      },
      hasCompleteProfile,
      isRegistrar: false,
    });

  } catch (error: any) {
    console.error('Google authentication error:', error.message);
    return NextResponse.json(
      { error: 'Google authentication failed' },
      { status: 500 }
    );
  }
}