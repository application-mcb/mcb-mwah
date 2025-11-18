import { detectIntent, extractContext, ChatbotIntent } from './chatbot-keywords'
import {
  ExtendedEnrollmentData,
  StudentProfile,
  StudentDocuments,
  SubjectSetData,
  SubjectAssignmentData,
  CourseData,
  GradeData,
} from '../types'
import { SubjectData } from '@/lib/subject-database'
import { buildStudentContext } from './buildStudentContext'

export interface ChatbotResponse {
  intent: ChatbotIntent
  message: string
  data?: any
  action?: string
  transcript?: any
}

// Translate message if needed
export const translateMessage = async (
  message: string,
  baseUrl?: string
): Promise<string> => {
  try {
    const url = baseUrl
      ? `${baseUrl}/api/ai/translate`
      : typeof window !== 'undefined'
      ? '/api/ai/translate'
      : 'http://localhost:3000/api/ai/translate' // Fallback for server-side

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: message }),
    })

    if (!response.ok) {
      return message // Fallback to original
    }

    const data = await response.json()
    return data.translated || message
  } catch (error) {
    console.error('Translation error:', error)
    return message // Fallback to original
  }
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

// Fetch transcript data
const fetchTranscript = async (
  userId: string,
  ayCode?: string,
  yearLevel?: string,
  baseUrl?: string
): Promise<any> => {
  try {
    const params = new URLSearchParams()
    params.append('userId', userId)
    if (ayCode) params.append('ayCode', ayCode)
    if (yearLevel) params.append('yearLevel', yearLevel)

    const url = baseUrl
      ? `${baseUrl}/api/ai/student-grades?${params.toString()}`
      : typeof window !== 'undefined'
      ? `/api/ai/student-grades?${params.toString()}`
      : `http://localhost:3000/api/ai/student-grades?${params.toString()}` // Fallback for server-side

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch transcript')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching transcript:', error)
    return null
  }
}

// Main chatbot handler
export const handleChatbotMessage = async (
  message: string,
  enrollment: ExtendedEnrollmentData | null,
  studentProfile: StudentProfile | null,
  studentDocuments: StudentDocuments | null,
  subjects: Record<string, SubjectData>,
  subjectSets: Record<number, SubjectSetData[]>,
  subjectAssignments: SubjectAssignmentData[],
  grades: Record<string, GradeData>,
  courses: CourseData[],
  baseUrl?: string,
  lastAIMessage?: string
): Promise<ChatbotResponse> => {
  if (!enrollment) {
    return {
      intent: 'unknown',
      message:
        'Sorry, I could not find the student information. Please try again.',
    }
  }

  // Step 1: Translate message if needed
  const translatedMessage = await translateMessage(message, baseUrl)

  // Step 2: Detect intent
  let intent = detectIntent(translatedMessage)

  // Step 3: Extract context (AY code, year level, semester)
  const context = extractContext(translatedMessage)

  // Step 2.5: Check if this is a follow-up response to a period selection question
  // If the last AI message asked about selecting an AY, and this message contains an AY code, treat it as transcript request
  const isPeriodSelectionFollowUp =
    lastAIMessage &&
    (lastAIMessage.toLowerCase().includes('which academic year') ||
      lastAIMessage.toLowerCase().includes('available:') ||
      lastAIMessage.toLowerCase().includes('would you like to see'))

  if (intent === 'unknown' && (context.ayCode || isPeriodSelectionFollowUp)) {
    // User is likely selecting an AY from a list or responding to a period selection question
    intent = 'transcript'
  }

  // Step 4: Build student context for data access
  // Try to build from provided data, but if enrollment is minimal, we'll work with what we have
  let studentContext = buildStudentContext(
    enrollment,
    studentProfile,
    studentDocuments,
    subjects,
    subjectSets,
    subjectAssignments,
    grades,
    courses
  )

  // If buildStudentContext failed but we have enrollment data, create a minimal context
  if (!studentContext && enrollment) {
    studentContext = {
      studentInfo: {
        personalInfo: {
          fullName:
            `${enrollment.personalInfo?.firstName || ''} ${
              enrollment.personalInfo?.lastName || ''
            }`.trim() || 'Student',
          firstName: enrollment.personalInfo?.firstName,
          lastName: enrollment.personalInfo?.lastName,
          middleName: enrollment.personalInfo?.middleName,
          nameExtension: enrollment.personalInfo?.nameExtension,
        },
        contactInfo: {
          email: enrollment.personalInfo?.email,
          phone: enrollment.personalInfo?.phone,
        },
        enrollmentInfo: enrollment.enrollmentInfo || {},
        guardianInfo: studentProfile
          ? {
              guardianName: studentProfile.guardianName,
              guardianPhone: studentProfile.guardianPhone,
              guardianEmail: studentProfile.guardianEmail,
              guardianRelationship: studentProfile.guardianRelationship,
              emergencyContact: studentProfile.emergencyContact,
            }
          : {},
      },
      documents: {
        submitted: [],
        missing: [],
      },
      subjects: {
        assigned: [],
        subjectSet: null,
      },
      grades: {
        currentGrades: null,
        performance: null,
      },
      actions: {
        enrollmentStatus: enrollment.enrollmentInfo?.status || 'unknown',
        sectionAssignment: enrollment.enrollmentInfo?.sectionId || null,
        studentType: enrollment.enrollmentInfo?.studentType || 'regular',
      },
    }
  }

  if (!studentContext) {
    return {
      intent: 'unknown',
      message:
        'Sorry, I could not access the student information. Please try again.',
    }
  }

  // Step 5: Handle each intent
  switch (intent) {
    case 'transcript': {
      // Check if the message contains a full period ID (e.g., "AY2526_second_semester_ABM_11")
      // If so, use it directly; otherwise use the extracted AY code
      let ayCodeToUse = context.ayCode
      const fullPeriodIdMatch = translatedMessage.match(/ay\d{4}_[^\s]+/i)
      if (fullPeriodIdMatch) {
        // User provided full period ID, use it as-is
        ayCodeToUse = fullPeriodIdMatch[0]
      }

      const transcriptData = await fetchTranscript(
        enrollment.userId,
        ayCodeToUse,
        context.yearLevel,
        baseUrl
      )

      if (!transcriptData) {
        return {
          intent: 'transcript',
          message:
            'Sorry, I could not retrieve the transcript. Please try again later.',
        }
      }

      // If multiple periods available, ask user to choose
      if (transcriptData.periods && transcriptData.periods.length > 1) {
        const periodsList = transcriptData.periods
          .map(
            (p: any) =>
              `${p.ayCode}${
                p.metadata?.studentLevel ? ` (${p.metadata.studentLevel})` : ''
              }`
          )
          .join(', ')

        return {
          intent: 'transcript',
          message: `Which academic year would you like to see? Available: ${periodsList}`,
          data: { periods: transcriptData.periods },
        }
      }

      // If single period, auto-fetch it
      if (transcriptData.periods && transcriptData.periods.length === 1) {
        const singlePeriod = transcriptData.periods[0]
        const actualTranscript = await fetchTranscript(
          enrollment.userId,
          singlePeriod.ayCode,
          context.yearLevel,
          baseUrl
        )

        if (actualTranscript && actualTranscript.grades) {
          // Format the transcript data for the formatter
          const formattedTranscript = await formatTranscript(
            actualTranscript,
            actualTranscript.metadata || {},
            baseUrl || 'http://localhost:3000'
          )
          return {
            intent: 'transcript',
            message: `Here's the transcript for ${studentContext.studentInfo.personalInfo.fullName}:`,
            transcript: formattedTranscript,
            action: 'show_transcript',
          }
        }
      }

      // If grades data is available directly
      if (transcriptData.grades) {
        // Format the transcript data for the formatter
        const formattedTranscript = await formatTranscript(
          transcriptData,
          transcriptData.metadata || {},
          baseUrl || 'http://localhost:3000'
        )
        return {
          intent: 'transcript',
          message: `Here's the transcript for ${studentContext.studentInfo.personalInfo.fullName}:`,
          transcript: formattedTranscript,
          action: 'show_transcript',
        }
      }

      return {
        intent: 'transcript',
        message:
          'No transcript data is available for this student at this time.',
      }
    }

    case 'guardian': {
      const guardian = studentContext.studentInfo.guardianInfo
      if (!guardian.guardianName) {
        return {
          intent: 'guardian',
          message: 'Guardian information is not available for this student.',
        }
      }

      const guardianInfo = [
        `Name: ${guardian.guardianName}`,
        guardian.guardianRelationship
          ? `Relationship: ${guardian.guardianRelationship}`
          : '',
        guardian.guardianPhone ? `Phone: ${guardian.guardianPhone}` : '',
        guardian.guardianEmail ? `Email: ${guardian.guardianEmail}` : '',
        guardian.emergencyContact
          ? `Emergency Contact: ${guardian.emergencyContact}`
          : '',
      ]
        .filter(Boolean)
        .join('\n')

      return {
        intent: 'guardian',
        message: `Guardian information for ${studentContext.studentInfo.personalInfo.fullName}:\n\n${guardianInfo}`,
        data: guardian,
      }
    }

    case 'subjects': {
      const assignedSubjects = studentContext.subjects.assigned
      if (!assignedSubjects || assignedSubjects.length === 0) {
        return {
          intent: 'subjects',
          message: 'No subjects are currently assigned to this student.',
        }
      }

      const subjectList = assignedSubjects
        .map(
          (subj: any) =>
            `${subj.code || 'N/A'} - ${subj.name} (${
              subj.totalUnits || 0
            } units)`
        )
        .join('\n')

      return {
        intent: 'subjects',
        message: `Assigned subjects for ${studentContext.studentInfo.personalInfo.fullName}:\n\n${subjectList}`,
        data: { subjects: assignedSubjects },
        action: 'show_subjects',
      }
    }

    case 'enrollment': {
      const enrollmentInfo = studentContext.studentInfo.enrollmentInfo
      const status = enrollmentInfo.status || 'unknown'
      const schoolYear = enrollmentInfo.schoolYear || 'N/A'
      const level =
        enrollmentInfo.level === 'college'
          ? `${enrollmentInfo.courseCode || 'N/A'} ${
              enrollmentInfo.yearLevel || 'N/A'
            }${
              enrollmentInfo.semester === 'first-sem'
                ? ' (Q1)'
                : enrollmentInfo.semester === 'second-sem'
                ? ' (Q2)'
                : ''
            }`
          : `Grade ${enrollmentInfo.gradeLevel || 'N/A'}`

      const enrollmentDetails = [
        `Status: ${status}`,
        `School Year: ${schoolYear}`,
        `Level: ${level}`,
        enrollmentInfo.sectionId ? `Section: ${enrollmentInfo.sectionId}` : '',
        enrollmentInfo.studentType
          ? `Student Type: ${enrollmentInfo.studentType}`
          : '',
        enrollmentInfo.orNumber ? `OR Number: ${enrollmentInfo.orNumber}` : '',
        enrollmentInfo.scholarship
          ? `Scholarship: ${enrollmentInfo.scholarship}`
          : '',
      ]
        .filter(Boolean)
        .join('\n')

      return {
        intent: 'enrollment',
        message: `Enrollment information for ${studentContext.studentInfo.personalInfo.fullName}:\n\n${enrollmentDetails}`,
        data: enrollmentInfo,
      }
    }

    case 'documents': {
      const submitted = studentContext.documents.submitted || []
      const missing = studentContext.documents.missing || []

      if (missing.length === 0) {
        return {
          intent: 'documents',
          message: `All required documents have been submitted for ${studentContext.studentInfo.personalInfo.fullName}.`,
          data: { submitted, missing: [] },
        }
      }

      const missingList = missing.join(', ')
      return {
        intent: 'documents',
        message: `Missing documents for ${studentContext.studentInfo.personalInfo.fullName}:\n\n${missingList}\n\nSubmitted documents: ${submitted.length}`,
        data: { submitted, missing },
      }
    }

    case 'personal': {
      const personal = studentContext.studentInfo.personalInfo
      const contact = studentContext.studentInfo.contactInfo

      const personalInfo = [
        `Full Name: ${personal.fullName}`,
        personal.dateOfBirth ? `Date of Birth: ${personal.dateOfBirth}` : '',
        personal.age ? `Age: ${personal.age}` : '',
        personal.gender ? `Gender: ${personal.gender}` : '',
        personal.citizenship ? `Citizenship: ${personal.citizenship}` : '',
        personal.religion ? `Religion: ${personal.religion}` : '',
        personal.placeOfBirth ? `Place of Birth: ${personal.placeOfBirth}` : '',
        contact.email ? `Email: ${contact.email}` : '',
        contact.phone ? `Phone: ${contact.phone}` : '',
      ]
        .filter(Boolean)
        .join('\n')

      return {
        intent: 'personal',
        message: `Personal information for ${personal.fullName}:\n\n${personalInfo}`,
        data: { personal, contact },
      }
    }

    case 'summary': {
      // Build comprehensive summary
      const summaryParts = []

      // Enrollment
      const enrollmentInfo = studentContext.studentInfo.enrollmentInfo
      summaryParts.push(
        `Enrollment: ${enrollmentInfo.status || 'N/A'} - ${
          enrollmentInfo.schoolYear || 'N/A'
        }`
      )

      // Level
      const level =
        enrollmentInfo.level === 'college'
          ? `${enrollmentInfo.courseCode || 'N/A'} ${
              enrollmentInfo.yearLevel || 'N/A'
            }`
          : `Grade ${enrollmentInfo.gradeLevel || 'N/A'}`
      summaryParts.push(`Level: ${level}`)

      // Subjects
      const subjectCount = studentContext.subjects.assigned?.length || 0
      summaryParts.push(`Subjects: ${subjectCount} assigned`)

      // Documents
      const missingDocs = studentContext.documents.missing?.length || 0
      summaryParts.push(
        `Documents: ${
          missingDocs === 0 ? 'All submitted' : `${missingDocs} missing`
        }`
      )

      // Guardian
      if (studentContext.studentInfo.guardianInfo.guardianName) {
        summaryParts.push(
          `Guardian: ${studentContext.studentInfo.guardianInfo.guardianName}`
        )
      }

      return {
        intent: 'summary',
        message: `Summary for ${
          studentContext.studentInfo.personalInfo.fullName
        }:\n\n${summaryParts.join(
          '\n'
        )}\n\nWould you like to know more about any specific area?`,
        data: studentContext,
      }
    }

    default: {
      return {
        intent: 'unknown',
        message:
          "I didn't quite understand that. You can ask me about:\n- Transcript or grades\n- Guardian information\n- Assigned subjects\n- Enrollment status\n- Documents\n- Personal information\n- Complete summary",
      }
    }
  }
}
