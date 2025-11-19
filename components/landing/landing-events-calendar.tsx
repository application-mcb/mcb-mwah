'use client'

import { useState, useEffect, useMemo } from 'react'
import { EventData } from '@/lib/types/events'
import { formatDateRangeAsWords } from '@/lib/utils/date-formatter'
import {
  Calendar,
  CaretLeft,
  CaretRight,
  Info,
  PushPin,
} from '@phosphor-icons/react'
import { Modal } from '@/components/ui/modal'
import * as PhosphorIcons from '@phosphor-icons/react'

export const LandingEventsCalendar = () => {
  const [events, setEvents] = useState<EventData[]>([])
  const [pastEvents, setPastEvents] = useState<EventData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [hoveredEvent, setHoveredEvent] = useState<EventData | null>(null)
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedDateEvents, setSelectedDateEvents] = useState<EventData[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null)
  const [showPastEventsModal, setShowPastEventsModal] = useState(false)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        // Fetch all events for public display (no level filtering)
        const response = await fetch('/api/events')
        const data = await response.json()

        // Fetch past events
        const pastResponse = await fetch('/api/events?type=past')
        const pastData = await pastResponse.json()

        if (response.ok && data.success && data.events) {
          setEvents(data.events)
        } else {
          setEvents([])
        }

        if (pastResponse.ok && pastData.success && pastData.events) {
          setPastEvents(pastData.events)
        } else {
          setPastEvents([])
        }
      } catch (error) {
        console.error('Error fetching events:', error)
        setEvents([])
        setPastEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const getIconComponent = (iconName: string) => {
    const IconComponent =
      (PhosphorIcons as any)[iconName] || PhosphorIcons.Calendar
    return IconComponent
  }

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; border: string }> = {
      'blue-900': { bg: 'bg-blue-900', border: 'border-blue-900' },
      'blue-800': { bg: 'bg-blue-800', border: 'border-blue-800' },
      'red-800': { bg: 'bg-red-800', border: 'border-red-800' },
      'emerald-800': { bg: 'bg-emerald-800', border: 'border-emerald-800' },
      'yellow-800': { bg: 'bg-yellow-800', border: 'border-yellow-800' },
      'orange-800': { bg: 'bg-orange-800', border: 'border-orange-800' },
      'violet-800': { bg: 'bg-violet-800', border: 'border-violet-800' },
      'purple-800': { bg: 'bg-purple-800', border: 'border-purple-800' },
    }
    return colorMap[color] || colorMap['blue-900']
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Get events for a specific date (only events that START on this date)
  const getEventsForDate = (date: Date): EventData[] => {
    // Normalize calendar date to local midnight (date only, no time)
    const calendarYear = date.getFullYear()
    const calendarMonth = date.getMonth()
    const calendarDay = date.getDate()
    const normalizedDate = new Date(
      calendarYear,
      calendarMonth,
      calendarDay,
      0,
      0,
      0,
      0
    )

    return events.filter((event) => {
      // Parse event start date from ISO string and normalize to local midnight
      const eventStartDate = new Date(event.startDate)

      // Normalize to local date only (year, month, day) - ignore time components
      const startYear = eventStartDate.getFullYear()
      const startMonth = eventStartDate.getMonth()
      const startDay = eventStartDate.getDate()
      const normalizedStartDate = new Date(
        startYear,
        startMonth,
        startDay,
        0,
        0,
        0,
        0
      )

      // Only show event icon on the start date
      return normalizedDate.getTime() === normalizedStartDate.getTime()
    })
  }

  // Navigate to previous month
  const handlePreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  // Navigate to next month
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  // Handle date click
  const handleDateClick = (date: Date, eventsForDate: EventData[]) => {
    setSelectedDate(date)
    setSelectedDateEvents(eventsForDate)
  }

  // Handle event click
  const handleEventClick = (event: EventData) => {
    setSelectedEvent(event)
  }

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = []

    // Add days from previous month
    const prevMonthDays = firstDayOfMonth
    const prevMonth = new Date(year, month - 1, 0)
    for (let i = prevMonthDays - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isCurrentMonth: false,
      })
    }

    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      })
    }

    // Add days from next month to fill the grid
    const remainingDays = 42 - days.length // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      })
    }

    return days
  }, [year, month, firstDayOfMonth, daysInMonth])

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long' })

  return (
    <section className="py-20 bg-gradient-to-br from-white to-blue-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-blue-900/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-blue-800/5 rounded-full blur-3xl"></div>
      </div>
      <div className="texture-overlay" aria-hidden="true"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-medium text-blue-900 mb-4"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            Calendar of Activities
          </h2>
          <p
            className="text-base sm:text-lg text-blue-800/70 max-w-2xl mx-auto font-mono"
            style={{ fontWeight: 300 }}
          >
            View all scheduled events and activities in our interactive
            calendar.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-900/30 border-t-blue-900"></div>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 shadow-lg p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center shadow-md">
                  <Calendar size={20} className="text-white" weight="fill" />
                </div>
                <h3
                  className="text-lg sm:text-xl font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {monthName} {year}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {pastEvents.length > 0 && (
                  <button
                    onClick={() => setShowPastEventsModal(true)}
                    className="px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 text-white text-xs sm:text-sm font-medium hover:from-blue-900 hover:to-blue-950 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    See Previous Events
                  </button>
                )}
                <button
                  onClick={handlePreviousMonth}
                  className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center text-white hover:from-blue-900 hover:to-blue-950 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  aria-label="Previous month"
                >
                  <CaretLeft size={16} weight="bold" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center text-white hover:from-blue-900 hover:to-blue-950 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  aria-label="Next month"
                >
                  <CaretRight size={16} weight="bold" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs sm:text-sm font-medium text-blue-900 py-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((day, index) => {
                const dayEvents = getEventsForDate(day.date)
                const isToday =
                  day.date.toDateString() === new Date().toDateString()
                const isCurrentMonth = day.isCurrentMonth

                return (
                  <div
                    key={index}
                    className="relative"
                    onMouseLeave={() => {
                      setHoveredEvent(null)
                      setHoveredDate(null)
                    }}
                  >
                    <button
                      onClick={() => handleDateClick(day.date, dayEvents)}
                      className={`relative p-1 sm:p-2 rounded-lg sm:rounded-xl border transition-all duration-200 min-h-[60px] sm:min-h-[80px] flex flex-col items-start w-full ${
                        isCurrentMonth
                          ? isToday
                            ? 'bg-white border-blue-400 hover:border-blue-500 hover:shadow-md text-gray-900'
                            : 'bg-white border-blue-200 hover:border-blue-400 hover:shadow-md text-gray-900'
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}
                      style={
                        isToday && isCurrentMonth
                          ? {
                              boxShadow: '0 0 20px rgba(30, 64, 175, 0.6)',
                              animation: 'pulse-glow 3s ease-in-out infinite',
                            }
                          : undefined
                      }
                    >
                      <div className="flex items-center gap-1 sm:gap-1.5 w-full">
                        <span
                          className={`text-xs sm:text-sm font-medium ${
                            isCurrentMonth
                              ? isToday
                                ? 'text-blue-900'
                                : 'text-blue-900'
                              : 'text-gray-400'
                          }`}
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          {day.date.getDate()}
                        </span>
                        {isToday && isCurrentMonth && (
                          <div className="flex items-center gap-1">
                            <PushPin
                              size={12}
                              className="text-blue-900"
                              weight="fill"
                            />
                            <span
                              className="text-[8px] sm:text-[10px] font-medium text-blue-900"
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            >
                              today
                            </span>
                          </div>
                        )}
                      </div>
                      {dayEvents.length > 0 && (
                        <div className="flex flex-col gap-1 sm:gap-1.5 mt-1 sm:mt-2 w-full">
                          <div className="flex flex-wrap gap-1 sm:gap-1.5">
                            {dayEvents.slice(0, 3).map((event) => {
                              const IconComponent = getIconComponent(event.icon)
                              const colorClasses = getColorClasses(event.color)
                              return (
                                <div
                                  key={event.id}
                                  onMouseEnter={() => {
                                    setHoveredEvent(event)
                                    setHoveredDate(day.date)
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEventClick(event)
                                  }}
                                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg ${colorClasses.bg} border-2 ${colorClasses.border} flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-200 shadow-sm`}
                                  title={event.title}
                                >
                                  <IconComponent
                                    size={14}
                                    className="text-white"
                                    weight="fill"
                                  />
                                </div>
                              )
                            })}
                            {dayEvents.length > 3 && (
                              <div
                                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center text-[8px] sm:text-[10px] font-medium border-2 ${
                                  isCurrentMonth
                                    ? isToday
                                      ? 'bg-blue-100 border-blue-300 text-blue-900'
                                      : 'bg-blue-100 border-blue-300 text-blue-900'
                                    : 'bg-gray-200 border-gray-300 text-gray-500'
                                }`}
                                title={`${dayEvents.length - 3} more events`}
                              >
                                +{dayEvents.length - 3}
                              </div>
                            )}
                          </div>
                          {dayEvents.length >= 2 && (
                            <div
                              className={`text-[8px] sm:text-[9px] font-medium ${
                                isCurrentMonth
                                  ? isToday
                                    ? 'text-blue-900'
                                    : 'text-blue-900'
                                  : 'text-gray-500'
                              }`}
                              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                            >
                              {dayEvents.length}+ events
                            </div>
                          )}
                        </div>
                      )}
                    </button>

                    {/* Hover Tooltip */}
                    {hoveredEvent &&
                      hoveredDate &&
                      hoveredDate.toDateString() ===
                        day.date.toDateString() && (
                        <div className="absolute z-50 top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-white rounded-xl shadow-2xl border-2 border-blue-200 p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <div
                              className={`w-10 h-10 rounded-lg ${
                                getColorClasses(hoveredEvent.color).bg
                              } flex items-center justify-center flex-shrink-0`}
                            >
                              {(() => {
                                const IconComponent = getIconComponent(
                                  hoveredEvent.icon
                                )
                                return (
                                  <IconComponent
                                    size={20}
                                    className="text-white"
                                    weight="fill"
                                  />
                                )
                              })()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4
                                className="text-sm font-medium text-gray-900 mb-1 line-clamp-2"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 500,
                                }}
                              >
                                {hoveredEvent.title}
                              </h4>
                              <p
                                className="text-xs text-gray-600 mb-2"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 300,
                                }}
                              >
                                {formatDateRangeAsWords(
                                  hoveredEvent.startDate,
                                  hoveredEvent.endDate
                                )}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEventClick(hoveredEvent)
                              setHoveredEvent(null)
                              setHoveredDate(null)
                            }}
                            className="w-full px-4 py-2 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 text-white text-sm font-medium hover:from-blue-900 hover:to-blue-950 transition-all duration-200 flex items-center justify-center gap-2"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            <Info size={16} weight="fill" />
                            See Info
                          </button>
                        </div>
                      )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

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
          size="xl"
        >
          <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-blue-50">
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Calendar size={40} className="text-white" weight="duotone" />
                </div>
                <p
                  className="text-gray-600 text-base sm:text-lg font-medium mb-2"
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  No events scheduled
                </p>
                <p
                  className="text-gray-500 text-xs sm:text-sm"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  There are no events scheduled for this date.
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
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
                  const endDate = event.endDate ? new Date(event.endDate) : null
                  const selectedDateObj = selectedDate || now

                  let daysText = ''
                  if (selectedDateObj < startDate) {
                    const diffTime =
                      startDate.getTime() - selectedDateObj.getTime()
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    daysText =
                      diffDays === 1 ? '1 day left' : `${diffDays} days left`
                  } else if (
                    endDate &&
                    selectedDateObj >= startDate &&
                    selectedDateObj <= endDate
                  ) {
                    const diffTime =
                      endDate.getTime() - selectedDateObj.getTime()
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
                      key={event.id}
                      className={`group p-4 sm:p-6 rounded-xl bg-gradient-to-br ${gradientClass} shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-white/20`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300 mx-auto sm:mx-0">
                          <IconComponent
                            size={28}
                            className="text-blue-900"
                            weight="fill"
                          />
                        </div>
                        <div className="flex-1 min-w-0 text-center sm:text-left">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-2">
                            <h3
                              className="text-base sm:text-lg font-medium text-white"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              {event.title}
                            </h3>
                            {daysText && (
                              <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 border border-white/30 mx-auto sm:mx-0">
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
                            className="text-xs sm:text-sm text-white/90 mb-3 leading-relaxed"
                            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                          >
                            {event.description}
                          </p>
                          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-white/80 bg-white/10 rounded-lg px-3 py-2 w-fit mx-auto sm:mx-0">
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
          size="xl"
        >
          <div className="p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="space-y-3 sm:space-y-4">
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
                  : null

                let daysText = ''
                if (now < startDate) {
                  const diffTime = startDate.getTime() - now.getTime()
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                  daysText =
                    diffDays === 1 ? '1 day left' : `${diffDays} days left`
                } else if (endDate && now >= startDate && now <= endDate) {
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
                    className={`group p-4 sm:p-6 rounded-xl bg-gradient-to-br ${gradientClass} shadow-lg border border-white/20`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-md mx-auto sm:mx-0">
                        <IconComponent
                          size={28}
                          className="text-blue-900"
                          weight="fill"
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-2">
                          <h3
                            className="text-base sm:text-lg font-medium text-white"
                            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                          >
                            {selectedEvent.title}
                          </h3>
                          {daysText && (
                            <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 border border-white/30 mx-auto sm:mx-0">
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
                          className="text-xs sm:text-sm text-white/90 mb-3 leading-relaxed"
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          {selectedEvent.description}
                        </p>
                        <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-white/80 bg-white/10 rounded-lg px-3 py-2 w-fit mx-auto sm:mx-0">
                          <Calendar size={14} weight="duotone" />
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
        size="xl"
      >
        <div className="p-4 sm:p-6">
          {pastEvents.length === 0 ? (
            <p
              className="text-gray-600 text-center py-4 text-sm sm:text-base"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              No past events
            </p>
          ) : (
            <div className="space-y-3 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">
              {pastEvents.map((event) => {
                const IconComponent = getIconComponent(event.icon)
                const gradientClass =
                  event.color === 'blue-900'
                    ? 'from-blue-900 to-blue-800'
                    : 'from-blue-800 to-blue-700'

                return (
                  <div
                    key={event.id}
                    className={`p-3 sm:p-4 rounded-xl bg-gradient-to-br ${gradientClass}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
                        <IconComponent
                          size={20}
                          className="text-blue-900"
                          weight="fill"
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-center sm:text-left">
                        <h3
                          className="text-sm sm:text-base font-medium text-white mb-1"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          {event.title}
                        </h3>
                        <p
                          className="text-xs sm:text-sm text-white/90 mb-2"
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          {event.description}
                        </p>
                        <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-white/80">
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
        </div>
      </Modal>
    </section>
  )
}
