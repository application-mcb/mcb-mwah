// Shared types for grades and sections - can be safely imported by both client and server code

// Available grade colors (same as course colors)
export const GRADE_COLORS = [
  'blue-800',
  'red-800',
  'emerald-800',
  'yellow-800',
  'orange-800',
  'violet-800',
  'purple-800'
] as const;

export type GradeColor = typeof GRADE_COLORS[number];

// Department types
export const DEPARTMENTS = [
  'JHS', // Junior High School
  'SHS', // Senior High School
  'COLLEGE' // College
] as const;

export type Department = typeof DEPARTMENTS[number];

// Section ranks
export const SECTION_RANKS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'
] as const;

export type SectionRank = typeof SECTION_RANKS[number];

// Grade data structure
export interface GradeData {
  id: string; // Auto-generated ID (e.g., "grade-11-shs-abm")
  gradeLevel: number; // e.g., 7, 8, 9, 10, 11, 12
  department: Department; // JHS, SHS
  strand?: string; // Strand for SHS grades (ABM, HUMSS, STEM, GAS)
  description: string; // Detailed description (max 150 chars)
  color: GradeColor; // Color theme for the grade (same as course colors)
  createdAt: string; // ISO string (serialized from Firestore timestamp)
  updatedAt: string; // ISO string (serialized from Firestore timestamp)
  createdBy: string; // UID of the registrar who created it
}

// Section data structure
export interface SectionData {
  id: string; // Auto-generated ID (e.g., "section-grade10-jhs-don-bosco")
  gradeId?: string; // Reference to the grade this section belongs to (for JHS/SHS)
  courseId?: string; // Reference to the course this section belongs to (for College)
  sectionName: string; // e.g., "Don Bosco", "Don Toreto"
  grade: string; // e.g., "Grade 10" or "BSIT - Year 1"
  department: Department; // JHS, SHS, COLLEGE
  rank: SectionRank; // A, B, C, D, E, F, G, H
  description: string; // Detailed description
  students?: string[]; // Array of student userIds assigned to this section
  createdAt: string; // ISO string (serialized from Firestore timestamp)
  updatedAt: string; // ISO string (serialized from Firestore timestamp)
  createdBy: string; // UID of the registrar who created it
}

// Input types for creating
export interface CreateGradeData {
  gradeLevel: number;
  department: Department;
  strand?: string;
  description: string;
  color: GradeColor;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSectionData {
  gradeId?: string;
  courseId?: string;
  sectionName: string;
  grade: string;
  department: Department;
  rank: SectionRank;
  description: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
