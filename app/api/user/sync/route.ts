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

    // Check if student already exists
    let userData = await StudentDatabase.getStudent(firebaseUser.uid);
    
    if (!userData) {
      // If student doesn't exist, return null (they need to complete setup)
      return NextResponse.json({ 
        success: true, 
        user: null 
      });
    }
    
    // Update last login time
    await StudentDatabase.updateLastLogin(firebaseUser.uid);

    return NextResponse.json({ 
      success: true, 
      user: userData 
    });

  } catch (error: any) {
    console.error('User sync error:', error.message);
    return NextResponse.json(
      { error: 'Failed to sync user data' },
      { status: 500 }
    );
  }
}
