import { NextRequest, NextResponse } from 'next/server';
import { SectionDatabase, CreateSectionData, Department, DEPARTMENTS, GradeDatabase } from '@/lib/grade-section-database';
import { RegistrarDatabase } from '@/lib/registrar-database';

// GET /api/sections - Get all sections or filter by query parameters
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gradeId = searchParams.get('gradeId');
  const grade = searchParams.get('grade');
  const department = searchParams.get('department');
  const search = searchParams.get('search');

  try {
    let sections;

    if (search) {
      // Search sections by name or description
      // For now, get all sections and filter client-side
      const allSections = await SectionDatabase.getAllSections();
      sections = allSections.filter(section =>
        section.sectionName.toLowerCase().includes(search.toLowerCase()) ||
        section.description.toLowerCase().includes(search.toLowerCase()) ||
        section.grade.toLowerCase().includes(search.toLowerCase())
      );
    } else if (gradeId) {
      // Get sections by grade ID
      sections = await SectionDatabase.getSectionsByGrade(gradeId);
    } else if (grade) {
      // Get sections by grade level - filter from all sections
      const allSections = await SectionDatabase.getAllSections();
      sections = allSections.filter(section =>
        section.grade.toLowerCase().includes(`grade ${grade}`.toLowerCase())
      );
    } else if (department) {
      // Validate and cast department parameter
      if (!DEPARTMENTS.includes(department as Department)) {
        return NextResponse.json(
          { error: `Invalid department. Must be one of: ${DEPARTMENTS.join(', ')}` },
          { status: 400 }
        );
      }
      // Get sections by department
      sections = await SectionDatabase.getSectionsByDepartment(department as Department);
    } else {
      // Get all sections
      sections = await SectionDatabase.getAllSections();
    }

    console.log('Successfully fetched sections, count:', sections?.length || 0);
    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Error fetching sections:', error);
    console.error('Grade ID param:', gradeId);
    console.error('Grade param:', grade);
    console.error('Department param:', department);
    console.error('Search param:', search);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch sections';
    return NextResponse.json(
      { error: errorMessage, details: { gradeId, grade, department, search } },
      { status: 500 }
    );
  }
}

// POST /api/sections - Create a new section
export async function POST(request: NextRequest) {
  try {
    const { gradeId, sectionName, grade, department, rank, description, registrarUid } = await request.json();

    // Validate required fields
    if (!gradeId || !sectionName || !registrarUid) {
      return NextResponse.json(
        { error: 'Missing required fields: gradeId, sectionName, registrarUid' },
        { status: 400 }
      );
    }

    // Validate department is valid
    if (department && !DEPARTMENTS.includes(department as Department)) {
      return NextResponse.json(
        { error: `Invalid department. Must be one of: ${DEPARTMENTS.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if registrar exists and has proper role
    const hasRegistrarRole = await RegistrarDatabase.hasRegistrarRole(registrarUid);
    if (!hasRegistrarRole) {
      return NextResponse.json(
        { error: 'Only registrars can create sections' },
        { status: 403 }
      );
    }

    // Check if grade exists
    const gradeData = await GradeDatabase.getGrade(gradeId);
    if (!gradeData) {
      return NextResponse.json(
        { error: 'Grade not found' },
        { status: 404 }
      );
    }

    // Check if section name already exists for this grade
    const existingSections = await SectionDatabase.getSectionsByGrade(gradeId);
    const sectionExists = existingSections.some(
      section => section.sectionName.toLowerCase() === sectionName.toLowerCase().trim()
    );

    if (sectionExists) {
      return NextResponse.json(
        { error: `Section "${sectionName}" already exists for this grade level` },
        { status: 409 }
      );
    }

    const sectionData: CreateSectionData = {
      gradeId,
      sectionName: sectionName.trim(),
      grade: grade || `Grade ${gradeData.gradeLevel}`,
      department: (department as Department) || gradeData.department,
      rank: rank || 'A',
      description: description?.trim() || '',
      createdBy: registrarUid,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const section = await SectionDatabase.createSection(sectionData);

    return NextResponse.json({
      section,
      message: 'Section created successfully'
    });
  } catch (error) {
    console.error('Error creating section:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create section';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
