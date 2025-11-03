import { NextRequest, NextResponse } from 'next/server';
import { subjectAssignmentDatabase } from '@/lib/subject-assignment-database';

export async function GET() {
  try {
    const subjectAssignments = await subjectAssignmentDatabase.getAllSubjectAssignments();
    return NextResponse.json({ subjectAssignments });
  } catch (error: any) {
    console.error('Error fetching subject assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subject assignments' },
      { status: 500 }
    );
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
        registrarUid
      } = await request.json();

      // Validation
      if (!level || !subjectSetId || !registrarUid) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Level-specific validation
      if (level === 'high-school' && !gradeLevel) {
        return NextResponse.json(
          { error: 'Grade level is required for high school assignments' },
          { status: 400 }
        );
      }

      if (level === 'college' && (!courseCode || !yearLevel || !semester)) {
        return NextResponse.json(
          { error: 'Course code, year level, and semester are required for college assignments' },
          { status: 400 }
        );
      }

    if (!subjectSetId || subjectSetId.trim() === '') {
      return NextResponse.json(
        { error: 'A subject set must be selected' },
        { status: 400 }
      );
    }

      const subjectAssignmentData = {
        level,
        gradeLevel: gradeLevel ? parseInt(gradeLevel) : undefined,
        courseCode: courseCode || undefined,
        courseName: courseName || undefined,
        yearLevel: yearLevel ? parseInt(yearLevel) : undefined,
        semester: semester || undefined,
        subjectSetId,
        registrarUid
      };

    const newSubjectAssignment = await subjectAssignmentDatabase.createSubjectAssignment(subjectAssignmentData);

    return NextResponse.json({ 
      subjectAssignment: newSubjectAssignment,
      message: 'Subject assignment created successfully'
    });
  } catch (error: any) {
    console.error('Error creating subject assignment:', error);
    return NextResponse.json(
      { error: 'Failed to create subject assignment' },
      { status: 500 }
    );
  }
}
