import { EnrollmentData } from '@/lib/enrollment-database'

export interface ExtendedEnrollmentData extends Omit<EnrollmentData, 'enrollmentInfo'> {
  enrollmentInfo: {
    gradeLevel?: string
    department?: string // For high school (JHS/SHS)
    strand?: string // For SHS
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
  gradeLevel: number // Legacy field
  gradeLevels?: number[] // New field
  courseSelections?: {
    code: string
    year: number
    semester: 'first-sem' | 'second-sem'
  }[] // College course selections
  color: string
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface ScholarshipData {
  id: string
  code: string
  name: string
  value: number
  minUnit: number
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface SubjectAssignmentData {
  id: string
  level: 'high-school' | 'college'
  gradeLevel?: number
  department?: string // For high school (JHS/SHS)
  strand?: string // For SHS
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


