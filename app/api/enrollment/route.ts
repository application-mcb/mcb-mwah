import { NextRequest, NextResponse } from 'next/server';
import { EnrollmentDatabase } from '@/lib/enrollment-database';
import { db } from '@/lib/firebase-server';
import { getApps } from 'firebase/app';
import { where, collection, query, getDocs } from 'firebase/firestore';

console.log('✅ Enrollment API route loaded using Firebase Client SDK');

// POST /api/enrollment - Submit enrollment request
export async function POST(request: NextRequest) {
  try {
    const { userId, gradeId, gradeLevel, department, personalInfo, documents } = await request.json();

    // Validate required fields
    if (!userId || !gradeId || !personalInfo) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, gradeId, personalInfo' },
        { status: 400 }
      );
    }

    // First check if student exists
    const studentResult = await EnrollmentDatabase.getStudent(userId);
    if (!studentResult.success) {
      return NextResponse.json(
        { error: studentResult.error || 'Student not found' },
        { status: 404 }
      );
    }

    // Get system configuration
    const systemConfig = await EnrollmentDatabase.getSystemConfig();
    const ayCode = systemConfig.ayCode;

    // Process documents (assuming they're already uploaded to Firebase Storage)
    const processedDocuments: { [key: string]: { name: string; url: string; uploadedAt: string } } = {};

    if (documents) {
      for (const [docKey, docInfo] of Object.entries(documents)) {
        if (docInfo && typeof docInfo === 'object' && 'url' in docInfo) {
          processedDocuments[docKey] = {
            name: (docInfo as any).name || docKey,
            url: (docInfo as any).url,
            uploadedAt: new Date().toISOString()
          };
        }
      }
    }

    // Prepare enrollment data
    const enrollmentData = {
      userId,
      personalInfo: {
        ...personalInfo,
        email: studentResult.data?.email || personalInfo.email,
      },
      enrollmentInfo: {
        gradeLevel,
        schoolYear: ayCode,
        enrollmentDate: new Date().toISOString(),
        status: 'pending'
      },
      documents: processedDocuments
    };

    // Submit enrollment using the database class
    const result = await EnrollmentDatabase.submitEnrollment(userId, enrollmentData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to submit enrollment' },
        { status: 500 }
      );
    }

    console.log('✅ Enrollment submitted successfully for user:', userId);

    return NextResponse.json({
      success: true,
      message: 'Enrollment submitted successfully',
      enrollmentId: `${userId}_${ayCode}`,
      ayCode
    });
  } catch (error) {
    console.error('❌ Error submitting enrollment:', error);
    return NextResponse.json(
      {
        error: 'Failed to submit enrollment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/enrollment - Process student enrollment or update latest ID or assign/unassign section
export async function PUT(request: NextRequest) {
  try {
    const { userId, selectedSubjects, orNumber, scholarship, studentId, updateLatestId, sectionId, unassignSection } = await request.json();

    // If updating latest student ID
    if (updateLatestId) {
      const result = await EnrollmentDatabase.updateLatestStudentId(updateLatestId);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to update latest student ID' },
          { status: 500 }
        );
      }
      return NextResponse.json({
        success: true,
        message: 'Latest student ID updated successfully'
      });
    }

    // If assigning section to student
    if (userId && sectionId) {
      // Validate required fields
      if (!userId || !sectionId) {
        return NextResponse.json(
          { error: 'Missing required fields: userId and sectionId' },
          { status: 400 }
        );
      }

      // Assign section using the database class
      const result = await EnrollmentDatabase.assignSection(userId, sectionId);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to assign section' },
          { status: 500 }
        );
      }

      console.log('✅ Section assigned successfully for user:', userId);

      return NextResponse.json({
        success: true,
        message: 'Section assigned successfully'
      });
    }

    // If unassigning section from student
    if (userId && sectionId && unassignSection === true) {
      // Validate required fields
      if (!userId || !sectionId) {
        return NextResponse.json(
          { error: 'Missing required fields: userId and sectionId' },
          { status: 400 }
        );
      }

      // Unassign section using the database class
      const result = await EnrollmentDatabase.unassignSection(userId, sectionId);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to unassign section' },
          { status: 500 }
        );
      }

      console.log('✅ Section unassigned successfully for user:', userId);

      return NextResponse.json({
        success: true,
        message: 'Section unassigned successfully'
      });
    }

    // Validate required fields
    if (!userId || !selectedSubjects || !Array.isArray(selectedSubjects)) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and selectedSubjects array' },
        { status: 400 }
      );
    }

    // Process enrollment using the database class
    const result = await EnrollmentDatabase.enrollStudent(userId, selectedSubjects, orNumber, scholarship, studentId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to enroll student' },
        { status: 500 }
      );
    }

    console.log('✅ Student enrolled successfully for user:', userId);

    return NextResponse.json({
      success: true,
      message: 'Student enrolled successfully'
    });
  } catch (error) {
    console.error('❌ Error enrolling student:', error);
    return NextResponse.json(
      {
        error: 'Failed to enroll student',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/enrollment - Revoke student enrollment
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Process enrollment revocation using the database class
    const result = await EnrollmentDatabase.revokeEnrollment(userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to revoke enrollment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Enrollment revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking enrollment:', error);
    return NextResponse.json(
      {
        error: 'Failed to revoke enrollment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/enrollment - Get enrollment data or system info
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const getConfig = searchParams.get('getConfig');
  const testFirebase = searchParams.get('testFirebase');
  const healthCheck = searchParams.get('healthCheck');
  const userId = searchParams.get('userId');
  const getAll = searchParams.get('getAll');
  const getLatestId = searchParams.get('getLatestId');

  // Simple health check endpoint
  if (healthCheck === 'true') {
    return NextResponse.json({
      success: true,
      message: 'API route is working',
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cwd: process.cwd(),
        firebaseConfigured: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      }
    });
  }

  // Test Firebase connection
  if (testFirebase === 'true') {
    const testResult = await EnrollmentDatabase.testConnection();
    return NextResponse.json(testResult);
  }

  // If requesting config, return system configuration
  if (getConfig === 'true') {
    try {
      const systemConfig = await EnrollmentDatabase.getSystemConfig();
      return NextResponse.json({
        ayCode: systemConfig.ayCode,
        systemData: systemConfig
      });
    } catch (error) {
      console.error('Error loading system configuration:', error);
      return NextResponse.json(
        { error: 'Failed to load system configuration', ayCode: 'AY2526' },
        { status: 500 }
      );
    }
  }

  // If requesting latest student ID
  if (getLatestId === 'true') {
    try {
      const latestIdResult = await EnrollmentDatabase.getLatestStudentId();
      if (!latestIdResult.success) {
        return NextResponse.json(
          { error: latestIdResult.error || 'Failed to get latest student ID' },
          { status: 500 }
        );
      }
      return NextResponse.json({
        success: true,
        latestId: latestIdResult.latestId
      });
    } catch (error) {
      console.error('Error fetching latest student ID:', error);
      return NextResponse.json(
        { error: 'Failed to fetch latest student ID', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }

  // Get all enrollments for registrar view
  if (getAll === 'true') {
    try {
      const enrollmentsResult = await EnrollmentDatabase.getAllEnrollments();

      if (!enrollmentsResult.success) {
        return NextResponse.json(
          { error: enrollmentsResult.error || 'Failed to fetch enrollments' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: enrollmentsResult.data || [],
        count: enrollmentsResult.data?.length || 0
      });
    } catch (error) {
      console.error('Error fetching all enrollments:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch enrollments',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  }

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  try {
    const enrollmentResult = await EnrollmentDatabase.getEnrollment(userId);

    if (!enrollmentResult.success) {
      return NextResponse.json(
        { error: enrollmentResult.error || 'No enrollment found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: enrollmentResult.data
    });
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch enrollment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
