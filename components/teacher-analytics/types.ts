export interface TeacherAnalyticsProps {
  teacherId: string
  teacherName?: string
}

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
    schoolYear: string
    sectionId?: string
    level?: 'college' | 'high-school'
    studentId?: string
  }
}

export interface Section {
  id: string
  sectionName: string
  gradeId: string
  rank: string
  grade: string
  department: string
}

export interface Subject {
  id: string
  code: string
  name: string
  color: string
}

export interface TeacherAssignment {
  subjectId: string
  sectionId: string
  teacherId: string
}

export interface StudentWithGrades {
  enrollment: EnrollmentData
  grades: StudentGrades
  section: Section | null
}

export interface SectionPerformance {
  sectionId: string
  sectionName: string
  averageGrade: number
  studentCount: number
  subjectCount: number
}

export interface GradeDistribution {
  range: string
  min: number
  max: number
  count: number
  percentage: number
}

export interface SubjectAnalytics {
  subjectId: string
  subjectCode: string
  subjectName: string
  averageGrade: number
  studentCount: number
  sectionCount: number
}

export interface QuarterComparison {
  period: string
  label: string
  averageGrade: number
  studentCount: number
}

export interface ChartDataPoint {
  name: string
  value: number
  count?: number
}

export interface BarChartDataPoint {
  name: string
  average: number
  students?: number
}

export interface AnalyticsData {
  sectionPerformance: SectionPerformance[]
  gradeDistribution: GradeDistribution[]
  subjectAnalytics: SubjectAnalytics[]
  quarterComparison: QuarterComparison[]
  totalStudents: number
  totalSections: number
  totalSubjects: number
}
