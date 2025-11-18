'use client'

import { useState, useMemo } from 'react'
import { EventData } from '@/lib/types/events'
import { formatDateRangeAsWords } from '@/lib/utils/date-formatter'
import { Calendar, CaretLeft, CaretRight, Info } from '@phosphor-icons/react'
import * as PhosphorIcons from '@phosphor-icons/react'

interface EventsCalendarProps {
  events: EventData[]
  onDateClick?: (date: Date, events: EventData[]) => void
  onEventClick?: (event: EventData) => void
}

export default function EventsCalendar({
  events,
  onDateClick,
  onEventClick,
}: EventsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [hoveredEvent, setHoveredEvent] = useState<EventData | null>(null)
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)

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
    const normalizedDate = new Date(calendarYear, calendarMonth, calendarDay, 0, 0, 0, 0)

    return events.filter((event) => {
      // Parse event start date from ISO string and normalize to local midnight
      const eventStartDate = new Date(event.startDate)
      
      // Normalize to local date only (year, month, day) - ignore time components
      const startYear = eventStartDate.getFullYear()
      const startMonth = eventStartDate.getMonth()
      const startDay = eventStartDate.getDate()
      const normalizedStartDate = new Date(startYear, startMonth, startDay, 0, 0, 0, 0)

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
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center shadow-md">
            <Calendar size={20} className="text-white" weight="fill" />
          </div>
          <h2
            className="text-xl font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            Calendar of Activities
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousMonth}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center text-white hover:from-blue-900 hover:to-blue-950 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-900"
            aria-label="Previous month"
          >
            <CaretLeft size={16} weight="bold" />
          </button>
          <div className="px-4 py-1 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg text-white text-sm font-medium min-w-[140px] text-center">
            {monthName} {year}
          </div>
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
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-blue-900 py-2"
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
                onClick={() => onDateClick?.(day.date, dayEvents)}
                className={`relative p-2 rounded-xl border transition-all duration-200 min-h-[80px] flex flex-col items-start w-full ${
                  isCurrentMonth
                    ? isToday
                      ? 'bg-gradient-to-br from-blue-800 to-blue-900 text-white border-blue-900 shadow-lg shadow-[0_0_18px_rgba(30,64,175,0.45)]'
                      : 'bg-white border-blue-200 hover:border-blue-400 hover:shadow-md text-gray-900'
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    isCurrentMonth
                      ? isToday
                        ? 'text-white'
                        : 'text-blue-900'
                      : 'text-gray-400'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                >
                  {day.date.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 w-full">
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
                            onEventClick?.(event)
                          }}
                          className={`w-6 h-6 rounded-lg ${colorClasses.bg} border-2 ${colorClasses.border} flex items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-200 shadow-sm`}
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
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-medium border-2 ${
                          isCurrentMonth
                            ? isToday
                              ? 'bg-white/20 border-white/40 text-white'
                              : 'bg-blue-100 border-blue-300 text-blue-900'
                            : 'bg-gray-200 border-gray-300 text-gray-500'
                        }`}
                        title={`${dayEvents.length - 3} more events`}
                      >
                        +{dayEvents.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </button>

              {/* Hover Tooltip */}
              {hoveredEvent &&
                hoveredDate &&
                hoveredDate.toDateString() === day.date.toDateString() && (
                  <div className="absolute z-50 top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-white rounded-xl shadow-2xl border-2 border-blue-200 p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={`w-10 h-10 rounded-lg ${getColorClasses(hoveredEvent.color).bg} flex items-center justify-center flex-shrink-0`}
                      >
                        {(() => {
                          const IconComponent = getIconComponent(hoveredEvent.icon)
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
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          {hoveredEvent.title}
                        </h4>
                        <p
                          className="text-xs text-gray-600 mb-2"
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
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
                        onEventClick?.(hoveredEvent)
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
  )
}

