import {
  detectRegistrarIntent,
  extractStudentName,
  extractFilters,
  RegistrarChatbotIntent,
} from './registrar-chatbot-keywords'

// Translation function (reused from student chatbot)
const translateMessage = async (
  message: string,
  baseUrl?: string
): Promise<string> => {
  try {
    const url = baseUrl
      ? `${baseUrl}/api/ai/translate`
      : typeof window !== 'undefined'
      ? '/api/ai/translate'
      : 'http://localhost:3000/api/ai/translate'

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

export interface RegistrarChatbotResponse {
  intent: RegistrarChatbotIntent
  message: string
  data?: any
  action?: string
}

// Fetch enrollment data
const fetchEnrollmentData = async (baseUrl: string): Promise<any> => {
  try {
    const response = await fetch(`${baseUrl}/api/ai/enrollment-data`)
    if (!response.ok) {
      throw new Error('Failed to fetch enrollment data')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching enrollment data:', error)
    return null
  }
}

// Fetch student data
const fetchStudentData = async (
  baseUrl: string,
  filters?: {
    studentId?: string
    name?: string
    gradeLevel?: string
    status?: string
  }
): Promise<any> => {
  try {
    const params = new URLSearchParams()
    if (filters?.studentId) params.append('studentId', filters.studentId)
    if (filters?.name) params.append('name', filters.name)
    if (filters?.gradeLevel) params.append('gradeLevel', filters.gradeLevel)
    if (filters?.status) params.append('status', filters.status)

    const url = params.toString()
      ? `${baseUrl}/api/ai/student-data?${params.toString()}`
      : `${baseUrl}/api/ai/student-data`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch student data')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching student data:', error)
    return null
  }
}

// Fetch teacher data
const fetchTeacherData = async (
  baseUrl: string,
  teacherId?: string
): Promise<any> => {
  try {
    const url = teacherId
      ? `${baseUrl}/api/ai/teacher-data?teacherId=${teacherId}`
      : `${baseUrl}/api/ai/teacher-data`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch teacher data')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching teacher data:', error)
    return null
  }
}

// Main registrar chatbot handler
export const handleRegistrarChatbotMessage = async (
  message: string,
  baseUrl: string,
  lastAIMessage?: string
): Promise<RegistrarChatbotResponse> => {
  // Step 1: Translate message if needed
  const translatedMessage = await translateMessage(message, baseUrl)

  // Step 2: Detect intent
  const intent = detectRegistrarIntent(translatedMessage)

  // Step 3: Handle each intent
  switch (intent) {
    case 'enrollment_stats': {
      const enrollmentData = await fetchEnrollmentData(baseUrl)

      if (!enrollmentData || !enrollmentData.success) {
        return {
          intent: 'enrollment_stats',
          message:
            'Sorry, I could not retrieve enrollment statistics. Please try again later.',
        }
      }

      const enrollments = enrollmentData.enrollments || []
      const totalEnrolled = enrollments.length
      const enrolledCount = enrollments.filter(
        (e: any) => e.enrollmentInfo?.status === 'enrolled'
      ).length
      const pendingCount = enrollments.filter(
        (e: any) => e.enrollmentInfo?.status === 'pending'
      ).length

      // Count by grade level
      const byGrade: Record<string, number> = {}
      const byStatus: Record<string, number> = {}

      enrollments.forEach((e: any) => {
        const grade = e.enrollmentInfo?.gradeLevel || 'Unknown'
        const status = e.enrollmentInfo?.status || 'Unknown'
        byGrade[grade] = (byGrade[grade] || 0) + 1
        byStatus[status] = (byStatus[status] || 0) + 1
      })

      const gradeBreakdown = Object.entries(byGrade)
        .map(([grade, count]) => `Grade ${grade}: ${count}`)
        .join('\n')

      return {
        intent: 'enrollment_stats',
        message: `Enrollment Statistics:\n\nTotal Enrollments: ${totalEnrolled}\nEnrolled: ${enrolledCount}\nPending: ${pendingCount}\n\nBreakdown by Grade:\n${gradeBreakdown}`,
        data: {
          total: totalEnrolled,
          enrolled: enrolledCount,
          pending: pendingCount,
          byGrade,
          byStatus,
        },
      }
    }

    case 'student_search': {
      // Extract student name and filters
      const studentName = extractStudentName(translatedMessage)
      const filters = extractFilters(translatedMessage)

      const studentData = await fetchStudentData(baseUrl, {
        name: studentName || undefined,
        gradeLevel: filters.gradeLevel,
        status: filters.status,
      })

      if (!studentData || !studentData.success) {
        return {
          intent: 'student_search',
          message:
            'Sorry, I could not search for students. Please try again later.',
        }
      }

      const students = studentData.students || []

      if (students.length === 0) {
        if (studentName) {
          return {
            intent: 'student_search',
            message: `No students found matching "${studentName}".`,
          }
        }
        return {
          intent: 'student_search',
          message: 'No students found matching your criteria.',
        }
      }

      if (students.length === 1) {
        const student = students[0]
        const name = `${student.personalInfo?.firstName || ''} ${
          student.personalInfo?.lastName || ''
        }`.trim()
        const grade = student.enrollmentInfo?.gradeLevel || 'N/A'
        const status = student.enrollmentInfo?.status || 'N/A'

        return {
          intent: 'student_search',
          message: `Found student:\n\nName: ${name}\nGrade: ${grade}\nStatus: ${status}\n\nWould you like more details about this student?`,
          data: { students: [student] },
        }
      }

      // Multiple students found
      const studentList = students
        .slice(0, 10)
        .map((s: any, idx: number) => {
          const name = `${s.personalInfo?.firstName || ''} ${
            s.personalInfo?.lastName || ''
          }`.trim()
          return `${idx + 1}. ${name} (Grade ${
            s.enrollmentInfo?.gradeLevel || 'N/A'
          })`
        })
        .join('\n')

      const moreText =
        students.length > 10 ? `\n... and ${students.length - 10} more` : ''

      return {
        intent: 'student_search',
        message: `Found ${students.length} student(s):\n\n${studentList}${moreText}\n\nPlease be more specific to narrow down the results.`,
        data: { students },
      }
    }

    case 'teacher_info': {
      const teacherData = await fetchTeacherData(baseUrl)

      if (!teacherData || !teacherData.success) {
        return {
          intent: 'teacher_info',
          message:
            'Sorry, I could not retrieve teacher information. Please try again later.',
        }
      }

      const teachers = teacherData.teachers || []

      if (teachers.length === 0) {
        return {
          intent: 'teacher_info',
          message: 'No teachers found in the system.',
        }
      }

      const teacherList = teachers
        .slice(0, 10)
        .map((t: any, idx: number) => {
          const name = `${t.firstName || ''} ${t.lastName || ''}`.trim()
          return `${idx + 1}. ${name}${t.email ? ` (${t.email})` : ''}`
        })
        .join('\n')

      const moreText =
        teachers.length > 10 ? `\n... and ${teachers.length - 10} more` : ''

      return {
        intent: 'teacher_info',
        message: `Teachers (${teachers.length} total):\n\n${teacherList}${moreText}`,
        data: { teachers },
      }
    }

    case 'help': {
      return {
        intent: 'help',
        message: `I can help you with:\n\n• Enrollment Statistics - Ask about enrollment counts, statistics, or reports\n• Student Search - Find students by name, grade, or status\n• Teacher Information - Get details about teachers and their assignments\n\nYou can ask questions like:\n- "How many students are enrolled?"\n- "Find student named [Name]"\n- "Show me all teachers"\n- "Enrollment statistics"\n\nYou can ask in English or Filipino!`,
      }
    }

    default: {
      return {
        intent: 'unknown',
        message:
          "I didn't quite understand that. I can help you with:\n• Enrollment statistics\n• Student search\n• Teacher information\n\nTry asking something like 'How many students are enrolled?' or 'Find student named [Name]'",
      }
    }
  }
}
