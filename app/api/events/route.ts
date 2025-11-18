import { NextRequest, NextResponse } from 'next/server'
import { EventsDatabase, CreateEventData } from '@/lib/events-database'
import { RegistrarDatabase } from '@/lib/registrar-database'
import { sanitizeInput } from '@/lib/sanitization'
import { defaultRateLimiter } from '@/lib/rate-limiter'
import { logger } from '@/lib/logger'

// GET /api/events - Get events (filtered by student level if student, or all if registrar)
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await defaultRateLimiter.check(request)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level')
    const type = searchParams.get('type') // 'all', 'upcoming', 'past', 'active'

    let events

    if (level) {
      // Student view - filter by level
      if (type === 'past') {
        events = await EventsDatabase.getPastEventsByAudience(level)
      } else if (type === 'upcoming') {
        events = await EventsDatabase.getUpcomingEventsByAudience(level)
      } else {
        // Default: active events
        events = await EventsDatabase.getEventsByAudience(level)
      }
    } else {
      // Registrar view - get all events
      if (type === 'upcoming') {
        events = await EventsDatabase.getUpcomingEvents()
      } else if (type === 'past') {
        events = await EventsDatabase.getPastEvents()
      } else {
        events = await EventsDatabase.getAllEvents()
      }
    }

    logger.info('Events fetched successfully', {
      count: events.length,
      level,
      type,
    })
    return NextResponse.json({ success: true, events })
  } catch (error) {
    logger.error('Error fetching events', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch events'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// POST /api/events - Create a new event (registrar only)
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await defaultRateLimiter.check(request)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    const {
      title,
      description,
      startDate,
      endDate,
      color,
      icon,
      visibleAudience,
      registrarUid,
    } = await request.json()

    // Validate required fields
    if (
      !title ||
      !description ||
      !startDate ||
      !color ||
      !icon ||
      !visibleAudience ||
      !registrarUid
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: title, description, startDate, color, icon, visibleAudience, registrarUid',
        },
        { status: 400 }
      )
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeInput(title)
    const sanitizedDescription = sanitizeInput(description)

    // Validate start date
    const start = new Date(startDate)
    if (isNaN(start.getTime())) {
      return NextResponse.json(
        { error: 'Invalid start date format' },
        { status: 400 }
      )
    }

    // End date is optional - if provided, validate it
    let end: Date | null = null
    if (endDate) {
      end = new Date(endDate)
      if (isNaN(end.getTime())) {
        return NextResponse.json(
          { error: 'Invalid end date format' },
          { status: 400 }
        )
      }
      if (start >= end) {
        return NextResponse.json(
          { error: 'Start date must be before end date' },
          { status: 400 }
        )
      }
    } else {
      // If no end date provided, set it to the same as start date
      end = new Date(start)
    }

    // Validate visibleAudience
    if (
      !Array.isArray(visibleAudience) ||
      visibleAudience.length === 0
    ) {
      return NextResponse.json(
        { error: 'visibleAudience must be a non-empty array' },
        { status: 400 }
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

    const eventData: CreateEventData = {
      title: sanitizedTitle,
      description: sanitizedDescription,
      startDate: start,
      endDate: end,
      color: color,
      icon: icon,
      visibleAudience: visibleAudience,
      createdBy: registrarUid,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const event = await EventsDatabase.createEvent(eventData)

    logger.info('Event created successfully', {
      id: event.id,
      createdBy: registrarUid,
    })
    return NextResponse.json(
      {
        success: true,
        event,
        message: 'Event created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Error creating event', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create event'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// PUT /api/events - Update an event (registrar only)
export async function PUT(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await defaultRateLimiter.check(request)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    const {
      id,
      title,
      description,
      startDate,
      endDate,
      color,
      icon,
      visibleAudience,
      registrarUid,
    } = await request.json()

    // Validate required fields
    if (!id || !registrarUid) {
      return NextResponse.json(
        { error: 'Missing required fields: id, registrarUid' },
        { status: 400 }
      )
    }

    // Verify registrar role
    const hasRegistrarRole = await RegistrarDatabase.hasRegistrarRole(
      registrarUid
    )
    if (!hasRegistrarRole) {
      return NextResponse.json(
        { error: 'User does not have registrar privileges' },
        { status: 403 }
      )
    }

    // Check if event exists
    const existingEvent = await EventsDatabase.getEvent(id)
    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Build update data
    const updateData: Partial<CreateEventData> = {}

    if (title !== undefined) {
      updateData.title = sanitizeInput(title)
    }
    if (description !== undefined) {
      updateData.description = sanitizeInput(description)
    }
    if (startDate !== undefined) {
      updateData.startDate = new Date(startDate)
    }
    if (endDate !== undefined) {
      updateData.endDate = new Date(endDate)
    }
    if (color !== undefined) {
      updateData.color = color
    }
    if (icon !== undefined) {
      updateData.icon = icon
    }
    if (visibleAudience !== undefined) {
      updateData.visibleAudience = visibleAudience
    }

    const updatedEvent = await EventsDatabase.updateEvent(id, updateData)

    logger.info('Event updated successfully', { id, updatedBy: registrarUid })
    return NextResponse.json({
      success: true,
      event: updatedEvent,
      message: 'Event updated successfully',
    })
  } catch (error) {
    logger.error('Error updating event', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to update event'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// DELETE /api/events - Delete an event (registrar only)
export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await defaultRateLimiter.check(request)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const registrarUid = searchParams.get('registrarUid')

    // Validate required fields
    if (!id || !registrarUid) {
      return NextResponse.json(
        { error: 'Missing required fields: id, registrarUid' },
        { status: 400 }
      )
    }

    // Verify registrar role
    const hasRegistrarRole = await RegistrarDatabase.hasRegistrarRole(
      registrarUid
    )
    if (!hasRegistrarRole) {
      return NextResponse.json(
        { error: 'User does not have registrar privileges' },
        { status: 403 }
      )
    }

    // Check if event exists
    const existingEvent = await EventsDatabase.getEvent(id)
    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    await EventsDatabase.deleteEvent(id)

    logger.info('Event deleted successfully', { id, deletedBy: registrarUid })
    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
    })
  } catch (error) {
    logger.error('Error deleting event', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to delete event'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

