import { toast } from 'react-toastify'

export async function confirmQuickEnrollUtil({
  quickEnrollData,
  studentProfiles,
  quickEnrollOrNumber,
  quickEnrollScholarship,
  quickEnrollStudentId,
  setEnrollingStudent,
  setShowQuickEnrollModal,
  setQuickEnrollData,
  setQuickEnrollOrNumber,
  setQuickEnrollScholarship,
  setQuickEnrollStudentId,
}: any) {
  if (!quickEnrollData) return

  const existingId =
    studentProfiles[quickEnrollData.enrollment.userId]?.studentId ||
    quickEnrollData.enrollment.enrollmentInfo?.studentId
  const finalStudentId = existingId || quickEnrollStudentId

  if (!quickEnrollOrNumber.trim()) {
    toast.error('OR Number is required.', { autoClose: 5000 })
    return
  }
  if (!quickEnrollScholarship.trim()) {
    toast.error('Scholarship is required.', { autoClose: 5000 })
    return
  }
  if (!finalStudentId || !String(finalStudentId).trim()) {
    toast.error('Student ID is required.', { autoClose: 5000 })
    return
  }

  setEnrollingStudent(true)
  try {
    const response = await fetch('/api/enrollment', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: quickEnrollData.enrollment.userId,
        selectedSubjects: quickEnrollData.subjects,
        orNumber: quickEnrollOrNumber,
        scholarship: quickEnrollScholarship,
        studentId: finalStudentId,
        studentType: quickEnrollData.enrollment.enrollmentInfo?.studentType || 'regular',
        level: quickEnrollData.enrollment.enrollmentInfo?.level,
        semester: quickEnrollData.enrollment.enrollmentInfo?.semester,
      }),
    })
    const data = await response.json()
    if (response.ok && data.success) {
      if (!existingId) {
        try {
          await fetch('/api/enrollment', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updateLatestId: finalStudentId }),
          })
        } catch {}
      }
      toast.success(
        `Quick enrolled ${quickEnrollData.enrollment.personalInfo?.firstName} ${quickEnrollData.enrollment.personalInfo?.lastName} with ${quickEnrollData.subjects.length} subjects.`,
        { autoClose: 6000 }
      )
      setShowQuickEnrollModal(false)
      setQuickEnrollData(null)
      setQuickEnrollOrNumber('')
      setQuickEnrollScholarship('')
      setQuickEnrollStudentId('')
    } else {
      toast.error(data.error || 'Failed to quick enroll student.', {
        autoClose: 8000,
      })
    }
  } catch (error) {
    toast.error('Network error occurred while quick enrolling student.', {
      autoClose: 7000,
    })
  } finally {
    setEnrollingStudent(false)
  }
}

export async function handleConfirmEnrollUtil({
  viewingEnrollment,
  selectedSubjects,
  enrollOrNumber,
  enrollScholarship,
  enrollStudentId,
  studentProfiles,
  setEnrollingStudent,
  setShowEnrollModal,
  closeViewModal,
}: any) {
  if (!viewingEnrollment || selectedSubjects.length === 0) {
    toast.warning('Please select at least one subject before enrolling the student.', { autoClose: 5000 })
    return
  }

  const existingId =
    studentProfiles[viewingEnrollment.userId]?.studentId ||
    viewingEnrollment.enrollmentInfo?.studentId
  const finalStudentId = existingId || enrollStudentId

  if (!enrollOrNumber.trim()) {
    toast.error('OR Number is required.', { autoClose: 5000 })
    return
  }
  if (!enrollScholarship.trim()) {
    toast.error('Scholarship is required.', { autoClose: 5000 })
    return
  }
  if (!finalStudentId || !String(finalStudentId).trim()) {
    toast.error('Student ID is required.', { autoClose: 5000 })
    return
  }

  setEnrollingStudent(true)
  try {
    const response = await fetch('/api/enrollment', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: viewingEnrollment.userId,
        selectedSubjects,
        orNumber: enrollOrNumber,
        scholarship: enrollScholarship,
        studentId: finalStudentId,
        studentType: viewingEnrollment.enrollmentInfo?.studentType || 'regular',
        level: viewingEnrollment.enrollmentInfo?.level,
        semester: viewingEnrollment.enrollmentInfo?.semester,
      }),
    })
    const data = await response.json()
    if (response.ok && data.success) {
      toast.success(
        `Student ${viewingEnrollment?.personalInfo?.firstName} ${viewingEnrollment?.personalInfo?.lastName} enrolled with ${selectedSubjects.length} subject(s).`,
        { autoClose: 6000 }
      )
      setShowEnrollModal(false)
      closeViewModal()
    } else {
      toast.error(data.error || 'Failed to enroll student. Please try again.', {
        autoClose: 8000,
      })
    }
  } catch (error) {
    toast.error('Network error occurred while enrolling student. Please check your connection and try again.', {
      autoClose: 7000,
    })
  } finally {
    setEnrollingStudent(false)
  }
}

export async function enrollSubjectsOnlyUtil({
  viewingEnrollment,
  selectedSubjects,
  setEnrollingStudent,
  closeViewModal,
}: any) {
  if (!viewingEnrollment || selectedSubjects.length === 0) {
    toast.warning('Please select at least one subject before enrolling the student.', { autoClose: 5000 })
    return
  }
  setEnrollingStudent(true)
  try {
    const response = await fetch('/api/enrollment', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: viewingEnrollment.userId,
        selectedSubjects,
        studentType: viewingEnrollment.enrollmentInfo?.studentType || 'regular',
        level: viewingEnrollment.enrollmentInfo?.level,
        semester: viewingEnrollment.enrollmentInfo?.semester,
      }),
    })
    const data = await response.json()
    if (response.ok && data.success) {
      toast.success(
        `Student ${viewingEnrollment?.personalInfo?.firstName} ${viewingEnrollment?.personalInfo?.lastName} enrolled with ${selectedSubjects.length} subject(s).`,
        { autoClose: 6000 }
      )
      closeViewModal()
    } else {
      toast.error(data.error || 'Failed to enroll student. Please try again.', { autoClose: 8000 })
    }
  } catch (error) {
    toast.error('Network error occurred while enrolling student. Please check your connection and try again.', { autoClose: 7000 })
  } finally {
    setEnrollingStudent(false)
  }
}

export async function revokeEnrollmentUtil({ viewingEnrollment, setShowRevokeModal, setRevokingEnrollment, closeViewModal }: any) {
  if (!viewingEnrollment) {
    toast.error('Unable to find enrollment information. Please refresh and try again.', { autoClose: 5000 })
    return
  }
  setRevokingEnrollment(true)
  try {
    const response = await fetch('/api/enrollment', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: viewingEnrollment.userId,
        level: viewingEnrollment.enrollmentInfo?.level,
        semester: viewingEnrollment.enrollmentInfo?.semester,
      }),
    })
    const data = await response.json()
    if (response.ok && data.success) {
      toast.success(
        `Enrollment for ${viewingEnrollment?.personalInfo?.firstName} ${viewingEnrollment?.personalInfo?.lastName} has been revoked.`,
        { autoClose: 6000 }
      )
      setShowRevokeModal(false)
      closeViewModal()
    } else {
      toast.error(data.error || 'Failed to revoke enrollment. Please try again.', { autoClose: 8000 })
    }
  } catch (error) {
    toast.error('Network error occurred while revoking enrollment. Please check your connection and try again.', { autoClose: 7000 })
  } finally {
    setRevokingEnrollment(false)
  }
}

export async function deleteEnrollmentUtil({ enrollmentToDelete, setShowDeleteModal, setEnrollmentToDelete, setDeletingEnrollment }: any) {
  if (!enrollmentToDelete) {
    toast.error('Unable to find enrollment information. Please refresh and try again.', { autoClose: 5000 })
    return
  }
  setDeletingEnrollment(true)
  try {
    const response = await fetch('/api/enrollment', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: enrollmentToDelete.userId,
        level: enrollmentToDelete.enrollmentInfo?.level,
        semester: enrollmentToDelete.enrollmentInfo?.semester,
      }),
    })
    const data = await response.json()
    if (response.ok && data.success) {
      toast.success(
        `Enrollment for ${enrollmentToDelete?.personalInfo?.firstName} ${enrollmentToDelete?.personalInfo?.lastName} has been deleted permanently.`,
        { autoClose: 6000 }
      )
      setShowDeleteModal(false)
      setEnrollmentToDelete(null)
    } else {
      toast.error(data.error || 'Failed to delete enrollment. Please try again.', { autoClose: 8000 })
    }
  } catch (error) {
    toast.error('Network error occurred while deleting enrollment. Please check your connection and try again.', { autoClose: 7000 })
  } finally {
    setDeletingEnrollment(false)
  }
}



