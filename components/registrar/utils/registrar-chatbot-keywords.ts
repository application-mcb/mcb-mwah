// Keyword patterns for registrar chatbot intent detection
export type RegistrarChatbotIntent =
  | 'enrollment_stats'
  | 'student_search'
  | 'teacher_info'
  | 'help'
  | 'unknown'

export interface RegistrarKeywordPattern {
  keywords: string[]
  intent: RegistrarChatbotIntent
  priority: number
}

// Define keyword patterns for each intent
export const REGISTRAR_KEYWORD_PATTERNS: RegistrarKeywordPattern[] = [
  {
    intent: 'enrollment_stats',
    priority: 10,
    keywords: [
      'enrollment',
      'enrollments',
      'enrolled',
      'statistics',
      'stats',
      'count',
      'how many',
      'total',
      'number of students',
      'enrollment count',
      'enrollment statistics',
      'enrollment stats',
      'how many students',
      'student count',
      'total students',
      'enrollment data',
      'enrollment report',
      'enrollment summary',
      'enrollment overview',
      'students enrolled',
      'enrolled students',
    ],
  },
  {
    intent: 'student_search',
    priority: 9,
    keywords: [
      'student',
      'students',
      'find',
      'search',
      'look for',
      'lookup',
      'find student',
      'search student',
      'student named',
      'student called',
      'is there a student',
      'do we have',
      'tell me about',
      'show me',
      'student information',
      'student info',
      'student details',
      'who is',
      'who are',
      'student with',
      'students in',
      'students with',
      'students by',
      'students for',
    ],
  },
  {
    intent: 'teacher_info',
    priority: 8,
    keywords: [
      'teacher',
      'teachers',
      'faculty',
      'instructor',
      'professor',
      'teacher information',
      'teacher info',
      'teacher details',
      'teacher assignment',
      'teacher assignments',
      'teachers assigned',
      'faculty information',
      'show teachers',
      'list teachers',
      'all teachers',
      'teacher schedule',
      'teacher subjects',
    ],
  },
  {
    intent: 'help',
    priority: 5,
    keywords: [
      'help',
      'what can you do',
      'what can you help',
      'how can you help',
      'what do you do',
      'capabilities',
      'features',
      'commands',
      'options',
      'available',
      'tulong',
      'paano',
    ],
  },
]

// Function to detect intent from message
export const detectRegistrarIntent = (
  message: string
): RegistrarChatbotIntent => {
  const lowerMessage = message.toLowerCase().trim()

  // Sort patterns by priority (highest first)
  const sortedPatterns = [...REGISTRAR_KEYWORD_PATTERNS].sort(
    (a, b) => b.priority - a.priority
  )

  // Check each pattern
  for (const pattern of sortedPatterns) {
    for (const keyword of pattern.keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        return pattern.intent
      }
    }
  }

  return 'unknown'
}

// Extract student name from query (for student search)
export const extractStudentName = (message: string): string | null => {
  const lowerMessage = message.toLowerCase()

  // Patterns to extract names
  const namePatterns = [
    /(?:student|find|search|look for|lookup|named|called|is there a student|do we have|tell me about|show me|who is)\s+(?:named|called|is|a|an)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /(?:student|find|search|look for|lookup)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/, // Any capitalized words (likely a name)
  ]

  for (const pattern of namePatterns) {
    const match = message.match(pattern)
    if (match && match[1]) {
      // Filter out common words that aren't names
      const name = match[1].trim()
      const commonWords = [
        'student',
        'students',
        'enrolled',
        'enrollment',
        'grade',
        'level',
        'status',
        'information',
        'details',
        'show',
        'find',
        'search',
        'tell',
        'me',
        'about',
        'with',
        'for',
        'in',
        'by',
      ]
      if (!commonWords.includes(name.toLowerCase())) {
        return name
      }
    }
  }

  return null
}

// Extract filters from query
export const extractFilters = (
  message: string
): {
  gradeLevel?: string
  status?: string
  courseCode?: string
} => {
  const lowerMessage = message.toLowerCase()
  const filters: { gradeLevel?: string; status?: string; courseCode?: string } =
    {}

  // Extract grade level
  const gradeMatch = lowerMessage.match(/grade\s*(\d+)/i)
  if (gradeMatch) {
    filters.gradeLevel = gradeMatch[1]
  }

  // Extract status
  const statusKeywords = ['enrolled', 'pending', 'approved', 'rejected']
  for (const status of statusKeywords) {
    if (lowerMessage.includes(status)) {
      filters.status = status
      break
    }
  }

  // Extract course code (e.g., BSIT, BSCS)
  const courseMatch = lowerMessage.match(/\b(bsit|bscs|bsba|bsed|bsn|bsa)\b/i)
  if (courseMatch) {
    filters.courseCode = courseMatch[1].toUpperCase()
  }

  return filters
}
