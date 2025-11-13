import { NextRequest, NextResponse } from 'next/server'
import { subjectAssignmentDatabase } from '@/lib/subject-assignment-database'
import { EnrollmentDatabase } from '@/lib/enrollment-database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const subjectAssignment =
      await subjectAssignmentDatabase.getSubjectAssignmentById(id)

    if (!subjectAssignment) {
      return NextResponse.json(
        { error: 'Subject assignment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ subjectAssignment })
  } catch (error: any) {
    console.error('Error fetching subject assignment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subject assignment' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const {
      level,
      gradeId, // Grade ID (includes strand info)
      gradeLevel,
      courseCode,
      courseName,
      yearLevel,
      semester,
      subjectSetId,
      registrarUid,
      strand, // For SHS
    } = await request.json()

    // Validation
    if (!level || !subjectSetId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Level-specific validation
    if (level === 'high-school' && !gradeLevel) {
      return NextResponse.json(
        { error: 'Grade level is required for high school assignments' },
        { status: 400 }
      )
    }

    if (level === 'college' && (!courseCode || !yearLevel || !semester)) {
      return NextResponse.json(
        {
          error:
            'Course code, year level, and semester are required for college assignments',
        },
        { status: 400 }
      )
    }

    if (!subjectSetId || subjectSetId.trim() === '') {
      return NextResponse.json(
        { error: 'A subject set must be selected' },
        { status: 400 }
      )
    }

    const updateData = {
      level,
      gradeId: gradeId || undefined, // Store gradeId for unique strand identification
      gradeLevel: gradeLevel ? parseInt(gradeLevel) : undefined,
      courseCode: courseCode || undefined,
      courseName: courseName || undefined,
      yearLevel: yearLevel ? parseInt(yearLevel) : undefined,
      semester: semester || undefined,
      strand: strand || undefined, // For SHS
      subjectSetId,
    }

    const updatedSubjectAssignment =
      await subjectAssignmentDatabase.updateSubjectAssignment(id, updateData)

    // Update grades for affected students
    try {
      await EnrollmentDatabase.updateGradesForSubjectAssignmentChange(
        level,
        courseCode,
        gradeLevel ? parseInt(gradeLevel) : undefined,
        yearLevel ? parseInt(yearLevel) : undefined,
        semester
      )
    } catch (gradesError) {
      console.warn(
        'Failed to update grades after subject assignment update:',
        gradesError
      )
      // Don't fail the request if grades update fails
    }

    return NextResponse.json({
      subjectAssignment: updatedSubjectAssignment,
      message: 'Subject assignment updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating subject assignment:', error)
    return NextResponse.json(
      { error: 'Failed to update subject assignment' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const registrarUid = searchParams.get('registrarUid')

    if (!registrarUid) {
      return NextResponse.json(
        { error: 'Registrar UID is required' },
        { status: 400 }
      )
    }

    // Get the subject assignment before deleting it
    const subjectAssignment =
      await subjectAssignmentDatabase.getSubjectAssignmentById(id)
    if (!subjectAssignment) {
      return NextResponse.json(
        { error: 'Subject assignment not found' },
        { status: 404 }
      )
    }

    await subjectAssignmentDatabase.deleteSubjectAssignment(id)

    // Update grades for affected students - they will fall back to selectedSubjects
    try {
      await EnrollmentDatabase.updateGradesForSubjectAssignmentChange(
        subjectAssignment.level,
        subjectAssignment.courseCode,
        subjectAssignment.gradeLevel,
        subjectAssignment.yearLevel,
        subjectAssignment.semester
      )
    } catch (gradesError) {
      console.warn(
        'Failed to update grades after subject assignment deletion:',
        gradesError
      )
      // Don't fail the request if grades update fails
    }

    return NextResponse.json({
      message: 'Subject assignment deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting subject assignment:', error)
    return NextResponse.json(
      { error: 'Failed to delete subject assignment' },
      { status: 500 }
    )
  }
}
