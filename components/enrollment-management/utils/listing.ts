import { formatFullName } from '../utils/format'
import { getDateRange, getDateTimestamp } from '../utils/date'

export function computeFilteredAndSortedEnrollments({
  enrollments,
  currentAYFilter,
  currentSemesterFilter,
  currentStudentTypeFilter,
  debouncedSearchQuery,
  sortOption,
}: any) {
  let filtered = enrollments.filter((enrollment: any) => {
    if (!currentAYFilter) return true
    const enrollmentAY = enrollment.enrollmentInfo?.schoolYear
    return enrollmentAY === currentAYFilter
  })

  filtered = filtered.filter((enrollment: any) => {
    const isCollege = enrollment.enrollmentInfo?.level === 'college'
    if (!isCollege) return true
    if (!currentSemesterFilter) return true
    const filterSemesterValue =
      currentSemesterFilter === '1'
        ? 'first-sem'
        : currentSemesterFilter === '2'
        ? 'second-sem'
        : null
    const enrollmentSemester = enrollment.enrollmentInfo?.semester
    return enrollmentSemester === filterSemesterValue
  })

  // Filter by student type (multiple selection allowed)
  if (currentStudentTypeFilter && currentStudentTypeFilter.length > 0) {
    filtered = filtered.filter((enrollment: any) => {
      const studentType = enrollment.enrollmentInfo?.studentType || 'regular'
      return currentStudentTypeFilter.includes(studentType as 'regular' | 'irregular')
    })
  }

  filtered = filtered.filter(
    (enrollment: any) => enrollment.enrollmentInfo?.status !== 'enrolled'
  )

  if (sortOption === 'last-3-days') {
    const threeDaysAgo = getDateRange(3)
    filtered = filtered.filter(
      (enrollment: any) =>
        enrollment.submittedAt &&
        getDateTimestamp(enrollment.submittedAt) >= threeDaysAgo.getTime()
    )
  } else if (sortOption === 'last-7-days') {
    const sevenDaysAgo = getDateRange(7)
    filtered = filtered.filter(
      (enrollment: any) =>
        enrollment.submittedAt &&
        getDateTimestamp(enrollment.submittedAt) >= sevenDaysAgo.getTime()
    )
  }

  if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
    const query = debouncedSearchQuery.toLowerCase()
    filtered = filtered.filter((enrollment: any) => {
      const fullName = formatFullName(
        enrollment.personalInfo?.firstName,
        enrollment.personalInfo?.middleName,
        enrollment.personalInfo?.lastName,
        enrollment.personalInfo?.nameExtension
      ).toLowerCase()
      const email = String(enrollment.personalInfo?.email || '').toLowerCase()
      const gradeLevel = String(
        enrollment.enrollmentInfo?.gradeLevel || ''
      ).toLowerCase()
      const status = String(
        enrollment.enrollmentInfo?.status || ''
      ).toLowerCase()
      return (
        fullName.includes(query) ||
        email.includes(query) ||
        gradeLevel.includes(query) ||
        status.includes(query)
      )
    })
  }

  const sorted = [...filtered].sort((a, b) => {
    switch (sortOption) {
      case 'a-z': {
        const nameA = formatFullName(
          a.personalInfo?.firstName,
          a.personalInfo?.middleName,
          a.personalInfo?.lastName,
          a.personalInfo?.nameExtension
        ).toLowerCase()
        const nameB = formatFullName(
          b.personalInfo?.firstName,
          b.personalInfo?.middleName,
          b.personalInfo?.lastName,
          b.personalInfo?.nameExtension
        ).toLowerCase()
        return nameA.localeCompare(nameB)
      }
      case 'z-a': {
        const nameA = formatFullName(
          a.personalInfo?.firstName,
          a.personalInfo?.middleName,
          a.personalInfo?.lastName,
          a.personalInfo?.nameExtension
        ).toLowerCase()
        const nameB = formatFullName(
          b.personalInfo?.firstName,
          b.personalInfo?.middleName,
          b.personalInfo?.lastName,
          b.personalInfo?.nameExtension
        ).toLowerCase()
        return nameB.localeCompare(nameA)
      }
      case 'latest': {
        const dateA = getDateTimestamp(a.submittedAt)
        const dateB = getDateTimestamp(b.submittedAt)
        return dateB - dateA
      }
      case 'oldest': {
        const dateA = getDateTimestamp(a.submittedAt)
        const dateB = getDateTimestamp(b.submittedAt)
        return dateA - dateB
      }
      default:
        return 0
    }
  })

  return sorted
}


