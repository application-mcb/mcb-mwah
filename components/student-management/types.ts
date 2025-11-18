import { EnrollmentData } from '@/lib/enrollment-database'

export interface StudentProfile {
  userId: string
  photoURL?: string
  email?: string
  studentId?: string
  guardianName?: string
  guardianPhone?: string
  guardianEmail?: string
  guardianRelationship?: string
  emergencyContact?: string
}

export interface StudentDocument {
  fileFormat: string
  fileName: string
  fileSize: number
  fileType: string
  fileUrl: string
  uploadDate: string
  uploadedAt: string
  status?: 'approved' | 'rejected' | 'pending'
  rejectionReason?: string
  // Validation fields
  extractedText?: string
  validationSummary?: string
  validationStatus?: 'valid' | 'warning' | 'invalid' | 'pending'
  validationDetails?: any
  confidenceScore?: number
  keyFindings?: string[]
  scannedAt?: string
  scannedBy?: string | null
  scanVersion?: number
  ocrMethod?: 'gemini' | 'tesseract' | 'hybrid'
}

export interface StudentDocuments {
  [key: string]: StudentDocument
}

export interface SubjectSetData {
  id: string
  name: string
  description: string
  subjects: string[]
  gradeLevel: number
  color: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface SubjectAssignmentData {
  id: string
  level: 'high-school' | 'college'
  gradeLevel?: number
  courseCode?: string
  courseName?: string
  yearLevel?: number
  semester?: 'first-sem' | 'second-sem'
  subjectSetId: string
  registrarUid: string
  createdAt: string
  updatedAt: string
}

export interface Tab {
  id: string
  label: string
  icon: React.ReactElement
  content: React.ReactNode
}

export interface CourseData {
  id: string
  name: string
  code: string
  description: string
  color: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface SectionData {
  id: string
  gradeId?: string
  courseId?: string
  sectionName: string
  grade: string
  department: string
  rank: string
  description: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface GradeData {
  id: string
  name: string
  level: number
  color: string
  description: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

// Extended interface to handle college enrollment fields
export interface ExtendedEnrollmentData
  extends Omit<EnrollmentData, 'enrollmentInfo'> {
  enrollmentInfo: {
    gradeLevel?: string
    schoolYear: string
    enrollmentDate: string
    status: string
    orNumber?: string
    scholarship?: string
    studentId?: string
    sectionId?: string
    studentType?: 'regular' | 'irregular'
    // College-specific fields
    level?: 'college' | 'high-school'
    courseId?: string
    courseCode?: string
    courseName?: string
    yearLevel?: string
    semester?: 'first-sem' | 'second-sem'
  }
}
