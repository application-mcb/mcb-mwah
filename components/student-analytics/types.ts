export interface SubjectGrade {
  subjectName: string
  period1: number | null
  period2: number | null
  period3: number | null
  period4: number | null
  specialStatus?: 'INC' | 'FA' | 'FW' | 'W' | null
}

export interface StudentGrades {
  [subjectId: string]: SubjectGrade
}

export interface SubjectData {
  id: string
  name: string
  code?: string
  description?: string
  color?: string
}

export interface EnrollmentData {
  userId: string
  personalInfo: {
    firstName: string
    middleName?: string
    lastName: string
    nameExtension?: string
    email: string
  }
  enrollmentInfo: {
    gradeLevel?: string
    department?: string
    strand?: string
    semester?: 'first-sem' | 'second-sem'
    level?: 'college' | 'high-school'
    courseCode?: string
    courseName?: string
    yearLevel?: string
    schoolYear: string
    status: string
  }
  selectedSubjects?: string[]
}

export interface StudentAnalyticsProps {
  studentId: string
  studentName?: string
}

export interface SubjectAverage {
  subjectId: string
  subjectName: string
  average: number | null
  completedPeriods: number
  specialStatus?: 'INC' | 'FA' | 'FW' | 'W' | null
}

export interface TermAveragePoint {
  label: string
  value: number | null
}

export interface StudentAnalyticsResult {
  level: 'college' | 'senior' | 'junior' | null
  semester: 'first-sem' | 'second-sem' | null
  totalSubjects: number
  completedSubjects: number
  overallAverage: number | null
  gwa: number | null
  passCount: number
  failCount: number
  pendingCount: number
  subjectAverages: SubjectAverage[]
  bestSubject: SubjectAverage | null
  strugglingSubject: SubjectAverage | null
  termAverages: TermAveragePoint[]
  gradeTrend: TermAveragePoint[]
  gpaHistory: TermAveragePoint[]
}


