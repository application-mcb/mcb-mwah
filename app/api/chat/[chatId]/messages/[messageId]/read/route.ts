import { NextRequest, NextResponse } from 'next/server'
import { ChatDatabase } from '@/lib/chat-database'

// PUT /api/chat/[chatId]/messages/[messageId]/read - Mark message as read
export async function PUT(
  request: NextRequest,
  { params }: { params: { chatId: string; messageId: string } }
) {
  try {
    const { chatId, messageId } = params
    const { userId } = await request.json()

    if (!chatId || !messageId || !userId) {
      return NextResponse.json(
        { success: false, error: 'chatId, messageId, and userId are required' },
        { status: 400 }
      )
    }

    const result = await ChatDatabase.markAsRead(chatId, messageId, userId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Error marking message as read:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark message as read',
      },
      { status: 500 }
    )
  }
}

