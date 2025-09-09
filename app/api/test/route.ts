import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase-server';

// Simple database connectivity test
export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connectivity...');

    // Try to get a simple collection count
    const subjectsCollection = collection(db, 'subjects');
    const snapshot = await getDocs(subjectsCollection);

    console.log(`Database test successful. Found ${snapshot.docs.length} documents in subjects collection.`);

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      subjectsCount: snapshot.docs.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Database connection failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}