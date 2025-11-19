'use client'

import { useState, useEffect, useMemo } from 'react'
import { EventData } from '@/lib/types/events'
import { formatDateRangeAsWords } from '@/lib/utils/date-formatter'
import EventsCalendar from './events-calendar'
import { Calendar, CaretRight, Bell, X } from '@phosphor-icons/react'
import { Modal } from './ui/modal'
import * as PhosphorIcons from '@phosphor-icons/react'

interface EventsOverviewProps {
  level: string | null
  userId: string
}

export default function EventsOverview({ level, userId }: EventsOverviewProps) {
  const [events, setEvents] = useState<EventData[]>([])
  const [pastEvents, setPastEvents] = useState<EventData[]>([])
  const [loading, setLoading] = useState(true)
  const [showPastEventsModal, setShowPastEventsModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedDateEvents, setSelectedDateEvents] = useState<EventData[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null)
  const [featuredIndex, setFeaturedIndex] = useState(0)

  useEffect(() => {
    const fetchEvents = async () => {
      if (!level) {
        setLoading(false)
        return
      }

      try {
        // Fetch active events
        const activeResponse = await fetch(`/api/events?level=${level}`)
        const activeData = await activeResponse.json()

        // Fetch upcoming events (for calendar display)
        const upcomingResponse = await fetch(
          `/api/events?level=${level}&type=upcoming`
        )
        const upcomingData = await upcomingResponse.json()

        // Fetch past events
        const pastResponse = await fetch(`/api/events?level=${level}&type=past`)
        const pastData = await pastResponse.json()

        // Combine active and upcoming events for calendar display
        const allVisibleEvents = [
          ...(activeData.success && activeData.events ? activeData.events : []),
          ...(upcomingData.success && upcomingData.events
            ? upcomingData.events
            : []),
        ]
        setEvents(allVisibleEvents)

        if (pastData.success && pastData.events) {
          setPastEvents(pastData.events)
        }
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()

    // Refresh events every 5 minutes
    const interval = setInterval(fetchEvents, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [level])

  // Get featured/important events (first 3 active events)
  const featuredEvents = useMemo(() => {
    return events.slice(0, 3)
  }, [events])

  // Get upcoming events (events that haven't started yet)
  const upcomingEvents = useMemo(() => {
    const now = new Date()
    return events.filter((event) => {
      const startDate = new Date(event.startDate)
      return startDate > now
    })
  }, [events])

  const handleDateClick = (date: Date, eventsForDate: EventData[]) => {
    setSelectedDate(date)
    setSelectedDateEvents(eventsForDate)
  }

  const getIconComponent = (iconName: string) => {
    const IconComponent =
      (PhosphorIcons as any)[iconName] || PhosphorIcons.Calendar
    return IconComponent
  }

  useEffect(() => {
    if (featuredEvents.length === 0) {
      setFeaturedIndex(0)
      return
    }

    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featuredEvents.length)
    }, 1000)

    return () => clearInterval(interval)
  }, [featuredEvents.length])

  return (
    <div className="space-y-6">
      {/* Banner Section - Featured Announcements */}
      {featuredEvents.length > 0 && (
        <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <Bell size={20} className="text-blue-900" weight="fill" />
            </div>
            <h2
              className="text-xl font-medium text-white"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Featured Announcements
            </h2>
          </div>
          <div className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${featuredIndex * 100}%)`,
              }}
            >
              {featuredEvents.map((event) => {
                const IconComponent = getIconComponent(event.icon)
                return (
                  <div key={event.id} className="w-full flex-shrink-0 px-1">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-200">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                          <IconComponent
                            size={20}
                            className="text-blue-900"
                            weight="fill"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className="text-sm font-medium text-white mb-1"
                            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                          >
                            {event.title}
                          </h3>
                          <p
                            className="text-xs text-white/80 line-clamp-2"
                            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                          >
                            {event.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-center mt-4 space-x-2">
              {featuredEvents.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setFeaturedIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    index === featuredIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                  aria-label={`Go to featured announcement ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Events Carousel */}
      {upcomingEvents.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center shadow-md">
                <Calendar size={20} className="text-white" weight="fill" />
              </div>
              <h2
                className="text-xl font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Upcoming Events
              </h2>
            </div>
            {pastEvents.length > 0 && (
              <button
                onClick={() => setShowPastEventsModal(true)}
                className="px-4 py-2 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 text-white text-sm font-medium hover:from-blue-900 hover:to-blue-950 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-900"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                See Previous Events
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.map((event) => {
              const IconComponent = getIconComponent(event.icon)
              const gradientClass =
                event.color === 'blue-900'
                  ? 'from-blue-900 to-blue-800'
                  : 'from-blue-800 to-blue-700'

              return (
                <div
                  key={event.id}
                  className={`group p-4 rounded-xl bg-gradient-to-br ${gradientClass} hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-in-out shadow-lg`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-md">
                      <IconComponent
                        size={24}
                        className="text-blue-900"
                        weight="fill"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-sm font-medium text-white mb-1"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        {event.title}
                      </h3>
                      <p
                        className="text-xs text-white/90 mb-2 line-clamp-2"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        {event.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-white/80">
                        <Calendar size={14} weight="duotone" />
                        <span
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          {formatDateRangeAsWords(
                            event.startDate,
                            event.endDate
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Calendar of Activities */}
      <EventsCalendar
        events={events}
        onDateClick={handleDateClick}
        onEventClick={(event) => setSelectedEvent(event)}
      />

      {/* Date Events Modal */}
      {selectedDate && (
        <Modal
          isOpen={selectedDate !== null}
          onClose={() => {
            setSelectedDate(null)
            setSelectedDateEvents([])
          }}
          title={`Events on ${selectedDate.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}`}
          size="lg"
        >
          <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50">
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Calendar size={40} className="text-white" weight="duotone" />
                </div>
                <p
                  className="text-gray-600 text-lg font-medium mb-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  No events scheduled
                </p>
                <p
                  className="text-gray-500 text-sm"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  There are no events scheduled for this date.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateEvents.map((event) => {
                  const IconComponent = getIconComponent(event.icon)
                  const colorMap: Record<string, string> = {
                    'blue-900': 'from-blue-900 to-blue-800',
                    'blue-800': 'from-blue-800 to-blue-700',
                    'red-800': 'from-red-800 to-red-700',
                    'emerald-800': 'from-emerald-800 to-emerald-700',
                    'yellow-800': 'from-yellow-800 to-yellow-700',
                    'orange-800': 'from-orange-800 to-orange-700',
                    'violet-800': 'from-violet-800 to-violet-700',
                    'purple-800': 'from-purple-800 to-purple-700',
                  }
                  const gradientClass =
                    colorMap[event.color] || 'from-blue-900 to-blue-800'

                  // Calculate days left
                  const now = new Date()
                  const startDate = new Date(event.startDate)
                  const endDate = event.endDate
                    ? new Date(event.endDate)
                    : startDate
                  const selectedDateObj = selectedDate || now

                  let daysLeft: number | null = null
                  let daysText = ''

                  if (selectedDateObj < startDate) {
                    // Event hasn't started yet
                    const diffTime =
                      startDate.getTime() - selectedDateObj.getTime()
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    daysLeft = diffDays
                    daysText =
                      diffDays === 1 ? '1 day left' : `${diffDays} days left`
                  } else if (
                    selectedDateObj >= startDate &&
                    selectedDateObj <= endDate
                  ) {
                    // Event is ongoing
                    const diffTime =
                      endDate.getTime() - selectedDateObj.getTime()
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    if (diffDays > 0) {
                      daysLeft = diffDays
                      daysText =
                        diffDays === 1
                          ? 'Ends in 1 day'
                          : `Ends in ${diffDays} days`
                    } else {
                      daysText = 'Ends today'
                    }
                  }

                  return (
                    <div
                      key={event.id}
                      className={`group p-6 rounded-xl bg-gradient-to-br ${gradientClass} shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-white/20`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300">
                          <IconComponent
                            size={28}
                            className="text-blue-900"
                            weight="fill"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h3
                              className="text-lg font-medium text-white"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              {event.title}
                            </h3>
                            {daysText && (
                              <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/30">
                                <span
                                  className="text-xs font-medium text-white whitespace-nowrap"
                                  style={{
                                    fontFamily: 'Poppins',
                                    fontWeight: 500,
                                  }}
                                >
                                  {daysText}
                                </span>
                              </div>
                            )}
                          </div>
                          <p
                            className="text-sm text-white/90 mb-3 leading-relaxed"
                            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                          >
                            {event.description}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-white/80 bg-white/10 rounded-lg px-3 py-2 w-fit">
                            <Calendar size={16} weight="duotone" />
                            <span
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            >
                              {formatDateRangeAsWords(
                                event.startDate,
                                event.endDate
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <Modal
          isOpen={selectedEvent !== null}
          onClose={() => setSelectedEvent(null)}
          title={selectedEvent.title}
          size="lg"
        >
          <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="space-y-4">
              {(() => {
                const IconComponent = getIconComponent(selectedEvent.icon)
                const colorMap: Record<string, string> = {
                  'blue-900': 'from-blue-900 to-blue-800',
                  'blue-800': 'from-blue-800 to-blue-700',
                  'red-800': 'from-red-800 to-red-700',
                  'emerald-800': 'from-emerald-800 to-emerald-700',
                  'yellow-800': 'from-yellow-800 to-yellow-700',
                  'orange-800': 'from-orange-800 to-orange-700',
                  'violet-800': 'from-violet-800 to-violet-700',
                  'purple-800': 'from-purple-800 to-purple-700',
                }
                const gradientClass =
                  colorMap[selectedEvent.color] || 'from-blue-900 to-blue-800'

                // Calculate days left
                const now = new Date()
                const startDate = new Date(selectedEvent.startDate)
                const endDate = selectedEvent.endDate
                  ? new Date(selectedEvent.endDate)
                  : startDate

                let daysText = ''
                if (now < startDate) {
                  const diffTime = startDate.getTime() - now.getTime()
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                  daysText =
                    diffDays === 1 ? '1 day left' : `${diffDays} days left`
                } else if (now >= startDate && now <= endDate) {
                  const diffTime = endDate.getTime() - now.getTime()
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                  if (diffDays > 0) {
                    daysText =
                      diffDays === 1
                        ? 'Ends in 1 day'
                        : `Ends in ${diffDays} days`
                  } else {
                    daysText = 'Ends today'
                  }
                }

                return (
                  <div
                    className={`group p-6 rounded-xl bg-gradient-to-br ${gradientClass} shadow-lg border border-white/20`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-md">
                        <IconComponent
                          size={28}
                          className="text-blue-900"
                          weight="fill"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3
                            className="text-lg font-medium text-white"
                            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                          >
                            {selectedEvent.title}
                          </h3>
                          {daysText && (
                            <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/30">
                              <span
                                className="text-xs font-medium text-white whitespace-nowrap"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 500,
                                }}
                              >
                                {daysText}
                              </span>
                            </div>
                          )}
                        </div>
                        <p
                          className="text-sm text-white/90 mb-3 leading-relaxed"
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          {selectedEvent.description}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-white/80 bg-white/10 rounded-lg px-3 py-2 w-fit">
                          <Calendar size={16} weight="duotone" />
                          <span
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            {formatDateRangeAsWords(
                              selectedEvent.startDate,
                              selectedEvent.endDate
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </Modal>
      )}

      {/* Past Events Modal */}
      <Modal
        isOpen={showPastEventsModal}
        onClose={() => setShowPastEventsModal(false)}
        title="Previous Events"
        size="lg"
      >
        {pastEvents.length === 0 ? (
          <p
            className="text-gray-600 text-center py-4"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            No past events
          </p>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {pastEvents.map((event) => {
              const IconComponent = getIconComponent(event.icon)
              const gradientClass =
                event.color === 'blue-900'
                  ? 'from-blue-900 to-blue-800'
                  : 'from-blue-800 to-blue-700'

              return (
                <div
                  key={event.id}
                  className={`p-4 rounded-xl bg-gradient-to-br ${gradientClass}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                      <IconComponent
                        size={20}
                        className="text-blue-900"
                        weight="fill"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-sm font-medium text-white mb-1"
                        style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                      >
                        {event.title}
                      </h3>
                      <p
                        className="text-xs text-white/90 mb-2"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        {event.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-white/80">
                        <Calendar size={14} weight="duotone" />
                        <span
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          {formatDateRangeAsWords(
                            event.startDate,
                            event.endDate
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Modal>
    </div>
  )
}
