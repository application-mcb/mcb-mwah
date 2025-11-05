export const determineStudentType = (
  selectedLevel: string,
  selectedCourse: any,
  selectedYear: number,
  selectedSemester: string,
  previousEnrollment: any,
  existingEnrollment: any,
  pendingCourse: any,
  currentStudentType: string
) => {
  // If user explicitly confirmed course change via modal, always use irregular
  if (currentStudentType === 'irregular') {
    return 'irregular'
  }

  // Re-enrollment (same course/grade, different semester) is always regular
  if (previousEnrollment && selectedLevel === 'college') {
    const prevCourseCode = previousEnrollment.enrollmentInfo?.courseCode
    if (prevCourseCode && selectedCourse?.code === prevCourseCode) {
      return 'regular'
    }
  }

  // For high school, check grade level regularity
  if (selectedLevel === 'high-school' && selectedCourse) {
    // Regular grades: 7 (JHS entry), 11 (SHS entry), 1 (College freshman)
    const gradeLevel = selectedCourse.gradeLevel
    if (gradeLevel === 7 || gradeLevel === 11) {
      return 'regular'
    } else {
      return 'irregular'
    }
  }

  // For college, check if this is a non-starting year/semester combination
  if (selectedLevel === 'college' && selectedYear && selectedSemester) {
    // Regular: Only Year 1 First Semester is the starting point
    if (selectedYear === 1 && selectedSemester === 'first-sem') {
      // But check if they're changing courses - that makes them irregular
      if (previousEnrollment?.enrollmentInfo?.courseCode &&
          selectedCourse?.code !== previousEnrollment.enrollmentInfo.courseCode) {
        return 'irregular'
      }
      return 'regular'
    } else {
      return 'irregular'
    }
  }

  // Default fallback
  return selectedLevel === 'college' ? 'regular' : 'regular'
}

export const checkCourseChangeRequired = (
  selectedLevel: string,
  selectedCourse: any,
  previousEnrollment: any,
  existingEnrollment: any
) => {
  if (selectedLevel !== 'college' || !selectedCourse) {
    return { shouldShowModal: false, previousCourseCode: null }
  }

  let hasPreviousDifferentCourse = false
  let previousCourseCode = null

  // Check previousEnrollment
  if (previousEnrollment?.enrollmentInfo?.level === 'college') {
    previousCourseCode = previousEnrollment.enrollmentInfo?.courseCode
    if (previousCourseCode && selectedCourse.code && previousCourseCode !== selectedCourse.code) {
      hasPreviousDifferentCourse = true
    }
  }

  // Check existingEnrollment ONLY if it's for a different semester
  if (!hasPreviousDifferentCourse && existingEnrollment?.enrollmentInfo?.level === 'college') {
    const existingSemester = existingEnrollment.enrollmentInfo?.semester
    const existingCourseCode = existingEnrollment.enrollmentInfo?.courseCode

    // Only check if enrolled in different semester AND different course
    if (existingSemester && existingCourseCode && existingCourseCode !== selectedCourse.code) {
      // We'll handle this in final submission, not here
      // This check should only trigger if we have conflicting data
    }
  }

  // API safeguard check - look through all enrollments
  if (!hasPreviousDifferentCourse) {
    // This would be done via API call, but for now return the basic check
  }

  return {
    shouldShowModal: hasPreviousDifferentCourse,
    previousCourseCode
  }
}

export const validateEnrollmentAvailability = async (
  selectedLevel: string,
  selectedSemester: string,
  selectedCourse: any,
  userId: string
) => {
  if (selectedLevel !== 'college' || !selectedCourse || !selectedSemester) {
    return { isValid: true, message: '' }
  }

  try {
    const response = await fetch(
      `/api/enrollment?userId=${userId}&semester=${selectedSemester}`
    )
    const data = await response.json()

    if (response.ok && data.success && data.data) {
      // Enrollment exists for this semester
      const enrollmentInfo = data.data.enrollmentInfo
      if (enrollmentInfo?.status === 'enrolled') {
        return {
          isValid: false,
          message: `You have already enrolled for ${
            selectedSemester === 'first-sem' ? 'First' : 'Second'
          } Semester. You can enroll for the ${
            selectedSemester === 'first-sem' ? 'Second' : 'First'
          } Semester or wait for the next academic year.`
        }
      }
    }
  } catch (error) {
    console.error('Error checking existing enrollment for semester:', error)
  }

  return { isValid: true, message: '' }
}
