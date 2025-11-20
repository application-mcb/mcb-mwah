import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get('uid')

    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Verify teacher exists in Firestore
    const teacherExists = await doesTeacherExist(uid)
    if (!teacherExists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let userRecord
    try {
      userRecord = await auth.getUser(uid)
    } catch (firebaseError: any) {
      if (firebaseError?.code === 'auth/user-not-found') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      console.error('Firebase Admin error:', firebaseError)
      return NextResponse.json(
        { error: 'Failed to check teacher status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      disabled: userRecord?.disabled ?? false,
      emailVerified: userRecord?.emailVerified ?? false,
    })
  } catch (error: any) {
    console.error('Error checking teacher status:', error)
    return NextResponse.json(
      { error: 'Failed to check teacher status' },
      { status: 500 }
    )
  }
}

// Helper: ensure teacher exists without leaking DB structure elsewhere
async function doesTeacherExist(uid: string): Promise<boolean> {
  try {
    const { TeacherDatabase } = await import('@/lib/firestore-database')
    const teacher = await TeacherDatabase.getTeacher(uid)
    return Boolean(teacher)
  } catch (error) {
    console.error('Error verifying teacher record:', error)
    return false
  }
}
