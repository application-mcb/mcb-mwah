import { NextRequest, NextResponse } from 'next/server';
import { TeacherDatabase } from '@/lib/firestore-database';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacherId = params.id;
    const updateData = await request.json();

    // Update teacher in database
    const updatedTeacher = await TeacherDatabase.updateTeacher(teacherId, updateData);

    return NextResponse.json({
      success: true,
      teacher: updatedTeacher,
    });
  } catch (error: any) {
    console.error('Error updating teacher:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update teacher' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacherId = params.id;

    // Delete teacher from database
    await TeacherDatabase.deleteTeacher(teacherId);

    return NextResponse.json({
      success: true,
      message: 'Teacher deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting teacher:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete teacher' },
      { status: 500 }
    );
  }
}
