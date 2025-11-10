import { ExtendedEnrollmentData, CourseData, GradeData } from '../types'

export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'approved':
      return 'bg-green-900 text-green-900'
    case 'pending':
      return 'bg-yellow-900 text-yellow-900'
    case 'rejected':
      return 'bg-red-900 text-red-900'
    case 'enrolled':
      return 'bg-blue-900 text-blue-900'
    default:
      return 'bg-gray-900 text-gray-900'
  }
}

// Get status color as hex value for square badge
export const getStatusHexColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'approved':
      return '#22c55e' // green-500
    case 'pending':
      return '#eab308' // yellow-500
    case 'rejected':
      return '#ef4444' // red-500
    case 'enrolled':
      return '#3b82f6' // blue-500
    default:
      return '#6b7280' // gray-500
  }
}

// Color mapping for background colors (matching grade-list.tsx)
export const getBgColor = (color: string): string => {
  const colorMap: { [key: string]: string } = {
    'blue-900': '#1e40af',
    'red-800': '#991b1b',
    'emerald-800': '#064e3b',
    'yellow-800': '#92400e',
    'orange-800': '#9a3412',
    'violet-800': '#5b21b6',
    'purple-800': '#581c87',
  }
  return colorMap[color] || '#1e40af' // default to blue-900
}

// Get grade color from database (matching grade-list.tsx structure)
export const getGradeColor = (
  gradeLevel: number,
  grades: Record<string, GradeData>
): string => {
  // Find the grade document that matches this grade level
  const gradeEntries = Object.entries(grades)
  console.log(
    'CONSOLE :: Looking for grade color for level:',
    gradeLevel,
    'Available grades:',
    gradeEntries
  )

  const matchingGrade = gradeEntries.find(([id, gradeData]) => {
    // Extract grade level from ID like "grade-7-jhs" -> 7
    const idParts = id.split('-')
    const idGradeLevel = parseInt(idParts[1])
    console.log(
      'CONSOLE :: Checking grade ID:',
      id,
      'Parts:',
      idParts,
      'Grade level:',
      idGradeLevel
    )
    return idGradeLevel === gradeLevel
  })

  const color = matchingGrade ? matchingGrade[1].color : 'blue-900'
  console.log('CONSOLE:: Grade', gradeLevel, 'color:', color)
  return color // default to blue-900
}

// Get course color from database by course code
export const getCourseColor = (
  courseCode: string,
  courses: CourseData[]
): string => {
  // Find the course that matches the course code
  const courseData = courses.find((c) => c.code === courseCode)
  console.log(
    'CONSOLE :: Looking for course color for code:',
    courseCode,
    'Found:',
    courseData
  )

  const color = courseData ? courseData.color : 'blue-900'
  console.log('CONSOLE:: Course', courseCode, 'color:', color)
  return color // default to blue-900
}

// Helper function to get display info for enrollment (handles both high school and college)
export const getEnrollmentDisplayInfo = (
  enrollment: ExtendedEnrollmentData | null,
  grades: Record<string, GradeData>,
  courses: CourseData[]
) => {
  if (!enrollment || !enrollment.enrollmentInfo) {
    return {
      type: 'unknown',
      displayText: 'N/A',
      subtitle: 'N/A',
      color: 'blue-900',
    }
  }

  const enrollmentInfo = enrollment.enrollmentInfo

  if (enrollmentInfo?.level === 'college') {
    const semesterDisplay =
      enrollmentInfo.semester === 'first-sem'
        ? 'Q1'
        : enrollmentInfo.semester === 'second-sem'
        ? 'Q2'
        : ''
    const semesterSuffix = semesterDisplay ? ` ${semesterDisplay}` : ''
    return {
      type: 'college',
      displayText: `${enrollmentInfo.courseCode || 'N/A'} ${
        enrollmentInfo.yearLevel || 'N/A'
      }${semesterSuffix}`,
      subtitle: enrollmentInfo?.schoolYear || 'N/A',
      color: getCourseColor(enrollmentInfo.courseCode || '', courses),
    }
  } else {
    // High school enrollment
    const gradeLevel = parseInt(enrollmentInfo?.gradeLevel || '0')
    return {
      type: 'high-school',
      displayText: `Grade ${gradeLevel || 'N/A'}`,
      subtitle: enrollmentInfo?.schoolYear || 'N/A',
      color: getGradeColor(gradeLevel, grades),
    }
  }
}
