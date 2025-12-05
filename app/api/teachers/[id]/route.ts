import { NextRequest, NextResponse } from 'next/server'
import { TeacherDatabase } from '@/lib/firestore-database'
import { AuditLogDatabase } from '@/lib/audit-log-database'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacherId = params.id
    const { actorId, actorName, actorEmail, actorRole, ...updateData } =
      await request.json()

    // Update teacher in database
    const updatedTeacher = await TeacherDatabase.updateTeacher(
      teacherId,
      updateData
    )

    try {
      await AuditLogDatabase.createLog({
        action: 'Updated teacher',
        category: 'teachers',
        status: 'success',
        context: `Teacher ${teacherId}`,
        actorId: actorId || '',
        actorName: actorName || 'Registrar',
        actorEmail: actorEmail || '',
        actorRole: actorRole || 'registrar',
        metadata: {
          teacherId,
          updatedFields: Object.keys(updateData || {}),
        },
      })
    } catch (logError) {
      console.warn('Audit log write failed (teacher update):', logError)
    }

    return NextResponse.json({
      success: true,
      teacher: updatedTeacher,
    })
  } catch (error: any) {
    console.error('Error updating teacher:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update teacher' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teacherId = params.id
    const { actorId, actorName, actorEmail, actorRole } = await request.json()

    // Delete teacher from database
    await TeacherDatabase.deleteTeacher(teacherId)

    try {
      await AuditLogDatabase.createLog({
        action: 'Deleted teacher',
        category: 'teachers',
        status: 'success',
        context: `Teacher ${teacherId}`,
        actorId: actorId || '',
        actorName: actorName || 'Registrar',
        actorEmail: actorEmail || '',
        actorRole: actorRole || 'registrar',
        metadata: { teacherId },
      })
    } catch (logError) {
      console.warn('Audit log write failed (teacher delete):', logError)
    }

    return NextResponse.json({
      success: true,
      message: 'Teacher deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting teacher:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete teacher' },
      { status: 500 }
    )
  }
}
