import { NextRequest, NextResponse } from 'next/server';
import { GradeDatabase, CreateGradeData, GRADE_COLORS, Department, DEPARTMENTS } from '@/lib/grade-section-database';
import { RegistrarDatabase } from '@/lib/registrar-database';

// GET /api/grades - Get all grades or filter by query parameters
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const department = searchParams.get('department');
  const color = searchParams.get('color');
  const search = searchParams.get('search');

  try {
    let grades;

    if (search) {
      // Search grades by grade level, department, or description
      // For now, get all grades and filter client-side
      const allGrades = await GradeDatabase.getAllGrades();
      grades = allGrades.filter(grade =>
        grade.gradeLevel.toString().includes(search.toLowerCase()) ||
        grade.department.toLowerCase().includes(search.toLowerCase()) ||
        grade.description.toLowerCase().includes(search.toLowerCase()) ||
        (grade.strand && grade.strand.toLowerCase().includes(search.toLowerCase()))
      );
    } else if (department) {
      // Validate and cast department parameter
      if (!DEPARTMENTS.includes(department as Department)) {
        return NextResponse.json(
          { error: `Invalid department. Must be one of: ${DEPARTMENTS.join(', ')}` },
          { status: 400 }
        );
      }
      // Get grades by department
      grades = await GradeDatabase.getGradesByDepartment(department as Department);
    } else if (color) {
      // Get grades by color - filter from all grades
      if (!GRADE_COLORS.includes(color as any)) {
        return NextResponse.json(
          { error: `Invalid color. Must be one of: ${GRADE_COLORS.join(', ')}` },
          { status: 400 }
        );
      }
      const allGrades = await GradeDatabase.getAllGrades();
      grades = allGrades.filter(grade => grade.color === color);
    } else {
      // Get all grades
      grades = await GradeDatabase.getAllGrades();
    }

    console.log('Successfully fetched grades, count:', grades?.length || 0);
    return NextResponse.json({ grades });
  } catch (error) {
    console.error('Error fetching grades:', error);
    console.error('Department param:', department);
    console.error('Color param:', color);
    console.error('Search param:', search);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch grades';
    return NextResponse.json(
      { error: errorMessage, details: { department, color, search } },
      { status: 500 }
    );
  }
}

// POST /api/grades - Create a new grade
export async function POST(request: NextRequest) {
  try {
    const { gradeLevel, department, description, color, registrarUid, strand } = await request.json();

    // Validate required fields
    if (!gradeLevel || !department || !color || !registrarUid) {
      return NextResponse.json(
        { error: 'Missing required fields: gradeLevel, department, color, registrarUid' },
        { status: 400 }
      );
    }

    // Validate department is valid
    if (!DEPARTMENTS.includes(department as Department)) {
      return NextResponse.json(
        { error: `Invalid department. Must be one of: ${DEPARTMENTS.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate grade level
    if (gradeLevel < 1 || gradeLevel > 12) {
      return NextResponse.json(
        { error: 'Grade level must be between 1 and 12' },
        { status: 400 }
      );
    }

    // Validate color
    if (!GRADE_COLORS.includes(color)) {
      return NextResponse.json(
        { error: `Invalid color. Must be one of: ${GRADE_COLORS.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if registrar exists and has proper role
    const hasRegistrarRole = await RegistrarDatabase.hasRegistrarRole(registrarUid);
    if (!hasRegistrarRole) {
      return NextResponse.json(
        { error: 'Only registrars can create grades' },
        { status: 403 }
      );
    }

    const gradeData: CreateGradeData = {
      gradeLevel: Number(gradeLevel),
      department: department as Department,
      description: description?.trim() || '',
      color,
      strand: strand || undefined,
      createdBy: registrarUid,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const grade = await GradeDatabase.createGrade(gradeData);

    return NextResponse.json({
      grade,
      message: 'Grade created successfully'
    });
  } catch (error) {
    console.error('Error creating grade:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create grade';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
