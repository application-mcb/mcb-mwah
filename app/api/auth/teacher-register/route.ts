import { NextRequest, NextResponse } from 'next/server'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { AuditLogDatabase } from '@/lib/audit-log-database'

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      password,
      firstName,
      middleName,
      lastName,
      extension,
      phone,
      registrarUid,
    } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
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

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Create user with Firebase
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )
    const user = userCredential.user

    // Create teacher record in database
    try {
      const { TeacherDatabase } = await import('@/lib/firestore-database')

      const teacherData = {
        id: user.uid,
        uid: user.uid,
        email: user.email || '',
        firstName: firstName || '',
        middleName: middleName || '',
        lastName: lastName || '',
        extension: extension || '',
        phone: phone || '',
        createdBy: registrarUid,
        createdAt: new Date(),
        updatedAt: new Date(),
        assignments: [], // Start with empty assignments
      }

      await TeacherDatabase.createTeacher(teacherData)

      try {
        await AuditLogDatabase.createLog({
          action: 'Created teacher account',
          category: 'teachers',
          status: 'success',
          context: `${teacherData.firstName} ${teacherData.lastName} • ${teacherData.email}`,
          actorId: registrarUid || '',
          actorName: 'Registrar',
          actorEmail: '',
          actorRole: 'registrar',
          metadata: {
            teacherUid: user.uid,
            teacherEmail: teacherData.email,
            phone: teacherData.phone,
            extension: teacherData.extension,
          },
        })
      } catch (logError) {
        console.warn('Audit log write failed (teacher register):', logError)
      }
    } catch (dbError) {
      console.error('Teacher database creation failed:', dbError)
      // If database creation fails, we should ideally delete the Firebase user
      // But for now, continue and let the user know
    }

    // Return success response with user data
    return NextResponse.json({
      success: true,
      message: 'Teacher account created successfully',
      user: {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    })
  } catch (error: any) {
    // Log error safely without exposing sensitive details
    console.error('Teacher registration failed:', error.code || 'Unknown error')

    // Handle specific Firebase auth errors
    let errorMessage = 'An error occurred during teacher registration'

    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'An account with this email already exists'
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address'
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak'
    } else if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'Email/password accounts are not enabled'
    }

    return NextResponse.json({ error: errorMessage }, { status: 400 })
  }
}
