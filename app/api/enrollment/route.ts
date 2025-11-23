import { NextRequest, NextResponse } from 'next/server'
import { EnrollmentDatabase } from '@/lib/enrollment-database'
import { GradeDatabase } from '@/lib/grade-section-database'
import { db } from '@/lib/firebase-server'
import { getApps } from 'firebase/app'
import { where, collection, query, getDocs } from 'firebase/firestore'

console.log('  Enrollment API route loaded using Firebase Client SDK')

// POST /api/enrollment - Submit enrollment request
export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      gradeId,
      gradeLevel,
      department,
      personalInfo,
      documents,
      studentType,
      courseId,
      courseCode,
      courseName,
      yearLevel,
      semester,
      level,
    } = await request.json()

    // Validate required fields based on level
    if (!userId || !personalInfo) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, personalInfo' },
        { status: 400 }
      )
    }

    // Validate level-specific requirements
    if (level === 'college') {
      if (!courseId || !courseCode || !courseName || !yearLevel || !semester) {
        return NextResponse.json(
          {
            error:
              'Missing required fields for college enrollment: courseId, courseCode, courseName, yearLevel, semester',
          },
          { status: 400 }
        )
      }
    } else {
      // Default to high school level
      if (!gradeId) {
        return NextResponse.json(
          {
            error:
              'Missing required fields for high school enrollment: gradeId',
          },
          { status: 400 }
        )
      }
    }

    // First check if student exists
    const studentResult = await EnrollmentDatabase.getStudent(userId)
    if (!studentResult.success) {
      return NextResponse.json(
        { error: studentResult.error || 'Student not found' },
        { status: 404 }
      )
    }

    // Get system configuration
    const systemConfig = await EnrollmentDatabase.getSystemConfig()
    const ayCode = systemConfig.ayCode

    // Check for duplicate enrollment before submitting
    // For college: check if enrollment exists for current AY + semester
    // For SHS: check if enrollment exists for current AY + semester
    // For JHS: check if enrollment exists for current AY (no semester)
    const isSHS = level === 'high-school' && department === 'SHS'

    if ((level === 'college' && semester) || (isSHS && semester)) {
      // College or SHS: check by semester
      const existingEnrollment = await EnrollmentDatabase.getEnrollment(
        userId,
        ayCode,
        semester
      )
      const eData: any = existingEnrollment.data
      const matchesCurrent = !!(
        eData &&
        eData.enrollmentInfo?.schoolYear === ayCode &&
        eData.enrollmentInfo?.semester === semester &&
        ((level === 'college' && eData.enrollmentInfo?.level === 'college') ||
          (isSHS &&
            eData.enrollmentInfo?.level === 'high-school' &&
            eData.enrollmentInfo?.department === 'SHS'))
      )
      if (existingEnrollment.success && matchesCurrent) {
        return NextResponse.json(
          {
            error: `You have already enrolled for ${ayCode} ${
              semester === 'first-sem' ? 'First' : 'Second'
            } Semester. Please enroll for the other semester or wait for the next academic year.`,
          },
          { status: 400 }
        )
      }
    } else {
      // JHS: check if enrollment exists for current AY (no semester)
      const existingEnrollment = await EnrollmentDatabase.getEnrollment(
        userId,
        ayCode
      )
      const eData: any = existingEnrollment.data
      const matchesCurrent = !!(
        (
          eData &&
          eData.enrollmentInfo?.schoolYear === ayCode &&
          (eData.enrollmentInfo?.level === 'high-school' ||
            (!eData.enrollmentInfo?.level &&
              !eData.enrollmentInfo?.semester)) &&
          eData.enrollmentInfo?.department !== 'SHS'
        ) // Exclude SHS enrollments
      )
      if (existingEnrollment.success && matchesCurrent) {
        return NextResponse.json(
          {
            error: `You have already enrolled for ${ayCode}. Please wait for the next academic year to enroll again.`,
          },
          { status: 400 }
        )
      }
    }

    // Process documents (assuming they're already uploaded to Firebase Storage)
    const processedDocuments: {
      [key: string]: { name: string; url: string; uploadedAt: string }
    } = {}

    if (documents) {
      for (const [docKey, docInfo] of Object.entries(documents)) {
        if (docInfo && typeof docInfo === 'object' && 'url' in docInfo) {
          processedDocuments[docKey] = {
            name: (docInfo as any).name || docKey,
            url: (docInfo as any).url,
            uploadedAt: new Date().toISOString(),
          }
        }
      }
    }

    // Prepare enrollment data
    // For high school, fetch strand if SHS
    let strand: string | undefined = undefined
    if (level === 'high-school' && department === 'SHS' && gradeId) {
      try {
        const grade = await GradeDatabase.getGrade(gradeId)
        strand = grade?.strand || ''
      } catch (e) {
        // strand remains undefined
      }
    }

    const enrollmentInfo: any = {
      schoolYear: ayCode,
      enrollmentDate: new Date().toISOString(),
      status: 'pending',
      studentType: studentType || 'regular', // Use provided studentType or default to regular
    }

    if (level === 'college') {
      enrollmentInfo.courseId = courseId
      enrollmentInfo.courseCode = courseCode
      enrollmentInfo.courseName = courseName
      enrollmentInfo.yearLevel = yearLevel
      enrollmentInfo.semester = semester
      enrollmentInfo.level = 'college'
    } else {
      enrollmentInfo.gradeLevel = String(gradeLevel)
      enrollmentInfo.gradeId = gradeId // Store gradeId for high school enrollments
      enrollmentInfo.department = department
      // Only include strand if it has a value (for SHS) - Firestore doesn't allow undefined
      if (strand !== undefined && strand !== '') {
        enrollmentInfo.strand = strand
      }
      // Only include semester for SHS
      if (department === 'SHS' && semester) {
        enrollmentInfo.semester = semester
      }
      enrollmentInfo.level = 'high-school'
    }

    const enrollmentData = {
      userId,
      personalInfo: {
        ...personalInfo,
        email: studentResult.data?.email || personalInfo.email,
      },
      enrollmentInfo,
      documents: processedDocuments,
    }

    // Submit enrollment using the database class
    const result = await EnrollmentDatabase.submitEnrollment(
      userId,
      enrollmentData
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to submit enrollment' },
        { status: 500 }
      )
    }

    console.log('  Enrollment submitted successfully for user:', userId)

    // Generate enrollment ID using new format
    // Build enrollment info for document ID generation
    const enrollmentInfoForId: any = {
      level,
      semester,
      department,
      courseCode: level === 'college' ? courseCode : undefined,
      yearLevel: level === 'college' ? yearLevel : undefined,
      gradeLevel: level === 'high-school' ? gradeLevel : undefined,
    }

    // For SHS, fetch strand from grade
    if (level === 'high-school' && department === 'SHS' && gradeId) {
      try {
        const grade = await GradeDatabase.getGrade(gradeId)
        if (grade && grade.strand) {
          enrollmentInfoForId.strand = grade.strand
        }
      } catch (e) {
        console.warn('Failed to fetch grade for strand:', e)
      }
    }

    // Generate document ID using database helper
    const docId = EnrollmentDatabase.generateDocumentId(
      ayCode,
      enrollmentInfoForId
    )
    const enrollmentId = `${userId}_${docId}`

    return NextResponse.json({
      success: true,
      message: 'Enrollment submitted successfully',
      enrollmentId,
      ayCode,
      semester:
        (level === 'college' ||
          (level === 'high-school' && department === 'SHS')) &&
        semester
          ? semester
          : undefined,
    })
  } catch (error) {
    console.error('ERROR::  Error submitting enrollment:', error)
    return NextResponse.json(
      {
        error: 'Failed to submit enrollment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PUT /api/enrollment - Process student enrollment or update latest ID or assign/unassign section
export async function PUT(request: NextRequest) {
  try {
    const {
      userId,
      selectedSubjects,
      orNumber,
      scholarship,
      studentId,
      updateLatestId,
      sectionId,
      unassignSection,
      studentType,
      updateAY,
      updateSemester,
      updateEnrollmentStartPeriodHS,
      updateEnrollmentEndPeriodHS,
      updateEnrollmentStartPeriodCollege,
      updateEnrollmentEndPeriodCollege,
      level,
      semester,
    } = await request.json()

    // If updating Academic Year and/or Semester
    if (updateAY) {
      const result = await EnrollmentDatabase.updateSystemConfig(
        updateAY,
        updateSemester,
        updateEnrollmentStartPeriodHS,
        updateEnrollmentEndPeriodHS,
        updateEnrollmentStartPeriodCollege,
        updateEnrollmentEndPeriodCollege
      )
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to update settings' },
          { status: 500 }
        )
      }
      return NextResponse.json({
        success: true,
        message: 'Settings updated successfully',
        ayCode: updateAY,
        semester: updateSemester,
      })
    }

    // If updating latest student ID
    if (updateLatestId) {
      const result = await EnrollmentDatabase.updateLatestStudentId(
        updateLatestId
      )
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to update latest student ID' },
          { status: 500 }
        )
      }
      return NextResponse.json({
        success: true,
        message: 'Latest student ID updated successfully',
      })
    }

    // If assigning section to student
    if (userId && sectionId) {
      // Validate required fields
      if (!userId || !sectionId) {
        return NextResponse.json(
          { error: 'Missing required fields: userId and sectionId' },
          { status: 400 }
        )
      }

      // Assign section using the database class
      const result = await EnrollmentDatabase.assignSection(userId, sectionId)

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to assign section' },
          { status: 500 }
        )
      }

      console.log('  Section assigned successfully for user:', userId)

      return NextResponse.json({
        success: true,
        message: 'Section assigned successfully',
      })
    }

    // If unassigning section from student
    if (userId && sectionId && unassignSection === true) {
      // Validate required fields
      if (!userId || !sectionId) {
        return NextResponse.json(
          { error: 'Missing required fields: userId and sectionId' },
          { status: 400 }
        )
      }

      // Unassign section using the database class
      const result = await EnrollmentDatabase.unassignSection(userId, sectionId)

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to unassign section' },
          { status: 500 }
        )
      }

      console.log('  Section unassigned successfully for user:', userId)

      return NextResponse.json({
        success: true,
        message: 'Section unassigned successfully',
      })
    }

    // Validate required fields
    if (!userId || !selectedSubjects || !Array.isArray(selectedSubjects)) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and selectedSubjects array' },
        { status: 400 }
      )
    }

    // Process enrollment using the database class
    const result = await EnrollmentDatabase.enrollStudent(
      userId,
      selectedSubjects,
      orNumber,
      scholarship,
      studentId,
      studentType,
      level,
      semester
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to enroll student' },
        { status: 500 }
      )
    }

    console.log('  Student enrolled successfully for user:', userId)

    return NextResponse.json({
      success: true,
      message: 'Student enrolled successfully',
    })
  } catch (error) {
    console.error('ERROR::  Error enrolling student:', error)
    return NextResponse.json(
      {
        error: 'Failed to enroll student',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/enrollment - Delete student enrollment permanently
export async function DELETE(request: NextRequest) {
  try {
    const { userId, level, semester } = await request.json()

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Process enrollment deletion using the database class
    const result = await EnrollmentDatabase.deleteEnrollment(
      userId,
      level,
      semester
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete enrollment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Enrollment deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting enrollment:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete enrollment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET /api/enrollment - Get enrollment data or system info
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const getConfig = searchParams.get('getConfig')
  const testFirebase = searchParams.get('testFirebase')
  const healthCheck = searchParams.get('healthCheck')
  const userId = searchParams.get('userId')
  const ayParam = searchParams.get('ay') || searchParams.get('ayCode')
  const getAll = searchParams.get('getAll')
  const getEnrolledStudents = searchParams.get('getEnrolledStudents')
  const getLatestId = searchParams.get('getLatestId')
  const getEnrolledSubjects = searchParams.get('getEnrolledSubjects')
  const latestHighSchool = searchParams.get('latestHighSchool')

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
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      },
    })
  }

  // Test Firebase connection
  if (testFirebase === 'true') {
    const testResult = await EnrollmentDatabase.testConnection()
    return NextResponse.json(testResult)
  }

  // If requesting config, return system configuration
  if (getConfig === 'true') {
    try {
      const systemConfig = await EnrollmentDatabase.getSystemConfig()
      return NextResponse.json({
        ayCode: systemConfig.ayCode,
        semester: systemConfig.semester || '1',
        enrollmentStartPeriodHS: systemConfig.enrollmentStartPeriodHS,
        enrollmentEndPeriodHS: systemConfig.enrollmentEndPeriodHS,
        enrollmentStartPeriodCollege: systemConfig.enrollmentStartPeriodCollege,
        enrollmentEndPeriodCollege: systemConfig.enrollmentEndPeriodCollege,
        systemData: systemConfig,
      })
    } catch (error) {
      console.error('Error loading system configuration:', error)
      return NextResponse.json(
        { error: 'Failed to load system configuration', ayCode: 'AY2526' },
        { status: 500 }
      )
    }
  }

  // If requesting latest student ID
  if (getLatestId === 'true') {
    try {
      const latestIdResult = await EnrollmentDatabase.getLatestStudentId()
      if (!latestIdResult.success) {
        return NextResponse.json(
          { error: latestIdResult.error || 'Failed to get latest student ID' },
          { status: 500 }
        )
      }
      return NextResponse.json({
        success: true,
        latestId: latestIdResult.latestId,
      })
    } catch (error) {
      console.error('Error fetching latest student ID:', error)
      return NextResponse.json(
        {
          error: 'Failed to fetch latest student ID',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  }

  // Get latest previous High School enrollment (previous AY, no semester)
  if (latestHighSchool === 'true' && userId) {
    try {
      const systemConfig = await EnrollmentDatabase.getSystemConfig()
      const currentAY = systemConfig.ayCode

      // Scan multiple locations for HS enrollments (no semester) excluding current AY
      const {
        collection: firestoreCollection,
        getDocs: firestoreGetDocs,
        doc: firestoreDoc,
        getDoc: firestoreGetDoc,
      } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase-server')

      const hsDocs: Array<{ ay?: string; updatedAt?: number; data: any }> = []

      // Helper to push if HS and not current AY
      const pushIfHS = (data: any) => {
        if (!data) return
        const info = data?.enrollmentInfo || {}
        const sy = info.schoolYear as string | undefined
        const level = info.level as string | undefined
        const semester = info.semester as string | undefined
        const isHS = level === 'high-school' || (!level && !semester)
        if (isHS && sy && sy !== currentAY) {
          const updatedAt =
            data.updatedAt &&
            (data.updatedAt.seconds || data.updatedAt._seconds)
              ? Number(
                  (data.updatedAt.seconds || data.updatedAt._seconds) * 1000
                )
              : Date.parse(data.enrollmentInfo?.enrollmentDate || '') || 0
          hsDocs.push({ ay: sy, updatedAt, data })
        }
      }

      // 1) students/{userId}/enrollment (singular)
      try {
        const col = firestoreCollection(db, 'students', userId, 'enrollment')
        const snap = await firestoreGetDocs(col)
        snap.forEach((docSnap) => pushIfHS(docSnap.data()))
      } catch {}

      // 2) students/{userId}/enrollments (plural)
      try {
        const col = firestoreCollection(db, 'students', userId, 'enrollments')
        const snap = await firestoreGetDocs(col)
        snap.forEach((docSnap) => pushIfHS(docSnap.data()))
      } catch {}

      // 3) student/{userId}/enrollment (legacy root name)
      try {
        const col = firestoreCollection(db, 'student', userId, 'enrollment')
        const snap = await firestoreGetDocs(col)
        snap.forEach((docSnap) => pushIfHS(docSnap.data()))
      } catch {}

      // 4) top-level enrollments for user (new format) – scan all AYs
      try {
        const topCol = firestoreCollection(db, 'enrollments')
        const topSnap = await firestoreGetDocs(topCol)
        topSnap.forEach((docSnap) => {
          const docData: any = docSnap.data()
          if (!docData || docData.userId !== userId) return
          const data = docData.enrollmentData || docData
          pushIfHS(data)
        })
      } catch {}

      if (hsDocs.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No previous high school enrollment found',
        })
      }

      // Sort by AY descending (AY2526 > AY2425), fallback to updatedAt desc
      const ayRank = (ay: string) => {
        const m = /^AY(\d{2})(\d{2})$/.exec(ay)
        if (!m) return -1
        const a = parseInt(m[1], 10)
        const b = parseInt(m[2], 10)
        return a * 100 + b
      }
      hsDocs.sort((a, b) => {
        const ar = a.ay ? ayRank(a.ay) : -1
        const br = b.ay ? ayRank(b.ay) : -1
        if (ar !== br) return br - ar
        return (b.updatedAt || 0) - (a.updatedAt || 0)
      })

      const latest = hsDocs[0].data
      return NextResponse.json({ success: true, data: latest })
    } catch (error) {
      console.error('Error fetching latest HS enrollment:', error)
      return NextResponse.json(
        {
          error: 'Failed to fetch latest HS enrollment',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  }

  // Get enrolled subjects for a student
  if (getEnrolledSubjects === 'true' && userId) {
    try {
      console.log('CONSOLE :: API: Getting enrolled subjects for user:', userId)

      // Get system config for current AY and semester
      const systemConfig = await EnrollmentDatabase.getSystemConfig()
      const ayCode = systemConfig.ayCode
      const currentSemester = systemConfig.semester

      console.log(
        'CONSOLE :: API: Current config - AY:',
        ayCode,
        'Semester:',
        currentSemester
      )

      // Convert semester number to semester format
      const semesterFormat =
        currentSemester === '1'
          ? 'first-sem'
          : currentSemester === '2'
          ? 'second-sem'
          : undefined

      console.log('CONSOLE :: API: Semester format:', semesterFormat)

      // Use EnrollmentDatabase.getEnrollment to handle all lookup logic
      const enrollmentResult = await EnrollmentDatabase.getEnrollment(
        userId,
        ayCode,
        semesterFormat
      )

      if (!enrollmentResult.success || !enrollmentResult.data) {
        console.log('CONSOLE :: API: No enrollment document found')
        return NextResponse.json({
          success: false,
          error:
            enrollmentResult.error ||
            'No enrollment found for current academic year',
        })
      }

      const enrollmentData = enrollmentResult.data
      console.log('CONSOLE :: API: Found enrollment data:', {
        level: enrollmentData.enrollmentInfo?.level,
        department: enrollmentData.enrollmentInfo?.department,
        gradeLevel: enrollmentData.enrollmentInfo?.gradeLevel,
        semester: enrollmentData.enrollmentInfo?.semester,
        strand: enrollmentData.enrollmentInfo?.strand,
      })

      // Get selected subjects (if available)
      let selectedSubjects = enrollmentData.selectedSubjects || []
      console.log('CONSOLE :: API: Selected subjects:', selectedSubjects)

      // If no selectedSubjects, resolve from subject assignments
      if (!Array.isArray(selectedSubjects) || selectedSubjects.length === 0) {
        console.log(
          'CONSOLE :: API: No selectedSubjects, resolving from subject assignments'
        )

        // Import SubjectAssignmentDatabase and SubjectSetDatabase
        const subjectAssignmentModule = await import(
          '@/lib/subject-assignment-database'
        )
        const subjectDatabaseModule = await import('@/lib/subject-database')

        type SubjectAssignmentData = typeof subjectAssignmentModule extends {
          SubjectAssignmentData: infer T
        }
          ? T
          : never
        type SubjectSetData = typeof subjectDatabaseModule extends {
          SubjectSetData: infer T
        }
          ? T
          : never

        const subjectAssignmentDb =
          new subjectAssignmentModule.SubjectAssignmentDatabase()

        // Get all subject assignments and subject sets
        const [allAssignments, allSubjectSets] = await Promise.all([
          subjectAssignmentDb.getAllSubjectAssignments(),
          subjectDatabaseModule.SubjectSetDatabase.getAllSubjectSets(),
        ])

        const enrollmentInfo = enrollmentData.enrollmentInfo

        // Resolve assigned subjects based on enrollment info
        let assignment: any = null
        if (enrollmentInfo?.level === 'college') {
          assignment =
            allAssignments.find(
              (a: any) =>
                a.level === 'college' &&
                a.courseCode === enrollmentInfo.courseCode &&
                a.yearLevel === parseInt(enrollmentInfo.yearLevel || '1') &&
                a.semester === enrollmentInfo.semester
            ) || null
        } else if (enrollmentInfo?.level === 'high-school') {
          const gradeLevel = parseInt(enrollmentInfo.gradeLevel || '0')
          const isSHS = enrollmentInfo?.department === 'SHS'

          if (isSHS) {
            // SHS: match by grade + semester + strand
            assignment =
              allAssignments.find(
                (a: any) =>
                  a.level === 'high-school' &&
                  a.gradeLevel === gradeLevel &&
                  a.semester === enrollmentInfo.semester &&
                  a.strand === enrollmentInfo.strand
              ) || null
          } else {
            // JHS: match by grade only (no semester)
            assignment =
              allAssignments.find(
                (a: any) =>
                  a.level === 'high-school' &&
                  a.gradeLevel === gradeLevel &&
                  !a.semester
              ) || null
          }
        }

        if (assignment) {
          const subjectSet = allSubjectSets.find(
            (s: any) => s.id === assignment!.subjectSetId
          )
          selectedSubjects = subjectSet?.subjects || []
          console.log(
            'CONSOLE :: API: Resolved subjects from assignment:',
            selectedSubjects.length
          )
        } else {
          console.log('CONSOLE :: API: No subject assignment found')
        }
      }

      if (!Array.isArray(selectedSubjects) || selectedSubjects.length === 0) {
        console.log('CONSOLE :: API: No subjects found')
        return NextResponse.json({
          success: true,
          subjects: [],
          message: 'No subjects assigned yet',
        })
      }

      // Fetch subject details for each selected subject
      const subjectsResult = await EnrollmentDatabase.getSubjectsByIds(
        selectedSubjects
      )

      if (!subjectsResult.success) {
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch subject details',
        })
      }

      return NextResponse.json({
        success: true,
        subjects: subjectsResult.subjects || [],
        enrollmentInfo: {
          ayCode,
          semester: semesterFormat,
          level: enrollmentData.enrollmentInfo?.level,
          courseCode: enrollmentData.enrollmentInfo?.courseCode,
          gradeLevel: enrollmentData.enrollmentInfo?.gradeLevel,
          department: enrollmentData.enrollmentInfo?.department,
          strand: enrollmentData.enrollmentInfo?.strand,
        },
      })
    } catch (error) {
      console.error('Error fetching enrolled subjects:', error)
      return NextResponse.json(
        {
          error: 'Failed to fetch enrolled subjects',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  }

  // Get all enrolled students for student management (status='enrolled' only)
  if (getEnrolledStudents === 'true') {
    try {
      const enrollmentsResult =
        await EnrollmentDatabase.getAllEnrolledStudents()

      if (!enrollmentsResult.success) {
        return NextResponse.json(
          {
            error:
              enrollmentsResult.error || 'Failed to fetch enrolled students',
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        enrollments: enrollmentsResult.data || [],
        count: enrollmentsResult.data?.length || 0,
      })
    } catch (error) {
      console.error('Error fetching enrolled students:', error)
      return NextResponse.json(
        {
          error: 'Failed to fetch enrolled students',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  }

  // Get all enrollments for registrar view
  if (getAll === 'true') {
    try {
      const enrollmentsResult = await EnrollmentDatabase.getAllEnrollments()

      if (!enrollmentsResult.success) {
        return NextResponse.json(
          { error: enrollmentsResult.error || 'Failed to fetch enrollments' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        data: enrollmentsResult.data || [],
        count: enrollmentsResult.data?.length || 0,
      })
    } catch (error) {
      console.error('Error fetching all enrollments:', error)
      return NextResponse.json(
        {
          error: 'Failed to fetch enrollments',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  }

  // Batch enrollment requests for multiple user IDs
  const userIds = searchParams.get('userIds')
  if (userIds) {
    try {
      const userIdArray = userIds
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id)
      const enrollmentPromises = userIdArray.map((id) =>
        EnrollmentDatabase.getEnrollment(id)
      )

      const enrollmentResults = await Promise.all(enrollmentPromises)

      // Filter out failed requests and extract successful data
      const enrollments = enrollmentResults
        .filter((result) => result.success && result.data)
        .map((result) => result.data)

      return NextResponse.json({
        success: true,
        data: enrollments,
        count: enrollments.length,
      })
    } catch (error) {
      console.error('Error fetching batch enrollments:', error)
      return NextResponse.json(
        {
          error: 'Failed to fetch batch enrollments',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  }

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  // Check if explicit AY and/or semester is provided
  const semester = searchParams.get('semester')

  try {
    // First try using the database method
    const enrollmentResult = await EnrollmentDatabase.getEnrollment(
      userId,
      ayParam || undefined,
      semester || undefined
    )

    if (enrollmentResult.success) {
      return NextResponse.json({
        success: true,
        data: enrollmentResult.data,
      })
    }

    // Fallback: Direct query to top-level enrollments collection
    // This handles enrollments stored with old format (userId_AYCode document ID)
    const {
      collection: firestoreCollection,
      query: firestoreQuery,
      where: firestoreWhere,
      getDocs,
    } = await import('firebase/firestore')
    const { db } = await import('@/lib/firebase-server')

    const systemConfig = await EnrollmentDatabase.getSystemConfig()
    const ayCode = systemConfig.ayCode

    const enrollmentsRef = firestoreCollection(db, 'enrollments')

    // Query all enrollments for this user in current AY
    const enrollmentsQuery = firestoreQuery(
      enrollmentsRef,
      firestoreWhere('userId', '==', userId),
      firestoreWhere('ayCode', '==', ayCode)
    )

    const snapshot = await getDocs(enrollmentsQuery)

    // Look through all matching documents
    for (const docSnapshot of snapshot.docs) {
      const docData = docSnapshot.data()
      if (docData.enrollmentData) {
        const enrollmentData = docData.enrollmentData
        const enrollmentAY = enrollmentData.enrollmentInfo?.schoolYear
        const enrollmentSemester = enrollmentData.enrollmentInfo?.semester
        const enrollmentLevel = enrollmentData.enrollmentInfo?.level

        // For college: must match AY + semester
        if (semester && enrollmentLevel === 'college') {
          if (enrollmentAY === ayCode && enrollmentSemester === semester) {
            return NextResponse.json({
              success: true,
              data: enrollmentData,
            })
          }
        }
        // For high school: must match AY only (no semester)
        else if (
          !semester &&
          (enrollmentLevel === 'high-school' ||
            (!enrollmentLevel && !enrollmentSemester))
        ) {
          if (enrollmentAY === ayCode) {
            return NextResponse.json({
              success: true,
              data: enrollmentData,
            })
          }
        }
      }
    }

    // If no enrollment found after all checks
    // Return 200 with success: false (not 404) so frontend doesn't treat it as an error
    return NextResponse.json({
      success: false,
      error: 'No enrollment found for this user',
    })
  } catch (error) {
    console.error('Error fetching enrollment:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch enrollment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
