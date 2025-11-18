// Shared types for events - can be safely imported by both client and server code

// Available event colors (at least 8 colors)
export const EVENT_COLORS = [
  'blue-900',
  'blue-800',
  'red-800',
  'emerald-800',
  'yellow-800',
  'orange-800',
  'violet-800',
  'purple-800',
] as const

export type EventColor = (typeof EVENT_COLORS)[number]

// Available levels for audience targeting
export const EVENT_LEVELS = [
  'junior-high-school',
  'senior-high-school',
  'college',
] as const

export type EventLevel = (typeof EVENT_LEVELS)[number]

export interface EventData {
  id: string
  title: string
  description: string
  startDate: string // ISO string (serialized from Firestore timestamp)
  endDate: string | null // ISO string (serialized from Firestore timestamp) - optional
  color: EventColor
  icon: string // Phosphor icon name
  visibleAudience: EventLevel[] // Array of levels (JHS, SHS, College)
  createdAt: string // ISO string (serialized from Firestore timestamp)
  updatedAt: string // ISO string (serialized from Firestore timestamp)
  createdBy: string // UID of the registrar who created it
}

export interface CreateEventData {
  title: string
  description: string
  startDate: Date
  endDate: Date | null // Optional - if not provided, defaults to startDate
  color: EventColor
  icon: string
  visibleAudience: EventLevel[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

