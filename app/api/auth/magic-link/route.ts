import { NextRequest, NextResponse } from 'next/server';
import { StudentDatabase } from '@/lib/firestore-database';

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
          provider: 'email',
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

    // Check if user has a complete profile
    let hasCompleteProfile = false;
    try {
      const userData = await StudentDatabase.getStudent(firebaseUser.uid);
      hasCompleteProfile = !!(userData && userData.firstName && userData.lastName);
    } catch (profileError) {
      console.error('Profile check failed:', profileError);
      // Continue with authentication even if profile check fails
    }

    // Return success response with profile status
    return NextResponse.json({
      success: true,
      hasCompleteProfile,
    });

  } catch (error: any) {
    console.error('Magic link authentication error:', error.message);
    return NextResponse.json(
      { error: 'Magic link authentication failed' },
      { status: 500 }
    );
  }
}
