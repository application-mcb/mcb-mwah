import { NextRequest, NextResponse } from 'next/server'
import { handleChatbotMessage } from '@/components/student-management/utils/chatbot-handler'
import {
  ExtendedEnrollmentData,
  StudentProfile,
  StudentDocuments,
  SubjectSetData,
  SubjectAssignmentData,
  CourseData,
  GradeData,
} from '@/components/student-management/types'
import { SubjectData } from '@/lib/subject-database'

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json()
    const { message, studentContext, userId, lastAIMessage } = requestBody

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (!studentContext) {
      return NextResponse.json(
        { error: 'Student context is required' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Student userId is required' },
        { status: 400 }
      )
    }

    // Reconstruct enrollment data from studentContext
    const enrollment: ExtendedEnrollmentData = {
      id: '', // Will be set if available
      userId: userId,
      personalInfo: {
        firstName: studentContext.studentInfo?.personalInfo?.firstName,
        middleName: studentContext.studentInfo?.personalInfo?.middleName,
        lastName: studentContext.studentInfo?.personalInfo?.lastName,
        nameExtension: studentContext.studentInfo?.personalInfo?.nameExtension,
        email: studentContext.studentInfo?.contactInfo?.email,
        phone: studentContext.studentInfo?.contactInfo?.phone,
        birthYear: studentContext.studentInfo?.personalInfo?.dateOfBirth
          ? studentContext.studentInfo.personalInfo.dateOfBirth.split('-')[0]
          : undefined,
        birthMonth: studentContext.studentInfo?.personalInfo?.dateOfBirth
          ? studentContext.studentInfo.personalInfo.dateOfBirth.split('-')[1]
          : undefined,
        birthDay: studentContext.studentInfo?.personalInfo?.dateOfBirth
          ? studentContext.studentInfo.personalInfo.dateOfBirth.split('-')[2]
          : undefined,
        gender: studentContext.studentInfo?.personalInfo?.gender,
        citizenship: studentContext.studentInfo?.personalInfo?.citizenship,
        religion: studentContext.studentInfo?.personalInfo?.religion,
        placeOfBirth: studentContext.studentInfo?.personalInfo?.placeOfBirth,
      },
      enrollmentInfo: studentContext.studentInfo?.enrollmentInfo || {},
      submittedAt: new Date().toISOString(),
    } as ExtendedEnrollmentData

    // Reconstruct student profile
    const studentProfile: StudentProfile | null = studentContext.studentInfo
      ? {
          userId: userId,
          email: studentContext.studentInfo.contactInfo?.email,
          studentId: studentContext.studentInfo.enrollmentInfo?.studentId,
          guardianName: studentContext.studentInfo.guardianInfo?.guardianName,
          guardianPhone: studentContext.studentInfo.guardianInfo?.guardianPhone,
          guardianEmail: studentContext.studentInfo.guardianInfo?.guardianEmail,
          guardianRelationship:
            studentContext.studentInfo.guardianInfo?.guardianRelationship,
          emergencyContact:
            studentContext.studentInfo.guardianInfo?.emergencyContact,
        }
      : null

    // Reconstruct student documents
    const studentDocuments: StudentDocuments | null = studentContext.documents
      ? Object.fromEntries(
          (studentContext.documents.submitted || []).map((doc: any) => [
            doc.type,
            {
              fileFormat: doc.fileFormat || '',
              fileName: doc.fileName || '',
              fileSize: doc.fileSize || 0,
              fileType: doc.fileType || '',
              fileUrl: doc.fileUrl || '',
              uploadDate: doc.uploadDate || '',
              uploadedAt: doc.uploadDate || '',
            },
          ])
        )
      : null

    // Reconstruct subjects map from studentContext
    const subjects: Record<string, SubjectData> = {}
    if (studentContext.subjects?.assigned) {
      studentContext.subjects.assigned.forEach((subj: any) => {
        if (subj.id) {
          subjects[subj.id] = {
            id: subj.id,
            code: subj.code || '',
            name: subj.name || '',
            description: subj.description || '',
            lectureUnits: subj.lectureUnits || 0,
            labUnits: subj.labUnits || 0,
          } as SubjectData
        }
      })
    }

    // Reconstruct subject sets
    const subjectSets: Record<number, SubjectSetData[]> = {}
    if (studentContext.subjects?.subjectSet) {
      const gradeLevel = studentContext.subjects.subjectSet.gradeLevel
      if (gradeLevel) {
        subjectSets[gradeLevel] = [
          {
            id: studentContext.subjects.subjectSet.id || '',
            name: studentContext.subjects.subjectSet.name || '',
            description: studentContext.subjects.subjectSet.description || '',
            subjects: studentContext.subjects.assigned?.map((s: any) => s.id) || [],
            gradeLevel: gradeLevel,
            color: '',
            createdAt: '',
            updatedAt: '',
            createdBy: '',
          },
        ]
      }
    }

    // Subject assignments, grades, and courses are not in studentContext
    // They will be empty, but the handler has fallbacks
    const subjectAssignments: SubjectAssignmentData[] = []
    const grades: Record<string, GradeData> = {}
    const courses: CourseData[] = []

    // Get base URL for API calls
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`

    // Call the chatbot handler
    const response = await handleChatbotMessage(
      message,
      enrollment,
      studentProfile,
      studentDocuments,
      subjects,
      subjectSets,
      subjectAssignments,
      grades,
      courses,
      baseUrl,
      lastAIMessage
    )

    // Format response for the frontend
    const responseData: any = {
      response: response.message,
      intent: response.intent,
    }

    // Include transcript data if available
    if (response.transcript) {
      responseData.transcript = response.transcript
    }

    // Include action if available
    if (response.action) {
      responseData.action = response.action
    }

    // Include data if available
    if (response.data) {
      responseData.data = response.data
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Chatbot API Error:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to process request'

    return NextResponse.json(
      {
        error: 'Failed to process chatbot request',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
