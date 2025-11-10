import { SubjectData } from '@/lib/subject-database'

export const fetchSubjectSets = async () => {
  const response = await fetch('/api/subject-sets')
  const data = await response.json()
  if (!response.ok || !data.subjectSets) throw new Error('Failed to load subject sets')
  const allSubjectSets = data.subjectSets as Array<{
    id: string
    name: string
    description: string
    subjects: string[]
    gradeLevel?: number
    gradeLevels?: number[]
    color: string
  }>
  const subjectSetsByGrade: Record<number, typeof allSubjectSets> = {}
  allSubjectSets.forEach((subjectSet) => {
    if (subjectSet.gradeLevels && subjectSet.gradeLevels.length > 0) {
      subjectSet.gradeLevels.forEach((gradeLevel) => {
        if (!subjectSetsByGrade[gradeLevel]) subjectSetsByGrade[gradeLevel] = []
        subjectSetsByGrade[gradeLevel].push(subjectSet as any)
      })
    } else if (subjectSet.gradeLevel) {
      const gradeLevel = subjectSet.gradeLevel
      if (!subjectSetsByGrade[gradeLevel]) subjectSetsByGrade[gradeLevel] = []
      subjectSetsByGrade[gradeLevel].push(subjectSet as any)
    }
  })
  return { allSubjectSets, subjectSetsByGrade }
}

export const fetchSubjects = async () => {
  const response = await fetch('/api/subjects')
  const data = await response.json()
  if (!response.ok || !data.subjects) throw new Error('Failed to load subjects')
  const subjectsMap: Record<string, SubjectData> = {}
  ;(data.subjects as SubjectData[]).forEach((subject) => {
    subjectsMap[subject.id] = subject
  })
  return subjectsMap
}

export const fetchGrades = async () => {
  const response = await fetch('/api/grades')
  const data = await response.json()
  if (!response.ok || !data.grades) throw new Error('Failed to load grades')
  const gradesMap: Record<string, { color: string }> = {}
  ;(data.grades as any[]).forEach((grade) => {
    gradesMap[grade.id] = { color: grade.color }
  })
  return gradesMap
}

export const fetchCourses = async () => {
  const response = await fetch('/api/courses')
  const data = await response.json()
  if (!response.ok || !data.courses) throw new Error('Failed to load courses')
  const coursesMap: Record<string, { color: string }> = {}
  ;(data.courses as any[]).forEach((course) => {
    coursesMap[course.code] = { color: course.color }
  })
  return coursesMap
}

export const fetchSubjectAssignments = async () => {
  const response = await fetch('/api/subject-assignments')
  const data = await response.json()
  if (!response.ok || !data.subjectAssignments)
    throw new Error('Failed to load subject assignments')
  return data.subjectAssignments as any[]
}

export const fetchProfilesForEnrollments = async (
  enrollmentData: Array<{ userId: string }>
) => {
  const profiles: Record<string, any> = {}
  if (enrollmentData.length === 0) return profiles
  const userIds = enrollmentData.map((e) => e.userId)
  const chunkSize = 50
  const chunks: string[][] = []
  for (let i = 0; i < userIds.length; i += chunkSize) {
    chunks.push(userIds.slice(i, i + chunkSize))
  }
  const batchPromises = chunks.map(async (chunk) => {
    try {
      const chunkUserIds = chunk.join(',')
      const batchResponse = await fetch(`/api/user/profile?uids=${chunkUserIds}`)
      const batchData = await batchResponse.json()
      if (batchResponse.ok && batchData.success && batchData.users) {
        return batchData.users
      }
      return []
    } catch {
      return []
    }
  })
  const allUsers = await Promise.all(batchPromises)
  allUsers.flat().forEach((user: any) => {
    if (user && user.uid) {
      profiles[user.uid] = {
        userId: user.uid,
        photoURL: user.photoURL,
        email: user.email,
        studentId: user.studentId,
        guardianName: user.guardianName,
        guardianPhone: user.guardianPhone,
        guardianEmail: user.guardianEmail,
        guardianRelationship: user.guardianRelationship,
        emergencyContact: user.emergencyContact,
      }
    }
  })
  return profiles
}

export const fetchDocumentsForEnrollments = async (
  enrollmentData: Array<{ userId: string }>
) => {
  const documents: Record<string, any> = {}
  if (enrollmentData.length === 0) return documents
  const userIds = enrollmentData.map((e) => e.userId)
  const chunkSize = 50
  const chunks: string[][] = []
  for (let i = 0; i < userIds.length; i += chunkSize) {
    chunks.push(userIds.slice(i, i + chunkSize))
  }
  const batchPromises = chunks.map(async (chunk) => {
    try {
      const chunkUserIds = chunk.join(',')
      const batchResponse = await fetch(`/api/user/profile?uids=${chunkUserIds}`)
      const batchData = await batchResponse.json()
      if (batchResponse.ok && batchData.success && batchData.users) {
        return batchData.users
      }
      return []
    } catch {
      return []
    }
  })
  const allUsers = await Promise.all(batchPromises)
  allUsers.flat().forEach((user: any) => {
    if (user && user.uid && user.documents) {
      documents[user.uid] = user.documents
    }
  })
  return documents
}


