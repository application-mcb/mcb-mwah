import { NextRequest, NextResponse } from 'next/server'
import { handleRegistrarChatbotMessage } from '@/components/registrar/utils/registrar-chatbot-handler'

export async function POST(request: NextRequest) {
  try {
    const { message, context, lastAIMessage } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get base URL for API calls
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`

    // Call the registrar chatbot handler
    const response = await handleRegistrarChatbotMessage(
      message,
      baseUrl,
      lastAIMessage
    )

    // Format response for the frontend
    const responseData: any = {
      response: response.message,
      intent: response.intent,
    }

    // Include data if available
    if (response.data) {
      responseData.data = response.data
    }

    // Include action if available
    if (response.action) {
      responseData.action = response.action
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Registrar Chatbot API Error:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to process request'

    return NextResponse.json(
      {
        error: 'Failed to process chatbot request',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
