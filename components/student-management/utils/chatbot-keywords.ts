// Keyword patterns for intent detection
export type ChatbotIntent =
  | 'transcript'
  | 'guardian'
  | 'subjects'
  | 'enrollment'
  | 'documents'
  | 'personal'
  | 'summary'
  | 'unknown'

export interface KeywordPattern {
  keywords: string[]
  intent: ChatbotIntent
  priority: number // Higher priority = checked first
}

// Define keyword patterns for each intent
export const KEYWORD_PATTERNS: KeywordPattern[] = [
  {
    intent: 'transcript',
    priority: 10,
    keywords: [
      'transcript',
      'transcripts',
      'grade',
      'grades',
      'report card',
      'report cards',
      'academic record',
      'academic records',
      'marka',
      'mga marka',
      'talaan',
      'talaan ng marka',
      'record',
      'records',
      'gpa',
      'gwa',
      'final grade',
      'final grades',
      'show transcript',
      'view transcript',
      'see transcript',
      'student transcript',
      'student grades',
      'student grade',
    ],
  },
  {
    intent: 'guardian',
    priority: 9,
    keywords: [
      'guardian',
      'guardians',
      'parent',
      'parents',
      'magulang',
      'guardian information',
      'guardian info',
      'parent information',
      'parent info',
      'who is the guardian',
      'guardian name',
      'guardian contact',
      'guardian phone',
      'guardian email',
      'emergency contact',
      'emergency contacts',
    ],
  },
  {
    intent: 'subjects',
    priority: 8,
    keywords: [
      'subject',
      'subjects',
      'course',
      'courses',
      'class',
      'classes',
      'mga asignatura',
      'asignatura',
      'enrolled subjects',
      'assigned subjects',
      'student subjects',
      'what subjects',
      'which subjects',
      'list subjects',
      'show subjects',
      'view subjects',
      'see subjects',
    ],
  },
  {
    intent: 'enrollment',
    priority: 7,
    keywords: [
      'enrollment',
      'enrolled',
      'enroll',
      'enrollment status',
      'enrollment info',
      'enrollment information',
      'status',
      'student status',
      'pagpaparehistro',
      'parehistro',
      'enrollment date',
      'school year',
      'academic year',
      'section',
      'student type',
      'regular',
      'irregular',
    ],
  },
  {
    intent: 'documents',
    priority: 6,
    keywords: [
      'document',
      'documents',
      'mga dokumento',
      'dokumento',
      'missing',
      'missing documents',
      'requirements',
      'required documents',
      'document status',
      'submitted documents',
      'what documents',
      'which documents',
      'show documents',
      'view documents',
      'see documents',
      'list documents',
    ],
  },
  {
    intent: 'personal',
    priority: 5,
    keywords: [
      'personal',
      'personal information',
      'personal info',
      'impormasyon',
      'information',
      'details',
      'student information',
      'student info',
      'student details',
      'name',
      'age',
      'birthday',
      'birth date',
      'date of birth',
      'address',
      'contact',
      'phone',
      'email',
      'gender',
      'citizenship',
    ],
  },
  {
    intent: 'summary',
    priority: 4,
    keywords: [
      'everything',
      'all',
      'summary',
      'summarize',
      'overview',
      'lahat',
      'complete',
      'full',
      'all information',
      'all info',
      'tell me about',
      'tell me everything',
      'show everything',
      'view everything',
      'comprehensive',
      'complete information',
    ],
  },
]

// Function to detect intent from message
export const detectIntent = (message: string): ChatbotIntent => {
  const lowerMessage = message.toLowerCase().trim()

  // Sort patterns by priority (highest first)
  const sortedPatterns = [...KEYWORD_PATTERNS].sort(
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

// Function to extract additional context from message (e.g., academic year, grade level)
export const extractContext = (message: string): {
  ayCode?: string
  yearLevel?: string
  semester?: string
} => {
  const lowerMessage = message.toLowerCase()
  const context: { ayCode?: string; yearLevel?: string; semester?: string } =
    {}

  // Extract AY code patterns: "AY2526", "2526", "AY 2526", "AY-2526", "academic year 2526", "AY2526_second_semester_ABM_11"
  // Try more specific patterns first (with underscores/formatting), then general patterns
  const ayPatterns = [
    /ay\s*(\d{4})[_\s]/i, // "AY2526_" or "AY2526 " (most specific)
    /^ay\s*(\d{4})/i, // "AY2526" at start of message
    /ay\s*(\d{4})/i, // "AY2526" or "AY 2526" anywhere
    /(\d{4})[_\s]/i, // "2526_" or "2526 " (without AY prefix)
    /^(\d{4})/i, // "2526" at start of message
    /(\d{4})/i, // "2526" anywhere (fallback)
    /academic\s*year\s*(\d{4})/i,
    /ay\s*(\d{2})\s*[-]\s*(\d{2})/i, // "AY 25-26"
    /(\d{2})\s*[-]\s*(\d{2})/i, // "25-26"
  ]

  for (const pattern of ayPatterns) {
    const match = lowerMessage.match(pattern)
    if (match) {
      if (match[2] && !match[3] && match[2].length === 2) {
        // Format like "AY 25-26" or "25-26"
        context.ayCode = `AY${match[1]}${match[2]}`
      } else {
        // Format like "AY2526" or "2526"
        const year = match[1]
        if (year.length === 4) {
          context.ayCode = `AY${year}`
        } else if (year.length === 2 && match[2] && match[2].length === 2) {
          // Handle "25-26" format
          context.ayCode = `AY${year}${match[2]}`
        } else {
          context.ayCode = `AY${year}`
        }
      }
      break
    }
  }

  // Extract year level patterns: "Grade 7", "Grade7", "7th grade", "first year", "1st year", "BSIT 1"
  const gradePatterns = [
    /grade\s*(\d+)/i,
    /(\d+)(?:th|st|nd|rd)\s*grade/i,
    /(first|second|third|fourth)\s*year/i,
    /(1st|2nd|3rd|4th)\s*year/i,
    /(bsit|bscs|bsba|bsed|bsn|bsa)\s*(\d+)/i,
  ]

  for (const pattern of gradePatterns) {
    const match = lowerMessage.match(pattern)
    if (match) {
      if (match[1] && ['first', 'second', 'third', 'fourth'].includes(match[1])) {
        const yearMap: Record<string, string> = {
          first: '1',
          second: '2',
          third: '3',
          fourth: '4',
        }
        context.yearLevel = yearMap[match[1]]
      } else if (match[1] && ['1st', '2nd', '3rd', '4th'].includes(match[1])) {
        context.yearLevel = match[1].replace(/\D/g, '')
      } else if (match[2]) {
        // Course code with year level
        context.yearLevel = match[2]
      } else {
        context.yearLevel = match[1]
      }
      break
    }
  }

  // Extract semester patterns: "first sem", "second sem", "1st sem", "2nd sem", "Q1", "Q2"
  const semesterPatterns = [
    /first\s*sem/i,
    /second\s*sem/i,
    /1st\s*sem/i,
    /2nd\s*sem/i,
    /q1/i,
    /q2/i,
  ]

  for (const pattern of semesterPatterns) {
    const match = lowerMessage.match(pattern)
    if (match) {
      const sem = match[0].toLowerCase()
      if (sem.includes('first') || sem.includes('1st') || sem === 'q1') {
        context.semester = 'first-sem'
      } else if (sem.includes('second') || sem.includes('2nd') || sem === 'q2') {
        context.semester = 'second-sem'
      }
      break
    }
  }

  return context
}

