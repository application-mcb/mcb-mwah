import { NextRequest, NextResponse } from 'next/server'
import { TeacherDatabase } from '@/lib/firestore-database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teacherId, permissions } = body

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID is required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Permissions must be an array' },
        { status: 400 }
      )
    }

    // Valid permission values
    const validPermissions = [
      'overview',
      'student-enrollments',
      'student-management',
      'course-management',
      'grade-section-management',
      'subject-management',
      'teacher-management',
      'events-management',
      'analytics',
    ]

    // Validate permissions
    const invalidPermissions = permissions.filter(
      (p: string) => !validPermissions.includes(p)
    )
    if (invalidPermissions.length > 0) {
      return NextResponse.json(
        { error: `Invalid permissions: ${invalidPermissions.join(', ')}` },
        { status: 400 }
      )
    }

    // Update teacher permissions
    await TeacherDatabase.updateTeacher(teacherId, {
      permissions: permissions,
    })

    return NextResponse.json({
      success: true,
      message: 'Permissions updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating teacher permissions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update permissions' },
      { status: 500 }
    )
  }
}

