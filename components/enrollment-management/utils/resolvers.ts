export function resolveStudentId(viewingEnrollment: any, studentProfiles: Record<string, any>) {
  if (!viewingEnrollment) return ''
  return (
    studentProfiles[viewingEnrollment.userId]?.studentId ||
    viewingEnrollment.enrollmentInfo?.studentId ||
    ''
  )
}


