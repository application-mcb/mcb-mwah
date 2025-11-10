import { NextRequest, NextResponse } from 'next/server'
import { subjectAssignmentDatabase } from '@/lib/subject-assignment-database'
import { EnrollmentDatabase } from '@/lib/enrollment-database'

export async function GET() {
  try {
    const subjectAssignments =
      await subjectAssignmentDatabase.getAllSubjectAssignments()
    return NextResponse.json({ subjectAssignments })
  } catch (error: any) {
    console.error('Error fetching subject assignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subject assignments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      level,
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
    if (!level || !subjectSetId || !registrarUid) {
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

    // Check if SHS - require semester and strand
    if (level === 'high-school') {
      // We need to check if it's SHS by checking the grade
      // For now, validate semester and strand if provided (they'll be required for SHS)
      // The actual validation will happen in the component
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

    const subjectAssignmentData = {
      level,
      gradeLevel: gradeLevel ? parseInt(gradeLevel) : undefined,
      courseCode: courseCode || undefined,
      courseName: courseName || undefined,
      yearLevel: yearLevel ? parseInt(yearLevel) : undefined,
      semester: semester || undefined,
      strand: strand || undefined, // For SHS
      subjectSetId,
      registrarUid,
    }

    const newSubjectAssignment =
      await subjectAssignmentDatabase.createSubjectAssignment(
        subjectAssignmentData
      )

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
        'Failed to update grades after subject assignment creation:',
        gradesError
      )
      // Don't fail the request if grades update fails
    }

    return NextResponse.json({
      subjectAssignment: newSubjectAssignment,
      message: 'Subject assignment created successfully',
    })
  } catch (error: any) {
    console.error('Error creating subject assignment:', error)
    return NextResponse.json(
      { error: 'Failed to create subject assignment' },
      { status: 500 }
    )
  }
}
