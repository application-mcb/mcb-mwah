import { ChatbotResponse } from './chatbot-handler'

// Format chatbot response into user-friendly text
export const formatChatbotResponse = (response: ChatbotResponse): string => {
  // The handler already returns formatted messages, but we can enhance them here if needed
  return response.message
}

// Format transcript data for display
export const formatTranscriptData = (transcriptData: any): string => {
  if (!transcriptData || !transcriptData.grades) {
    return 'No transcript data available.'
  }

  const metadata = transcriptData.metadata || {}
  const grades = transcriptData.grades || {}

  let formatted = `Transcript for ${metadata.studentName || 'Student'}\n`
  formatted += `Academic Year: ${transcriptData.ayCode || 'N/A'}\n`
  if (metadata.studentLevel) {
    formatted += `Level: ${metadata.studentLevel}\n`
  }
  if (metadata.studentSection) {
    formatted += `Section: ${metadata.studentSection}\n`
  }
  if (metadata.studentSemester) {
    formatted += `Semester: ${metadata.studentSemester}\n`
  }
  formatted += '\n'

  // Extract subject IDs (exclude metadata fields)
  const subjectIds = Object.keys(grades).filter(
    (key) =>
      ![
        'studentName',
        'studentSection',
        'studentLevel',
        'studentSemester',
        'createdAt',
        'updatedAt',
      ].includes(key)
  )

  if (subjectIds.length === 0) {
    return formatted + 'No grades recorded.'
  }

  formatted += 'Grades:\n'
  subjectIds.forEach((subjectId) => {
    const subjectGrade = grades[subjectId]
    const subjectName = subjectGrade.subjectName || subjectId
    const period1 = subjectGrade.period1 ?? 'N/A'
    const period2 = subjectGrade.period2 ?? 'N/A'
    const period3 = subjectGrade.period3 ?? 'N/A'
    const period4 = subjectGrade.period4 ?? 'N/A'

    formatted += `\n${subjectName}:\n`
    formatted += `  Period 1: ${period1}\n`
    formatted += `  Period 2: ${period2}\n`
    formatted += `  Period 3: ${period3}\n`
    if (period4 !== 'N/A') {
      formatted += `  Period 4: ${period4}\n`
    }
    if (subjectGrade.specialStatus) {
      formatted += `  Status: ${subjectGrade.specialStatus}\n`
    }
  })

  return formatted
}

// Format subjects list for display
export const formatSubjectsList = (subjects: any[]): string => {
  if (!subjects || subjects.length === 0) {
    return 'No subjects assigned.'
  }

  let formatted = 'Assigned Subjects:\n\n'
  subjects.forEach((subject, index) => {
    formatted += `${index + 1}. ${subject.code || 'N/A'} - ${subject.name || 'N/A'}\n`
    if (subject.description) {
      formatted += `   ${subject.description}\n`
    }
    formatted += `   Units: ${subject.totalUnits || 0} (${subject.lectureUnits || 0} lecture, ${subject.labUnits || 0} lab)\n\n`
  })

  return formatted
}

// Format guardian info for display
export const formatGuardianInfo = (guardian: any): string => {
  if (!guardian || !guardian.guardianName) {
    return 'Guardian information not available.'
  }

  let formatted = 'Guardian Information:\n\n'
  formatted += `Name: ${guardian.guardianName}\n`
  if (guardian.guardianRelationship) {
    formatted += `Relationship: ${guardian.guardianRelationship}\n`
  }
  if (guardian.guardianPhone) {
    formatted += `Phone: ${guardian.guardianPhone}\n`
  }
  if (guardian.guardianEmail) {
    formatted += `Email: ${guardian.guardianEmail}\n`
  }
  if (guardian.emergencyContact) {
    formatted += `Emergency Contact: ${guardian.emergencyContact}\n`
  }

  return formatted
}

// Format enrollment info for display
export const formatEnrollmentInfo = (enrollment: any): string => {
  if (!enrollment) {
    return 'Enrollment information not available.'
  }

  let formatted = 'Enrollment Information:\n\n'
  formatted += `Status: ${enrollment.status || 'N/A'}\n`
  formatted += `School Year: ${enrollment.schoolYear || 'N/A'}\n`

  if (enrollment.level === 'college') {
    formatted += `Course: ${enrollment.courseCode || 'N/A'} ${enrollment.courseName || ''}\n`
    formatted += `Year Level: ${enrollment.yearLevel || 'N/A'}\n`
    if (enrollment.semester) {
      const sem =
        enrollment.semester === 'first-sem'
          ? 'First Semester (Q1)'
          : enrollment.semester === 'second-sem'
          ? 'Second Semester (Q2)'
          : enrollment.semester
      formatted += `Semester: ${sem}\n`
    }
  } else {
    formatted += `Grade Level: ${enrollment.gradeLevel || 'N/A'}\n`
  }

  if (enrollment.sectionId) {
    formatted += `Section: ${enrollment.sectionId}\n`
  }
  if (enrollment.studentType) {
    formatted += `Student Type: ${enrollment.studentType}\n`
  }
  if (enrollment.orNumber) {
    formatted += `OR Number: ${enrollment.orNumber}\n`
  }
  if (enrollment.scholarship) {
    formatted += `Scholarship: ${enrollment.scholarship}\n`
  }

  return formatted
}

// Format documents info for display
export const formatDocumentsInfo = (documents: {
  submitted: any[]
  missing: string[]
}): string => {
  if (!documents) {
    return 'Document information not available.'
  }

  let formatted = 'Documents Status:\n\n'

  if (documents.missing && documents.missing.length > 0) {
    formatted += `Missing Documents (${documents.missing.length}):\n`
    documents.missing.forEach((doc) => {
      formatted += `  - ${doc}\n`
    })
    formatted += '\n'
  } else {
    formatted += 'All required documents have been submitted.\n\n'
  }

  if (documents.submitted && documents.submitted.length > 0) {
    formatted += `Submitted Documents (${documents.submitted.length}):\n`
    documents.submitted.forEach((doc: any) => {
      formatted += `  - ${doc.type || doc.fileName || 'Unknown'}\n`
    })
  }

  return formatted
}

// Format personal info for display
export const formatPersonalInfo = (personal: any, contact: any): string => {
  if (!personal) {
    return 'Personal information not available.'
  }

  let formatted = 'Personal Information:\n\n'
  formatted += `Full Name: ${personal.fullName || 'N/A'}\n`
  if (personal.dateOfBirth) {
    formatted += `Date of Birth: ${personal.dateOfBirth}\n`
  }
  if (personal.age) {
    formatted += `Age: ${personal.age}\n`
  }
  if (personal.gender) {
    formatted += `Gender: ${personal.gender}\n`
  }
  if (personal.citizenship) {
    formatted += `Citizenship: ${personal.citizenship}\n`
  }
  if (personal.religion) {
    formatted += `Religion: ${personal.religion}\n`
  }
  if (personal.placeOfBirth) {
    formatted += `Place of Birth: ${personal.placeOfBirth}\n`
  }
  if (contact) {
    if (contact.email) {
      formatted += `Email: ${contact.email}\n`
    }
    if (contact.phone) {
      formatted += `Phone: ${contact.phone}\n`
    }
  }

  return formatted
}

