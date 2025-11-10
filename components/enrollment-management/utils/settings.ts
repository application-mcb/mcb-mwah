export async function loadCurrentAYUtil({
  setCurrentAY,
  setNewAY,
  setCurrentSemester,
  setNewSemester,
  setCurrentSemesterFilter,
  setCurrentEnrollmentStartHS,
  setNewEnrollmentStartHS,
  setCurrentEnrollmentEndHS,
  setNewEnrollmentEndHS,
  setCurrentEnrollmentStartCollege,
  setNewEnrollmentStartCollege,
  setCurrentEnrollmentEndCollege,
  setNewEnrollmentEndCollege,
  toastError,
}: any) {
  try {
    const response = await fetch('/api/enrollment?getConfig=true')
    const data = await response.json()
    if (response.ok && data.ayCode) {
      setCurrentAY(data.ayCode)
      setNewAY(data.ayCode)
      const semester = data.semester || '1'
      setCurrentSemester(semester)
      setNewSemester(semester)
      setCurrentSemesterFilter(semester)
      if (data.enrollmentStartPeriodHS) {
        setCurrentEnrollmentStartHS(data.enrollmentStartPeriodHS)
        setNewEnrollmentStartHS(data.enrollmentStartPeriodHS)
      }
      if (data.enrollmentEndPeriodHS) {
        setCurrentEnrollmentEndHS(data.enrollmentEndPeriodHS)
        setNewEnrollmentEndHS(data.enrollmentEndPeriodHS)
      }
      if (data.enrollmentStartPeriodCollege) {
        setCurrentEnrollmentStartCollege(data.enrollmentStartPeriodCollege)
        setNewEnrollmentStartCollege(data.enrollmentStartPeriodCollege)
      }
      if (data.enrollmentEndPeriodCollege) {
        setCurrentEnrollmentEndCollege(data.enrollmentEndPeriodCollege)
        setNewEnrollmentEndCollege(data.enrollmentEndPeriodCollege)
      }
    } else {
      toastError('Failed to load current settings.', { autoClose: 5000 })
      setCurrentAY('N/A')
      setNewAY('')
      setCurrentSemester('1')
      setNewSemester('1')
      setCurrentSemesterFilter('1')
      setCurrentEnrollmentStartHS('')
      setNewEnrollmentStartHS('')
      setCurrentEnrollmentEndHS('')
      setNewEnrollmentEndHS('')
      setCurrentEnrollmentStartCollege('')
      setNewEnrollmentStartCollege('')
      setCurrentEnrollmentEndCollege('')
      setNewEnrollmentEndCollege('')
    }
  } catch (error) {
    toastError('Network error occurred while loading settings.', { autoClose: 7000 })
    setCurrentAY('N/A')
    setNewAY('')
    setCurrentSemester('1')
    setNewSemester('1')
    setCurrentSemesterFilter('1')
    setCurrentEnrollmentStartHS('')
    setNewEnrollmentStartHS('')
    setCurrentEnrollmentEndHS('')
    setNewEnrollmentEndHS('')
    setCurrentEnrollmentStartCollege('')
    setNewEnrollmentStartCollege('')
    setCurrentEnrollmentEndCollege('')
    setNewEnrollmentEndCollege('')
  }
}

export async function updateAcademicYearUtil({
  newAY,
  newSemester,
  newEnrollmentStartHS,
  newEnrollmentEndHS,
  newEnrollmentStartCollege,
  newEnrollmentEndCollege,
  toastError,
  toastSuccess,
  setCurrentAY,
  setCurrentSemester,
  setCurrentAYFilter,
  setCurrentSemesterFilter,
  setCurrentEnrollmentStartHS,
  setCurrentEnrollmentEndHS,
  setCurrentEnrollmentStartCollege,
  setCurrentEnrollmentEndCollege,
  setShowAcademicYearModal,
  setUpdatingAY,
}: any) {
  // basic validations (same as original)
  if (!newAY.trim()) {
    toastError('Academic Year is required.', { autoClose: 5000 })
    return
  }
  if (!/^AY\d{2}\d{2}$/.test(newAY.trim())) {
    toastError('Invalid format. Expected format: AY2526 (e.g., AY for Academic Year followed by 4 digits).', { autoClose: 7000 })
    return
  }
  if (!newSemester || !/^[12]$/.test(newSemester)) {
    toastError('Invalid semester. Must be 1 or 2.', { autoClose: 5000 })
    return
  }

  if (newEnrollmentStartHS && newEnrollmentEndHS) {
    const startDate = new Date(newEnrollmentStartHS)
    const endDate = new Date(newEnrollmentEndHS)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      toastError('Invalid date format for high school enrollment duration.', { autoClose: 5000 })
      return
    }
    if (startDate >= endDate) {
      toastError('High School: Start Period must be before End Period.', { autoClose: 5000 })
      return
    }
  }
  if (newEnrollmentStartCollege && newEnrollmentEndCollege) {
    const startDate = new Date(newEnrollmentStartCollege)
    const endDate = new Date(newEnrollmentEndCollege)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      toastError('Invalid date format for college enrollment duration.', { autoClose: 5000 })
      return
    }
    if (startDate >= endDate) {
      toastError('College: Start Period must be before End Period.', { autoClose: 5000 })
      return
    }
  }

  setUpdatingAY(true)
  try {
    const response = await fetch('/api/enrollment', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        updateAY: newAY.trim(),
        updateSemester: newSemester,
        updateEnrollmentStartPeriodHS: newEnrollmentStartHS || null,
        updateEnrollmentEndPeriodHS: newEnrollmentEndHS || null,
        updateEnrollmentStartPeriodCollege: newEnrollmentStartCollege || null,
        updateEnrollmentEndPeriodCollege: newEnrollmentEndCollege || null,
      }),
    })
    const data = await response.json()
    if (response.ok && data.success) {
      toastSuccess('Settings updated successfully.', { autoClose: 6000 })
      setCurrentAY(newAY.trim())
      setCurrentSemester(newSemester)
      setCurrentAYFilter(newAY.trim())
      setCurrentSemesterFilter(newSemester)
      if (newEnrollmentStartHS) setCurrentEnrollmentStartHS(newEnrollmentStartHS)
      if (newEnrollmentEndHS) setCurrentEnrollmentEndHS(newEnrollmentEndHS)
      if (newEnrollmentStartCollege) setCurrentEnrollmentStartCollege(newEnrollmentStartCollege)
      if (newEnrollmentEndCollege) setCurrentEnrollmentEndCollege(newEnrollmentEndCollege)
      setShowAcademicYearModal(false)
    } else {
      toastError(data.error || 'Failed to update settings.', { autoClose: 8000 })
    }
  } catch (error) {
    toastError('Network error occurred while updating settings.', { autoClose: 7000 })
  } finally {
    setUpdatingAY(false)
  }
}


