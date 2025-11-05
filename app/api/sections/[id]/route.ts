import { NextRequest, NextResponse } from 'next/server';
import { SectionDatabase, CreateSectionData } from '@/lib/grade-section-database';

// GET /api/sections/[id] - Get a specific section
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const section = await SectionDatabase.getSection(id);

    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ section });
  } catch (error) {
    console.error('Error fetching section:', error);
    return NextResponse.json(
      { error: 'Failed to fetch section' },
      { status: 500 }
    );
  }
}

// PUT /api/sections/[id] - Update a specific section
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { gradeId, sectionName, grade, department, rank, description, registrarUid } = body;

    // Validate required fields
    if (!registrarUid) {
      return NextResponse.json(
        { error: 'Missing required field: registrarUid' },
        { status: 400 }
      );
    }

    // Check if section exists
    const existingSection = await SectionDatabase.getSection(id);
    if (!existingSection) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    const updateData: Partial<CreateSectionData> = {};

    // Validate and add gradeId if provided
    if (gradeId !== undefined) {
      updateData.gradeId = gradeId;
    }

    // Validate and add sectionName if provided
    if (sectionName !== undefined) {
      updateData.sectionName = sectionName.trim();

      // Check if updated section name would conflict with existing sections in the same grade
      if (updateData.gradeId || existingSection.gradeId) {
        const targetGradeId = updateData.gradeId || existingSection.gradeId;
        const existingSections = await SectionDatabase.getSectionsByGrade(targetGradeId);
        const sectionExists = existingSections.some(
          section => section.id !== id && section.sectionName.toLowerCase() === sectionName.toLowerCase().trim()
        );

        if (sectionExists) {
          return NextResponse.json(
            { error: `Section "${sectionName}" already exists for this grade level` },
            { status: 409 }
          );
        }
      }
    }

    // Add other fields if provided
    if (grade !== undefined) {
      updateData.grade = grade;
    }
    if (department !== undefined) {
      updateData.department = department;
    }
    if (rank !== undefined) {
      updateData.rank = rank;
    }
    if (description !== undefined) {
      updateData.description = description.trim();
    }

    const updatedSection = await SectionDatabase.updateSection(id, updateData);

    if (!updatedSection) {
      return NextResponse.json(
        { error: 'Failed to update section' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { section: updatedSection, message: 'Section updated successfully' }
    );
  } catch (error) {
    console.error('Error updating section:', error);
    return NextResponse.json(
      { error: 'Failed to update section' },
      { status: 500 }
    );
  }
}

// DELETE /api/sections/[id] - Delete a specific section
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const registrarUid = searchParams.get('registrarUid');

    if (!registrarUid) {
      return NextResponse.json(
        { error: 'Missing required parameter: registrarUid' },
        { status: 400 }
      );
    }

    // Check if section exists
    const existingSection = await SectionDatabase.getSection(id);
    if (!existingSection) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    // Delete the section
    const success = await SectionDatabase.deleteSection(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete section' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Section deleted successfully' }
    );
  } catch (error) {
    console.error('Error deleting section:', error);
    return NextResponse.json(
      { error: 'Failed to delete section' },
      { status: 500 }
    );
  }
}
