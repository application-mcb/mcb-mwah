import { NextRequest, NextResponse } from 'next/server'
import { CourseDatabase, CreateCourseData } from '@/lib/course-database'
import { RegistrarDatabase } from '@/lib/registrar-database'
import { sanitizeInput } from '@/lib/sanitization'
import { defaultRateLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'
import { AuditLogDatabase } from '@/lib/audit-log-database'

// GET /api/courses - Get all courses or search by query
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await defaultRateLimiter.check(request)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    let courses

    if (search) {
      // Search courses by name, code, or description
      courses = await CourseDatabase.searchCourses(sanitizeInput(search))
    } else {
      // Get all courses
      courses = await CourseDatabase.getAllCourses()
    }

    logger.info('Courses fetched successfully', {
      count: courses.length,
      search,
    })
    return NextResponse.json({ courses })
  } catch (error) {
    logger.error('Error fetching courses', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch courses'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// POST /api/courses - Create a new course
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await defaultRateLimiter.check(request)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    const { code, name, description, color, registrarUid } =
      await request.json()

    // Validate required fields
    if (!code || !name || !description || !color || !registrarUid) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: code, name, description, color, registrarUid',
        },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedCode = sanitizeInput(code).toUpperCase()
    const sanitizedName = sanitizeInput(name)
    const sanitizedDescription = sanitizeInput(description)

    // Validate course code format (should be alphanumeric, typically 3-10 characters)
    if (!/^[A-Z0-9]{2,10}$/.test(sanitizedCode)) {
      return NextResponse.json(
        {
          error:
            'Invalid course code format. Must be 2-10 alphanumeric characters.',
        },
        { status: 400 }
      )
    }

    // Check if course code already exists
    const courseExists = await CourseDatabase.courseExists(sanitizedCode)
    if (courseExists) {
      return NextResponse.json(
        { error: 'Course code already exists' },
        { status: 409 }
      )
    }

    // Verify registrar role in database
    const hasRegistrarRole = await RegistrarDatabase.hasRegistrarRole(
      registrarUid
    )
    if (!hasRegistrarRole) {
      return NextResponse.json(
        { error: 'User does not have registrar privileges' },
        { status: 403 }
      )
    }

    const courseData: CreateCourseData = {
      code: sanitizedCode,
      name: sanitizedName,
      description: sanitizedDescription,
      color: color,
      createdBy: registrarUid,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const course = await CourseDatabase.createCourse(courseData)

    logger.info('Course created successfully', {
      code: course.code,
      createdBy: registrarUid,
    })

    try {
      await AuditLogDatabase.createLog({
        action: 'Created course',
        category: 'course',
        status: 'success',
        context: `${course.code} • ${course.name}`,
        actorId: registrarUid,
        actorName: 'Registrar',
        actorEmail: '',
        actorRole: 'registrar',
        metadata: {
          color: course.color,
          description: course.description,
        },
      })
    } catch (logError) {
      console.warn('Audit log write failed (course create):', logError)
    }

    return NextResponse.json(
      {
        course,
        message: 'Course created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Error creating course', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create course'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
