import { toast } from 'react-toastify'
import { GradeData } from '@/lib/grade-section-database'
import {
  determineStudentType,
  checkCourseChangeRequired,
  validateEnrollmentAvailability,
} from '../utils/enrollment-business-logic'
import {
  validatePersonalInfo,
  validateCompliance,
  validateDocuments,
} from '../utils/enrollment-validation'
import {
  formatPhoneNumber,
  calculateAgeFromValues,
  isRegularGradeLevel,
  isRegularYearSemester,
} from '../utils/enrollment-utils'

export const createEnrollmentHandlers = (
  state: any,
  changeStep: (
    step:
      | 'compliance'
      | 're-enroll'
      | 'level-selection'
      | 'grade-selection'
      | 'course-selection'
      | 'year-selection'
      | 'semester-selection'
      | 'personal-info'
      | 'confirmation'
  ) => void
) => {
  const handleComplianceCheck = () => {
    state.setComplianceChecked(!state.complianceChecked)
  }

  const handleProceedToLevelSelection = () => {
    const validation = validateCompliance(state.complianceChecked)
    if (!validation.isValid) {
      toast.error(validation.message)
      return
    }
    state.setIsReEnrolling(false)
    changeStep('level-selection')
  }

  const handleLevelSelect = (level: 'high-school' | 'college') => {
    // Check if enrollment is available for this level
    if (!state.isEnrollmentAvailable(level)) {
      const periodMessage = state.getEnrollmentPeriodMessage(level)
      toast.error(
        `Enrollment for ${
          level === 'high-school' ? 'High School' : 'College'
        } is currently closed.${periodMessage ? ` ${periodMessage}` : ''}`,
        {
          autoClose: 6000,
        }
      )
      return
    }

    state.setSelectedLevel(level)
    state.setSelectedGrade(null)
    state.setSelectedCourse(null)
    state.setSelectedYear(null)
    if (level === 'high-school') {
      state.loadGrades()
      changeStep('grade-selection')
    } else {
      state.loadCourses()
      changeStep('course-selection')
    }
  }

  const handleGradeSelect = (grade: GradeData) => {
    state.setSelectingGrade(grade.id)

    // Check if this is SHS (Senior High School) - Grade 11-12 with department === 'SHS'
    const isSHS = grade.department === 'SHS'

    // Check for strand change for SHS re-enrollment
    if (isSHS && state.previousEnrollment) {
      const prevInfo = state.previousEnrollment.enrollmentInfo
      const prevStrand = prevInfo?.strand || ''
      const currentStrand = grade.strand || ''

      // If strand changed, reset to Grade 11 First Semester (irregular)
      if (prevStrand && currentStrand && prevStrand !== currentStrand) {
        // Check if selected grade is Grade 11
        if (grade.gradeLevel === 11) {
          // Set as irregular and proceed to semester selection
          setTimeout(() => {
            state.setSelectedGrade(grade)
            state.setStudentType('irregular')
            state.setSelectingGrade(null)
            changeStep('semester-selection')
          }, 600)
          return
        } else {
          // If not Grade 11, show warning and reset to Grade 11
          toast.warning(
            'Strand change detected. You will be reset to Grade 11 First Semester.',
            {
              autoClose: 6000,
            }
          )
          // Find Grade 11 with new strand
          const grade11 = state.grades.find(
            (g: GradeData) =>
              g.gradeLevel === 11 &&
              g.department === 'SHS' &&
              g.strand === currentStrand
          )
          if (grade11) {
            setTimeout(() => {
              state.setSelectedGrade(grade11)
              state.setStudentType('irregular')
              state.setSelectingGrade(null)
              changeStep('semester-selection')
            }, 600)
            return
          }
        }
      }
    }

    // Check if this is an irregular grade level
    const isRegular = isRegularGradeLevel(grade.gradeLevel)

    if (!isRegular) {
      // Show irregular student modal
      setTimeout(() => {
        state.setSelectingGrade(null)
        state.setShowIrregularModal(true)
        // Store the selected grade temporarily
        state.setSelectedGrade(grade)
      }, 600)
    } else {
      // Regular grade level - proceed based on department
      setTimeout(() => {
        state.setSelectedGrade(grade)
        state.setStudentType('regular')
        state.setSelectingGrade(null)

        if (isSHS) {
          // SHS students go to semester selection (like college)
          changeStep('semester-selection')
        } else {
          // JHS students go directly to personal info (no semester)
          changeStep('personal-info')
        }
      }, 600)
    }
  }

  const handleCourseSelect = async (course: any) => {
    const courseCheck = checkCourseChangeRequired(
      state.selectedLevel,
      course,
      state.previousEnrollment,
      state.existingEnrollment
    )

    if (courseCheck.shouldShowModal) {
      console.log(
        '🔴 COURSE SELECT: Different course detected - showing modal',
        courseCheck.previousCourseCode,
        '→',
        course.code
      )
      state.setPendingCourse(course)
      state.setShowCourseChangeModal(true)
      return // Don't proceed until user confirms
    }

    // Same course or no previous enrollment - set as regular explicitly
    console.log(
      '  COURSE SELECT: Same course or no previous enrollment - setting as regular',
      course.code
    )
    state.setStudentType('regular')

    // Proceed normally
    state.setSelectedCourse(course)
    if (state.selectedLevel === 'college') {
      changeStep('year-selection')
    } else {
      changeStep('personal-info')
    }
  }

  const handleYearSelect = (year: number) => {
    state.setSelectedYear(year)
    changeStep('semester-selection')
  }

  const handleSemesterSelect = async (semester: 'first-sem' | 'second-sem') => {
    state.setSelectedSemester(semester)

    // For SHS re-enrollment, check if strand changed
    const isSHS = state.selectedGrade?.department === 'SHS'
    if (isSHS && state.previousEnrollment && state.isReEnrolling) {
      const prevInfo = state.previousEnrollment.enrollmentInfo
      const prevStrand = prevInfo?.strand || ''
      const currentStrand = state.selectedGrade?.strand || ''

      // If strand changed, must be Grade 11 First Semester (irregular)
      if (prevStrand && currentStrand && prevStrand !== currentStrand) {
        if (
          state.selectedGrade?.gradeLevel === 11 &&
          semester === 'first-sem'
        ) {
          state.setStudentType('irregular')
        } else {
          // Force Grade 11 First Semester
          toast.warning(
            'Strand change detected. Resetting to Grade 11 First Semester.',
            {
              autoClose: 6000,
            }
          )
          const grade11 = state.grades.find(
            (g: GradeData) =>
              g.gradeLevel === 11 &&
              g.department === 'SHS' &&
              g.strand === currentStrand
          )
          if (grade11) {
            state.setSelectedGrade(grade11)
            state.setSelectedSemester('first-sem')
            state.setStudentType('irregular')
          }
        }
      } else {
        // Same strand - check if continuing progression
        const prevGradeLevel = parseInt(prevInfo?.gradeLevel || '0')
        const currentGradeLevel = state.selectedGrade?.gradeLevel || 0
        const prevSemester = prevInfo?.semester

        // If continuing from previous semester/grade, it's regular
        if (
          prevSemester === 'first-sem' &&
          semester === 'second-sem' &&
          prevGradeLevel === currentGradeLevel
        ) {
          state.setStudentType('regular')
        } else if (
          prevSemester === 'second-sem' &&
          semester === 'first-sem' &&
          currentGradeLevel === prevGradeLevel + 1
        ) {
          state.setStudentType('regular')
        } else if (currentGradeLevel === 11 && semester === 'first-sem') {
          // Starting Grade 11 First Semester is regular
          state.setStudentType('regular')
        } else {
          // Otherwise, irregular
          state.setStudentType('irregular')
        }
      }
    }

    // For college students, check if this is a non-starting year/semester combination
    if (
      state.selectedLevel === 'college' &&
      state.selectedYear &&
      !state.isReEnrolling
    ) {
      const isRegular = isRegularYearSemester(state.selectedYear, semester)
      if (!isRegular) {
        // This is an irregular year/semester combination - set student as irregular
        console.log('🔴 IRREGULAR YEAR/SEMESTER: Non-starting point detected', {
          year: state.selectedYear,
          semester,
        })
        state.setStudentType('irregular')
      } else {
        // Regular starting point - ensure regular
        console.log('  REGULAR YEAR/SEMESTER: Starting point', {
          year: state.selectedYear,
          semester,
        })
        // Don't set to regular here because course change might override it
        // state.studentType will be determined in handleFinalSubmit
      }
    }

    // For SHS students, check enrollment availability
    if (isSHS) {
      // Check enrollment availability for SHS
      const availabilityCheck = await validateEnrollmentAvailability(
        state.selectedLevel,
        semester,
        state.selectedGrade, // Pass grade instead of course for SHS
        state.userId
      )

      if (!availabilityCheck.isValid) {
        toast.error(availabilityCheck.message, {
          autoClose: 8000,
        })
        state.setSelectedSemester(null)
        return
      }
    } else if (state.selectedLevel === 'college') {
      // Check enrollment availability for college
      const availabilityCheck = await validateEnrollmentAvailability(
        state.selectedLevel,
        semester,
        state.selectedCourse,
        state.userId
      )

      if (!availabilityCheck.isValid) {
        toast.error(availabilityCheck.message, {
          autoClose: 8000,
        })
        state.setSelectedSemester(null)
        return
      }
    }

    changeStep('personal-info')
  }

  const handleReEnrollSemesterSelect = (
    semester: 'first-sem' | 'second-sem'
  ) => {
    state.setReEnrollSemester(semester)
    state.setSelectedSemester(semester)
  }

  const handlePersonalInfoChange = (field: string, value: string) => {
    const updated = {
      ...state.personalInfo,
      [field]: value,
    }

    state.setPersonalInfo(updated)

    // Calculate age immediately with updated values
    if (
      field === 'birthMonth' ||
      field === 'birthDay' ||
      field === 'birthYear'
    ) {
      const age = calculateAgeFromValues(
        updated.birthMonth,
        updated.birthDay,
        updated.birthYear
      )
      state.setCalculatedAge(age)
    }
  }

  const handlePhoneNumberChange = (value: string) => {
    const formatted = formatPhoneNumber(value)
    state.setPersonalInfo({
      ...state.personalInfo,
      phone: formatted,
    })
  }

  const handlePhoneNumberKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    // Prevent deletion of +63 prefix
    if (
      e.key === 'Backspace' &&
      state.personalInfo.phone.startsWith('+63') &&
      state.personalInfo.phone.length <= 3
    ) {
      e.preventDefault()
      return
    }

    // Prevent typing 0 as first character (after +63)
    if (e.key === '0' && state.personalInfo.phone === '+63') {
      e.preventDefault()
      return
    }
  }

  const handleProceedToConfirmation = () => {
    const validation = validatePersonalInfo(state.personalInfo)
    if (!validation.isValid) {
      toast.error(validation.message)
      return
    }

    console.log(
      'Proceeding to confirmation with personal info:',
      state.personalInfo
    )
    changeStep('confirmation')
  }

  const handleStartReEnroll = async () => {
    if (!state.previousEnrollment) {
      toast.error('No previous enrollment found')
      return
    }

    state.setIsReEnrolling(true)

    // Pre-fill data from previous enrollment
    const prevInfo = state.previousEnrollment.enrollmentInfo
    const prevPersonal = state.previousEnrollment.personalInfo

    // Set level
    if (prevInfo?.level === 'college') {
      state.setSelectedLevel('college')
      // Load courses and find the matching course
      let courseList = state.courses
      if (state.courses.length === 0) {
        await state.loadCourses()
        // Fetch courses directly to get fresh data
        try {
          const response = await fetch('/api/courses')
          const data = await response.json()
          courseList = data.courses || []
        } catch (error) {
          console.error('Error fetching courses:', error)
        }
      }

      if (prevInfo.courseCode && courseList.length > 0) {
        const course = courseList.find(
          (c: any) => c.code === prevInfo.courseCode
        )
        if (course) {
          state.setSelectedCourse(course)
        }
      }
      state.setSelectedYear(
        prevInfo.yearLevel ? parseInt(prevInfo.yearLevel) : null
      )
      // Automatically determine opposite semester from previous enrollment
      if (prevInfo.semester === 'first-sem') {
        state.setReEnrollSemester('second-sem')
        state.setSelectedSemester('second-sem')
      } else if (prevInfo.semester === 'second-sem') {
        state.setReEnrollSemester('first-sem')
        state.setSelectedSemester('first-sem')
      }
    } else {
      state.setSelectedLevel('high-school')

      // Check if previous enrollment was SHS
      const prevIsSHS = prevInfo?.department === 'SHS'
      const prevStrand = prevInfo?.strand || ''
      const prevGradeLevel = prevInfo?.gradeLevel

      // Ensure grades list is available
      if (state.grades.length === 0) {
        try {
          await state.loadGrades()
        } catch (e) {}
      }

      if (prevIsSHS) {
        // For SHS re-enrollment, check for strand changes
        // If strand changes, reset to Grade 11 First Semester (irregular)
        // If same strand, continue to next semester/grade (regular)

        // For now, let user select grade - we'll check strand in handleGradeSelect
        state.setSelectedGrade(null)
        changeStep('grade-selection')
      } else {
        // JHS: Determine next grade level (prev + 1), capped at 12
        let nextGradeLevel: number | null = null
        if (prevGradeLevel) {
          const numStr = String(prevGradeLevel).match(/\d+/)?.[0]
          const prev = numStr ? parseInt(numStr, 10) : NaN
          if (!Number.isNaN(prev)) {
            const candidate = prev + 1
            nextGradeLevel = candidate <= 12 ? candidate : null
          }
        }

        if (nextGradeLevel) {
          // Prefer id pattern `grade-X`, fallback by gradeLevel equality
          let nextGrade = state.grades.find((g: GradeData) =>
            g.id.startsWith(`grade-${nextGradeLevel}`)
          )
          if (!nextGrade) {
            nextGrade = state.grades.find(
              (g: GradeData) =>
                parseInt(String(g.gradeLevel), 10) === nextGradeLevel
            ) as GradeData | undefined
          }
          if (nextGrade) {
            state.setSelectedGrade(nextGrade)
            // Proceed to re-enroll step UI
            changeStep('re-enroll')
          } else {
            // If not found, guide user to pick the appropriate next grade
            state.setSelectedGrade(null)
            toast.info(
              `Grade ${nextGradeLevel} is not configured yet. Please select your grade.`,
              { autoClose: 6000 }
            )
            changeStep('grade-selection')
          }
        } else {
          // If no valid next grade (e.g., 12), leave unselected
          state.setSelectedGrade(null)
          changeStep('grade-selection')
        }
      }
    }

    // Re-enrollment (same course/grade, different semester) is always regular
    state.setStudentType('regular')

    // Pre-fill personal info
    if (prevPersonal) {
      state.setPersonalInfo({
        firstName: prevPersonal.firstName || '',
        middleName: prevPersonal.middleName || '',
        lastName: prevPersonal.lastName || '',
        nameExtension: prevPersonal.nameExtension || '',
        email: prevPersonal.email || '',
        phone: prevPersonal.phone || '',
        birthMonth: prevPersonal.birthMonth || '',
        birthDay: prevPersonal.birthDay || '',
        birthYear: prevPersonal.birthYear || '',
        placeOfBirth: prevPersonal.placeOfBirth || '',
        gender: prevPersonal.gender || '',
        citizenship: prevPersonal.citizenship || '',
        religion: prevPersonal.religion || '',
        civilStatus: prevPersonal.civilStatus || '',
      })
    }

    // Moved re-enroll navigation inside HS/college branches after selections
  }

  const handleProceedToReEnrollConfirmation = () => {
    changeStep('confirmation')
  }

  const handleProceedToFinalConfirmation = () => {
    console.log('Proceeding to final confirmation')
    changeStep('confirmation')
  }

  const handleBackToLevelSelection = () => {
    state.setSelectedLevel(null)
    state.setSelectedGrade(null)
    state.setSelectedCourse(null)
    changeStep('level-selection')
  }

  const handleBackToGradeSelection = () => {
    state.setSelectedGrade(null)
    changeStep('grade-selection')
  }

  const handleBackToCourseSelection = () => {
    state.setSelectedCourse(null)
    changeStep('course-selection')
  }

  const handleBackToSemesterSelection = () => {
    state.setSelectedSemester(null)
    changeStep('semester-selection')
  }

  const handleBackToPersonalInfo = () => {
    changeStep('personal-info')
  }

  const handleBackToCompliance = () => {
    state.setSelectedGrade(null)
    state.setSelectedCourse(null)
    state.setSelectedLevel(null)
    changeStep('compliance')
  }

  const confirmIrregularStudent = () => {
    state.setStudentType('irregular')
    state.setShowIrregularModal(false)

    // Check if SHS - route to semester selection
    const isSHS = state.selectedGrade?.department === 'SHS'
    if (isSHS) {
      changeStep('semester-selection')
    } else {
      changeStep('personal-info')
    }
  }

  const cancelIrregularStudent = () => {
    state.setSelectedGrade(null)
    state.setShowIrregularModal(false)
  }

  const confirmCourseChange = () => {
    if (state.pendingCourse) {
      console.log(
        '  CONFIRM COURSE CHANGE: Setting studentType to irregular for course',
        state.pendingCourse.code
      )
      // CRITICAL: Set studentType FIRST before any other operations
      state.setStudentType('irregular')
      state.setSelectedCourse(state.pendingCourse)
      state.setShowCourseChangeModal(false)
      state.setPendingCourse(null)

      console.log(
        'CONSOLE :: After setStudentType("irregular") - should be set now'
      )

      if (state.selectedLevel === 'college') {
        changeStep('year-selection')
      }

      // Verification log after state update
      setTimeout(() => {
        console.log(
          'CONSOLE :: Verification: studentType should be irregular now'
        )
      }, 100)
    }
  }

  const cancelCourseChange = () => {
    state.setPendingCourse(null)
    state.setShowCourseChangeModal(false)
  }

  const handleOpenSubmitModal = () => {
    state.setCountdown(5)
    state.setSubmitModalOpen(true)
  }

  const handleCloseSubmitModal = () => {
    state.setSubmitModalOpen(false)
    state.setCountdown(5)
  }

  const handleFinalSubmit = async () => {
    // Check if all required documents are uploaded
    const docValidation = validateDocuments(state.documentsStatus)
    if (!docValidation.isValid) {
      toast.error(docValidation.message, {
        autoClose: 8000,
      })
      return
    }

    // Validate personal info before submitting
    const personalInfoValidation = validatePersonalInfo(state.personalInfo)
    if (!personalInfoValidation.isValid) {
      toast.error(personalInfoValidation.message, {
        autoClose: 8000,
      })
      return
    }

    try {
      state.setEnrolling(true)
      toast.info('Submitting enrollment...', {
        autoClose: false,
        toastId: 'enrollment-submit',
      })

      // CRITICAL: Final check for course changes - detect if student is shifting courses
      let finalStudentType = state.studentType

      if (state.selectedLevel === 'college' && state.selectedCourse) {
        const newCourseCode = state.selectedCourse.code

        // Check previousEnrollment for course change
        if (
          state.previousEnrollment &&
          state.previousEnrollment.enrollmentInfo?.level === 'college'
        ) {
          const previousCourseCode =
            state.previousEnrollment.enrollmentInfo?.courseCode
          if (
            previousCourseCode &&
            newCourseCode &&
            previousCourseCode !== newCourseCode
          ) {
            console.log(
              '🔴 FINAL CHECK: Course changed from',
              previousCourseCode,
              'to',
              newCourseCode,
              '- FORCING irregular'
            )
            finalStudentType = 'irregular'
          }
        }

        // Check existingEnrollment ONLY if it's for a different semester (not current enrollment)
        // existingEnrollment is set when student has current AY + current semester enrollment
        if (
          finalStudentType !== 'irregular' &&
          state.existingEnrollment &&
          state.existingEnrollment.enrollmentInfo?.level === 'college'
        ) {
          const existingSemester =
            state.existingEnrollment.enrollmentInfo?.semester
          const existingCourseCode =
            state.existingEnrollment.enrollmentInfo?.courseCode

          // Only mark as irregular if enrolled in different semester AND different course
          // But at this point we don't have selectedSemester yet, so skip this check
          // It will be caught in handleFinalSubmit instead
          // This check should only trigger if we somehow have conflicting data
        }

        // FINAL SAFEGUARD: If studentType is 'irregular', it takes precedence (user confirmed via modal)
        // This ensures that if the user clicked "Yes, Continue with Course Change", it's always respected
        if (state.studentType === 'irregular') {
          finalStudentType = 'irregular'
          console.log(
            '  FINAL CHECK: studentType is irregular - FORCING irregular'
          )
        }

        // If studentType is still null/undefined and we're in college, default to regular
        // But ONLY if we haven't detected a course change
        if (!finalStudentType) {
          finalStudentType =
            state.selectedLevel === 'college' ? 'regular' : 'regular'
        }

        console.log(
          '📋 FINAL studentType being submitted:',
          finalStudentType,
          '| state.studentType:',
          state.studentType
        )

        // Submit enrollment without documents (they'll be referenced from the Documents section)
        const enrollmentData = {
          userId: state.userId,
          personalInfo: state.personalInfo,
          studentType: finalStudentType,
          documents: {}, // Empty documents object - documents will be referenced separately
        }

        if (
          state.selectedLevel === 'college' &&
          state.selectedCourse &&
          state.selectedYear &&
          state.selectedSemester
        ) {
          // College enrollment
          Object.assign(enrollmentData, {
            courseId: state.selectedCourse.code, // Use code as the identifier since courses don't have id field
            courseCode: state.selectedCourse.code,
            courseName: state.selectedCourse.name,
            yearLevel: state.selectedYear,
            semester: state.selectedSemester,
            level: 'college',
          })
        } else if (
          state.selectedLevel === 'high-school' &&
          state.selectedGrade
        ) {
          // High school enrollment
          const enrollmentInfo: any = {
            gradeId: state.selectedGrade.id,
            gradeLevel: state.selectedGrade.gradeLevel,
            department: state.selectedGrade.department,
            level: 'high-school',
          }

          // Add semester for SHS students
          if (
            state.selectedGrade.department === 'SHS' &&
            state.selectedSemester
          ) {
            enrollmentInfo.semester = state.selectedSemester
            enrollmentInfo.strand = state.selectedGrade.strand || ''
          }

          Object.assign(enrollmentData, enrollmentInfo)
        }

        const response = await fetch('/api/enrollment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(enrollmentData),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to submit enrollment')
        }

        // Close modal
        state.setSubmitModalOpen(false)
        state.setCountdown(5)

        toast.dismiss('enrollment-submit')
        toast.success('Enrollment submitted successfully!')

        // Dispatch custom event to notify enrollment-management of new enrollment
        if (typeof window !== 'undefined') {
          try {
            window.dispatchEvent(
              new CustomEvent('enrollmentSubmitted', {
                detail: {
                  userId: state.userId,
                  status: 'submitted',
                  timestamp: Date.now(),
                },
              })
            )
          } catch (error) {
            // Silently fail - Firestore realtime listener will catch changes
            console.warn('Failed to dispatch enrollmentSubmitted event:', error)
          }
        }

        // Refresh enrollment data by re-checking existing enrollment
        // This ensures we get the actual data from the database
        await state.checkExistingEnrollment()

        // Clear submittedEnrollment so we use the fetched existingEnrollment
        state.setSubmittedEnrollment(null)

        // Reset form after successful submission
        state.setSelectedGrade(null)
        state.setSelectedCourse(null)
        state.setSelectedLevel(null)
        state.setSelectedYear(null)
        state.setSelectedSemester(null)
        state.setStudentType(null)
        state.setPersonalInfo({
          firstName: '',
          middleName: '',
          lastName: '',
          nameExtension: '',
          email: '',
          phone: '',
          birthMonth: '',
          birthDay: '',
          birthYear: '',
          placeOfBirth: '',
          gender: '',
          citizenship: '',
          religion: '',
          civilStatus: '',
        })
      } else if (state.selectedLevel === 'high-school' && state.selectedGrade) {
        // High school enrollment
        const enrollmentData: any = {
          userId: state.userId,
          gradeId: state.selectedGrade.id,
          gradeLevel: state.selectedGrade.gradeLevel,
          department: state.selectedGrade.department,
          personalInfo: state.personalInfo,
          studentType: state.studentType || 'regular',
          documents: {}, // Empty documents object - documents will be referenced separately
        }

        // Add semester for SHS students
        if (
          state.selectedGrade.department === 'SHS' &&
          state.selectedSemester
        ) {
          enrollmentData.semester = state.selectedSemester
        }

        const response = await fetch('/api/enrollment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(enrollmentData),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to submit enrollment')
        }

        toast.dismiss('enrollment-submit')
        toast.success(
          "Enrollment submitted successfully! You will be notified once it's processed."
        )

        // Dispatch custom event to notify enrollment-management of new enrollment
        if (typeof window !== 'undefined') {
          try {
            window.dispatchEvent(
              new CustomEvent('enrollmentSubmitted', {
                detail: {
                  userId: state.userId,
                  status: 'submitted',
                  timestamp: Date.now(),
                },
              })
            )
          } catch (error) {
            // Silently fail - Firestore realtime listener will catch changes
            console.warn('Failed to dispatch enrollmentSubmitted event:', error)
          }
        }

        // Trigger progress update callback
        if (state.onProgressUpdate) {
          state.onProgressUpdate()
        }
      }
    } catch (error: any) {
      toast.dismiss('enrollment-submit')
      toast.error(error.message || 'Failed to submit enrollment')
    } finally {
      state.setEnrolling(false)
    }
  }

  const handleDeleteEnrollment = () => {
    state.setShowDeleteModal(true)
    state.setDeleteCountdown(5)
  }

  const confirmDeleteEnrollment = async () => {
    try {
      state.setDeletingEnrollment(true)

      const response = await fetch('/api/enrollment', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: state.userId,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success(
          'Enrollment deleted successfully. You can now submit a new enrollment.',
          {
            autoClose: 6000,
          }
        )
        state.setExistingEnrollment(null)
        state.setSubmittedEnrollment(null)
        state.setShowDeleteModal(false)
        // Reset form to initial state
        state.setSelectedGrade(null)
        state.setSelectedCourse(null)
        state.setSelectedLevel(null)
        state.setSelectedYear(null)
        state.setSelectedSemester(null)
        state.setStudentType(null)
        state.setPersonalInfo({
          firstName: '',
          middleName: '',
          lastName: '',
          nameExtension: '',
          email: '',
          phone: '',
          birthMonth: '',
          birthDay: '',
          birthYear: '',
          placeOfBirth: '',
          gender: '',
          citizenship: '',
          religion: '',
          civilStatus: '',
        })
        state.setCurrentStep('compliance')
        state.setComplianceChecked(false)
      } else {
        toast.error(data.error || 'Failed to delete enrollment.', {
          autoClose: 8000,
        })
      }
    } catch (error) {
      console.error('Error deleting enrollment:', error)
      toast.error('Network error occurred while deleting enrollment.', {
        autoClose: 7000,
      })
    } finally {
      state.setDeletingEnrollment(false)
    }
  }

  const cancelDeleteEnrollment = () => {
    state.setShowDeleteModal(false)
    state.setDeleteCountdown(0)
  }

  return {
    handleComplianceCheck,
    handleProceedToLevelSelection,
    handleLevelSelect,
    handleGradeSelect,
    handleCourseSelect,
    handleYearSelect,
    handleSemesterSelect,
    handleReEnrollSemesterSelect,
    handlePersonalInfoChange,
    handlePhoneNumberChange,
    handlePhoneNumberKeyDown,
    handleProceedToConfirmation,
    handleStartReEnroll,
    handleProceedToReEnrollConfirmation,
    handleProceedToFinalConfirmation,
    handleBackToLevelSelection,
    handleBackToGradeSelection,
    handleBackToCourseSelection,
    handleBackToSemesterSelection,
    handleBackToPersonalInfo,
    handleBackToCompliance,
    confirmIrregularStudent,
    cancelIrregularStudent,
    confirmCourseChange,
    cancelCourseChange,
    handleOpenSubmitModal,
    handleCloseSubmitModal,
    handleFinalSubmit,
    handleDeleteEnrollment,
    confirmDeleteEnrollment,
    cancelDeleteEnrollment,
  }
}
