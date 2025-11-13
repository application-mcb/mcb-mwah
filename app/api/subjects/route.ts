import { NextRequest, NextResponse } from 'next/server';
import { SubjectDatabase, CreateSubjectData, SubjectColor } from '@/lib/subject-database';
import { RegistrarDatabase } from '@/lib/registrar-database';

// GET /api/subjects - Get all subjects or filter by query parameters
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gradeLevel = searchParams.get('gradeLevel');
  const courseCode = searchParams.get('courseCode');
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
    } else if (courseCode) {
      // Get subjects by course code
      subjects = await SubjectDatabase.getSubjectsByCourseCode(courseCode);
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
    console.error('Course code param:', courseCode);
    console.error('Color param:', color);
    console.error('Search param:', search);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch subjects';
    return NextResponse.json(
      { error: errorMessage, details: { gradeLevel, courseCode, color, search } },
      { status: 500 }
    );
  }
}

// POST /api/subjects - Create a new subject
export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    console.log('Subject creation request body:', requestBody);
    
    const { code, name, description, gradeLevels, gradeIds, courseCodes, courseSelections, color, lectureUnits, labUnits, prerequisites, postrequisites, registrarUid } = requestBody;

    // Validate required fields
    if (!code || !name || !description || !color || lectureUnits === undefined || labUnits === undefined || !registrarUid) {
      return NextResponse.json(
        { error: 'Missing required fields: code, name, description, color, lectureUnits, labUnits, registrarUid' },
        { status: 400 }
      );
    }

    // Validate that at least one grade level or course selection is provided
    if ((!gradeLevels || gradeLevels.length === 0) && (!gradeIds || gradeIds.length === 0) && (!courseCodes || courseCodes.length === 0) && (!courseSelections || courseSelections.length === 0)) {
      return NextResponse.json(
        { error: 'At least one grade level, grade ID, or college course must be selected' },
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
      gradeLevels: gradeLevels ? Array.from(new Set(gradeLevels.map((level: any) => parseInt(level)))) : [],
      gradeIds: gradeIds ? Array.from(new Set(gradeIds.map((id: any) => String(id)))) : [],
      courseCodes: courseCodes || [],
      courseSelections: courseSelections || [],
      color: color as SubjectColor,
      lectureUnits: parseInt(lectureUnits),
      labUnits: parseInt(labUnits),
      totalUnits: parseInt(lectureUnits) + parseInt(labUnits),
      prerequisites: Array.isArray(prerequisites) ? prerequisites : [],
      postrequisites: Array.isArray(postrequisites) ? postrequisites : [],
      createdBy: registrarUid,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('Creating subject with data:', subjectData);
    const subject = await SubjectDatabase.createSubject(subjectData);
    console.log('Subject created successfully:', subject);

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
