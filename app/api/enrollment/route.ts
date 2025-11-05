import { NextRequest, NextResponse } from 'next/server';
import { EnrollmentDatabase } from '@/lib/enrollment-database';
import { db } from '@/lib/firebase-server';
import { getApps } from 'firebase/app';
import { where, collection, query, getDocs } from 'firebase/firestore';

console.log('  Enrollment API route loaded using Firebase Client SDK');

// POST /api/enrollment - Submit enrollment request
export async function POST(request: NextRequest) {
  try {
    const { userId, gradeId, gradeLevel, department, personalInfo, documents, studentType, courseId, courseCode, courseName, yearLevel, semester, level } = await request.json();

    // Validate required fields based on level
    if (!userId || !personalInfo) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, personalInfo' },
        { status: 400 }
      );
    }

    // Validate level-specific requirements
    if (level === 'college') {
      if (!courseId || !courseCode || !courseName || !yearLevel || !semester) {
        return NextResponse.json(
          { error: 'Missing required fields for college enrollment: courseId, courseCode, courseName, yearLevel, semester' },
          { status: 400 }
        );
      }
    } else {
      // Default to high school level
      if (!gradeId) {
        return NextResponse.json(
          { error: 'Missing required fields for high school enrollment: gradeId' },
          { status: 400 }
        );
      }
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

    // Check for duplicate enrollment before submitting
    // For college: check if enrollment exists for current AY + semester
    // For high school: check if enrollment exists for current AY
    if (level === 'college' && semester) {
      const existingEnrollment = await EnrollmentDatabase.getEnrollment(userId, ayCode, semester);
      if (existingEnrollment.success && existingEnrollment.data) {
        return NextResponse.json(
          { error: `You have already enrolled for ${ayCode} ${semester === 'first-sem' ? 'First' : 'Second'} Semester. Please enroll for the other semester or wait for the next academic year.` },
          { status: 400 }
        );
      }
    } else {
      // High school: check if enrollment exists for current AY
      const existingEnrollment = await EnrollmentDatabase.getEnrollment(userId, ayCode);
      if (existingEnrollment.success && existingEnrollment.data) {
        return NextResponse.json(
          { error: `You have already enrolled for ${ayCode}. Please wait for the next academic year to enroll again.` },
          { status: 400 }
        );
      }
    }

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
        ...(level === 'college' ? {
          courseId,
          courseCode,
          courseName,
          yearLevel,
          semester,
          level: 'college'
        } : {
          gradeLevel,
          department,
          level: 'high-school'
        }),
        schoolYear: ayCode,
        enrollmentDate: new Date().toISOString(),
        status: 'pending',
        studentType: studentType || 'regular' // Use provided studentType or default to regular
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

    console.log('  Enrollment submitted successfully for user:', userId);

    // Determine enrollment ID based on level
    let enrollmentId: string;
    if (level === 'college' && semester) {
      enrollmentId = `${userId}_${ayCode}_${semester}`;
    } else {
      enrollmentId = `${userId}_${ayCode}`;
    }

    return NextResponse.json({
      success: true,
      message: 'Enrollment submitted successfully',
      enrollmentId,
      ayCode,
      semester: level === 'college' && semester ? semester : undefined
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
    const { userId, selectedSubjects, orNumber, scholarship, studentId, updateLatestId, sectionId, unassignSection, studentType, updateAY, updateSemester, updateEnrollmentStartPeriodHS, updateEnrollmentEndPeriodHS, updateEnrollmentStartPeriodCollege, updateEnrollmentEndPeriodCollege, level, semester } = await request.json();

    // If updating Academic Year and/or Semester
    if (updateAY) {
      const result = await EnrollmentDatabase.updateSystemConfig(
        updateAY, 
        updateSemester,
        updateEnrollmentStartPeriodHS,
        updateEnrollmentEndPeriodHS,
        updateEnrollmentStartPeriodCollege,
        updateEnrollmentEndPeriodCollege
      );
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to update settings' },
          { status: 500 }
        );
      }
      return NextResponse.json({
        success: true,
        message: 'Settings updated successfully',
        ayCode: updateAY,
        semester: updateSemester
      });
    }

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

      console.log('  Section assigned successfully for user:', userId);

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

      console.log('  Section unassigned successfully for user:', userId);

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
    const result = await EnrollmentDatabase.enrollStudent(userId, selectedSubjects, orNumber, scholarship, studentId, studentType, level, semester);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to enroll student' },
        { status: 500 }
      );
    }

    console.log('  Student enrolled successfully for user:', userId);

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

// DELETE /api/enrollment - Delete student enrollment permanently
export async function DELETE(request: NextRequest) {
  try {
    const { userId, level, semester } = await request.json();

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Process enrollment deletion using the database class
    const result = await EnrollmentDatabase.deleteEnrollment(userId, level, semester);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete enrollment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Enrollment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete enrollment',
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
  const getEnrolledSubjects = searchParams.get('getEnrolledSubjects');

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
        semester: systemConfig.semester || '1',
        enrollmentStartPeriodHS: systemConfig.enrollmentStartPeriodHS,
        enrollmentEndPeriodHS: systemConfig.enrollmentEndPeriodHS,
        enrollmentStartPeriodCollege: systemConfig.enrollmentStartPeriodCollege,
        enrollmentEndPeriodCollege: systemConfig.enrollmentEndPeriodCollege,
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

  // Get enrolled subjects for a student
  if (getEnrolledSubjects === 'true' && userId) {
    try {
      console.log('🔍 API: Getting enrolled subjects for user:', userId);

      // Get system config for current AY and semester
      const systemConfig = await EnrollmentDatabase.getSystemConfig();
      const ayCode = systemConfig.ayCode;
      const currentSemester = systemConfig.semester;

      console.log('🔍 API: Current config - AY:', ayCode, 'Semester:', currentSemester);

      // Convert semester number to semester format
      const semesterFormat = currentSemester === '1' ? 'first-sem' : currentSemester === '2' ? 'second-sem' : undefined;

      console.log('🔍 API: Semester format:', semesterFormat);

      // Try to get enrollment document from subcollection
      const { collection: firestoreCollection, doc: firestoreDoc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase-server');

      let enrollmentDoc = null;
      let enrollmentData = null;

      // Try college enrollment first (with semester)
      if (semesterFormat) {
        const collegeDocId = `${ayCode}_${semesterFormat}`;
        console.log('🔍 API: Trying college enrollment path:', `student/${userId}/enrollment/${collegeDocId}`);
        let collegeDoc = await getDoc(firestoreDoc(db, 'student', userId, 'enrollment', collegeDocId));
        console.log('🔍 API: College doc (student) exists:', collegeDoc.exists());
        if (!collegeDoc.exists()) {
          // Fallback to plural collection name
          console.log('🔁 Fallback: Trying students collection path:', `students/${userId}/enrollment/${collegeDocId}`);
          collegeDoc = await getDoc(firestoreDoc(db, 'students', userId, 'enrollment', collegeDocId));
          console.log('🔍 API: College doc (students) exists:', collegeDoc.exists());
        }
        if (collegeDoc.exists()) {
          enrollmentDoc = collegeDoc;
          enrollmentData = collegeDoc.data();
          console.log('🔍 API: Found college enrollment data:', enrollmentData);
        }
      }

      // If not found, try high school enrollment (without semester)
      if (!enrollmentDoc) {
        console.log('🔍 API: Trying high school enrollment path:', `student/${userId}/enrollment/${ayCode}`);
        let hsDoc = await getDoc(firestoreDoc(db, 'student', userId, 'enrollment', ayCode));
        console.log('🔍 API: HS doc (student) exists:', hsDoc.exists());
        if (!hsDoc.exists()) {
          // Fallback to plural collection name
          console.log('🔁 Fallback: Trying students collection path:', `students/${userId}/enrollment/${ayCode}`);
          hsDoc = await getDoc(firestoreDoc(db, 'students', userId, 'enrollment', ayCode));
          console.log('🔍 API: HS doc (students) exists:', hsDoc.exists());
        }
        if (hsDoc.exists()) {
          enrollmentDoc = hsDoc;
          enrollmentData = hsDoc.data();
          console.log('🔍 API: Found HS enrollment data:', enrollmentData);
        }
      }

      if (!enrollmentDoc || !enrollmentData) {
        console.log('🔍 API: No enrollment document found');
        return NextResponse.json({
          success: false,
          error: 'No enrollment found for current academic year'
        });
      }

      // Get selected subjects
      const selectedSubjects = enrollmentData.selectedSubjects || [];
      console.log('🔍 API: Selected subjects:', selectedSubjects);

      if (!Array.isArray(selectedSubjects) || selectedSubjects.length === 0) {
        console.log('🔍 API: No subjects in selectedSubjects array');
        return NextResponse.json({
          success: true,
          subjects: [],
          message: 'No subjects assigned yet'
        });
      }

      // Fetch subject details for each selected subject
      const subjectsResult = await EnrollmentDatabase.getSubjectsByIds(selectedSubjects);

      if (!subjectsResult.success) {
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch subject details'
        });
      }

      return NextResponse.json({
        success: true,
        subjects: subjectsResult.subjects || [],
        enrollmentInfo: {
          ayCode,
          semester: semesterFormat,
          level: enrollmentData.enrollmentInfo?.level,
          courseCode: enrollmentData.enrollmentInfo?.courseCode,
          gradeLevel: enrollmentData.enrollmentInfo?.gradeLevel
        }
      });
    } catch (error) {
      console.error('Error fetching enrolled subjects:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch enrolled subjects',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
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

  // Batch enrollment requests for multiple user IDs
  const userIds = searchParams.get('userIds');
  if (userIds) {
    try {
      const userIdArray = userIds.split(',').map(id => id.trim()).filter(id => id);
      const enrollmentPromises = userIdArray.map(id => EnrollmentDatabase.getEnrollment(id));

      const enrollmentResults = await Promise.all(enrollmentPromises);

      // Filter out failed requests and extract successful data
      const enrollments = enrollmentResults
        .filter(result => result.success && result.data)
        .map(result => result.data);

      return NextResponse.json({
        success: true,
        data: enrollments,
        count: enrollments.length
      });
    } catch (error) {
      console.error('Error fetching batch enrollments:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch batch enrollments',
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

  // Check if semester parameter is provided (for college enrollments)
  const semester = searchParams.get('semester');

  try {
    // First try using the database method
    const enrollmentResult = await EnrollmentDatabase.getEnrollment(userId, undefined, semester || undefined);

    if (enrollmentResult.success) {
      return NextResponse.json({
        success: true,
        data: enrollmentResult.data
      });
    }

    // Fallback: Direct query to top-level enrollments collection
    // This handles enrollments stored with old format (userId_AYCode document ID)
    const { collection: firestoreCollection, query: firestoreQuery, where: firestoreWhere, getDocs } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase-server');
    
    const systemConfig = await EnrollmentDatabase.getSystemConfig();
    const ayCode = systemConfig.ayCode;
    
    const enrollmentsRef = firestoreCollection(db, 'enrollments');
    
    // Query all enrollments for this user in current AY
    const enrollmentsQuery = firestoreQuery(
      enrollmentsRef,
      firestoreWhere('userId', '==', userId),
      firestoreWhere('ayCode', '==', ayCode)
    );
    
    const snapshot = await getDocs(enrollmentsQuery);
    
    // Look through all matching documents
    for (const docSnapshot of snapshot.docs) {
      const docData = docSnapshot.data();
      if (docData.enrollmentData) {
        const enrollmentData = docData.enrollmentData;
        const enrollmentAY = enrollmentData.enrollmentInfo?.schoolYear;
        const enrollmentSemester = enrollmentData.enrollmentInfo?.semester;
        const enrollmentLevel = enrollmentData.enrollmentInfo?.level;
        
        // For college: must match AY + semester
        if (semester && enrollmentLevel === 'college') {
          if (enrollmentAY === ayCode && enrollmentSemester === semester) {
            return NextResponse.json({
              success: true,
              data: enrollmentData
            });
          }
        }
        // For high school: must match AY only (no semester)
        else if (!semester && (enrollmentLevel === 'high-school' || (!enrollmentLevel && !enrollmentSemester))) {
          if (enrollmentAY === ayCode) {
            return NextResponse.json({
              success: true,
              data: enrollmentData
            });
          }
        }
      }
    }
    
    // If no enrollment found after all checks
    // Return 200 with success: false (not 404) so frontend doesn't treat it as an error
    return NextResponse.json({
      success: false,
      error: 'No enrollment found for this user'
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
