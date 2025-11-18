'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import { EventData, EventColor, EventLevel } from '@/lib/types/events'
import { Modal } from './ui/modal'
import EventsForm from './events-form'
import EventsManagementSkeleton from './events-management-skeleton'
import {
  Trash,
  X,
  Warning,
  Pencil,
  Plus,
  Calendar,
  MagnifyingGlass,
} from '@phosphor-icons/react'
import { formatDateRangeAsWords } from '@/lib/utils/date-formatter'
import * as PhosphorIcons from '@phosphor-icons/react'

interface EventsManagementProps {
  registrarUid: string
}

export default function EventsManagement({
  registrarUid,
}: EventsManagementProps) {
  const [events, setEvents] = useState<EventData[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<EventData | null>(null)
  const [countdown, setCountdown] = useState(5)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadEvents()
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (showDeleteModal && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [showDeleteModal, countdown])

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events

    const searchTerm = searchQuery.toLowerCase()
    return events.filter(
      (event) =>
        event.title.toLowerCase().includes(searchTerm) ||
        event.description.toLowerCase().includes(searchTerm)
    )
  }, [events, searchQuery])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/events')

      if (!response.ok) {
        throw new Error('Failed to load events')
      }

      const data = await response.json()
      setEvents(data.events || [])
    } catch (error: any) {
      toast.error('Failed to load events: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEvent = async (eventData: {
    title: string
    description: string
    startDate: Date
    endDate: Date | null
    color: EventColor
    icon: string
    visibleAudience: EventLevel[]
  }) => {
    try {
      setActionLoading(true)
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...eventData,
          registrarUid,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create event')
      }

      setEvents((prev) => [data.event, ...prev])
      toast.success('Event created successfully!')
      setShowCreateModal(false)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateEvent = async (eventData: {
    title: string
    description: string
    startDate: Date
    endDate: Date | null
    color: EventColor
    icon: string
    visibleAudience: EventLevel[]
  }) => {
    if (!editingEvent) return

    try {
      setActionLoading(true)
      const response = await fetch('/api/events', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingEvent.id,
          ...eventData,
          registrarUid,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update event')
      }

      setEvents((prev) =>
        prev.map((e) => (e.id === editingEvent.id ? data.event : e))
      )
      toast.success('Event updated successfully!')
      setShowEditModal(false)
      setEditingEvent(null)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteEvent = async () => {
    if (!deletingEvent || !isConfirmed) return

    try {
      setActionLoading(true)
      const response = await fetch(
        `/api/events?id=${deletingEvent.id}&registrarUid=${registrarUid}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete event')
      }

      setEvents((prev) => prev.filter((e) => e.id !== deletingEvent.id))
      toast.success('Event deleted successfully!')
      setShowDeleteModal(false)
      setDeletingEvent(null)
      setIsConfirmed(false)
      setCountdown(5)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditClick = (event: EventData) => {
    setEditingEvent(event)
    setShowEditModal(true)
  }

  const handleDeleteClick = (event: EventData) => {
    setDeletingEvent(event)
    setShowDeleteModal(true)
    setIsConfirmed(false)
    setCountdown(5)
  }

  const getIconComponent = (iconName: string) => {
    const IconComponent =
      (PhosphorIcons as any)[iconName] || PhosphorIcons.Calendar
    return IconComponent
  }

  if (loading) {
    return <EventsManagementSkeleton />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <Calendar size={20} className="text-blue-900" weight="fill" />
            </div>
            <div>
              <h1
                className="text-2xl font-medium text-white"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Events & Announcements Management
              </h1>
              <p
                className="text-sm text-blue-100 mt-1"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                Manage events and announcements for students
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg bg-white text-blue-900 font-medium hover:bg-blue-50 transition-all duration-200 flex items-center gap-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            <Plus size={20} weight="bold" />
            Create Event
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 shadow-lg p-4">
        <div className="relative">
          <MagnifyingGlass
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          />
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 shadow-lg p-12 text-center">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <p
              className="text-gray-600"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              {searchQuery
                ? 'No events found matching your search'
                : 'No events created yet'}
            </p>
          </div>
        ) : (
          filteredEvents.map((event) => {
            const IconComponent = getIconComponent(event.icon)
            const gradientMap: Record<string, string> = {
              'blue-900': 'from-blue-900 to-blue-800',
              'blue-800': 'from-blue-800 to-blue-700',
              'red-800': 'from-red-800 to-red-700',
              'emerald-800': 'from-emerald-800 to-emerald-700',
              'yellow-800': 'from-yellow-800 to-yellow-700',
              'orange-800': 'from-orange-800 to-orange-700',
              'violet-800': 'from-violet-800 to-violet-700',
              'purple-800': 'from-purple-800 to-purple-700',
            }
            const iconColorMap: Record<string, string> = {
              'blue-900': 'text-blue-900',
              'blue-800': 'text-blue-800',
              'red-800': 'text-red-800',
              'emerald-800': 'text-emerald-800',
              'yellow-800': 'text-yellow-800',
              'orange-800': 'text-orange-800',
              'violet-800': 'text-violet-800',
              'purple-800': 'text-purple-800',
            }
            const gradientClass =
              gradientMap[event.color] || 'from-blue-900 to-blue-800'
            const iconColorClass = iconColorMap[event.color] || 'text-blue-900'

            return (
              <div
                key={event.id}
                className={`bg-gradient-to-br ${gradientClass} rounded-xl p-6 shadow-lg`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                    <IconComponent
                      size={32}
                      className={iconColorClass}
                      weight="fill"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-lg font-medium text-white mb-2"
                      style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                    >
                      {event.title}
                    </h3>
                    <p
                      className="text-sm text-white/90 mb-3"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      {event.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-white/80 mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} weight="duotone" />
                        <span>
                          {formatDateRangeAsWords(
                            event.startDate,
                            event.endDate
                          )}
                        </span>
                      </div>
                      <div>
                        Visible to:{' '}
                        {event.visibleAudience
                          .map((l) => {
                            const labels: Record<string, string> = {
                              'junior-high-school': 'Junior High School',
                              'senior-high-school': 'Senior High School',
                              college: 'College',
                            }
                            return labels[l] || l
                          })
                          .join(', ')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(event)}
                        className="px-3 py-1 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all duration-200 flex items-center gap-2 text-sm"
                      >
                        <Pencil size={16} weight="fill" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(event)}
                        className="px-3 py-1 rounded-lg bg-red-800/20 text-white hover:bg-red-800/30 transition-all duration-200 flex items-center gap-2 text-sm"
                      >
                        <Trash size={16} weight="fill" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Event"
        size="2xl"
      >
        <EventsForm
          onSubmit={handleCreateEvent}
          onCancel={() => setShowCreateModal(false)}
          loading={actionLoading}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingEvent(null)
        }}
        title="Edit Event"
        size="2xl"
      >
        <EventsForm
          event={editingEvent}
          onSubmit={handleUpdateEvent}
          onCancel={() => {
            setShowEditModal(false)
            setEditingEvent(null)
          }}
          loading={actionLoading}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeletingEvent(null)
          setIsConfirmed(false)
          setCountdown(5)
        }}
        title="Delete Event"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
            <Warning size={24} className="text-red-800" weight="fill" />
            <p
              className="text-sm text-red-800"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Are you sure you want to delete this event? This action cannot be
              undone.
            </p>
          </div>
          {deletingEvent && (
            <div className="p-4 bg-gray-50 rounded-xl">
              <p
                className="font-medium text-gray-900 mb-1"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                {deletingEvent.title}
              </p>
              <p
                className="text-sm text-gray-600"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {deletingEvent.description}
              </p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="confirmDelete"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-900 focus:ring-blue-900"
            />
            <label
              htmlFor="confirmDelete"
              className="text-sm text-gray-700"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              I understand this action cannot be undone
            </label>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                setShowDeleteModal(false)
                setDeletingEvent(null)
                setIsConfirmed(false)
                setCountdown(5)
              }}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteEvent}
              disabled={!isConfirmed || actionLoading || countdown > 0}
              className="px-4 py-2 rounded-lg bg-red-800 text-white hover:bg-red-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              {countdown > 0
                ? `Delete (${countdown}s)`
                : actionLoading
                ? 'Deleting...'
                : 'Delete Event'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
