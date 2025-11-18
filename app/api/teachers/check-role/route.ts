import { NextRequest, NextResponse } from 'next/server';
import { TeacherDatabase } from '@/lib/firestore-database';

export async function POST(request: NextRequest) {
  try {
    const { uid, email } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user has teacher role by finding teacher with matching UID
    const teacher = await TeacherDatabase.getTeacher(uid);

    if (!teacher) {
      return NextResponse.json(
        { error: 'Access denied. Teacher role required.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      teacher: {
        id: teacher.id,
        uid: teacher.uid,
        email: teacher.email,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        middleName: teacher.middleName,
        extension: teacher.extension,
        phone: teacher.phone,
        status: teacher.status || 'active',
        permissions: teacher.permissions || []
      }
    });

  } catch (error: any) {
    console.error('Teacher role check failed:', error);

    return NextResponse.json(
      { error: 'Role check failed: ' + error.message },
      { status: 500 }
    );
  }
}
