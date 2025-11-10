// Shared types for subjects - can be safely imported by both client and server code

// Available subject colors (16 colors from Tailwind 700-800)
export const SUBJECT_COLORS = [
  'blue-900',
  'blue-900',
  'red-700',
  'red-800',
  'emerald-700',
  'emerald-800',
  'yellow-700',
  'yellow-800',
  'orange-700',
  'orange-800',
  'violet-700',
  'violet-800',
  'purple-700',
  'purple-800',
  'indigo-700',
  'indigo-800',
] as const

export type SubjectColor = (typeof SUBJECT_COLORS)[number]

export interface SubjectData {
  id: string
  code: string
  name: string
  description: string
  gradeLevel: number
  color: SubjectColor
  lectureUnits: number
  labUnits: number
  totalUnits: number
  createdBy: string
  createdAt: string // ISO string for client serialization
  updatedAt: string // ISO string for client serialization
}

export interface CreateSubjectData {
  code: string
  name: string
  description: string
  gradeLevel: number
  color: SubjectColor
  lectureUnits: number
  labUnits: number
  totalUnits: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface SubjectSetData {
  id: string // Auto-generated ID (e.g., "subject-set-g10-core")
  name: string // Subject set name (e.g., "G10 Core Subjects")
  description: string // Description of the subject set
  subjects: string[] // Array of subject IDs
  gradeLevel: number // Grade level for this subject set
  color: SubjectColor // Color theme for the subject set
  createdAt: string // ISO string (serialized from Firestore timestamp)
  updatedAt: string // ISO string (serialized from Firestore timestamp)
  createdBy: string // UID of the registrar who created it
}

export interface CreateSubjectSetData {
  name: string
  description: string
  subjects: string[]
  gradeLevel: number
  color: SubjectColor
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
