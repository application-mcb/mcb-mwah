export const incrementStudentId = (currentId: string): string => {
  try {
    const parts = currentId.split('-')
    if (parts.length !== 2) throw new Error('Invalid ID format')
    const prefix = parts[0]
    const numberPart = parseInt(parts[1])
    if (isNaN(numberPart)) throw new Error('Invalid number part')
    const nextNumber = numberPart + 1
    const nextNumberStr = nextNumber.toString().padStart(3, '0')
    return `${prefix}-${nextNumberStr}`
  } catch (error) {
    return '001-001'
  }
}

export const getGradeColor = (grades: Record<string, { color: string }>, gradeLevel: number): string => {
  const gradeEntries = Object.entries(grades)
  const matchingGrade = gradeEntries.find(([id]) => {
    const idParts = id.split('-')
    const idGradeLevel = parseInt(idParts[1])
    return idGradeLevel === gradeLevel
  })
  return matchingGrade ? matchingGrade[1].color : 'blue-900'
}

export const getCourseColor = (courses: Record<string, { color: string }>, courseCode: string): string => {
  const courseData = courses[courseCode]
  return courseData ? courseData.color : 'blue-900'
}

export const getEnrollmentDisplayInfo = (enrollment: any, helpers: { getCourseColor: (code: string) => string; getGradeColor: (level: number) => string }) => {
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
    const semesterDisplay = enrollmentInfo.semester === 'first-sem' ? 'Q1' : enrollmentInfo.semester === 'second-sem' ? 'Q2' : ''
    const semesterSuffix = semesterDisplay ? ` ${semesterDisplay}` : ''
    return {
      type: 'college',
      displayText: `${enrollmentInfo.courseCode || 'N/A'} ${enrollmentInfo.yearLevel || 'N/A'}${semesterSuffix}`,
      subtitle: enrollmentInfo?.schoolYear || 'N/A',
      color: helpers.getCourseColor(enrollmentInfo.courseCode || ''),
    }
  } else {
    const gradeLevel = parseInt(enrollmentInfo?.gradeLevel || '0')
    const isSHS = enrollmentInfo?.department === 'SHS'
    const strand = enrollmentInfo?.strand || ''
    const semester = enrollmentInfo?.semester
    
    // For SHS, include strand and semester
    if (isSHS) {
      const semesterDisplay = semester === 'first-sem' ? 'S1' : semester === 'second-sem' ? 'S2' : ''
      const semesterSuffix = semesterDisplay ? ` ${semesterDisplay}` : ''
      const strandSuffix = strand ? ` ${strand}` : ''
      return {
        type: 'high-school',
        displayText: `Grade ${gradeLevel || 'N/A'}${strandSuffix}${semesterSuffix}`,
        subtitle: enrollmentInfo?.schoolYear || 'N/A',
        color: helpers.getGradeColor(gradeLevel),
      }
    }
    
    // For JHS, just grade level
    return {
      type: 'high-school',
      displayText: `Grade ${gradeLevel || 'N/A'}`,
      subtitle: enrollmentInfo?.schoolYear || 'N/A',
      color: helpers.getGradeColor(gradeLevel),
    }
  }
}

// Resolve assigned subjects for a given enrollment info (college or high-school)
export const resolveAssignedSubjects = (
  enrollmentInfo: any,
  subjectAssignments: Array<{
    level: 'high-school' | 'college'
    gradeLevel?: number
    courseCode?: string
    yearLevel?: number
    semester?: 'first-sem' | 'second-sem'
    strand?: string // For SHS
    subjectSetId: string
  }>,
  allSubjectSets: Array<{ id: string; subjects: string[] }>
) => {
  if (!enrollmentInfo) return { subjectIds: [] as string[], subjectSetId: undefined as string | undefined }

  if (enrollmentInfo.level === 'college') {
    const assignment = subjectAssignments.find(
      (a) =>
        a.level === 'college' &&
        a.courseCode === enrollmentInfo.courseCode &&
        a.yearLevel === parseInt(enrollmentInfo.yearLevel || '1') &&
        a.semester === enrollmentInfo.semester
    )
    if (!assignment) return { subjectIds: [], subjectSetId: undefined }
    const set = allSubjectSets.find((s) => s.id === assignment.subjectSetId)
    return { subjectIds: set?.subjects || [], subjectSetId: set?.id }
  }

  // high-school
  const gradeLevel = parseInt(enrollmentInfo.gradeLevel || '0')
  const isSHS = enrollmentInfo?.department === 'SHS'
  
  // Normalize gradeLevel for comparison (handle both string and number)
  const normalizeGradeLevel = (gl: any): number => {
    if (typeof gl === 'number') return gl
    if (typeof gl === 'string') return parseInt(gl) || 0
    return 0
  }
  
  if (isSHS) {
    // SHS: match by grade + semester + strand
    const assignment = subjectAssignments.find(
      (a) =>
        a.level === 'high-school' &&
        normalizeGradeLevel(a.gradeLevel) === gradeLevel &&
        a.semester === enrollmentInfo.semester &&
        a.strand === enrollmentInfo.strand
    )
    if (!assignment) return { subjectIds: [], subjectSetId: undefined }
    const set = allSubjectSets.find((s) => s.id === assignment.subjectSetId)
    return { subjectIds: set?.subjects || [], subjectSetId: set?.id }
  } else {
    // JHS: match by grade only
    // For JHS, we ignore semester and strand fields entirely since they're not used
    // Match any assignment that has the same grade level, regardless of semester/strand
    const assignment = subjectAssignments.find(
      (a) => {
        if (a.level !== 'high-school') return false
        
        // Check grade level match (handle both number and string)
        const aGradeLevel = normalizeGradeLevel(a.gradeLevel)
        if (aGradeLevel !== gradeLevel) return false
        
        // For JHS, check if this assignment is NOT SHS (no strand or empty strand)
        // This ensures we match JHS assignments, not SHS assignments
        const strandValue = a.strand
        const isSHSAssignment = strandValue !== undefined && 
                                strandValue !== null && 
                                strandValue !== '' &&
                                strandValue.trim() !== ''
        
        // If it's an SHS assignment (has strand), skip it for JHS enrollment
        if (isSHSAssignment) return false
        
        // Match found - this is a JHS assignment for the correct grade level
        return true
      }
    )
    if (!assignment) return { subjectIds: [], subjectSetId: undefined }
    const set = allSubjectSets.find((s) => s.id === assignment.subjectSetId)
    return { subjectIds: set?.subjects || [], subjectSetId: set?.id }
  }
}


