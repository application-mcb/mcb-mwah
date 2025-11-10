import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'

// Initialize genAI lazily to ensure env vars are loaded
const getGenAI = () => {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY is not set')
  }
  return new GoogleGenerativeAI(apiKey)
}

// Helper function to calculate average
const calculateAverage = (
  grades: {
    period1?: number | null
    period2?: number | null
    period3?: number | null
    period4?: number | null
    specialStatus?: string | null
  },
  isCollege: boolean = false
): number | null => {
  if (grades.specialStatus) return null

  let validGrades: number[]

  if (isCollege) {
    validGrades = [grades.period1, grades.period2, grades.period3].filter(
      (grade) => grade !== null && grade !== undefined
    ) as number[]
  } else {
    validGrades = [
      grades.period1,
      grades.period2,
      grades.period3,
      grades.period4,
    ].filter((grade) => grade !== null && grade !== undefined) as number[]
  }

  if (validGrades.length === 0) return null

  const sum = validGrades.reduce((acc, grade) => acc + grade, 0)
  return Math.round((sum / validGrades.length) * 100) / 100
}

// Helper function to convert percentage to numeric mode (5-point system)
const convertToNumericMode = (percentage: number | null): number | null => {
  if (percentage === null || percentage === undefined || percentage === 0)
    return null

  if (percentage >= 98) return 1.0
  if (percentage >= 95) return 1.25
  if (percentage >= 92) return 1.5
  if (percentage >= 89) return 1.75
  if (percentage >= 86) return 2.0
  if (percentage >= 83) return 2.25
  if (percentage >= 80) return 2.5
  if (percentage >= 77) return 2.75
  if (percentage >= 75) return 3.0
  return 5.0 // 74 and below
}

// Helper function to fetch subject details
async function fetchSubjectDetails(
  subjectId: string,
  baseUrl: string
): Promise<{ name: string; code: string } | null> {
  try {
    const response = await fetch(
      `${baseUrl}/api/subjects/${encodeURIComponent(subjectId)}`
    )
    if (!response.ok) {
      return null
    }
    const data = await response.json()
    if (data.subject) {
      return {
        name: data.subject.name || 'Unknown Subject',
        code: data.subject.code || '',
      }
    }
    return null
  } catch (error) {
    console.error(`Error fetching subject ${subjectId}:`, error)
    return null
  }
}

// Helper function to format transcript as structured data
async function formatTranscript(
  gradesData: any,
  metadata: any,
  baseUrl: string
): Promise<{ isCollege: boolean; transcriptData: any[]; metadata: any }> {
  const isCollege =
    !!metadata.studentSemester ||
    (metadata.studentLevel &&
      (String(metadata.studentLevel).toLowerCase().includes('year') ||
        String(metadata.studentLevel).toLowerCase().includes('bs')))

  const grades = gradesData.grades || {}
  const subjectIds = Object.keys(grades).filter(
    (key) =>
      ![
        'studentName',
        'studentSection',
        'studentLevel',
        'studentSemester',
        'createdAt',
        'updatedAt',
      ].includes(key)
  )

  // Fetch subject details for all subjects
  const subjectDetailsPromises = subjectIds.map(async (subjectId) => {
    const subjectGrade = grades[subjectId]
    if (!subjectGrade) return null

    // Try to get subject details from API
    const subjectDetails = await fetchSubjectDetails(subjectId, baseUrl)

    // Use subject details from API, fallback to grade data, then to 'Unknown Subject'
    const subjectName =
      subjectDetails?.name || subjectGrade.subjectName || 'Unknown Subject'
    const subjectCode = subjectDetails?.code || subjectGrade.subjectCode || ''

    const period1 = subjectGrade.period1 ?? null
    const period2 = subjectGrade.period2 ?? null
    const period3 = subjectGrade.period3 ?? null
    const period4 = subjectGrade.period4 ?? null
    const specialStatus = subjectGrade.specialStatus

    const avg = specialStatus ? null : calculateAverage(subjectGrade, isCollege)
    const finalGrade =
      isCollege && avg !== null ? convertToNumericMode(avg) : null

    return {
      subjectName,
      subjectCode,
      period1,
      period2,
      period3,
      period4,
      average: avg,
      finalGrade,
      specialStatus,
    }
  })

  const transcriptData = (await Promise.all(subjectDetailsPromises)).filter(
    Boolean
  ) as any[]

  return {
    isCollege,
    transcriptData,
    metadata: {
      studentName: metadata.studentName || 'N/A',
      studentLevel: metadata.studentLevel || 'N/A',
      studentSection: metadata.studentSection || null,
      studentSemester: metadata.studentSemester || null,
      ayCode: gradesData.ayCode || 'N/A',
    },
  }
}

// Define available tools for the AI agent
const tools = {
  functionDeclarations: [
    {
      name: 'get_student_transcript',
      description:
        'Get student transcript/grades for a specific academic year. If ayCode not provided, returns available academic years with metadata. Can filter by year level (e.g., "Grade 7", "first year", "BSIT 1").',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          userId: {
            type: SchemaType.STRING,
            description: 'Student user ID (required)',
          },
          ayCode: {
            type: SchemaType.STRING,
            description:
              'Academic year code (e.g., "AY2526" or "2526"). Optional - if not provided, returns list of available periods.',
          },
          yearLevel: {
            type: SchemaType.STRING,
            description:
              'Filter by year level (e.g., "Grade 7", "first year", "BSIT 1"). Optional.',
          },
        },
        required: ['userId'],
      },
    },
  ],
} as any

// Execute tool calls
async function executeToolCalls(
  functionCalls: any[],
  baseUrl: string,
  studentUserId: string
) {
  const results: any[] = []

  for (const call of functionCalls) {
    const { name, args } = call

    try {
      let result

      switch (name) {
        case 'get_student_transcript':
          const transcriptParams = new URLSearchParams()
          // Use userId from args if provided, otherwise use the studentUserId from context
          const targetUserId = args.userId || studentUserId
          if (!targetUserId) {
            throw new Error('userId is required for get_student_transcript')
          }
          transcriptParams.append('userId', targetUserId)
          if (args.ayCode) {
            transcriptParams.append('ayCode', args.ayCode)
            console.log('Transcript request with ayCode:', args.ayCode)
          }
          if (args.yearLevel) {
            transcriptParams.append('yearLevel', args.yearLevel)
            console.log('Transcript request with yearLevel:', args.yearLevel)
          }

          const transcriptUrl = `${baseUrl}/api/ai/student-grades?${transcriptParams.toString()}`
          console.log('Fetching transcript from:', transcriptUrl)

          const transcriptResponse = await fetch(transcriptUrl)
          const transcriptData = await transcriptResponse.json()

          if (!transcriptResponse.ok) {
            console.error('Transcript fetch failed:', transcriptData)
            throw new Error(
              transcriptData.error || 'Failed to fetch transcript'
            )
          }

          console.log(
            'Transcript fetch successful. Has grades:',
            !!transcriptData.grades,
            'Has periods:',
            !!transcriptData.periods
          )

          results.push({
            functionResponse: {
              name,
              response: transcriptData,
            },
          })
          break

        default:
          results.push({
            functionResponse: {
              name,
              response: { error: `Unknown function: ${name}` },
            },
          })
      }
    } catch (error) {
      console.error(`Error executing tool ${name}:`, error)
      results.push({
        functionResponse: {
          name,
          response: {
            error: `Failed to execute ${name}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        },
      })
    }
  }

  return results
}

export async function POST(request: NextRequest) {
  try {
    console.log('AI Student Chat API: Received request')
    const requestBody = await request.json()
    const {
      message,
      studentContext,
      lastAIMessage,
      userId,
      model = 'gemini-2.0-flash',
    } = requestBody
    console.log(
      'AI Student Chat API: Parsed request, message length:',
      message?.length
    )

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (!studentContext) {
      return NextResponse.json(
        { error: 'Student context is required' },
        { status: 400 }
      )
    }

    // Validate API key
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY
    if (!apiKey || apiKey.trim().length === 0) {
      console.error('GOOGLE_GEMINI_API_KEY is not set or empty')
      return NextResponse.json(
        {
          error: 'AI service configuration error',
          details: 'API key not configured',
        },
        { status: 500 }
      )
    }

    console.log(
      'API Key found, length:',
      apiKey.length,
      'starts with:',
      apiKey.substring(0, 10)
    )

    // Extract userId - should be passed in request body, or try to get from context
    let studentUserId: string | null = userId || null

    if (!studentUserId) {
      // Try to extract from studentContext as fallback
      const contextObj = studentContext as any
      // Check if userId is stored somewhere in the context
      // This is a fallback - ideally userId should be passed explicitly
      console.warn(
        'userId not found in request body, attempting to extract from context'
      )
    }

    if (!studentUserId) {
      return NextResponse.json(
        {
          error:
            'Student userId is required. Please ensure userId is passed in the request body.',
        },
        { status: 400 }
      )
    }

    // Get base URL for API calls
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`

    // Initialize Gemini model with tools
    // Model can be: gemini-2.0-flash-lite, gemini-2.5-flash-lite, gemini-2.0-flash, gemini-2.5-flash, or gemini-2.5-pro
    const genAI = getGenAI()
    const geminiModel = genAI.getGenerativeModel({
      model: model,
      tools: [tools],
    })

    // Build comprehensive system prompt
    // Limit the context size to avoid token limits
    let contextString: string
    try {
      contextString = JSON.stringify(studentContext, null, 2)
      // Check if context is too large (roughly 100k characters limit)
      if (contextString.length > 100000) {
        console.warn('Student context is very large, truncating...')
        // Keep only essential parts
        const essentialContext = {
          studentInfo: studentContext.studentInfo,
          documents: {
            submitted: studentContext.documents?.submitted?.slice(0, 10) || [],
            missing: studentContext.documents?.missing || [],
          },
          subjects: {
            assigned: studentContext.subjects?.assigned?.slice(0, 20) || [],
          },
          actions: studentContext.actions,
        }
        contextString = JSON.stringify(essentialContext, null, 2)
      }
    } catch (error) {
      console.error('Error stringifying student context:', error)
      return NextResponse.json(
        {
          error: 'Invalid student context data',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 400 }
      )
    }

    const systemPrompt = `You are a friendly and helpful AI assistant for the Marian College of Baliuag, Inc. registrar system. You are analyzing a specific student's information to help the registrar answer questions. Be conversational, warm, and human-like in your responses.

STUDENT CONTEXT:
${contextString}

CRITICAL INSTRUCTIONS - READ CAREFULLY:
1. Write like a normal, friendly person having a conversation. NO markdown formatting, NO asterisks, NO section headers unless it's a comprehensive summary.
2. Analyze the user's question FIRST. Determine EXACTLY what information is being requested.
3. Answer ONLY that specific information. Do NOT provide any additional information beyond what was asked.
4. Write naturally and conversationally, as if you're talking to a colleague.

QUESTION ANALYSIS - Determine what is being asked:
- "transcript" / "show transcript" / "student transcript" / "transcript of" / "transcript for" / "show me the transcript" / "grades" / "grade" / "report card" / "report" / "academic record" / "student grades" / "student grade" → YOU MUST CALL get_student_transcript function IMMEDIATELY. Do NOT use context data. Do NOT show assigned subjects. ONLY call the function.
- "who is the guardian" / "guardian" / "guardian information" → Answer naturally: "Sure! [Student Name]'s guardian is [Name], [Relationship]. You can reach them at [Phone] or [Email]."
- "what subjects" / "subjects" / "courses" / "classes" → Answer naturally, then use "Subjects:" (NO asterisks) so the system can show a table. Example: "Here are [Student Name]'s assigned subjects: Subjects:"
- "enrollment" / "enrollment status" / "enrolled" → Answer naturally: "Sure! [Student Name] is enrolled for [AY], [Grade/Course], Section [Section Name]."
- "documents" / "missing documents" → Answer naturally: "All required documents have been submitted." or "The following documents are missing: [list]"
- "scholarship" → Answer naturally about scholarship
- "personal info" / "personal information" → Answer naturally about personal info
- "everything" / "all" / "summary" / "overview" / "tell me about" → THEN use structured format with section headers

TRANSCRIPT HANDLING - CRITICAL INSTRUCTIONS (HIGHEST PRIORITY - MANDATORY):
When user asks for transcript, grades, report card, academic record, or ANY grade-related query:
1. YOU MUST IMMEDIATELY CALL get_student_transcript function - THIS IS MANDATORY. DO NOT use context data. DO NOT show assigned subjects. DO NOT try to answer from memory. ONLY call the function.
2. Extract information from the query with flexible matching:
   - AY code patterns: "AY2526", "2526", "AY 2526", "AY-2526", "academic year 2526", "on AY2526", "for AY2526", "AY 25-26", "25-26"
   - Year level patterns: "Grade 7", "Grade7", "7th grade", "first year", "1st year", "BSIT 1", "BSIT1", "for Grade 7", "in Grade 7"
3. Call get_student_transcript function IMMEDIATELY with these rules:
   - ALWAYS provide userId: "${studentUserId}" (REQUIRED)
   - If AY code is detected in query (any format), extract and provide ayCode parameter (normalize to format like "AY2526")
   - If year level is detected, provide yearLevel parameter (keep original format)
   - If NO ayCode is mentioned, call WITHOUT ayCode first to get available periods list
4. Handling function results:
   - If function returns periods list (count > 0):
     * If count = 1: YOU MUST automatically call get_student_transcript AGAIN with that single ayCode to fetch the actual grades
     * If count > 1: Ask user: "Which academic year would you like to see? Available: [list each period with its level, e.g., 'AY2526 (Grade 7)', 'AY2425 (Grade 8)']"
     * If count = 0: Inform user no grades are available
   - If function returns grades data: Display the transcript
   - If function returns error: Inform user about the error and suggest checking the student ID or academic year
5. Formatting transcript response:
   - When displaying transcript, include "TRANSCRIPT:" marker in your response
   - The system will automatically format the table
   - Write a brief introduction, then include "TRANSCRIPT:" marker
   - DO NOT try to format the table yourself - just mention "TRANSCRIPT:" and the system handles it

CRITICAL RULES:
- If user asks for transcript/grades, you MUST call get_student_transcript function. NO EXCEPTIONS.
- Do NOT show assigned subjects from context when transcript is requested. Transcript = actual grades, not assigned subjects.
- If you get a periods list with count = 1, you MUST call the function again with that ayCode automatically.
- Always use the userId provided: "${studentUserId}"

When answering SPECIFIC questions:
- Write like a normal person. NO markdown, NO asterisks, NO bold text.
- Start with a friendly greeting mentioning the student's name
- Answer naturally in paragraph form
- For subjects: End with "Subjects:" (no asterisks) so the system can display the table
- DO NOT use section headers like "**Enrollment Status:**" - just write naturally

When answering COMPREHENSIVE requests (only when explicitly asked):
- Start with friendly intro
- Then use structured sections with headers:
  - Enrollment Status: [details]
  - Missing Documents: [details]
  - Subjects: [system will show table]
  - Grades: [details]
  - Scholarship: [details]

IMPORTANT: After answering a specific question, suggest ONE relevant follow-up question that would be helpful. Be conversational and friendly.

CRITICAL: When the user responds with "yes", "sure", "okay", "please", or similar affirmative responses to your follow-up suggestion, you MUST provide the information you just suggested. Do NOT ask what they want - just provide the suggested information directly.

Example:
- If you suggested "Would you like to know about their guardian information or enrollment details?" and user says "yes" → Provide BOTH guardian information AND enrollment details
- If you suggested "Would you like to know about their grades?" and user says "yes" → Provide the grades information immediately
- If user says "yes" to a suggestion with multiple options (e.g., "guardian or enrollment"), provide ALL the options mentioned

Relevant follow-up suggestions:
- After answering about subjects → Suggest: "Would you like to know about their grades for these subjects?"
- After answering about guardian → Suggest: "Would you like to know about their enrollment details or personal information?"
- After answering about enrollment → Suggest: "Would you like to know about their assigned subjects or documents?"
- After answering about documents → Suggest: "Would you like to know about their enrollment status or subjects?"
- After answering about grades → Suggest: "Would you like to know about their subjects or enrollment details?"
- After answering about scholarship → Suggest: "Would you like to know about their enrollment status or academic performance?"
- After answering about personal info → Suggest: "Would you like to know about their guardian information or enrollment details?"

Format: After your answer, add a friendly suggestion like: "Would you like to know about [relevant topic]?" or "Would you like to know about [option 1] or [option 2]?"

IMPORTANT: YOU MUST NOT PUT THE ID, YOU MUST PUT THE NAME OF THE SECTION AND ALSO THE GRADE LEVEL.

${
  lastAIMessage
    ? `PREVIOUS AI RESPONSE (for context): ${lastAIMessage}\n\nThe user is responding to your previous suggestion. If they said "yes", "sure", "okay", or similar, provide the information you suggested in your previous response.\n\n`
    : ''
}User question: ${message}

IMPORTANT REMINDERS:
- Write like a normal, friendly person. NO markdown formatting (NO **asterisks**, NO bold text).
- Answer ONLY what is being asked. Be precise and focused.
- For specific questions, write naturally in paragraph form.
- For subjects questions, end with "Subjects:" (no asterisks) so the system can display the table.

CONTEXT AWARENESS:
- If the user responds with "yes", "sure", "okay", "please", "go ahead", or similar affirmative responses, check if you just suggested something in your previous response.
- If you suggested multiple options (e.g., "guardian information or enrollment details"), provide ALL of them when user says "yes".
- If you suggested a single topic, provide that topic when user says "yes".
- Do NOT ask "what would you like to know" if you just made a suggestion and user said "yes" - just provide the suggested information.

After your answer, suggest ONE relevant follow-up question in a friendly, conversational manner.

Write your response now:`

    // Generate response
    let text: string
    let transcriptData: any = null
    try {
      console.log(
        'AI Student Chat API: Calling Gemini API, prompt length:',
        systemPrompt.length,
        'model:',
        model
      )
      const result = await geminiModel.generateContent(systemPrompt)
      console.log('AI Student Chat API: Got response from Gemini')

      if (!result || !result.response) {
        throw new Error('No response from AI model')
      }

      const response = result.response

      // Check if the response contains function calls
      const functionCalls = response.functionCalls()

      // Check if this is a transcript-related query
      const isTranscriptQuery =
        message.toLowerCase().includes('transcript') ||
        message.toLowerCase().includes('grade') ||
        message.toLowerCase().includes('report card') ||
        message.toLowerCase().includes('academic record')

      if (functionCalls && functionCalls.length > 0) {
        console.log(
          'AI Student Chat API: Function calls detected:',
          functionCalls.length,
          'Functions:',
          functionCalls.map((fc: any) => fc.name)
        )

        // Execute the tool calls
        const toolResults = await executeToolCalls(
          functionCalls,
          baseUrl,
          studentUserId
        )

        // Format transcript if it's a transcript request
        let periodsList = ''
        let shouldAutoFetch = false
        let autoFetchAyCode = ''

        for (const toolResult of toolResults) {
          const funcResponse = toolResult.functionResponse?.response
          if (funcResponse) {
            // Check for errors first
            if (funcResponse.error) {
              console.error('Function call error:', funcResponse.error)
              // Continue processing other results
            } else if (funcResponse.grades !== undefined) {
              // This is a transcript with grades
              transcriptData = await formatTranscript(
                funcResponse,
                funcResponse.metadata || {},
                baseUrl
              )
            } else if (funcResponse.periods !== undefined) {
              // This is a list of available periods
              const periods = funcResponse.periods || []
              if (periods.length === 1) {
                // Auto-fetch the single period
                shouldAutoFetch = true
                autoFetchAyCode = periods[0].ayCode
              } else if (periods.length > 1) {
                periodsList = periods
                  .map((p: any) => {
                    const level = p.metadata?.studentLevel || 'Unknown'
                    return `${p.ayCode} (${level})`
                  })
                  .join(', ')
              }
            }
          }
        }

        // Auto-fetch if only one period found
        if (shouldAutoFetch && autoFetchAyCode && !transcriptData) {
          console.log(
            'Auto-fetching transcript for single period:',
            autoFetchAyCode
          )
          try {
            const autoFetchParams = new URLSearchParams()
            autoFetchParams.append('userId', studentUserId)
            autoFetchParams.append('ayCode', autoFetchAyCode)

            const autoFetchUrl = `${baseUrl}/api/ai/student-grades?${autoFetchParams.toString()}`
            const autoFetchResponse = await fetch(autoFetchUrl)
            const autoFetchData = await autoFetchResponse.json()

            if (autoFetchResponse.ok && autoFetchData.grades !== undefined) {
              transcriptData = await formatTranscript(
                autoFetchData,
                autoFetchData.metadata || {},
                baseUrl
              )
            }
          } catch (error) {
            console.error('Error auto-fetching transcript:', error)
          }
        }

        // Generate final response with tool results
        const followUpPrompt = `Based on the tool execution results, please provide a comprehensive answer to the user's query.

Tool Results:
${JSON.stringify(toolResults, null, 2)}
${
  transcriptData
    ? `\n\nTRANSCRIPT DATA (USE THIS TO DISPLAY GRADES):\n${JSON.stringify(
        transcriptData,
        null,
        2
      )}\n\nIMPORTANT: You MUST include "TRANSCRIPT:" marker in your response when displaying this data.`
    : ''
}
${
  periodsList
    ? `\n\nAvailable Academic Years: ${periodsList}\n\nIMPORTANT: If multiple periods are available, ask the user which one they want to see.`
    : ''
}

Original user query: ${message}

CRITICAL INSTRUCTIONS FOR TRANSCRIPT RESPONSES:
- If TRANSCRIPT DATA is available above, you MUST include "TRANSCRIPT:" marker in your response
- Format: Write a brief friendly introduction mentioning the student name and academic year, then include "TRANSCRIPT:" marker
- Example: "Here's the transcript for [Student Name] for [Academic Year]: TRANSCRIPT:"
- Write naturally and conversationally
- DO NOT try to format the table yourself - just mention "TRANSCRIPT:" and the system will handle the formatting
- DO NOT show assigned subjects when transcript is requested - transcript shows actual grades, not assigned subjects
- If multiple academic years are available (periods list), ask the user which one they want to see
- If no transcript data is available and no periods list, inform the user that no grades were found

Please provide a helpful, accurate response based on this data.`

        const finalResult = await geminiModel.generateContent(followUpPrompt)
        const finalResponse = await finalResult.response
        text = finalResponse.text()

        console.log(
          'AI Student Chat API: Final response with tool results, length:',
          text?.length
        )
      } else {
        // No function calls, return regular response
        // But if this was a transcript query, warn that function wasn't called
        if (isTranscriptQuery) {
          console.warn(
            'AI Student Chat API: Transcript query detected but no function calls made. Message:',
            message.substring(0, 100)
          )
        }
        text = response.text()
        console.log(
          'AI Student Chat API: Extracted text, length:',
          text?.length
        )
      }

      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from AI model')
      }
    } catch (apiError) {
      console.error('Gemini API Error:', apiError)
      console.error('Error type:', typeof apiError)
      console.error(
        'Error message:',
        apiError instanceof Error ? apiError.message : String(apiError)
      )
      console.error(
        'Error stack:',
        apiError instanceof Error ? apiError.stack : 'No stack'
      )

      if (apiError instanceof Error) {
        const errorMsg = apiError.message.toLowerCase()
        // Check for specific API errors
        if (
          errorMsg.includes('api_key') ||
          errorMsg.includes('api key') ||
          errorMsg.includes('invalid api key')
        ) {
          console.error('API Key Error Detected')
          throw new Error(`AI service API key error: ${apiError.message}`)
        }
        if (
          errorMsg.includes('quota') ||
          errorMsg.includes('limit') ||
          errorMsg.includes('rate limit') ||
          errorMsg.includes('429') ||
          errorMsg.includes('Resource exhausted') ||
          errorMsg.includes('Too Many Requests')
        ) {
          // Return 429 status for rate limit errors
          return NextResponse.json(
            {
              error: 'AI service quota exceeded',
              details:
                'The AI service is currently experiencing high demand. Please wait a moment and try again.',
            },
            { status: 429 }
          )
        }
        if (
          errorMsg.includes('safety') ||
          errorMsg.includes('blocked') ||
          errorMsg.includes('content filter')
        ) {
          throw new Error(`AI response was blocked: ${apiError.message}`)
        }
        // Throw the original error with full message
        throw new Error(`Gemini API Error: ${apiError.message}`)
      }
      throw new Error(`Unknown API error: ${String(apiError)}`)
    }

    // Parse response to extract answer, actions, and insights
    // For now, return the full text response
    // The AI should naturally structure its response based on the prompt

    // Include transcript data in response if available
    const responseData: any = { response: text }
    if (transcriptData) {
      responseData.transcript = transcriptData
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('AI Student Chat API Error:', error)
    console.error('Error type:', typeof error)
    console.error(
      'Error message:',
      error instanceof Error ? error.message : String(error)
    )
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack'
    )

    const errorMessage = error instanceof Error ? error.message : String(error)

    // Check if it's a rate limit error
    if (
      errorMessage.includes('429') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('quota') ||
      errorMessage.includes('Resource exhausted') ||
      errorMessage.includes('Too Many Requests')
    ) {
      return NextResponse.json(
        {
          error: 'AI service quota exceeded',
          details:
            'The AI service is currently experiencing high demand. Please wait a moment and try again.',
        },
        { status: 429 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to process AI request',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
