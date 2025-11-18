import { NextRequest, NextResponse } from 'next/server'
import { ChatDatabase } from '@/lib/chat-database'

// GET /api/chat/contacts?userId={uid}&role={role} - Get contacts list
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const role = searchParams.get('role') as 'student' | 'registrar' | null

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    if (!role || (role !== 'student' && role !== 'registrar')) {
      return NextResponse.json(
        { success: false, error: 'role must be "student" or "registrar"' },
        { status: 400 }
      )
    }

    const contacts = await ChatDatabase.getContacts(userId, role)

    return NextResponse.json({
      success: true,
      contacts,
    })
  } catch (error) {
    console.error('Error getting contacts:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get contacts',
      },
      { status: 500 }
    )
  }
}

