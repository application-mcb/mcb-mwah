import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const TARGET_MODEL = 'gemini-2.5-flash-lite'
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  const { subjectName, subjectCode, selectedSubjects } = await request.json()

  if (!subjectName && !subjectCode) {
    return NextResponse.json(
      { error: 'Subject name or code is required' },
      { status: 400 }
    )
  }

  // Check if API key is available
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    console.error('GOOGLE_GEMINI_API_KEY not found in environment variables')
    return NextResponse.json(
      {
        error:
          'AI service configuration issue. Please check your API key configuration.',
        type: 'config_error',
      },
      { status: 500 }
    )
  }

  try {
    // Build prompt based on whether this is a subject set or individual subject
    let prompt = ''

    if (
      selectedSubjects &&
      Array.isArray(selectedSubjects) &&
      selectedSubjects.length > 0
    ) {
      // This is a subject set - include selected subjects
      const subjectsList = selectedSubjects.join(', ')
      prompt = `Generate a concise description for a subject set named "${
        subjectName || subjectCode
      }" that includes the following subjects: ${subjectsList}. The description should be exactly 30 words. The description should:
- Explain what this subject set covers
- Mention the included subjects and their educational purpose
- Be suitable for an academic subject set in a high school setting
- Be professional and educational

Subject Set Name: ${subjectName || subjectCode}
Included Subjects: ${subjectsList}

Generate ONLY the description text, nothing else. Exactly 30 words.`
    } else {
      // This is an individual subject
      prompt = `Generate a concise subject description for "${
        subjectName || subjectCode
      }" in exactly 30 words or less. The description should be:
- Clear and informative
- Suitable for an academic subject in a high school setting
- Professional and educational
- Focus on what students will learn or cover

Subject: ${subjectName || subjectCode}
Code: ${subjectCode || 'N/A'}

Generate ONLY the description text, nothing else. Maximum 30 words.`
    }

    // Initialize and use the target model
    console.log(`Initializing ${TARGET_MODEL}...`)
    const model = genAI.getGenerativeModel({ model: TARGET_MODEL })

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim()

    // Validate the AI response
    if (!text || text.length === 0) {
      console.warn('AI returned empty response')
      return NextResponse.json(
        {
          error: 'AI generated an empty response. Please try again.',
          type: 'empty_response',
        },
        { status: 500 }
      )
    }

    // Check if the response is too long or seems invalid
    if (text.length > 500 || !text.includes(' ') || /^\d+$/.test(text)) {
      console.warn('AI response appears invalid')
      return NextResponse.json(
        {
          error: 'AI generated an invalid response. Please try again.',
          type: 'invalid_response',
        },
        { status: 500 }
      )
    }

    console.log(
      `✅ Successfully generated description using ${TARGET_MODEL}:`,
      text.substring(0, 100) + '...'
    )
    return NextResponse.json({ description: text })
  } catch (error) {
    console.error('AI Description Generation Error:', error)

    // Enhanced error handling to distinguish between different error types
    const err = error as any
    const errorMessage = err?.message || err?.toString() || 'Unknown error'
    const errorStatus = err?.status || err?.code

    console.error('Detailed Error Analysis:', {
      message: errorMessage,
      status: errorStatus,
      name: err?.name,
      code: err?.code,
      stack: err?.stack?.substring(0, 500), // Truncate stack trace
      fullError: JSON.stringify(err, Object.getOwnPropertyNames(err)),
    })

    // Check for specific error patterns
    const lowerMessage = errorMessage.toLowerCase()
    console.log('Error message analysis:', {
      contains429: lowerMessage.includes('429'),
      containsQuota: lowerMessage.includes('quota'),
      containsRateLimit: lowerMessage.includes('rate limit'),
      containsAuth:
        lowerMessage.includes('auth') || lowerMessage.includes('api_key'),
      containsNetwork:
        lowerMessage.includes('network') || lowerMessage.includes('fetch'),
      containsModel:
        lowerMessage.includes('model') || lowerMessage.includes('gemini'),
    })

    // Check for actual rate limiting (429 status or quota exceeded messages)
    const isRateLimited =
      errorStatus === 429 ||
      errorMessage.includes('429') ||
      errorMessage.includes('quota') ||
      errorMessage.includes('limit exceeded') ||
      errorMessage.includes('RESOURCE_EXHAUSTED')

    // Check for authentication/API key issues
    const isAuthError =
      errorStatus === 401 ||
      errorStatus === 403 ||
      errorMessage.includes('API_KEY') ||
      errorMessage.includes('authentication') ||
      errorMessage.includes('permission')

    if (isRateLimited) {
      console.log('Rate limit detected')
      return NextResponse.json(
        {
          error: 'AI service quota exceeded. Please try again later.',
          type: 'rate_limit',
        },
        { status: 429 }
      )
    }

    if (isAuthError) {
      console.log('Authentication error detected')
      return NextResponse.json(
        {
          error:
            'AI service authentication failed. Please check your API configuration.',
          type: 'auth_error',
        },
        { status: 500 }
      )
    }

    // For other errors (network, model issues, etc.)
    console.log('Other error detected')
    const isModelError =
      errorMessage.includes('model') ||
      errorMessage.includes('gemini') ||
      errorMessage.includes('not available') ||
      errorMessage.includes('not found')

    if (isModelError) {
      return NextResponse.json(
        {
          error: `${TARGET_MODEL} is not available. Please verify your Google Gemini API key has access to ${TARGET_MODEL}.`,
          type: 'model_unavailable',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        error: 'AI service temporarily unavailable. Please try again later.',
        type: 'service_unavailable',
      },
      { status: 500 }
    )
  }
}
