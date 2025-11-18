// Server-side only - Firestore database operations for events
// This file should only be imported in API routes or server-side code

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
  query,
  orderBy,
  where,
  limit,
} from 'firebase/firestore'
import { db } from './firebase-server'
import { EventData, EVENT_COLORS, EventLevel } from './types/events'
import { logger } from './logger'

// Utility function to serialize Firestore data for client components
function serializeFirestoreData(data: any): any {
  if (data === null || data === undefined) {
    return data
  }

  if (data instanceof Timestamp) {
    return data.toDate().toISOString()
  }

  if (Array.isArray(data)) {
    return data.map(serializeFirestoreData)
  }

  if (typeof data === 'object') {
    const serialized: any = {}
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeFirestoreData(value)
    }
    return serialized
  }

  return data
}

// Input type for creating events (allows FieldValue for timestamps)
export interface CreateEventData extends Omit<EventData, 'id' | 'createdAt' | 'updatedAt'> {
  createdAt: any // Can be FieldValue or Date
  updatedAt: any // Can be FieldValue or Date
}

// Firestore database class for events
export class EventsDatabase {
  private static collectionName = 'events'

  // Generate event ID
  private static generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Create a new event document
  static async createEvent(eventData: CreateEventData): Promise<EventData> {
    try {
      // Validate color
      if (!EVENT_COLORS.includes(eventData.color)) {
        throw new Error(
          `Invalid event color. Must be one of: ${EVENT_COLORS.join(', ')}`
        )
      }

      // Validate dates
      const startDate = eventData.startDate instanceof Date
        ? eventData.startDate
        : new Date(eventData.startDate)
      
      // End date is optional - if not provided, use start date
      let endDate: Date
      if (eventData.endDate === null || eventData.endDate === undefined) {
        endDate = new Date(startDate)
      } else {
        endDate = eventData.endDate instanceof Date
          ? eventData.endDate
          : new Date(eventData.endDate)
      }

      if (startDate > endDate) {
        throw new Error('Start date must be before or equal to end date')
      }

      // Validate visibleAudience
      if (!Array.isArray(eventData.visibleAudience) || eventData.visibleAudience.length === 0) {
        throw new Error('visibleAudience must be a non-empty array')
      }

      const eventId = this.generateEventId()
      const eventRef = doc(collection(db, this.collectionName), eventId)

      const event: any = {
        ...eventData,
        title: eventData.title.trim(),
        description: eventData.description.trim(),
        startDate: Timestamp.fromDate(startDate),
        endDate: Timestamp.fromDate(endDate),
        visibleAudience: eventData.visibleAudience,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await setDoc(eventRef, event)

      // Return the serialized event data
      const createdEvent = await this.getEvent(eventId)
      return createdEvent!
    } catch (error) {
      logger.error('Error creating event:', error)
      throw error instanceof Error ? error : new Error('Failed to create event')
    }
  }

  // Get event by ID
  static async getEvent(eventId: string): Promise<EventData | null> {
    try {
      const eventRef = doc(db, this.collectionName, eventId)
      const eventSnap = await getDoc(eventRef)

      if (eventSnap.exists()) {
        const data = eventSnap.data()
        return serializeFirestoreData({ ...data, id: eventSnap.id }) as EventData
      }
      return null
    } catch (error) {
      logger.error('Error getting event:', error)
      throw new Error('Failed to get event data')
    }
  }

  // Get all events
  static async getAllEvents(limitCount: number = 500): Promise<EventData[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('startDate', 'desc'),
        limit(limitCount)
      )
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return serializeFirestoreData({ ...data, id: doc.id }) as EventData
      })
    } catch (error) {
      logger.error('Error getting all events:', error)
      throw new Error('Failed to get all events')
    }
  }

  // Get events filtered by audience (level)
  static async getEventsByAudience(
    level: EventLevel | string,
    limitCount: number = 500
  ): Promise<EventData[]> {
    try {
      const allEvents = await this.getAllEvents(limitCount)
      const now = new Date()

      return allEvents.filter((event) => {
        // Check if event is visible to this level
        const isVisible = event.visibleAudience.includes(level as EventLevel)

        // Check if event is currently active (between startDate and endDate)
        const startDate = new Date(event.startDate)
        // If endDate is null, treat it as a single-day event (endDate = startDate)
        const endDate = event.endDate ? new Date(event.endDate) : new Date(startDate)
        const isActive = now >= startDate && now <= endDate

        return isVisible && isActive
      })
    } catch (error) {
      logger.error('Error getting events by audience:', error)
      throw new Error('Failed to get events by audience')
    }
  }

  // Get upcoming events (future events)
  static async getUpcomingEvents(limitCount: number = 500): Promise<EventData[]> {
    try {
      const allEvents = await this.getAllEvents(limitCount)
      const now = new Date()

      return allEvents.filter((event) => {
        const startDate = new Date(event.startDate)
        return startDate > now
      })
    } catch (error) {
      logger.error('Error getting upcoming events:', error)
      throw new Error('Failed to get upcoming events')
    }
  }

  // Get past events
  static async getPastEvents(limitCount: number = 500): Promise<EventData[]> {
    try {
      const allEvents = await this.getAllEvents(limitCount)
      const now = new Date()

      return allEvents.filter((event) => {
        // If endDate is null, use startDate for comparison
        const endDate = event.endDate ? new Date(event.endDate) : new Date(event.startDate)
        return endDate < now
      })
    } catch (error) {
      logger.error('Error getting past events:', error)
      throw new Error('Failed to get past events')
    }
  }

  // Get upcoming events filtered by audience (level)
  static async getUpcomingEventsByAudience(
    level: EventLevel | string,
    limitCount: number = 500
  ): Promise<EventData[]> {
    try {
      const allEvents = await this.getAllEvents(limitCount)
      const now = new Date()

      return allEvents.filter((event) => {
        // Check if event is visible to this level
        const isVisible = event.visibleAudience.includes(level as EventLevel)

        // Check if event is upcoming (startDate is in the future)
        const startDate = new Date(event.startDate)
        const isUpcoming = startDate > now

        return isVisible && isUpcoming
      })
    } catch (error) {
      logger.error('Error getting upcoming events by audience:', error)
      throw new Error('Failed to get upcoming events by audience')
    }
  }

  // Get past events filtered by audience (level)
  static async getPastEventsByAudience(
    level: EventLevel | string,
    limitCount: number = 500
  ): Promise<EventData[]> {
    try {
      const allEvents = await this.getAllEvents(limitCount)
      const now = new Date()

      return allEvents.filter((event) => {
        // Check if event is visible to this level
        const isVisible = event.visibleAudience.includes(level as EventLevel)

        // Check if event is past (endDate is before now)
        // If endDate is null, use startDate for comparison
        const endDate = event.endDate ? new Date(event.endDate) : new Date(event.startDate)
        const isPast = endDate < now

        return isVisible && isPast
      })
    } catch (error) {
      logger.error('Error getting past events by audience:', error)
      throw new Error('Failed to get past events by audience')
    }
  }

  // Update event
  static async updateEvent(
    eventId: string,
    updateData: Partial<CreateEventData>
  ): Promise<EventData | null> {
    try {
      // Validate color if provided
      if (updateData.color && !EVENT_COLORS.includes(updateData.color)) {
        throw new Error(
          `Invalid event color. Must be one of: ${EVENT_COLORS.join(', ')}`
        )
      }

      const eventRef = doc(db, this.collectionName, eventId)

      const updatePayload: any = {
        ...(updateData.title && { title: updateData.title.trim() }),
        ...(updateData.description && { description: updateData.description.trim() }),
        ...(updateData.color && { color: updateData.color }),
        ...(updateData.icon && { icon: updateData.icon }),
        ...(updateData.visibleAudience && { visibleAudience: updateData.visibleAudience }),
        updatedAt: serverTimestamp(),
      }

      // Handle date updates
      if (updateData.startDate) {
        const startDate =
          updateData.startDate instanceof Date
            ? updateData.startDate
            : new Date(updateData.startDate)
        updatePayload.startDate = Timestamp.fromDate(startDate)
      }

      // Handle endDate update - can be null to remove it
      if (updateData.endDate !== undefined) {
        if (updateData.endDate === null) {
          // Setting endDate to null - use startDate as endDate
          const startDate = updatePayload.startDate 
            ? (updatePayload.startDate instanceof Timestamp
                ? updatePayload.startDate.toDate()
                : new Date(updatePayload.startDate))
            : (await getDoc(eventRef)).data()?.startDate instanceof Timestamp
              ? (await getDoc(eventRef)).data()?.startDate.toDate()
              : new Date((await getDoc(eventRef)).data()?.startDate)
          updatePayload.endDate = Timestamp.fromDate(startDate)
        } else {
          const endDate =
            updateData.endDate instanceof Date
              ? updateData.endDate
              : new Date(updateData.endDate)
          updatePayload.endDate = Timestamp.fromDate(endDate)
        }
      }

      // Validate dates if both are being updated
      if (updatePayload.startDate && updatePayload.endDate) {
        const startDate = updatePayload.startDate instanceof Timestamp
          ? updatePayload.startDate.toDate()
          : new Date(updatePayload.startDate)
        const endDate = updatePayload.endDate instanceof Timestamp
          ? updatePayload.endDate.toDate()
          : new Date(updatePayload.endDate)

        if (startDate > endDate) {
          throw new Error('Start date must be before or equal to end date')
        }
      }

      await updateDoc(eventRef, updatePayload)

      // Return updated event data
      const updatedEvent = await this.getEvent(eventId)
      return updatedEvent
    } catch (error) {
      logger.error('Error updating event:', error)
      throw error instanceof Error ? error : new Error('Failed to update event')
    }
  }

  // Delete event
  static async deleteEvent(eventId: string): Promise<boolean> {
    try {
      const eventRef = doc(db, this.collectionName, eventId)
      await deleteDoc(eventRef)
      return true
    } catch (error) {
      logger.error('Error deleting event:', error)
      throw new Error('Failed to delete event')
    }
  }

  // Check if event exists
  static async eventExists(eventId: string): Promise<boolean> {
    try {
      const event = await this.getEvent(eventId)
      return event !== null
    } catch (error) {
      logger.error('Error checking if event exists:', error)
      return false
    }
  }
}

