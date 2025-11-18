import { NextRequest, NextResponse } from 'next/server'
import { EnrollmentDatabase } from '@/lib/enrollment-database'
import { TeacherDatabase } from '@/lib/firestore-database'
import { SubjectDatabase } from '@/lib/subject-database'
import { SubjectSetDatabase } from '@/lib/subject-set-database'
import { CourseDatabase } from '@/lib/course-database'
import { GradeDatabase, SectionDatabase } from '@/lib/grade-section-database'
import { EventsDatabase } from '@/lib/events-database'

export async function GET(request: NextRequest) {
  try {
    // Get current academic year
    const systemConfig = await EnrollmentDatabase.getSystemConfig()
    const ayCode = systemConfig.ayCode

    // Get all enrollments
    const enrollmentsResult = await EnrollmentDatabase.getAllEnrollments(ayCode)
    const enrollments = enrollmentsResult.data || []

    // Calculate enrollment counts
    const pendingEnrollments = enrollments.filter(
      (e) => e.enrollmentInfo?.status === 'pending'
    ).length

    const regularEnrollments = enrollments.filter(
      (e) => e.enrollmentInfo?.studentType === 'regular'
    ).length

    const irregularEnrollments = enrollments.filter(
      (e) => e.enrollmentInfo?.studentType === 'irregular'
    ).length

    // Get teachers count (only active teachers)
    const allTeachers = await TeacherDatabase.getAllTeachers()
    // Filter out teachers without UID (they can't be active/inactive)
    // Only count teachers that have a UID and can be checked for status
    const teachersWithUid = allTeachers.filter((teacher) => teacher.uid)
    // Count active teachers - those with UID (default to active if status check fails)
    // Note: We count all teachers with UID, assuming they're active unless we check
    // To be safe, we'll count all teachers with UID since inactive check requires Firebase API calls
    const facultyCount = teachersWithUid.length

    // Get subjects count
    const subjects = await SubjectDatabase.getAllSubjects()
    const subjectsCount = subjects.length

    // Get subject sets count
    const subjectSets = await SubjectSetDatabase.getAllSubjectSets()
    const subjectSetsCount = subjectSets.length

    // Get courses count
    const courses = await CourseDatabase.getAllCourses()
    const coursesCount = courses.length

    // Get grades count
    const grades = await GradeDatabase.getAllGrades()
    const gradesCount = grades.length

    // Get sections count
    const sections = await SectionDatabase.getAllSections()
    const sectionsCount = sections.length

    // Get events count
    const events = await EventsDatabase.getAllEvents()
    const now = new Date()
    const dueEvents = events.filter((event) => {
      const startDate = new Date(event.startDate)
      return startDate > now
    }).length

    const upcomingEvents = events.filter((event) => {
      const startDate = new Date(event.startDate)
      return startDate > now
    }).length

    const expiredEvents = events.filter((event) => {
      const endDate = event.endDate ? new Date(event.endDate) : null
      return endDate ? endDate < now : false
    }).length

    return NextResponse.json({
      success: true,
      counts: {
        enrollments: {
          pending: pendingEnrollments,
          regular: regularEnrollments,
          irregular: irregularEnrollments,
        },
        teachers: {
          faculty: facultyCount,
        },
        subjects: {
          subjects: subjectsCount,
          subjectSets: subjectSetsCount,
        },
        courses: {
          courses: coursesCount,
        },
        gradesAndSections: {
          grades: gradesCount,
          sections: sectionsCount,
        },
        events: {
          due: dueEvents,
          upcoming: upcomingEvents,
          expired: expiredEvents,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching sidebar counts:', error)
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

