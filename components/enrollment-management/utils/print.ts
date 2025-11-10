export function handlePrintClickUtil({
  enrollment,
  subjectAssignments,
  allSubjectSets,
  setViewingEnrollment,
  setSelectedSubjects,
  setShowPrintModal,
}: any) {
  const enrollmentInfo = enrollment.enrollmentInfo
  let subjectsToPrint: string[] = []
  if (enrollmentInfo?.level === 'college') {
    const assignment = subjectAssignments.find(
      (a: any) =>
        a.level === 'college' &&
        a.courseCode === enrollmentInfo.courseCode &&
        a.yearLevel === parseInt(enrollmentInfo.yearLevel || '1') &&
        a.semester === enrollmentInfo.semester
    )
    if (assignment) {
      const subjectSet = (allSubjectSets || []).find((s: any) => s.id === assignment.subjectSetId)
      if (subjectSet) subjectsToPrint = subjectSet.subjects
    }
  } else {
    const gradeLevel = enrollmentInfo?.gradeLevel
    if (gradeLevel) {
      const assignment = subjectAssignments.find(
        (a: any) => a.level === 'high-school' && a.gradeLevel === parseInt(gradeLevel)
      )
      if (assignment) {
        const subjectSet = (allSubjectSets || []).find((s: any) => s.id === assignment.subjectSetId)
        if (subjectSet) subjectsToPrint = subjectSet.subjects
      }
    }
  }
  setViewingEnrollment(enrollment)
  setSelectedSubjects(subjectsToPrint)
  setShowPrintModal(true)
}


