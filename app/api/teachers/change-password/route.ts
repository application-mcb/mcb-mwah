import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { uid, currentPassword, newPassword } = await request.json();

    if (!uid || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'User ID, current password, and new password are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Firebase API key not configured' },
        { status: 500 }
      );
    }

    // Get user email from database
    const email = await getUserEmail(uid);
    if (!email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Use Firebase Auth REST API to verify current password and update
    console.log('Verifying current password and updating to new password for:', email);

    // Step 1: Sign in with current credentials to verify the password
    const signInResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: currentPassword,
        returnSecureToken: true,
      }),
    });

    if (!signInResponse.ok) {
      const errorData = await signInResponse.json();
      console.error('Password verification failed:', errorData);

      if (errorData.error?.message === 'INVALID_PASSWORD' || errorData.error?.message === 'EMAIL_NOT_FOUND') {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to verify current password' },
        { status: 400 }
      );
    }

    const signInData = await signInResponse.json();
    const idToken = signInData.idToken;

    // Step 2: Update the password using the verified session
    const updatePasswordResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken: idToken,
        password: newPassword,
        returnSecureToken: true,
      }),
    });

    if (!updatePasswordResponse.ok) {
      const errorData = await updatePasswordResponse.json();
      console.error('Password update failed:', errorData);

      if (errorData.error?.message === 'WEAK_PASSWORD') {
        return NextResponse.json(
          { error: 'New password is too weak. Please choose a stronger password.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to update password' },
        { status: 400 }
      );
    }

    const updateData = await updatePasswordResponse.json();
    console.log('Password updated successfully for user:', email);

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
      email: email,
    });

  } catch (error: any) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to change password' },
      { status: 500 }
    );
  }
}

// Helper function to get user email from database
async function getUserEmail(uid: string): Promise<string | null> {
  try {
    // Import here to avoid circular dependencies
    const { TeacherDatabase } = await import('@/lib/firestore-database');
    const teacher = await TeacherDatabase.getTeacher(uid);
    return teacher?.email || null;
  } catch (error) {
    console.error('Error getting user email:', error);
    return null;
  }
}
