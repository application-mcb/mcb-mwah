type Enrollment = any

export const filterByAYSemester = (
  enrollments: Enrollment[],
  opts: {
    academicYear: string
    semesterFilter: string
  }
) => {
  const { academicYear, semesterFilter } = opts
  const filterSemesterValue =
    semesterFilter === '1' ? 'first-sem' : semesterFilter === '2' ? 'second-sem' : ''
  return enrollments.filter((enrollment) => {
    const ayOk = enrollment?.enrollmentInfo?.schoolYear === academicYear
    if (!ayOk) return false
    if (!filterSemesterValue) return true
    return enrollment?.enrollmentInfo?.semester === filterSemesterValue
  })
}

export const textIncludes = (value: string, search: string) => {
  if (!search) return true
  const v = (value || '').toString().toLowerCase()
  const s = (search || '').toLowerCase()
  return v.includes(s)
}

export const applySearch = (
  enrollments: Enrollment[],
  searchText: string,
  getFullName: (e: Enrollment) => string
) => {
  if (!searchText) return enrollments
  return enrollments.filter((enr) => {
    const name = getFullName(enr) || ''
    const userId = enr.userId || ''
    return textIncludes(name, searchText) || textIncludes(userId, searchText)
  })
}

export const sortEnrollments = (
  enrollments: Enrollment[],
  sortOption: string,
  getSubmittedTs: (e: Enrollment) => number,
  getUpdatedTs: (e: Enrollment) => number,
) => {
  const sorted = [...enrollments].sort((a, b) => {
    switch (sortOption) {
      case 'a-z': {
        const an = (a.personalInfo?.lastName || '') + (a.personalInfo?.firstName || '')
        const bn = (b.personalInfo?.lastName || '') + (b.personalInfo?.firstName || '')
        return an.localeCompare(bn)
      }
      case 'z-a': {
        const an = (a.personalInfo?.lastName || '') + (a.personalInfo?.firstName || '')
        const bn = (b.personalInfo?.lastName || '') + (b.personalInfo?.firstName || '')
        return bn.localeCompare(an)
      }
      case 'oldest':
        return getSubmittedTs(a) - getSubmittedTs(b)
      case 'latest':
      default:
        return getSubmittedTs(b) - getSubmittedTs(a)
    }
  })
  return sorted
}


