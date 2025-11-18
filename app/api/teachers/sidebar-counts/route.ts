import { NextRequest, NextResponse } from 'next/server'
import { SubjectDatabase } from '@/lib/subject-database'
import { SectionDatabase } from '@/lib/grade-section-database'
import { EnrollmentDatabase } from '@/lib/enrollment-database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')

    if (!teacherId) {
      return NextResponse.json(
        { success: false, error: 'Teacher ID is required' },
        { status: 400 }
      )
    }

    // Get all subjects to find teacher assignments
    const subjects = await SubjectDatabase.getAllSubjects()

    // Get teacher assignments - subjects they teach
    const teacherAssignments: Record<string, string[]> = {}
    for (const subject of subjects) {
      if (subject.teacherAssignments) {
        const sectionIds = Object.entries(
          subject.teacherAssignments as Record<string, string[]>
        )
          .filter(
            ([_, assignedTeacherIds]) =>
              Array.isArray(assignedTeacherIds) &&
              assignedTeacherIds.includes(teacherId)
          )
          .map(([sectionId, _]) => sectionId)

        if (sectionIds.length > 0) {
          teacherAssignments[subject.id] = sectionIds
        }
      }
    }

    // Count unique subjects (classes)
    const classesCount = Object.keys(teacherAssignments).length

    // Get all sections to count students
    const allSections = await SectionDatabase.getAllSections()
    const teacherSectionIds = new Set<string>()
    
    // Collect all section IDs this teacher is assigned to
    Object.values(teacherAssignments).forEach((sectionIds) => {
      sectionIds.forEach((sectionId) => {
        teacherSectionIds.add(sectionId)
      })
    })

    // Get current academic year
    const systemConfig = await EnrollmentDatabase.getSystemConfig()
    const ayCode = systemConfig.ayCode

    // Get enrollments for current academic year
    const enrollmentsResult = await EnrollmentDatabase.getAllEnrollments(ayCode)
    const enrollments = enrollmentsResult.data || []

    // Count unique students in teacher's sections
    // Handle both high school (with sections) and college (with course/year/semester) students
    const studentSet = new Set<string>()
    
    enrollments.forEach((enrollment) => {
      const enrollmentInfo = enrollment.enrollmentInfo
      const level = enrollmentInfo?.level
      
      // High school students: match by sectionId
      if (level === 'high-school') {
        const sectionId = enrollmentInfo?.sectionId
        if (sectionId && teacherSectionIds.has(sectionId)) {
          studentSet.add(enrollment.userId)
        }
      }
      // College students: match by course code, year level, and semester
      else if (level === 'college') {
        const courseCode = enrollmentInfo?.courseCode
        const yearLevel = enrollmentInfo?.yearLevel
        const semester = enrollmentInfo?.semester
        
        if (courseCode && yearLevel && semester) {
          // Check if teacher is assigned to any subject that matches this college student
          const matchingSubject = Object.keys(teacherAssignments).find((subjectId) => {
            const subject = subjects.find((s) => s.id === subjectId)
            if (!subject) return false
            
            // Check if subject has courseSelections that match
            if (subject.courseSelections && Array.isArray(subject.courseSelections)) {
              return subject.courseSelections.some(
                (selection) =>
                  selection.code === courseCode &&
                  selection.year === yearLevel &&
                  selection.semester === semester
              )
            }
            
            // Fallback: check courseCodes (legacy support)
            if (subject.courseCodes && Array.isArray(subject.courseCodes)) {
              return subject.courseCodes.includes(courseCode)
            }
            
            return false
          })
          
          if (matchingSubject) {
            studentSet.add(enrollment.userId)
          }
        }
      }
    })

    const studentsCount = studentSet.size

    // Count sections this teacher is assigned to
    const sectionsCount = teacherSectionIds.size

    // For grades count, we'll need to check grade entries
    // For now, we'll return 0 as we need to check the grades database structure
    // This can be updated when grade entry system is available
    const gradesCount = 0

    return NextResponse.json({
      success: true,
      counts: {
        classes: {
          subjects: classesCount,
          sections: sectionsCount,
        },
        students: {
          total: studentsCount,
        },
        grades: {
          entries: gradesCount,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching teacher sidebar counts:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch counts',
      },
      { status: 500 }
    )
  }
}

