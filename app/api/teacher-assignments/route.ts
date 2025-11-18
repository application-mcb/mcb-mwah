import { NextRequest, NextResponse } from 'next/server';
import { SubjectDatabase } from '@/lib/subject-database';
import { SectionDatabase } from '@/lib/grade-section-database';
import { TeacherDatabase } from '@/lib/teacher-database';
import { RegistrarDatabase } from '@/lib/registrar-database';

// GET /api/teacher-assignments - Get teacher assignments for subjects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const teacherId = searchParams.get('teacherId');
    const sectionId = searchParams.get('sectionId');
    const gradeLevel = searchParams.get('gradeLevel');

    let assignments;

    if (subjectId) {
      // Get assignments for a specific subject
      assignments = await getAssignmentsForSubject(subjectId);
    } else if (teacherId) {
      // Get assignments for a specific teacher
      assignments = await getAssignmentsForTeacher(teacherId);
    } else if (sectionId) {
      // Get assignments for a specific section
      assignments = await getAssignmentsForSection(sectionId);
    } else if (gradeLevel) {
      // Get assignments for a specific grade level
      assignments = await getAssignmentsForGradeLevel(parseInt(gradeLevel));
    } else {
      // Get all assignments
      assignments = await getAllAssignments();
    }

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Error fetching teacher assignments:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch teacher assignments';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/teacher-assignments - Assign teacher to subject for specific section
export async function POST(request: NextRequest) {
  try {
    const { subjectId, sectionId, teacherId, registrarUid } = await request.json();

    // Validate required fields
    if (!subjectId || !sectionId || !teacherId || !registrarUid) {
      return NextResponse.json(
        { error: 'Missing required fields: subjectId, sectionId, teacherId, registrarUid' },
        { status: 400 }
      );
    }

    // Check if registrar exists and has proper role
    const hasRegistrarRole = await RegistrarDatabase.hasRegistrarRole(registrarUid);
    if (!hasRegistrarRole) {
      return NextResponse.json(
        { error: 'Only registrars can assign teachers to subjects' },
        { status: 403 }
      );
    }

    // Validate subject exists
    const subject = await SubjectDatabase.getSubject(subjectId);
    if (!subject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Validate section exists
    const section = await SectionDatabase.getSection(sectionId);
    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    // Validate teacher exists
    const teacher = await TeacherDatabase.getTeacher(teacherId);
    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Check if teacher is already assigned to this subject for this section
    const existingAssignments = await getAssignmentsForSubject(subjectId);
    if (existingAssignments[sectionId] && existingAssignments[sectionId].includes(teacherId)) {
      return NextResponse.json(
        { error: 'Teacher is already assigned to this subject for this section' },
        { status: 409 }
      );
    }

    // Assign teacher to subject for section
    await assignTeacherToSubject(subjectId, sectionId, teacherId);

    return NextResponse.json({
      message: 'Teacher assigned to subject successfully',
      assignment: {
        subjectId,
        sectionId,
        teacherId,
        subjectName: subject.name,
        sectionName: section.sectionName,
        teacherName: `${teacher.firstName} ${teacher.lastName}`
      }
    });
  } catch (error) {
    console.error('Error assigning teacher to subject:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to assign teacher to subject';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/teacher-assignments - Remove teacher assignment from subject for section
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const sectionId = searchParams.get('sectionId');
    const registrarUid = searchParams.get('registrarUid');
    const teacherId = searchParams.get('teacherId');

    if (!subjectId || !sectionId || !registrarUid) {
      return NextResponse.json(
        { error: 'Missing required parameters: subjectId, sectionId, registrarUid' },
        { status: 400 }
      );
    }

    // Check if registrar exists and has proper role
    const hasRegistrarRole = await RegistrarDatabase.hasRegistrarRole(registrarUid);
    if (!hasRegistrarRole) {
      return NextResponse.json(
        { error: 'Only registrars can remove teacher assignments' },
        { status: 403 }
      );
    }

    // Remove teacher assignment (pass teacherId if provided to remove only that teacher)
    await removeTeacherAssignment(subjectId, sectionId, teacherId || undefined);

    return NextResponse.json({
      message: 'Teacher assignment removed successfully'
    });
  } catch (error) {
    console.error('Error removing teacher assignment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to remove teacher assignment';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Helper functions
async function getAllAssignments(): Promise<Record<string, Record<string, string[]>>> {
  try {
    const subjects = await SubjectDatabase.getAllSubjects();
    const assignments: Record<string, Record<string, string[]>> = {};

    for (const subject of subjects) {
      if (subject.teacherAssignments) {
        assignments[subject.id] = subject.teacherAssignments as Record<string, string[]>;
      }
    }

    return assignments;
  } catch (error) {
    console.error('Error getting all assignments:', error);
    throw error;
  }
}

async function getAssignmentsForSubject(subjectId: string): Promise<Record<string, string[]>> {
  try {
    const subject = await SubjectDatabase.getSubject(subjectId);
    if (!subject) {
      throw new Error('Subject not found');
    }

    return (subject.teacherAssignments as Record<string, string[]>) || {};
  } catch (error) {
    console.error('Error getting assignments for subject:', error);
    throw error;
  }
}

async function getAssignmentsForTeacher(teacherId: string) {
  try {
    const subjects = await SubjectDatabase.getAllSubjects();
    const assignments: Record<string, string[]> = {};

    for (const subject of subjects) {
      if (subject.teacherAssignments) {
        const sectionIds = Object.entries(subject.teacherAssignments as Record<string, string[]>)
          .filter(([_, assignedTeacherIds]) => Array.isArray(assignedTeacherIds) && assignedTeacherIds.includes(teacherId))
          .map(([sectionId, _]) => sectionId);

        if (sectionIds.length > 0) {
          assignments[subject.id] = sectionIds;
        }
      }
    }

    return assignments;
  } catch (error) {
    console.error('Error getting assignments for teacher:', error);
    throw error;
  }
}

async function getAssignmentsForSection(sectionId: string): Promise<Record<string, string[]>> {
  try {
    const subjects = await SubjectDatabase.getAllSubjects();
    const assignments: Record<string, string[]> = {};

    for (const subject of subjects) {
      if (subject.teacherAssignments && (subject.teacherAssignments as Record<string, string[]>)[sectionId]) {
        assignments[subject.id] = (subject.teacherAssignments as Record<string, string[]>)[sectionId];
      }
    }

    return assignments;
  } catch (error) {
    console.error('Error getting assignments for section:', error);
    throw error;
  }
}

async function getAssignmentsForGradeLevel(gradeLevel: number): Promise<Record<string, Record<string, string[]>>> {
  try {
    const subjects = await SubjectDatabase.getSubjectsByGradeLevel(gradeLevel);
    const assignments: Record<string, Record<string, string[]>> = {};

    for (const subject of subjects) {
      if (subject.teacherAssignments) {
        assignments[subject.id] = subject.teacherAssignments as Record<string, string[]>;
      }
    }

    return assignments;
  } catch (error) {
    console.error('Error getting assignments for grade level:', error);
    throw error;
  }
}

async function assignTeacherToSubject(subjectId: string, sectionId: string, teacherId: string) {
  try {
    const subjectRef = doc(db, 'subjects', subjectId);

    // Get current subject data
    const subjectSnap = await getDoc(subjectRef);
    if (!subjectSnap.exists()) {
      throw new Error('Subject not found');
    }

    const subjectData = subjectSnap.data();
    const teacherAssignments = subjectData.teacherAssignments || {};

    // Initialize section assignments as array if it doesn't exist
    if (!teacherAssignments[sectionId]) {
      teacherAssignments[sectionId] = [];
    }

    // Add teacher to section if not already assigned
    if (!teacherAssignments[sectionId].includes(teacherId)) {
      teacherAssignments[sectionId].push(teacherId);
    }

    // Update subject with new assignment
    await updateDoc(subjectRef, {
      teacherAssignments,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error assigning teacher to subject:', error);
    throw error;
  }
}

async function removeTeacherAssignment(subjectId: string, sectionId: string, teacherId?: string) {
  try {
    const subjectRef = doc(db, 'subjects', subjectId);

    // Get current subject data
    const subjectSnap = await getDoc(subjectRef);
    if (!subjectSnap.exists()) {
      throw new Error('Subject not found');
    }

    const subjectData = subjectSnap.data();
    const teacherAssignments = subjectData.teacherAssignments || {};

    if (teacherId) {
      // Remove specific teacher from section
      if (teacherAssignments[sectionId] && Array.isArray(teacherAssignments[sectionId])) {
        teacherAssignments[sectionId] = teacherAssignments[sectionId].filter((id: string) => id !== teacherId);

        // Remove section key if no teachers left
        if (teacherAssignments[sectionId].length === 0) {
          delete teacherAssignments[sectionId];
        }
      }
    } else {
      // Remove entire section assignment
      delete teacherAssignments[sectionId];
    }

    // Update subject with removed assignment
    await updateDoc(subjectRef, {
      teacherAssignments,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error removing teacher assignment:', error);
    throw error;
  }
}

// Import missing dependencies
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase-server';
