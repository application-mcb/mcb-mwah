import {
  ExtendedEnrollmentData,
  StudentProfile,
  StudentDocuments,
  SubjectSetData,
  SubjectAssignmentData,
  CourseData,
  GradeData,
} from '../types'
import { SubjectData } from '@/lib/subject-database'

interface StudentContext {
  studentInfo: {
    personalInfo: any
    contactInfo: any
    enrollmentInfo: any
    guardianInfo: any
  }
  documents: {
    submitted: any[]
    missing: string[]
  }
  subjects: {
    assigned: any[]
    subjectSet: any
  }
  grades: {
    currentGrades: any
    performance: any
  }
  actions: {
    enrollmentStatus: string
    sectionAssignment: string | null
    studentType: string
    orNumber?: string
    scholarship?: string
  }
}

export const buildStudentContext = (
  enrollment: ExtendedEnrollmentData | null,
  studentProfile: StudentProfile | null,
  studentDocuments: StudentDocuments | null,
  subjects: Record<string, SubjectData>,
  subjectSets: Record<number, SubjectSetData[]>,
  subjectAssignments: SubjectAssignmentData[],
  grades: Record<string, GradeData>,
  courses: CourseData[]
): StudentContext | null => {
  if (!enrollment) return null

  const enrollmentInfo = enrollment.enrollmentInfo || {}
  const personalInfo = enrollment.personalInfo || {}
  const studentProfileData = studentProfile || ({} as Partial<StudentProfile>)

  // Build personal and contact info
  const personalInfoData = {
    fullName: `${personalInfo.firstName || ''} ${
      personalInfo.middleName || ''
    } ${personalInfo.lastName || ''} ${
      personalInfo.nameExtension || ''
    }`.trim(),
    firstName: personalInfo.firstName,
    middleName: personalInfo.middleName,
    lastName: personalInfo.lastName,
    nameExtension: personalInfo.nameExtension,
    dateOfBirth:
      personalInfo.birthYear && personalInfo.birthMonth && personalInfo.birthDay
        ? `${personalInfo.birthYear}-${String(personalInfo.birthMonth).padStart(
            2,
            '0'
          )}-${String(personalInfo.birthDay).padStart(2, '0')}`
        : null,
    age: personalInfo.birthYear
      ? new Date().getFullYear() - parseInt(personalInfo.birthYear)
      : null,
    gender: personalInfo.gender,
    civilStatus: personalInfo.civilStatus,
    citizenship: personalInfo.citizenship,
    religion: personalInfo.religion,
    placeOfBirth: personalInfo.placeOfBirth,
  }

  const contactInfoData = {
    email: (studentProfileData as StudentProfile).email || personalInfo.email,
    phone: personalInfo.phone,
    placeOfBirth: personalInfo.placeOfBirth,
  }

  const guardianInfoData = {
    guardianName: (studentProfileData as StudentProfile).guardianName,
    guardianPhone: (studentProfileData as StudentProfile).guardianPhone,
    guardianEmail: (studentProfileData as StudentProfile).guardianEmail,
    guardianRelationship: (studentProfileData as StudentProfile)
      .guardianRelationship,
    emergencyContact: (studentProfileData as StudentProfile).emergencyContact,
  }

  // Build enrollment info
  const enrollmentInfoData = {
    level: enrollmentInfo.level || 'high-school',
    gradeLevel: enrollmentInfo.gradeLevel,
    courseCode: enrollmentInfo.courseCode,
    courseName: enrollmentInfo.courseName,
    yearLevel: enrollmentInfo.yearLevel,
    semester: enrollmentInfo.semester,
    schoolYear: enrollmentInfo.schoolYear,
    enrollmentDate: enrollmentInfo.enrollmentDate,
    status: enrollmentInfo.status,
    studentType: enrollmentInfo.studentType || 'regular',
    sectionId: enrollmentInfo.sectionId,
    orNumber: enrollmentInfo.orNumber,
    scholarship: enrollmentInfo.scholarship,
    studentId:
      enrollmentInfo.studentId ||
      (studentProfileData as StudentProfile).studentId,
  }

  // Build documents info
  const documentsData = studentDocuments || {}
  const documentTypes = [
    'birthCertificate',
    'certificateOfGoodMoral',
    'form137',
    'idPicture',
    'reportCard',
  ]
  const submittedDocuments = Object.entries(documentsData).map(
    ([key, doc]) => ({
      type: key,
      fileName: doc.fileName,
      fileFormat: doc.fileFormat,
      fileSize: doc.fileSize,
      uploadDate: doc.uploadDate || doc.uploadedAt,
    })
  )
  const missingDocuments = documentTypes.filter((type) => !documentsData[type])

  // Build subjects info
  let assignedSubjects: any[] = []
  let subjectSetData: any = null

  if (enrollmentInfo.level === 'college') {
    const assignment = subjectAssignments.find(
      (a) =>
        a.level === 'college' &&
        a.courseCode === enrollmentInfo.courseCode &&
        a.yearLevel === parseInt(enrollmentInfo.yearLevel || '1') &&
        a.semester === enrollmentInfo.semester
    )

    if (assignment) {
      const subjectSet = Object.values(subjectSets)
        .flat()
        .find((set) => set.id === assignment.subjectSetId)
      if (subjectSet) {
        subjectSetData = {
          id: subjectSet.id,
          name: subjectSet.name,
          description: subjectSet.description,
          gradeLevel: subjectSet.gradeLevel,
        }
        assignedSubjects = subjectSet.subjects
          .map((subjectId) => {
            const subject = subjects[subjectId]
            if (!subject) return null
            return {
              id: subject.id,
              code: subject.code,
              name: subject.name,
              description: subject.description,
              lectureUnits: subject.lectureUnits || 0,
              labUnits: subject.labUnits || 0,
              totalUnits: (subject.lectureUnits || 0) + (subject.labUnits || 0),
            }
          })
          .filter(Boolean)
      }
    }
  } else {
    const gradeLevel = enrollmentInfo.gradeLevel
    if (gradeLevel) {
      const assignment = subjectAssignments.find(
        (a) =>
          a.level === 'high-school' && a.gradeLevel === parseInt(gradeLevel)
      )

      if (assignment) {
        const subjectSet = Object.values(subjectSets)
          .flat()
          .find((set) => set.id === assignment.subjectSetId)
        if (subjectSet) {
          subjectSetData = {
            id: subjectSet.id,
            name: subjectSet.name,
            description: subjectSet.description,
            gradeLevel: subjectSet.gradeLevel,
          }
          assignedSubjects = subjectSet.subjects
            .map((subjectId) => {
              const subject = subjects[subjectId]
              if (!subject) return null
              return {
                id: subject.id,
                code: subject.code,
                name: subject.name,
                description: subject.description,
                lectureUnits: subject.lectureUnits || 0,
                labUnits: subject.labUnits || 0,
                totalUnits:
                  (subject.lectureUnits || 0) + (subject.labUnits || 0),
              }
            })
            .filter(Boolean)
        }
      }
    }
  }

  // Build grades info (simplified - actual grades would need to be fetched)
  const gradesData = {
    currentGrades: null,
    performance: null,
    hasGrades: false,
    note: 'Grade data is available in the Grades tab but requires separate API call. Transcript functionality is available via AI.',
  }

  // Build actions info
  const actionsData = {
    enrollmentStatus: enrollmentInfo.status || 'unknown',
    sectionAssignment: enrollmentInfo.sectionId || null,
    studentType: enrollmentInfo.studentType || 'regular',
    orNumber: enrollmentInfo.orNumber,
    scholarship: enrollmentInfo.scholarship,
  }

  return {
    studentInfo: {
      personalInfo: personalInfoData,
      contactInfo: contactInfoData,
      enrollmentInfo: enrollmentInfoData,
      guardianInfo: guardianInfoData,
    },
    documents: {
      submitted: submittedDocuments,
      missing: missingDocuments,
    },
    subjects: {
      assigned: assignedSubjects,
      subjectSet: subjectSetData,
    },
    grades: gradesData,
    actions: actionsData,
  }
}
