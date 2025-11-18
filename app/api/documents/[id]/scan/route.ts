import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { db } from '@/lib/firebase-server'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import type {
  DocumentValidation,
  ScanDocumentRequest,
  ScanDocumentResponse,
  ValidationStatus,
} from '@/lib/types/document-validation'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// Helper function to download file from URL
async function downloadFile(
  url: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const contentType =
    response.headers.get('content-type') || 'application/octet-stream'
  return { buffer, mimeType: contentType }
}

// Helper function to convert buffer to base64
function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64')
}

// Extract text using Gemini Vision API
async function extractTextWithGemini(
  buffer: Buffer,
  mimeType: string
): Promise<{ text: string; method: 'gemini' }> {
  const base64Data = bufferToBase64(buffer)

  // Try different models in order of preference
  // Note: All Gemini models support vision/image understanding
  // Using models that are confirmed working in this codebase
  const modelsToTry = [
    'gemini-2.5-flash', // Latest stable flash model (supports vision)
    'gemini-2.0-flash', // Stable 2.0 flash model (supports vision)
    'gemini-2.5-flash-lite', // Lite version (used elsewhere in codebase)
    'gemini-2.0-flash-lite', // Lite version (used elsewhere in codebase)
    'gemini-1.5-flash', // Fallback (may be retired but try anyway)
  ]

  let lastError: any = null

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })

      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        'Extract all text from this document. Return only the extracted text, nothing else.',
      ])

      const response = await result.response
      const text = response.text()

      return { text: text.trim(), method: 'gemini' }
    } catch (error: any) {
      lastError = error
      // If it's a 404 (model not found) or 400 (bad request), try next model
      const isModelNotFound =
        error.status === 404 ||
        error.status === 400 ||
        error.message?.includes('not found') ||
        error.message?.includes('is not found for API version') ||
        error.message?.includes('is not supported')

      if (isModelNotFound) {
        console.warn(
          `Model ${modelName} not available (${
            error.status || 'unknown'
          }): ${error.message?.substring(0, 100)}`
        )
        continue
      }
      // For other errors, throw immediately
      throw error
    }
  }

  // If all models failed, throw the last error
  console.error('All Gemini models failed:', lastError)
  const errorDetails = lastError?.message || 'Unknown error'
  const errorStatus = lastError?.status || 'unknown'
  throw new Error(
    `No available Gemini vision model found. Please check your GOOGLE_GEMINI_API_KEY environment variable and ensure it has access to vision-capable models. Last error (${errorStatus}): ${errorDetails}`
  )
}

// Validate document using AI
async function validateDocument(
  extractedText: string,
  documentType: string,
  studentData: any
): Promise<{
  validationSummary: string
  validationStatus: ValidationStatus
  validationDetails: any
  confidenceScore: number
  keyFindings: string[]
}> {
  try {
    // Ensure studentData has the expected structure with safe defaults
    if (!studentData || typeof studentData !== 'object' || studentData === null) {
      studentData = {
        personalInfo: {},
        enrollmentInfo: {},
      }
    } else {
      // Ensure nested objects exist - use safe property access
      const safePersonalInfo = (studentData && 'personalInfo' in studentData) ? (studentData.personalInfo || {}) : {}
      const safeEnrollmentInfo = (studentData && 'enrollmentInfo' in studentData) ? (studentData.enrollmentInfo || {}) : {}
      
      studentData = {
        ...studentData, // Keep any other properties first
        personalInfo: safePersonalInfo,
        enrollmentInfo: safeEnrollmentInfo,
      }
    }

    // Try multiple models for validation
    // Note: Gemini 1.5 models are retired, using 2.0+ models
    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash', // Fallback (may be retired)
    ]
    let model
    let lastModelError: any = null

    for (const modelName of modelsToTry) {
      try {
        model = genAI.getGenerativeModel({ model: modelName })
        break
      } catch (modelError: any) {
        lastModelError = modelError
        const isModelNotFound =
          modelError.status === 404 ||
          modelError.status === 400 ||
          modelError.message?.includes('not found') ||
          modelError.message?.includes('is not found for API version') ||
          modelError.message?.includes('is not supported')

        if (isModelNotFound) {
          console.warn(
            `Validation model ${modelName} not available, trying next...`
          )
          continue
        }
        throw modelError
      }
    }

    if (!model) {
      const errorDetails = lastModelError?.message || 'Unknown error'
      const errorStatus = lastModelError?.status || 'unknown'
      throw new Error(
        `No available Gemini model found for validation. Please check your GOOGLE_GEMINI_API_KEY. Last error (${errorStatus}): ${errorDetails}`
      )
    }

    // Build student information context with safe property access
    const personalInfo = studentData.personalInfo || {}
    const enrollmentInfo = studentData.enrollmentInfo || {}
    
    const studentInfo = `
Student Information:
- Name: ${personalInfo.firstName || ''} ${personalInfo.middleName || ''} ${
      personalInfo.lastName || ''
    } ${personalInfo.nameExtension || ''}
- Birth Date: ${personalInfo.birthMonth || ''}/${
      personalInfo.birthDay || ''
    }/${personalInfo.birthYear || ''}
- Place of Birth: ${personalInfo.placeOfBirth || ''}
- Email: ${personalInfo.email || ''}
- Student ID: ${enrollmentInfo.studentId || ''}
- Grade Level: ${enrollmentInfo.gradeLevel || ''}
- Course: ${enrollmentInfo.courseCode || ''} ${
      enrollmentInfo.courseName || ''
    }
- School Year: ${enrollmentInfo.schoolYear || ''}
`

    // Check if we have meaningful student data to compare
    const hasStudentData = 
      (personalInfo.firstName || personalInfo.lastName) ||
      (enrollmentInfo.studentId) ||
      (personalInfo.birthYear)

    // Map document types to expected content
    const documentTypeExpectations: Record<string, string> = {
      birthCertificate:
        "A birth certificate should contain: full name, birth date, place of birth, parents' names, registration number, and official seals/stamps. It should NOT contain random text, animal information, or unrelated content.",
      transcript:
        'A transcript should contain: student name, course/subject names, grades, credits, GPA, school name, dates, and academic terms. It should NOT contain random text, animal information, or unrelated content.',
      diploma:
        'A diploma should contain: student name, degree/certificate name, school name, graduation date, signatures, and official seals. It should NOT contain random text, animal information, or unrelated content.',
      reportCard:
        'A report card should contain: student name, school name, subjects, grades, teacher names, dates, and academic period. It should NOT contain random text, animal information, or unrelated content.',
      id: 'An ID document should contain: name, photo, ID number, birth date, address, and issuing authority. It should NOT contain random text, animal information, or unrelated content.',
      medical:
        'A medical document should contain: patient name, medical information, dates, doctor/clinic names, and health-related content. It should NOT contain random text, animal information, or unrelated content.',
    }

    const typeExpectation =
      documentTypeExpectations[documentType] ||
      `A ${documentType} document should contain relevant information related to its type. It should NOT contain random text, animal information, or completely unrelated content.`

    const prompt = `
You are a document validation system. Analyze the extracted text from a ${documentType} document.

IMPORTANT: FIRST, verify if the extracted text is actually relevant to a ${documentType}. 
${typeExpectation}

If the text is completely irrelevant (e.g., about animals, random nonsense, unrelated topics), mark it as "invalid" with a low confidence score.

Extracted Document Text:
${extractedText}

${hasStudentData ? `Student Information (for comparison):
${studentInfo}` : 'Note: Student information is not available for comparison. Focus on validating document type relevance only.'}

Please analyze this document and provide:
1. A summary of the document's relevance and accuracy (2-3 sentences). FIRST check if the text is relevant to a ${documentType}, ${hasStudentData ? 'then compare with student info if available.' : 'focusing on document type relevance since student data is not available.'}
2. Validation status: 
   - "valid" (text is relevant to ${documentType}${hasStudentData ? ' AND all information matches student data' : ''})
   - "warning" (text is relevant but ${hasStudentData ? 'has some mismatches, or' : ''} text seems partially relevant)
   - "invalid" (text is NOT relevant to ${documentType}${hasStudentData ? ', OR has significant mismatches' : ''})
3. Detailed field-by-field comparison with:
   - Matches: ${hasStudentData ? 'fields that match between document and student info' : 'key information found in the document'}
   - Mismatches: ${hasStudentData ? 'fields that don\'t match (with expected vs found values)' : 'inconsistencies or issues found in the document'}
   - Missing fields: expected information not found in document
   - Extra fields: unexpected information found in document
4. Confidence score (0-1) for the validation. Use LOW scores (<0.3) if text is irrelevant to document type.
5. Key findings: list of 3-5 important pieces of information extracted from the document, or note if text is irrelevant

Return your response as a JSON object with this structure:
{
  "validationSummary": "string",
  "validationStatus": "valid" | "warning" | "invalid",
  "validationDetails": {
    "matches": [{"field": "string", "expectedValue": "string", "foundValue": "string", "confidence": number, "match": true}],
    "mismatches": [{"field": "string", "expectedValue": "string", "foundValue": "string", "confidence": number, "match": false, "notes": "string"}],
    "missingFields": ["string"],
    "extraFields": ["string"]
  },
  "confidenceScore": number,
  "keyFindings": ["string"]
}

IMPORTANT: Return ONLY valid JSON. Do not include any text before or after the JSON object.
`

    let result
    let response
    let text: string

    try {
      result = await model.generateContent(prompt)
      response = await result.response
      text = response.text()
    } catch (apiError: any) {
      console.error('Gemini API error during validation:', apiError)
      throw new Error(
        `AI validation API error: ${
          apiError.message || 'Unknown error'
        }. Status: ${apiError.status || 'unknown'}`
      )
    }

    if (!text || text.trim().length === 0) {
      throw new Error('AI validation returned empty response')
    }

    // Try to parse JSON from response
    let validationData
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch =
        text.match(/```json\n([\s\S]*?)\n```/) ||
        text.match(/```\n([\s\S]*?)\n```/) ||
        text.match(/\{[\s\S]*\}/)
      const jsonText = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text
      validationData = JSON.parse(jsonText.trim())

      // Validate required fields
      if (!validationData.validationSummary) {
        validationData.validationSummary =
          'Validation completed but summary is missing.'
      }
      if (!validationData.validationStatus) {
        validationData.validationStatus = 'warning'
      }
      if (!validationData.validationDetails) {
        validationData.validationDetails = {
          matches: [],
          mismatches: [],
          missingFields: [],
          extraFields: [],
        }
      }
      if (typeof validationData.confidenceScore !== 'number') {
        validationData.confidenceScore = 0.5
      }
      if (!Array.isArray(validationData.keyFindings)) {
        validationData.keyFindings = []
      }
    } catch (parseError: any) {
      // If JSON parsing fails, try to extract meaningful information
      console.error('Failed to parse AI response as JSON:', parseError)
      console.error('Raw response text:', text.substring(0, 500))

      // Check if text mentions irrelevance
      const isIrrelevant =
        text.toLowerCase().includes('irrelevant') ||
        text.toLowerCase().includes('not relevant') ||
        text.toLowerCase().includes('does not match') ||
        text.toLowerCase().includes('unrelated')

      validationData = {
        validationSummary: isIrrelevant
          ? `Document text appears to be irrelevant to ${documentType}. ${text.substring(
              0,
              150
            )}`
          : `Validation completed but response format was invalid. ${text.substring(
              0,
              150
            )}`,
        validationStatus: (isIrrelevant
          ? 'invalid'
          : 'warning') as ValidationStatus,
        validationDetails: {
          matches: [],
          mismatches: [],
          missingFields: [],
          extraFields: [],
        },
        confidenceScore: isIrrelevant ? 0.2 : 0.3,
        keyFindings: [text.substring(0, 100)],
      }
    }

    return {
      validationSummary:
        validationData.validationSummary || text.substring(0, 200),
      validationStatus: (validationData.validationStatus ||
        'warning') as ValidationStatus,
      validationDetails: validationData.validationDetails || {
        matches: [],
        mismatches: [],
        missingFields: [],
        extraFields: [],
      },
      confidenceScore: validationData.confidenceScore || 0.5,
      keyFindings: validationData.keyFindings || [],
    }
  } catch (error) {
    console.error('AI validation error:', error)
    throw error
  }
}

// POST /api/documents/[id]/scan - Scan and validate a document
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: documentId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const registrarUid = searchParams.get('registrarUid') || null

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { studentEnrollmentData } = body

    // Get document from Firestore
    const userDocRef = doc(db, 'students', userId)
    const userDocSnap = await getDoc(userDocRef)

    if (!userDocSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'User document not found' },
        { status: 404 }
      )
    }

    const userData = userDocSnap.data()
    const documents = userData.documents || {}

    if (!documents[documentId]) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      )
    }

    const document = documents[documentId]
    const fileUrl = document.fileUrl
    const documentType = documentId

    if (!fileUrl) {
      return NextResponse.json(
        { success: false, error: 'Document URL not found' },
        { status: 400 }
      )
    }

    // Get student enrollment data if not provided
    let studentData = studentEnrollmentData
    if (!studentData) {
      // Fetch enrollment data
      try {
        const enrollmentResponse = await fetch(
          `${request.nextUrl.origin}/api/enrollment?userId=${userId}&getEnrollment=true`
        )
        if (enrollmentResponse.ok) {
          const enrollmentData = await enrollmentResponse.json()
          studentData = enrollmentData?.enrollment || null
        }
      } catch (fetchError) {
        console.error('Error fetching enrollment data:', fetchError)
      }
      
      // Fallback to user data if still not available
      if (!studentData) {
        studentData = {
          personalInfo: userData?.personalInfo || {},
          enrollmentInfo: userData?.enrollmentInfo || {},
        }
      }
    }
    
    // Ensure studentData is always an object with the expected structure
    if (!studentData || typeof studentData !== 'object') {
      studentData = {
        personalInfo: {},
        enrollmentInfo: {},
      }
    } else {
      // Ensure nested objects exist
      studentData = {
        personalInfo: studentData.personalInfo || {},
        enrollmentInfo: studentData.enrollmentInfo || {},
        ...studentData, // Keep any other properties
      }
    }

    // Download document
    // fileUrl is already a download URL (stored as downloadURL in POST)
    let fileBuffer: Buffer
    let mimeType: string

    try {
      // fileUrl is already a download URL, so we can fetch it directly
      const downloaded = await downloadFile(fileUrl)
      fileBuffer = downloaded.buffer
      mimeType = downloaded.mimeType
    } catch (error) {
      console.error('Error downloading document:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to download document' },
        { status: 500 }
      )
    }

    // Extract text using OCR (Gemini Vision API)
    let extractedText: string
    let ocrMethod: 'gemini' | 'tesseract' | 'hybrid' = 'gemini'

    try {
      const geminiResult = await extractTextWithGemini(fileBuffer, mimeType)
      extractedText = geminiResult.text
      ocrMethod = geminiResult.method
    } catch (geminiError: any) {
      console.error('Gemini OCR failed:', geminiError)
      // Tesseract.js doesn't work in server-side Next.js, so just return error
      return NextResponse.json(
        {
          success: false,
          error:
            'Failed to extract text from document. Please check your Gemini API key and ensure a vision-capable model is available.',
          details: geminiError.message || 'Unknown error',
        },
        { status: 500 }
      )
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No text could be extracted from the document. Please ensure the document contains readable text.',
        },
        { status: 400 }
      )
    }

    // Validate document using AI
    let validationResult
    try {
      // Double-check studentData structure before validation
      if (!studentData || typeof studentData !== 'object') {
        console.warn('studentData is invalid before validation, using empty object')
        studentData = {
          personalInfo: {},
          enrollmentInfo: {},
        }
      }
      
      validationResult = await validateDocument(
        extractedText,
        documentType,
        studentData
      )
    } catch (validationError: any) {
      console.error('Validation error:', validationError)
      console.error('Validation error details:', {
        message: validationError?.message,
        status: validationError?.status,
        stack: validationError?.stack?.substring(0, 200),
        studentDataType: typeof studentData,
        studentDataKeys: studentData ? Object.keys(studentData) : 'null/undefined',
      })

      // Try to provide a basic validation based on extracted text
      // Check if text seems relevant to document type
      const textLower = extractedText.toLowerCase()
      const isLikelyIrrelevant =
        textLower.length < 20 || // Too short
        (textLower.includes('animal') && !textLower.includes('certificate')) ||
        textLower.includes('random') ||
        textLower.split(' ').length < 5 // Too few words

      // Return extracted text even if validation fails, but with better context
      validationResult = {
        validationSummary: isLikelyIrrelevant
          ? `Document scanned but validation failed. The extracted text appears to be irrelevant to a ${documentType} (too short or unrelated content). Error: ${
              validationError?.message || 'Unknown error'
            }`
          : `Document scanned but AI validation could not be completed. Error: ${
              validationError?.message || 'Unknown error'
            }. Please review the extracted text manually.`,
        validationStatus: isLikelyIrrelevant
          ? ('invalid' as ValidationStatus)
          : ('pending' as ValidationStatus),
        validationDetails: {
          matches: [],
          mismatches: [],
          missingFields: [],
          extraFields: [],
        },
        confidenceScore: isLikelyIrrelevant ? 0.1 : 0,
        keyFindings: [
          `Extracted text length: ${extractedText.length} characters`,
          `First 100 chars: ${extractedText.substring(0, 100)}`,
        ],
      }
    }

    // Get existing scan version
    const existingScanVersion = document.scanVersion || 0

    // Build validation object
    const validation: DocumentValidation = {
      extractedText,
      validationSummary: validationResult.validationSummary,
      validationStatus: validationResult.validationStatus,
      validationDetails: validationResult.validationDetails,
      confidenceScore: validationResult.confidenceScore,
      keyFindings: validationResult.keyFindings,
      scannedAt: new Date().toISOString(),
      scannedBy: registrarUid,
      scanVersion: existingScanVersion + 1,
      ocrMethod,
    }

    // Update document in Firestore with validation results
    try {
      const userDocRef = doc(db, 'students', userId)
      const userDocSnap = await getDoc(userDocRef)

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data()
        const currentDocuments = userData.documents || {}

        if (currentDocuments[documentId]) {
          const updatedDocument = {
            ...currentDocuments[documentId],
            ...validation,
          }

          await updateDoc(userDocRef, {
            documents: {
              ...currentDocuments,
              [documentId]: updatedDocument,
            },
            updatedAt: serverTimestamp(),
          })
        }
      }
    } catch (updateError) {
      console.error(
        'Error updating document with validation results:',
        updateError
      )
      // Continue even if update fails - we still return the validation results
    }

    const response: ScanDocumentResponse = {
      success: true,
      validation,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error scanning document:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to scan document',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
