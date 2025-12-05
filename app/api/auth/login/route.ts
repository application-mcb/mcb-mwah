import { NextRequest, NextResponse } from 'next/server'
import { serverTimestamp } from 'firebase/firestore'
import { StudentDatabase, TeacherDatabase } from '@/lib/firestore-database'
import { RegistrarDatabase } from '@/lib/registrar-database'
import { AuditLogDatabase } from '@/lib/audit-log-database'

export async function POST(request: NextRequest) {
  try {
    const { uid, email } = await request.json()

    // Validate input
    if (!uid || !email) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Sync user with database
    try {
      // Check if student already exists
      let userData = await StudentDatabase.getStudent(uid)

      if (!userData) {
        // If student doesn't exist, create a basic entry
        const basicStudentData = {
          uid: uid,
          email: email,
          firstName: '',
          lastName: '',
          middleName: '',
          nameExtension: '',
          phoneNumber: '',
          birthMonth: '',
          birthDay: '',
          birthYear: '',
          gender: '',
          civilStatus: '',
          streetName: '',
          province: '',
          municipality: '',
          barangay: '',
          zipCode: '',
          guardianName: '',
          guardianPhone: '',
          guardianRelationship: '',
          photoURL: '',
          provider: 'email' as const,
          academicDataUsageAgreement: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        }

        await StudentDatabase.createStudent(basicStudentData)
        // Get the created student data (which will be serialized)
        userData = await StudentDatabase.getStudent(uid)
      } else {
        // Update last login time
        await StudentDatabase.updateLastLogin(uid)
      }
    } catch (syncError) {
      console.error('User sync failed:', syncError)
      // Continue with login even if sync fails
    }

    // Check if user is a registrar first
    let isRegistrar = false
    try {
      isRegistrar = await RegistrarDatabase.hasRegistrarRole(uid)
    } catch (registrarError) {
      console.error('Registrar check failed:', registrarError)
      // Continue with login even if registrar check fails
    }

    // If user is a registrar, redirect to registrar dashboard
    if (isRegistrar) {
      try {
        await AuditLogDatabase.createLog({
          action: 'User login',
          category: 'access',
          status: 'success',
          context: 'Registrar dashboard login',
          actorId: uid,
          actorName: 'Registrar',
          actorEmail: email,
          actorRole: 'registrar',
        })
      } catch (logError) {
        console.warn('Audit log write failed (registrar login):', logError)
      }

      return NextResponse.json({
        success: true,
        user: {
          uid: uid,
          email: email,
          emailVerified: true,
        },
        isRegistrar: true,
        redirectTo: '/registrar',
      })
    }

    // Check if user is a teacher
    let isTeacher = false
    try {
      const teacher = await TeacherDatabase.getTeacher(uid)
      isTeacher = !!teacher
    } catch (teacherError) {
      console.error('Teacher check failed:', teacherError)
      // Continue with login even if teacher check fails
    }

    // If user is a teacher, redirect to teacher dashboard
    if (isTeacher) {
      try {
        await AuditLogDatabase.createLog({
          action: 'User login',
          category: 'access',
          status: 'success',
          context: 'Teacher dashboard login',
          actorId: uid,
          actorName: 'Teacher',
          actorEmail: email,
          actorRole: 'teacher',
        })
      } catch (logError) {
        console.warn('Audit log write failed (teacher login):', logError)
      }

      return NextResponse.json({
        success: true,
        user: {
          uid: uid,
          email: email,
          emailVerified: true,
        },
        isTeacher: true,
        redirectTo: '/teacher',
      })
    }

    // Check if user has a complete profile (for students)
    let hasCompleteProfile = false
    try {
      const userData = await StudentDatabase.getStudent(uid)
      hasCompleteProfile = !!(
        userData &&
        userData.firstName &&
        userData.lastName
      )
    } catch (profileError) {
      console.error('Profile check failed:', profileError)
      // Continue with login even if profile check fails
    }

    // Return success response with user data and profile status
    try {
      await AuditLogDatabase.createLog({
        action: 'User login',
        category: 'access',
        status: 'success',
        context: 'Student portal login',
        actorId: uid,
        actorName: 'Student',
        actorEmail: email,
        actorRole: 'student',
        metadata: { hasCompleteProfile },
      })
    } catch (logError) {
      console.warn('Audit log write failed (student login):', logError)
    }

    return NextResponse.json({
      success: true,
      user: {
        uid: uid,
        email: email,
        emailVerified: true,
      },
      hasCompleteProfile,
      isRegistrar: false,
      isTeacher: false,
    })
  } catch (error: any) {
    // Log error safely without exposing sensitive details
    console.error('Login failed:', error.code || 'Unknown error')
    console.error('Error details:', error.message)
    console.error('Full error:', error)

    try {
      await AuditLogDatabase.createLog({
        action: 'User login failed',
        category: 'access',
        status: 'info',
        context: 'Login failure',
        actorId: '',
        actorName: 'Unknown',
        actorEmail: '',
        actorRole: 'student',
        metadata: {
          code: error?.code,
          message: error?.message,
        },
      })
    } catch (logError) {
      console.warn('Audit log write failed (login error):', logError)
    }

    return NextResponse.json(
      {
        error: 'An error occurred during login',
        code: error.code,
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
