import { NextRequest, NextResponse } from 'next/server';
import { SubjectDatabase, CreateSubjectData, SubjectColor } from '@/lib/subject-database';
import { RegistrarDatabase } from '@/lib/registrar-database';

// GET /api/subjects - Get all subjects or filter by query parameters
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gradeLevel = searchParams.get('gradeLevel');
  const color = searchParams.get('color');
  const search = searchParams.get('search');

  try {
    let subjects;

    if (search) {
      // Search subjects by name or description
      subjects = await SubjectDatabase.searchSubjects(search);
    } else if (gradeLevel) {
      // Get subjects by grade level
      subjects = await SubjectDatabase.getSubjectsByGradeLevel(parseInt(gradeLevel));
    } else if (color) {
      // Get subjects by color - validate color is in SUBJECT_COLORS
      const { SUBJECT_COLORS } = await import('@/lib/subject-database');
      if (SUBJECT_COLORS.includes(color as SubjectColor)) {
        subjects = await SubjectDatabase.getSubjectsByColor(color as SubjectColor);
      } else {
        return NextResponse.json(
          { error: 'Invalid color parameter' },
          { status: 400 }
        );
      }
    } else {
      // Get all subjects
      subjects = await SubjectDatabase.getAllSubjects();
    }

    console.log('Successfully fetched subjects, count:', subjects?.length || 0);
    return NextResponse.json({ subjects });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    console.error('Grade level param:', gradeLevel);
    console.error('Color param:', color);
    console.error('Search param:', search);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch subjects';
    return NextResponse.json(
      { error: errorMessage, details: { gradeLevel, color, search } },
      { status: 500 }
    );
  }
}

// POST /api/subjects - Create a new subject
export async function POST(request: NextRequest) {
  try {
    const { code, name, description, gradeLevel, color, lectureUnits, labUnits, registrarUid } = await request.json();

    // Validate required fields
    if (!code || !name || !description || gradeLevel === undefined || !color || lectureUnits === undefined || labUnits === undefined || !registrarUid) {
      return NextResponse.json(
        { error: 'Missing required fields: code, name, description, gradeLevel, color, lectureUnits, labUnits, registrarUid' },
        { status: 400 }
      );
    }

    // Check if registrar exists and has proper role
    const hasRegistrarRole = await RegistrarDatabase.hasRegistrarRole(registrarUid);
    if (!hasRegistrarRole) {
      return NextResponse.json(
        { error: 'Only registrars can create subjects' },
        { status: 403 }
      );
    }

    const subjectData: CreateSubjectData = {
      code: code.toUpperCase().trim(),
      name: name.trim(),
      description: description.trim(),
      gradeLevel: parseInt(gradeLevel),
      color: color as SubjectColor,
      lectureUnits: parseInt(lectureUnits),
      labUnits: parseInt(labUnits),
      totalUnits: parseInt(lectureUnits) + parseInt(labUnits),
      createdBy: registrarUid,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const subject = await SubjectDatabase.createSubject(subjectData);

    return NextResponse.json({
      subject,
      message: 'Subject created successfully'
    });
  } catch (error) {
    console.error('Error creating subject:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create subject';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
