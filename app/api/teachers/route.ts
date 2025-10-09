import { NextRequest, NextResponse } from 'next/server';
import { TeacherDatabase } from '@/lib/firestore-database';

export async function GET(request: NextRequest) {
  try {
    const teachers = await TeacherDatabase.getAllTeachers();

    return NextResponse.json({
      success: true,
      teachers
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teachers' },
      { status: 500 }
    );
  }
}
