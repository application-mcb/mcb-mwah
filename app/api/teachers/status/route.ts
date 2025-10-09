import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

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

    // Get the user's email from the database first
    const email = await getUserEmail(uid);
    if (!email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Use Firebase Auth REST API to get user data
    const userLookupResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        localId: [uid],
      }),
    });

    if (!userLookupResponse.ok) {
      const errorData = await userLookupResponse.json();
      console.error('Failed to lookup user:', errorData);

      if (errorData.error?.message === 'USER_NOT_FOUND') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to check teacher status' },
        { status: 500 }
      );
    }

    const userData = await userLookupResponse.json();
    const user = userData.users?.[0];

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      disabled: user.disabled || false,
      emailVerified: user.emailVerified || false,
    });
  } catch (error: any) {
    console.error('Error checking teacher status:', error);
    return NextResponse.json(
      { error: 'Failed to check teacher status' },
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
