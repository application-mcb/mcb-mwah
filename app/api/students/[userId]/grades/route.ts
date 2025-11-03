import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-server';
import { EnrollmentDatabase } from '@/lib/enrollment-database';

// GET /api/students/[userId]/grades - Get student grades for a specific AY or batch grades for multiple students
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userIds = searchParams.get('userIds'); // For batch requests

    // Get current academic year from system config
    const systemConfig = await EnrollmentDatabase.getSystemConfig();
    const ayCode = systemConfig.ayCode;

    const { userId } = await params;

    // Handle batch grade requests
    if (userIds && userId === 'batch') {
      const userIdArray = userIds.split(',').map(id => id.trim()).filter(id => id);

      const gradePromises = userIdArray.map(async (studentId) => {
        try {
          const gradesRef = doc(db, 'students', studentId, 'studentGrades', ayCode);
          const gradesSnap = await getDoc(gradesRef);

          if (!gradesSnap.exists()) {
            return { userId: studentId, grades: {} };
          }

          const gradesData = gradesSnap.data();
          const { createdAt, updatedAt, ...grades } = gradesData;

          return { userId: studentId, grades };
        } catch (error) {
          console.error(`Error fetching grades for user ${studentId}:`, error);
          return { userId: studentId, grades: {} };
        }
      });

      const gradeResults = await Promise.all(gradePromises);

      return NextResponse.json({
        success: true,
        batchGrades: gradeResults,
        count: gradeResults.length
      });
    }

    // Handle single student grades request

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
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { grades } = await request.json();

    if (!grades || typeof grades !== 'object') {
      return NextResponse.json(
        { error: 'Grades data is required' },
        { status: 400 }
      );
    }

    // Get current academic year from system config
    const systemConfig = await EnrollmentDatabase.getSystemConfig();
    const ayCode = systemConfig.ayCode;

    const { userId } = await params;

    // Update student grades
    const gradesRef = doc(db, 'students', userId, 'studentGrades', ayCode);

    // Prepare update data
    const updateData = {
      ...grades,
      updatedAt: serverTimestamp()
    };

    // Check if document exists first
    const gradesSnap = await getDoc(gradesRef);

    if (gradesSnap.exists()) {
      // Update existing document
      await updateDoc(gradesRef, updateData);
    } else {
      // Create new document
      await setDoc(gradesRef, {
        ...updateData,
        createdAt: serverTimestamp()
      });
    }

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
