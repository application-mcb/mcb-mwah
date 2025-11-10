// Shared types for courses - can be safely imported by both client and server code

// Available course colors
export const COURSE_COLORS = [
  'blue-900',
  'red-800',
  'emerald-800',
  'yellow-800',
  'orange-800',
  'violet-800',
  'purple-800',
] as const

export type CourseColor = (typeof COURSE_COLORS)[number]

export interface CourseData {
  code: string // e.g., "BSIT"
  name: string // e.g., "BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY"
  description: string // Detailed description of the course
  color: CourseColor // e.g., "blue-900", "red-800", etc.
  createdAt: string // ISO string (serialized from Firestore timestamp)
  updatedAt: string // ISO string (serialized from Firestore timestamp)
  createdBy: string // UID of the registrar who created it
}

export interface CreateCourseData {
  code: string
  name: string
  description: string
  color: CourseColor
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
