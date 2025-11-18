export const determineStudentType = (
  selectedLevel: string,
  selectedCourse: any,
  selectedYear: number,
  selectedSemester: string,
  previousEnrollment: any,
  existingEnrollment: any,
  pendingCourse: any,
  currentStudentType: string,
  selectedGrade?: any
) => {
  // If user explicitly confirmed course change via modal, always use irregular
  if (currentStudentType === 'irregular') {
    return 'irregular'
  }

  // Check if there's a previous enrollment with studentType
  const prevStudentType = previousEnrollment?.enrollmentInfo?.studentType
  const prevInfo = previousEnrollment?.enrollmentInfo

  // If previous enrollment exists, check its studentType first
  if (previousEnrollment && prevStudentType) {
    // If previous was irregular, check if moving to starting point
    if (prevStudentType === 'irregular') {
      // Check if moving to a starting point
      if (selectedLevel === 'high-school' && selectedGrade) {
        const currentGradeLevel = selectedGrade.gradeLevel
        const prevGradeLevel = parseInt(prevInfo?.gradeLevel || '0')

        // Check if moving from non-starting point (Grade 8-10) to starting point (Grade 11)
        if (
          prevGradeLevel >= 8 &&
          prevGradeLevel <= 10 &&
          currentGradeLevel === 11
        ) {
          // Moving from Grade 8-10 to Grade 11 → becomes regular
          return 'regular'
        }
      } else if (
        selectedLevel === 'college' &&
        selectedYear &&
        selectedSemester
      ) {
        const prevGradeLevel = parseInt(prevInfo?.gradeLevel || '0')

        // Check if moving from Grade 12 (irregular) to Year 1 First Semester
        if (
          prevGradeLevel === 12 &&
          selectedYear === 1 &&
          selectedSemester === 'first-sem'
        ) {
          // Moving from Grade 12 to Year 1 First Semester → becomes regular
          return 'regular'
        }
      }

      // Otherwise, remain irregular
      return 'irregular'
    }

    // If previous was regular, check if same course/strand/grade
    if (prevStudentType === 'regular') {
      if (selectedLevel === 'college' && selectedCourse) {
        const prevCourseCode = prevInfo?.courseCode
        // Same course → remain regular
        if (prevCourseCode && selectedCourse.code === prevCourseCode) {
          return 'regular'
        }
      } else if (selectedLevel === 'high-school' && selectedGrade) {
        const prevGradeLevel = parseInt(prevInfo?.gradeLevel || '0')
        const currentGradeLevel = selectedGrade.gradeLevel
        const prevStrand = prevInfo?.strand || ''
        const currentStrand = selectedGrade.strand || ''

        // Same grade and strand → remain regular
        if (
          prevGradeLevel === currentGradeLevel &&
          prevStrand === currentStrand
        ) {
          return 'regular'
        }
      }

      // Different course/strand/grade → check if moving to non-starting point
      if (selectedLevel === 'high-school' && selectedGrade) {
        const currentGradeLevel = selectedGrade.gradeLevel
        // If not a starting point (7 or 11), becomes irregular
        if (currentGradeLevel !== 7 && currentGradeLevel !== 11) {
          return 'irregular'
        }
      } else if (
        selectedLevel === 'college' &&
        selectedYear &&
        selectedSemester
      ) {
        // If not Year 1 First Semester, becomes irregular
        if (!(selectedYear === 1 && selectedSemester === 'first-sem')) {
          return 'irregular'
        }
      }
    }
  }

  // For high school, check grade level regularity (no previous enrollment)
  if (selectedLevel === 'high-school' && selectedGrade) {
    const gradeLevel = selectedGrade.gradeLevel
    // Regular grades: 7 (JHS entry), 11 (SHS entry)
    if (gradeLevel === 7 || gradeLevel === 11) {
      return 'regular'
    } else {
      return 'irregular'
    }
  }

  // For college, check if this is a non-starting year/semester combination (no previous enrollment)
  if (selectedLevel === 'college' && selectedYear && selectedSemester) {
    // Regular: Only Year 1 First Semester is the starting point
    if (selectedYear === 1 && selectedSemester === 'first-sem') {
      // But check if they're changing courses - that makes them irregular
      if (
        previousEnrollment?.enrollmentInfo?.courseCode &&
        selectedCourse?.code !== previousEnrollment.enrollmentInfo.courseCode
      ) {
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
    if (
      previousCourseCode &&
      selectedCourse.code &&
      previousCourseCode !== selectedCourse.code
    ) {
      hasPreviousDifferentCourse = true
    }
  }

  // Check existingEnrollment ONLY if it's for a different semester
  if (
    !hasPreviousDifferentCourse &&
    existingEnrollment?.enrollmentInfo?.level === 'college'
  ) {
    const existingSemester = existingEnrollment.enrollmentInfo?.semester
    const existingCourseCode = existingEnrollment.enrollmentInfo?.courseCode

    // Only check if enrolled in different semester AND different course
    if (
      existingSemester &&
      existingCourseCode &&
      existingCourseCode !== selectedCourse.code
    ) {
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
    previousCourseCode,
  }
}

export const validateEnrollmentAvailability = async (
  selectedLevel: string,
  selectedSemester: string,
  selectedCourseOrGrade: any,
  userId: string
) => {
  // For college, require course and semester
  if (selectedLevel === 'college') {
    if (!selectedCourseOrGrade || !selectedSemester) {
      return { isValid: true, message: '' }
    }
  }
  // For SHS, require grade and semester
  else if (
    selectedLevel === 'high-school' &&
    selectedCourseOrGrade?.department === 'SHS'
  ) {
    if (!selectedCourseOrGrade || !selectedSemester) {
      return { isValid: true, message: '' }
    }
  }
  // For JHS, no semester check needed
  else {
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
          } Semester or wait for the next academic year.`,
        }
      }
    }
  } catch (error) {
    console.error('Error checking existing enrollment for semester:', error)
  }

  return { isValid: true, message: '' }
}
