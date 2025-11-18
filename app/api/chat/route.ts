import { NextRequest, NextResponse } from 'next/server'
import { ChatDatabase } from '@/lib/chat-database'

// GET /api/chat?userId={uid} - Get user's chats
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    const chats = await ChatDatabase.getUserChats(userId)

    return NextResponse.json({
      success: true,
      chats,
    })
  } catch (error) {
    console.error('Error getting chats:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get chats',
      },
      { status: 500 }
    )
  }
}

// POST /api/chat - Create new chat
export async function POST(request: NextRequest) {
  try {
    const { studentId, registrarId } = await request.json()

    if (!studentId || !registrarId) {
      return NextResponse.json(
        { success: false, error: 'studentId and registrarId are required' },
        { status: 400 }
      )
    }

    const result = await ChatDatabase.createChat(studentId, registrarId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      chatId: result.chatId,
    })
  } catch (error) {
    console.error('Error creating chat:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create chat',
      },
      { status: 500 }
    )
  }
}

