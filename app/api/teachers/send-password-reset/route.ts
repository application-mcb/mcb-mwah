import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Firebase API key not configured' },
        { status: 500 }
      );
    }

    // Get the user's email from the database
    const email = await getUserEmail(uid);
    if (!email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 404 });
    }

    console.log('Sending password reset email to:', email);

    // Use Firebase Auth REST API to send password reset email
    const resetResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email: email,
        continueUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`,
      }),
    });

    if (!resetResponse.ok) {
      const errorData = await resetResponse.json();
      console.error('Failed to send password reset email:', errorData);

      if (errorData.error?.message === 'EMAIL_NOT_FOUND') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to send password reset email' },
        { status: 400 }
      );
    }

    const result = await resetResponse.json();
    console.log('Password reset email sent successfully:', result);

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully',
      email: email,
      emailSent: true
    });

  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send password reset email' },
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
