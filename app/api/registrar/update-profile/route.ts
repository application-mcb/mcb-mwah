import { NextRequest, NextResponse } from 'next/server'
import { RegistrarDatabase } from '@/lib/registrar-database'

export async function POST(request: NextRequest) {
  try {
    const {
      uid,
      firstName,
      middleName,
      lastName,
      nameExtension,
      birthday,
      photoURL,
    } = await request.json()

    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      )
    }

    // Update registrar profile
    const updateData: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    }

    if (middleName) {
      updateData.middleName = middleName.trim()
    }

    if (nameExtension) {
      updateData.nameExtension = nameExtension.trim()
    }

    if (birthday) {
      updateData.birthday = birthday.trim()
    }

    if (photoURL) {
      updateData.photoURL = photoURL
    }

    const updatedRegistrar = await RegistrarDatabase.updateRegistrar(
      uid,
      updateData
    )

    if (!updatedRegistrar) {
      return NextResponse.json(
        { error: 'Registrar not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      registrar: updatedRegistrar,
    })
  } catch (error: any) {
    console.error('Profile update failed:', error)

    return NextResponse.json(
      { error: 'Profile update failed: ' + error.message },
      { status: 500 }
    )
  }
}

