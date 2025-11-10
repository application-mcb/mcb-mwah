import { formatFullName } from '@/components/enrollment-management/utils/format'
import { formatDate, formatBirthDate } from '@/components/enrollment-management/utils/date'

export interface CSVColumn {
  key: string
  label: string
  category: 'personal' | 'enrollment' | 'guardian' | 'system' | 'subjects'
}

export const CSV_COLUMNS: CSVColumn[] = [
  // Personal Information
  { key: 'firstName', label: 'First Name', category: 'personal' },
  { key: 'middleName', label: 'Middle Name', category: 'personal' },
  { key: 'lastName', label: 'Last Name', category: 'personal' },
  { key: 'nameExtension', label: 'Name Extension', category: 'personal' },
  { key: 'email', label: 'Email', category: 'personal' },
  { key: 'phone', label: 'Phone', category: 'personal' },
  { key: 'birthDate', label: 'Birth Date', category: 'personal' },
  { key: 'placeOfBirth', label: 'Place of Birth', category: 'personal' },
  { key: 'gender', label: 'Gender', category: 'personal' },
  { key: 'citizenship', label: 'Citizenship', category: 'personal' },
  { key: 'civilStatus', label: 'Civil Status', category: 'personal' },
  { key: 'religion', label: 'Religion', category: 'personal' },
  // Enrollment Information
  { key: 'studentId', label: 'Student ID', category: 'enrollment' },
  { key: 'academicYear', label: 'Academic Year', category: 'enrollment' },
  { key: 'gradeLevel', label: 'Grade Level', category: 'enrollment' },
  { key: 'courseCode', label: 'Course Code', category: 'enrollment' },
  { key: 'courseName', label: 'Course Name', category: 'enrollment' },
  { key: 'yearLevel', label: 'Year Level', category: 'enrollment' },
  { key: 'semester', label: 'Semester', category: 'enrollment' },
  { key: 'section', label: 'Section', category: 'enrollment' },
  { key: 'status', label: 'Status', category: 'enrollment' },
  { key: 'enrollmentDate', label: 'Enrollment Date', category: 'enrollment' },
  { key: 'studentType', label: 'Student Type', category: 'enrollment' },
  { key: 'orNumber', label: 'OR Number', category: 'enrollment' },
  { key: 'scholarship', label: 'Scholarship', category: 'enrollment' },
  // Guardian Information
  { key: 'guardianName', label: 'Guardian Name', category: 'guardian' },
  { key: 'guardianPhone', label: 'Guardian Phone', category: 'guardian' },
  { key: 'guardianEmail', label: 'Guardian Email', category: 'guardian' },
  { key: 'guardianRelationship', label: 'Guardian Relationship', category: 'guardian' },
  { key: 'emergencyContact', label: 'Emergency Contact', category: 'guardian' },
  // System Information
  { key: 'submittedAt', label: 'Submitted At', category: 'system' },
  { key: 'updatedAt', label: 'Updated At', category: 'system' },
  // Subjects
  { key: 'subjects', label: 'Subjects', category: 'subjects' },
]

export function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function formatBirthDateForCSV(
  birthDay?: string,
  birthMonth?: string,
  birthYear?: string
): string {
  if (!birthDay || !birthMonth || !birthYear) return ''
  try {
    const date = new Date(`${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`)
    if (isNaN(date.getTime())) return ''
    return formatBirthDate(date.toISOString())
  } catch {
    return ''
  }
}

export function formatEnrollmentData(
  enrollment: any,
  selectedColumns: string[],
  studentProfile: any,
  subjects: Record<string, any>,
  sections: Record<string, any[]>,
  courses: any[] | Record<string, any>,
  grades: Record<string, any>
): Record<string, string> {
  const row: Record<string, string> = {}
  const enrollmentInfo = enrollment.enrollmentInfo || {}
  const personalInfo = enrollment.personalInfo || {}

  // Get section name
  let sectionName = ''
  if (enrollmentInfo.sectionId) {
    const allSections = Object.values(sections).flat()
    const section = allSections.find((s) => s.id === enrollmentInfo.sectionId)
    sectionName = section?.sectionName || ''
  }

  // Get course name - prefer courseName from enrollmentInfo, fallback to lookup
  let courseName = enrollmentInfo.courseName || ''
  if (!courseName && enrollmentInfo.courseCode) {
    if (Array.isArray(courses)) {
      const course = courses.find((c) => c.code === enrollmentInfo.courseCode)
      courseName = course?.name || ''
    } else if (courses && typeof courses === 'object') {
      // If courses is a Record, try to find by code
      const coursesArray = Object.values(courses) as any[]
      const course = coursesArray.find((c) => c.code === enrollmentInfo.courseCode)
      courseName = course?.name || ''
    }
  }

  // Get subjects
  let subjectsList = ''
  if (enrollment.selectedSubjects && enrollment.selectedSubjects.length > 0) {
    const subjectNames = enrollment.selectedSubjects
      .map((subjectId: string) => {
        const subject = subjects[subjectId]
        return subject?.name || subjectId
      })
      .filter(Boolean)
    subjectsList = subjectNames.join(', ')
  }

  // Format semester display
  let semesterDisplay = ''
  if (enrollmentInfo.semester === 'first-sem') {
    semesterDisplay = 'Q1'
  } else if (enrollmentInfo.semester === 'second-sem') {
    semesterDisplay = 'Q2'
  }

  // Format student type
  const studentTypeDisplay = enrollmentInfo.studentType === 'irregular' ? 'Irregular' : 'Regular'

  // Build row data
  if (selectedColumns.includes('firstName')) {
    row['First Name'] = escapeCSVValue(personalInfo.firstName || '')
  }
  if (selectedColumns.includes('middleName')) {
    row['Middle Name'] = escapeCSVValue(personalInfo.middleName || '')
  }
  if (selectedColumns.includes('lastName')) {
    row['Last Name'] = escapeCSVValue(personalInfo.lastName || '')
  }
  if (selectedColumns.includes('nameExtension')) {
    row['Name Extension'] = escapeCSVValue(personalInfo.nameExtension || '')
  }
  if (selectedColumns.includes('email')) {
    row['Email'] = escapeCSVValue(personalInfo.email || '')
  }
  if (selectedColumns.includes('phone')) {
    row['Phone'] = escapeCSVValue(personalInfo.phone || '')
  }
  if (selectedColumns.includes('birthDate')) {
    row['Birth Date'] = escapeCSVValue(
      formatBirthDateForCSV(personalInfo.birthDay, personalInfo.birthMonth, personalInfo.birthYear)
    )
  }
  if (selectedColumns.includes('placeOfBirth')) {
    row['Place of Birth'] = escapeCSVValue(personalInfo.placeOfBirth || '')
  }
  if (selectedColumns.includes('gender')) {
    row['Gender'] = escapeCSVValue(personalInfo.gender || '')
  }
  if (selectedColumns.includes('citizenship')) {
    row['Citizenship'] = escapeCSVValue(personalInfo.citizenship || '')
  }
  if (selectedColumns.includes('civilStatus')) {
    row['Civil Status'] = escapeCSVValue(personalInfo.civilStatus || '')
  }
  if (selectedColumns.includes('religion')) {
    row['Religion'] = escapeCSVValue(personalInfo.religion || '')
  }
  if (selectedColumns.includes('studentId')) {
    row['Student ID'] = escapeCSVValue(enrollmentInfo.studentId || studentProfile?.studentId || '')
  }
  if (selectedColumns.includes('academicYear')) {
    row['Academic Year'] = escapeCSVValue(enrollmentInfo.schoolYear || '')
  }
  if (selectedColumns.includes('gradeLevel')) {
    row['Grade Level'] = escapeCSVValue(enrollmentInfo.gradeLevel || '')
  }
  if (selectedColumns.includes('courseCode')) {
    row['Course Code'] = escapeCSVValue(enrollmentInfo.courseCode || '')
  }
  if (selectedColumns.includes('courseName')) {
    row['Course Name'] = escapeCSVValue(courseName)
  }
  if (selectedColumns.includes('yearLevel')) {
    row['Year Level'] = escapeCSVValue(enrollmentInfo.yearLevel || '')
  }
  if (selectedColumns.includes('semester')) {
    row['Semester'] = escapeCSVValue(semesterDisplay)
  }
  if (selectedColumns.includes('section')) {
    row['Section'] = escapeCSVValue(sectionName)
  }
  if (selectedColumns.includes('status')) {
    row['Status'] = escapeCSVValue(enrollmentInfo.status || '')
  }
  if (selectedColumns.includes('enrollmentDate')) {
    row['Enrollment Date'] = escapeCSVValue(
      enrollmentInfo.enrollmentDate ? formatDate(enrollmentInfo.enrollmentDate) : ''
    )
  }
  if (selectedColumns.includes('studentType')) {
    row['Student Type'] = escapeCSVValue(studentTypeDisplay)
  }
  if (selectedColumns.includes('orNumber')) {
    row['OR Number'] = escapeCSVValue(enrollmentInfo.orNumber || '')
  }
  if (selectedColumns.includes('scholarship')) {
    row['Scholarship'] = escapeCSVValue(enrollmentInfo.scholarship || '')
  }
  if (selectedColumns.includes('guardianName')) {
    row['Guardian Name'] = escapeCSVValue(studentProfile?.guardianName || '')
  }
  if (selectedColumns.includes('guardianPhone')) {
    row['Guardian Phone'] = escapeCSVValue(studentProfile?.guardianPhone || '')
  }
  if (selectedColumns.includes('guardianEmail')) {
    row['Guardian Email'] = escapeCSVValue(studentProfile?.guardianEmail || '')
  }
  if (selectedColumns.includes('guardianRelationship')) {
    row['Guardian Relationship'] = escapeCSVValue(studentProfile?.guardianRelationship || '')
  }
  if (selectedColumns.includes('emergencyContact')) {
    row['Emergency Contact'] = escapeCSVValue(studentProfile?.emergencyContact || '')
  }
  if (selectedColumns.includes('submittedAt')) {
    row['Submitted At'] = escapeCSVValue(enrollment.submittedAt ? formatDate(enrollment.submittedAt) : '')
  }
  if (selectedColumns.includes('updatedAt')) {
    row['Updated At'] = escapeCSVValue(enrollment.updatedAt ? formatDate(enrollment.updatedAt) : '')
  }
  if (selectedColumns.includes('subjects')) {
    row['Subjects'] = escapeCSVValue(subjectsList)
  }

  return row
}

export function generateCSV(
  enrollments: any[],
  selectedColumns: string[],
  studentProfiles: Record<string, any>,
  subjects: Record<string, any>,
  sections: Record<string, any[]>,
  courses: any[] | Record<string, any>,
  grades: Record<string, any>
): string {
  if (enrollments.length === 0) {
    return ''
  }

  // Get column headers in order
  const headers = CSV_COLUMNS.filter((col) => selectedColumns.includes(col.key)).map((col) => col.label)

  // Generate CSV rows
  const rows = enrollments.map((enrollment) => {
    const studentProfile = studentProfiles[enrollment.userId] || {}
    const rowData = formatEnrollmentData(
      enrollment,
      selectedColumns,
      studentProfile,
      subjects,
      sections,
      courses,
      grades
    )
    return headers.map((header) => rowData[header] || '')
  })

  // Combine headers and rows
  const csvRows = [headers.join(',')]
  rows.forEach((row) => {
    csvRows.push(row.join(','))
  })

  // Add BOM for Excel compatibility
  const BOM = '\uFEFF'
  return BOM + csvRows.join('\n')
}

export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function getAcademicYearFromFilters(ayFilter: string, currentAY: string): string {
  if (ayFilter && ayFilter.trim()) {
    return ayFilter.trim().toUpperCase()
  }
  return currentAY || 'AY2526'
}

