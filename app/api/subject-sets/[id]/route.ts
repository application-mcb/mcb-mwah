import { NextRequest, NextResponse } from 'next/server';
import { SubjectSetDatabase, CreateSubjectSetData } from '@/lib/subject-database';
import { RegistrarDatabase } from '@/lib/registrar-database';

// GET /api/subject-sets/[id] - Get a specific subject set by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subjectSet = await SubjectSetDatabase.getSubjectSet(id);

    if (!subjectSet) {
      return NextResponse.json(
        { error: 'Subject set not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ subjectSet });
  } catch (error: any) {
    console.error('Error fetching subject set:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subject set' },
      { status: 500 }
    );
  }
}

// PUT /api/subject-sets/[id] - Update a specific subject set
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if subject set exists
    const existingSubjectSet = await SubjectSetDatabase.getSubjectSet(id);
    if (!existingSubjectSet) {
      return NextResponse.json(
        { error: 'Subject set not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, subjects, gradeLevels, courseSelections, color, registrarUid } = body;

    // Validate registrar role if registrarUid is provided
    if (registrarUid) {
      const hasRegistrarRole = await RegistrarDatabase.hasRegistrarRole(registrarUid);
      if (!hasRegistrarRole) {
        return NextResponse.json(
          { error: 'Only registrars can update subject sets' },
          { status: 403 }
        );
      }
    }

    const updateData: Partial<CreateSubjectSetData> = {};

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (subjects !== undefined) updateData.subjects = subjects;
    if (color !== undefined) updateData.color = color;

    if (gradeLevels !== undefined) updateData.gradeLevels = gradeLevels;
    if (courseSelections !== undefined) updateData.courseSelections = courseSelections;

    // For backward compatibility, use the first grade level if available
    // Otherwise, keep the existing grade level
    if (gradeLevels !== undefined && gradeLevels.length > 0) {
      updateData.gradeLevel = gradeLevels[0];
    }

    const updatedSubjectSet = await SubjectSetDatabase.updateSubjectSet(id, updateData);

    if (!updatedSubjectSet) {
      return NextResponse.json(
        { error: 'Failed to update subject set' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subjectSet: updatedSubjectSet,
      message: 'Subject set updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating subject set:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update subject set' },
      { status: 500 }
    );
  }
}

// DELETE /api/subject-sets/[id] - Delete a specific subject set
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if subject set exists
    const existingSubjectSet = await SubjectSetDatabase.getSubjectSet(id);
    if (!existingSubjectSet) {
      return NextResponse.json(
        { error: 'Subject set not found' },
        { status: 404 }
      );
    }

    // Get registrarUid from query parameters instead of request body
    const url = new URL(request.url);
    const registrarUid = url.searchParams.get('registrarUid');

    // Validate registrar role if registrarUid is provided
    if (registrarUid) {
      const hasRegistrarRole = await RegistrarDatabase.hasRegistrarRole(registrarUid);
      if (!hasRegistrarRole) {
        return NextResponse.json(
          { error: 'Only registrars can delete subject sets' },
          { status: 403 }
        );
      }
    }

    const success = await SubjectSetDatabase.deleteSubjectSet(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete subject set' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Subject set deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting subject set:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete subject set' },
      { status: 500 }
    );
  }
}
