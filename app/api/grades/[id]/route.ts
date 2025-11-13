import { NextRequest, NextResponse } from 'next/server';
import { GradeDatabase, CreateGradeData, GRADE_COLORS } from '@/lib/grade-section-database';

// GET /api/grades/[id] - Get a specific grade
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const grade = await GradeDatabase.getGrade(id);

    if (!grade) {
      return NextResponse.json(
        { error: 'Grade not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ grade });
  } catch (error) {
    console.error('Error fetching grade:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grade' },
      { status: 500 }
    );
  }
}

// PUT /api/grades/[id] - Update a specific grade
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { gradeLevel, department, description, color, registrarUid, strand } = body;

    // Validate required fields
    if (!registrarUid) {
      return NextResponse.json(
        { error: 'Missing required field: registrarUid' },
        { status: 400 }
      );
    }

    // Check if grade exists
    const existingGrade = await GradeDatabase.getGrade(id);
    if (!existingGrade) {
      return NextResponse.json(
        { error: 'Grade not found' },
        { status: 404 }
      );
    }

    const updateData: Partial<CreateGradeData> = {};

    // Validate and add gradeLevel if provided
    if (gradeLevel !== undefined) {
      const isValidGradeLevel = (level: number): boolean => {
        return (level >= 7 && level <= 10) || // Junior High School
               (level >= 11 && level <= 12); // Senior High School
      };

      if (!isValidGradeLevel(gradeLevel)) {
        return NextResponse.json(
          { error: 'Invalid grade level. Valid ranges: 7-10 (Junior HS), 11-12 (Senior HS)' },
          { status: 400 }
        );
      }
      updateData.gradeLevel = Number(gradeLevel);
    }

    // Validate and add department if provided
    if (department !== undefined) {
      updateData.department = department;
    }

    // Validate department consistency if both gradeLevel and department are being updated
    if (updateData.gradeLevel !== undefined && updateData.department !== undefined) {
      const getExpectedDepartment = (level: number): string => {
        if (level >= 7 && level <= 10) return 'JHS';
        if (level >= 11 && level <= 12) return 'SHS';
        return '';
      };

      const expectedDepartment = getExpectedDepartment(updateData.gradeLevel);
      if (updateData.department !== expectedDepartment) {
        return NextResponse.json(
          { error: `Department mismatch. Grade ${updateData.gradeLevel} should be in ${expectedDepartment === 'JHS' ? 'Junior High School' : 'Senior High School'}` },
          { status: 400 }
        );
      }
    }

    // Validate and add description if provided
    if (description !== undefined) {
      if (description.length > 500) {
        return NextResponse.json(
          { error: 'Description must not exceed 500 characters' },
          { status: 400 }
        );
      }
      updateData.description = description.trim();
    }

    // Validate and add color if provided
    if (color !== undefined) {
      if (!GRADE_COLORS.includes(color as any)) {
        return NextResponse.json(
          { error: `Invalid color. Must be one of: ${GRADE_COLORS.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.color = color;
    }

    // Validate and add strand if provided
    if (strand !== undefined) {
      updateData.strand = strand;
    }

    // Check if updated grade would conflict with existing grade
    if (updateData.gradeLevel && updateData.department) {
      let newGradeId: string;
      if (updateData.department === 'SHS' && (updateData.gradeLevel === 11 || updateData.gradeLevel === 12) && updateData.strand) {
        newGradeId = `grade-${updateData.gradeLevel}-${updateData.department.toLowerCase()}-${updateData.strand.toLowerCase()}`;
      } else {
        newGradeId = `grade-${updateData.gradeLevel}-${updateData.department.toLowerCase()}`;
      }

      if (newGradeId !== id) {
        const conflictingGrade = await GradeDatabase.getGrade(newGradeId);
        if (conflictingGrade) {
          const gradeDisplayName = updateData.strand && (updateData.gradeLevel === 11 || updateData.gradeLevel === 12)
            ? `G${updateData.gradeLevel}${updateData.strand}`
            : `Grade ${updateData.gradeLevel}`;
          return NextResponse.json(
            { error: `${gradeDisplayName} for ${updateData.department} already exists` },
            { status: 409 }
          );
        }
      }
    }

    const updatedGrade = await GradeDatabase.updateGrade(id, updateData);

    if (!updatedGrade) {
      return NextResponse.json(
        { error: 'Failed to update grade' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { grade: updatedGrade, message: 'Grade updated successfully' }
    );
  } catch (error) {
    console.error('Error updating grade:', error);
    return NextResponse.json(
      { error: 'Failed to update grade' },
      { status: 500 }
    );
  }
}

// DELETE /api/grades/[id] - Delete a specific grade
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

    // Check if grade exists
    const existingGrade = await GradeDatabase.getGrade(id);
    if (!existingGrade) {
      return NextResponse.json(
        { error: 'Grade not found' },
        { status: 404 }
      );
    }

    // Delete the grade (will throw error if sections exist)
    const success = await GradeDatabase.deleteGrade(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete grade' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Grade deleted successfully' }
    );
  } catch (error: any) {
    console.error('Error deleting grade:', error);

    // Handle specific error messages
    if (error.message.includes('Cannot delete grade that has sections')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete grade' },
      { status: 500 }
    );
  }
}
