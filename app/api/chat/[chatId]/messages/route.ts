import { NextRequest, NextResponse } from 'next/server'
import { ChatDatabase } from '@/lib/chat-database'

// GET /api/chat/[chatId]/messages - Get messages for a chat
export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const { chatId } = params
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!chatId) {
      return NextResponse.json(
        { success: false, error: 'chatId is required' },
        { status: 400 }
      )
    }

    const messages = await ChatDatabase.getChatMessages(chatId, limit)

    return NextResponse.json({
      success: true,
      messages,
    })
  } catch (error) {
    console.error('Error getting messages:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get messages',
      },
      { status: 500 }
    )
  }
}

// POST /api/chat/[chatId]/messages - Send message
export async function POST(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const { chatId } = params
    const { senderId, content, type, fileData } = await request.json()

    if (!chatId || !senderId || !content) {
      return NextResponse.json(
        { success: false, error: 'chatId, senderId, and content are required' },
        { status: 400 }
      )
    }

    const result = await ChatDatabase.sendMessage(
      chatId,
      senderId,
      content,
      type || 'text',
      fileData
    )

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
      },
      { status: 500 }
    )
  }
}

