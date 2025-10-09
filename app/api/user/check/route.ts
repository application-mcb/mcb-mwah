import { NextRequest, NextResponse } from 'next/server';
import { UserDatabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const existingUser = await UserDatabase.getUserByEmail(email);

    return NextResponse.json({ 
      success: true, 
      exists: !!existingUser,
      user: existingUser || null
    });

  } catch (error: any) {
    console.error('Check user error:', error.message);
    return NextResponse.json(
      { error: 'Failed to check user' },
      { status: 500 }
    );
  }
}
