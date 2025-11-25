export async function openEnrollModalUtil({
  viewingEnrollment,
  studentProfiles,
  setEnrollStudentId,
  setShowEnrollModal,
  setEnrollOrNumber,
  setEnrollScholarship,
  incrementStudentId,
}: any) {
  if (viewingEnrollment) {
    const existingId =
      studentProfiles[viewingEnrollment.userId]?.studentId ||
      viewingEnrollment.enrollmentInfo?.studentId
    if (existingId) {
      setEnrollStudentId(existingId)
      setShowEnrollModal(true)
      setEnrollOrNumber('')
      setEnrollScholarship('')
      return
    }
  }
  try {
    const response = await fetch('/api/enrollment?getLatestId=true')
    const data = await response.json()
    if (response.ok && data.success && data.latestId) {
      const nextStudentId = incrementStudentId(data.latestId)
      setEnrollStudentId(nextStudentId)
    } else {
      setEnrollStudentId('001-001')
    }
  } catch {
    setEnrollStudentId('001-001')
  }
  setShowEnrollModal(true)
  setEnrollOrNumber('')
  setEnrollScholarship('')
}

export function cancelQuickEnrollUtil({
  setShowQuickEnrollModal,
  setQuickEnrollData,
  setQuickEnrollOrNumber,
  setQuickEnrollScholarship,
  setQuickEnrollStudentId,
}: any) {
  setShowQuickEnrollModal(false)
  setQuickEnrollData(null)
  setQuickEnrollOrNumber('')
  setQuickEnrollScholarship('')
  setQuickEnrollStudentId('')
}

export function cancelEnrollModalUtil({
  setShowEnrollModal,
  setEnrollOrNumber,
  setEnrollScholarship,
  setEnrollStudentId,
}: any) {
  setShowEnrollModal(false)
  setEnrollOrNumber('')
  setEnrollScholarship('')
  setEnrollStudentId('')
}

export function cancelDeleteUtil({
  setShowDeleteModal,
  setDeleteCountdown,
  setEnrollmentToDelete,
}: any) {
  setShowDeleteModal(false)
  setDeleteCountdown(0)
  setEnrollmentToDelete(null)
}

export function cancelRevokeUtil({
  setShowRevokeModal,
  setRevokeCountdown,
}: any) {
  setShowRevokeModal(false)
  setRevokeCountdown(0)
}

export function closeViewModalUtil({
  setShowViewModal,
  setViewingEnrollment,
  setActiveTab,
  setSelectedSubjects,
  setShowOtherSets,
  setShowRevokeModal,
  setRevokeCountdown,
  setShowQuickEnrollModal,
  setQuickEnrollData,
  setShowEnrollModal,
  setEnrollOrNumber,
  setEnrollScholarship,
  setEnrollStudentId,
  setEnrollingStudent,
  setRevokingEnrollment,
}: any) {
  setShowViewModal(false)
  setViewingEnrollment(null)
  setActiveTab('student-info')
  setSelectedSubjects([])
  setShowOtherSets(false)
  setShowRevokeModal(false)
  setRevokeCountdown(0)
  setShowQuickEnrollModal(false)
  setQuickEnrollData(null)
  setShowEnrollModal(false)
  setEnrollOrNumber('')
  setEnrollScholarship('')
  setEnrollStudentId('')
  setEnrollingStudent(false)
  setRevokingEnrollment(false)
}
