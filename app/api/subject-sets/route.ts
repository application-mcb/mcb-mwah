import { NextRequest, NextResponse } from 'next/server';
import { SubjectSetDatabase, CreateSubjectSetData } from '@/lib/subject-database';
import { RegistrarDatabase } from '@/lib/registrar-database';

// GET /api/subject-sets - Get all subject sets or filter by query parameters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gradeLevel = searchParams.get('gradeLevel');
    const subjectId = searchParams.get('subjectId');

    let subjectSets;

    if (gradeLevel) {
      // Get subject sets by grade level
      subjectSets = await SubjectSetDatabase.getSubjectSetsByGradeLevel(parseInt(gradeLevel));
    } else if (subjectId) {
      // Get subject sets containing a specific subject
      subjectSets = await SubjectSetDatabase.getSubjectSetsContainingSubject(subjectId);
    } else {
      // Get all subject sets
      subjectSets = await SubjectSetDatabase.getAllSubjectSets();
    }

    return NextResponse.json({ subjectSets });
  } catch (error) {
    console.error('Error fetching subject sets:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch subject sets';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/subject-sets - Create a new subject set
export async function POST(request: NextRequest) {
  try {
    const { name, description, subjects, gradeLevels, courseSelections, color, registrarUid } = await request.json();

    // Validate required fields
    if (!name || !description || !subjects || !Array.isArray(subjects) || !color || !registrarUid) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, subjects (array), color, registrarUid' },
        { status: 400 }
      );
    }

    // Validate that at least one grade level or course selection is provided
    if ((!gradeLevels || gradeLevels.length === 0) && (!courseSelections || courseSelections.length === 0)) {
      return NextResponse.json(
        { error: 'At least one grade level or college course must be selected' },
        { status: 400 }
      );
    }

    // Validate subjects array is not empty
    if (subjects.length === 0) {
      return NextResponse.json(
        { error: 'Subject set must contain at least one subject' },
        { status: 400 }
      );
    }

    // Check if registrar exists and has proper role
    const hasRegistrarRole = await RegistrarDatabase.hasRegistrarRole(registrarUid);
    if (!hasRegistrarRole) {
      return NextResponse.json(
        { error: 'Only registrars can create subject sets' },
        { status: 403 }
      );
    }

    // For backward compatibility, use the first grade level if available
    // Otherwise, use a default grade level (7) for college-only subject sets
    const primaryGradeLevel = gradeLevels && gradeLevels.length > 0 ? gradeLevels[0] : 7;

    const subjectSetData: CreateSubjectSetData = {
      name: name.trim(),
      description: description.trim(),
      subjects,
      gradeLevels: gradeLevels || [],
      courseSelections: courseSelections || [],
      color,
      createdBy: registrarUid,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Backward compatibility
      gradeLevel: primaryGradeLevel,
    };

    const subjectSet = await SubjectSetDatabase.createSubjectSet(subjectSetData);

    return NextResponse.json({
      subjectSet,
      message: 'Subject set created successfully'
    });
  } catch (error: any) {
    console.error('Error creating subject set:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subject set' },
      { status: 500 }
    );
  }
}
