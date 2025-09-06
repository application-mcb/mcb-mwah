import { NextRequest, NextResponse } from 'next/server';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { serverTimestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { StudentDatabase } from '@/lib/firestore-database';
import { RegistrarDatabase } from '@/lib/registrar-database';

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

    // Attempt authentication with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Sync user with database
    try {
      // Check if student already exists
      let userData = await StudentDatabase.getStudent(user.uid);

      if (!userData) {
        // If student doesn't exist, create a basic entry
        const basicStudentData = {
          uid: user.uid,
          email: user.email || '',
          firstName: '',
          lastName: '',
          middleName: '',
          nameExtension: '',
          phoneNumber: '',
          birthMonth: '',
          birthDay: '',
          birthYear: '',
          gender: '',
          civilStatus: '',
          streetName: '',
          province: '',
          municipality: '',
          barangay: '',
          zipCode: '',
          guardianName: '',
          guardianPhone: '',
          guardianRelationship: '',
          photoURL: user.photoURL || '',
          provider: 'email' as const,
          academicDataUsageAgreement: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        };

        await StudentDatabase.createStudent(basicStudentData);
        // Get the created student data (which will be serialized)
        userData = await StudentDatabase.getStudent(user.uid);
      } else {
        // Update last login time
        await StudentDatabase.updateLastLogin(user.uid);
      }
    } catch (syncError) {
      console.error('User sync failed:', syncError);
      // Continue with login even if sync fails
    }

    // Check if user is a registrar first
    let isRegistrar = false;
    try {
      isRegistrar = await RegistrarDatabase.hasRegistrarRole(user.uid);
    } catch (registrarError) {
      console.error('Registrar check failed:', registrarError);
      // Continue with login even if registrar check fails
    }

    // If user is a registrar, redirect to registrar dashboard
    if (isRegistrar) {
      return NextResponse.json({
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
        },
        isRegistrar: true,
        redirectTo: '/registrar',
      });
    }

    // Check if user has a complete profile (for students)
    let hasCompleteProfile = false;
    try {
      const userData = await StudentDatabase.getStudent(user.uid);
      hasCompleteProfile = !!(userData && userData.firstName && userData.lastName);
    } catch (profileError) {
      console.error('Profile check failed:', profileError);
      // Continue with login even if profile check fails
    }

    // Return success response with user data and profile status
    return NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
      },
      hasCompleteProfile,
      isRegistrar: false,
    });

  } catch (error: any) {
    // Log error safely without exposing sensitive details
    console.error('Login failed:', error.code || 'Unknown error');

    // Handle specific Firebase auth errors
    let errorMessage = 'An error occurred during login';

    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'This account has been disabled';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many failed login attempts. Please try again later';
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 401 }
    );
  }
}
