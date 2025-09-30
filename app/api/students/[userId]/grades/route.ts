import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-server';

// GET /api/students/[userId]/grades - Get student grades for a specific AY
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const ayCode = searchParams.get('ayCode');

    if (!ayCode) {
      return NextResponse.json(
        { error: 'Academic year code is required' },
        { status: 400 }
      );
    }

    const userId = params.userId;

    // Get student grades for the specified AY
    const gradesRef = doc(db, 'students', userId, 'studentGrades', ayCode);
    const gradesSnap = await getDoc(gradesRef);

    if (!gradesSnap.exists()) {
      return NextResponse.json({
        grades: {},
        message: 'No grades found for this academic year'
      });
    }

    const gradesData = gradesSnap.data();

    // Remove metadata fields
    const { createdAt, updatedAt, ...grades } = gradesData;

    return NextResponse.json({ grades });
  } catch (error) {
    console.error('Error fetching student grades:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch student grades';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT /api/students/[userId]/grades - Update student grades
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { ayCode, grades } = await request.json();

    if (!ayCode) {
      return NextResponse.json(
        { error: 'Academic year code is required' },
        { status: 400 }
      );
    }

    if (!grades || typeof grades !== 'object') {
      return NextResponse.json(
        { error: 'Grades data is required' },
        { status: 400 }
      );
    }

    const userId = params.userId;

    // Update student grades
    const gradesRef = doc(db, 'students', userId, 'studentGrades', ayCode);

    // Prepare update data
    const updateData = {
      ...grades,
      updatedAt: serverTimestamp()
    };

    await updateDoc(gradesRef, updateData);

    console.log(`✅ Updated grades for student ${userId} in AY ${ayCode}`);

    return NextResponse.json({
      success: true,
      message: 'Grades updated successfully'
    });
  } catch (error) {
    console.error('Error updating student grades:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update student grades';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
