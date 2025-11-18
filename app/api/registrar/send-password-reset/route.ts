import { NextRequest, NextResponse } from 'next/server'
import { RegistrarDatabase } from '@/lib/registrar-database'

export async function POST(request: NextRequest) {
  try {
    const { uid, email } = await request.json()

    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Firebase API key not configured' },
        { status: 500 }
      )
    }

    // Get the user's email from the database if not provided
    let userEmail = email
    if (!userEmail) {
      const registrar = await RegistrarDatabase.getRegistrar(uid)
      if (!registrar) {
        return NextResponse.json(
          { error: 'Registrar not found' },
          { status: 404 }
        )
      }
      userEmail = registrar.email
    }

    console.log('Sending password reset email to:', userEmail)

    // Use Firebase Auth REST API to send password reset email
    const resetResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestType: 'PASSWORD_RESET',
          email: userEmail,
          continueUrl: `${
            process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          }/auth/reset-password`,
        }),
      }
    )

    if (!resetResponse.ok) {
      const errorData = await resetResponse.json()
      console.error('Failed to send password reset email:', errorData)

      if (errorData.error?.message === 'EMAIL_NOT_FOUND') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        {
          error:
            errorData.error?.message || 'Failed to send password reset email',
        },
        { status: 400 }
      )
    }

    const result = await resetResponse.json()
    console.log('Password reset email sent successfully:', result)

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully',
      email: userEmail,
      emailSent: true,
    })
  } catch (error: any) {
    console.error('Error sending password reset email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send password reset email' },
      { status: 500 }
    )
  }
}

