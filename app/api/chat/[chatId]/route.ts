import { NextRequest, NextResponse } from 'next/server'
import { ChatDatabase } from '@/lib/chat-database'

// GET /api/chat/[chatId] - Get chat details
export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const { chatId } = params

    if (!chatId) {
      return NextResponse.json(
        { success: false, error: 'chatId is required' },
        { status: 400 }
      )
    }

    const chat = await ChatDatabase.getChat(chatId)

    if (!chat) {
      return NextResponse.json(
        { success: false, error: 'Chat not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      chat,
    })
  } catch (error) {
    console.error('Error getting chat:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get chat',
      },
      { status: 500 }
    )
  }
}

