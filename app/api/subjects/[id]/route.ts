import { NextRequest, NextResponse } from 'next/server';
import { SubjectDatabase, CreateSubjectData } from '@/lib/subject-database';
import { RegistrarDatabase } from '@/lib/registrar-database';

// GET /api/subjects/[id] - Get a specific subject by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const subject = await SubjectDatabase.getSubject(id);

    if (!subject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ subject });
  } catch (error: any) {
    console.error('Error fetching subject:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subject' },
      { status: 500 }
    );
  }
}

// PUT /api/subjects/[id] - Update a specific subject
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if subject exists
    const existingSubject = await SubjectDatabase.getSubject(id);
    if (!existingSubject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { code, name, description, gradeLevels, gradeIds, courseCodes, courseSelections, color, lectureUnits, labUnits, prerequisites, postrequisites, registrarUid } = body;

    // Validate registrar role if registrarUid is provided
    if (registrarUid) {
      const hasRegistrarRole = await RegistrarDatabase.hasRegistrarRole(registrarUid);
      if (!hasRegistrarRole) {
        return NextResponse.json(
          { error: 'Only registrars can update subjects' },
          { status: 403 }
        );
      }
    }

    const updateData: Partial<CreateSubjectData> = {};

    if (code !== undefined) updateData.code = code.toUpperCase().trim();
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (gradeLevels !== undefined) updateData.gradeLevels = Array.isArray(gradeLevels) ? gradeLevels.map((level: any) => parseInt(level)) : [];
    if (gradeIds !== undefined) updateData.gradeIds = Array.isArray(gradeIds) ? gradeIds.map((id: any) => String(id)) : [];
    if (courseCodes !== undefined) updateData.courseCodes = Array.isArray(courseCodes) ? courseCodes : [];
    if (courseSelections !== undefined) updateData.courseSelections = Array.isArray(courseSelections) ? courseSelections : [];
    if (color !== undefined) updateData.color = color;
    if (lectureUnits !== undefined) updateData.lectureUnits = parseInt(lectureUnits);
    if (labUnits !== undefined) updateData.labUnits = parseInt(labUnits);
    if (prerequisites !== undefined) updateData.prerequisites = Array.isArray(prerequisites) ? prerequisites : [];
    if (postrequisites !== undefined) updateData.postrequisites = Array.isArray(postrequisites) ? postrequisites : [];

    const updatedSubject = await SubjectDatabase.updateSubject(id, updateData);

    if (!updatedSubject) {
      return NextResponse.json(
        { error: 'Failed to update subject' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subject: updatedSubject,
      message: 'Subject updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating subject:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update subject' },
      { status: 500 }
    );
  }
}

// DELETE /api/subjects/[id] - Delete a specific subject
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if subject exists
    const existingSubject = await SubjectDatabase.getSubject(id);
    if (!existingSubject) {
      return NextResponse.json(
        { error: 'Subject not found' },
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
          { error: 'Only registrars can delete subjects' },
          { status: 403 }
        );
      }
    }

    const success = await SubjectDatabase.deleteSubject(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete subject' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Subject deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting subject:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete subject' },
      { status: 500 }
    );
  }
}
