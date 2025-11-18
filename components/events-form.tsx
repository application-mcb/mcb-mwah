'use client'

import { useState, useEffect } from 'react'
import {
  EventData,
  EventColor,
  EventLevel,
  EVENT_LEVELS,
  EVENT_COLORS,
} from '@/lib/types/events'
import { Button } from './ui/button'
import {
  Calendar,
  Bell,
  X,
  Check,
  Info,
  Lightbulb,
  Users,
  Palette,
  Clock,
  TextT,
  FileText,
  Sparkle,
  ArrowsClockwise,
  Minus,
} from '@phosphor-icons/react'
import * as PhosphorIcons from '@phosphor-icons/react'
import { toast } from 'react-toastify'

// Common Phosphor icons for events
const COMMON_ICONS = [
  'Calendar',
  'Bell',
  'GraduationCap',
  'BookOpen',
  'Users',
  'Trophy',
  'Star',
  'Megaphone',
  'Flag',
  'Clock',
  'CalendarBlank',
  'CalendarCheck',
  'Campfire',
  'Chalkboard',
  'Certificate',
  'Medal',
  'Rocket',
  'Sparkle',
] as const

interface EventsFormProps {
  event?: EventData | null
  onSubmit: (eventData: {
    title: string
    description: string
    startDate: Date
    endDate: Date | null
    color: EventColor
    icon: string
    visibleAudience: EventLevel[]
  }) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export default function EventsForm({
  event,
  onSubmit,
  onCancel,
  loading = false,
}: EventsFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [color, setColor] = useState<EventColor>('blue-900')
  const [icon, setIcon] = useState('Calendar')
  const [visibleAudience, setVisibleAudience] = useState<EventLevel[]>([])
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [aiAction, setAiAction] = useState<
    'generate' | 'rewrite' | 'shorten' | null
  >(null)
  const [typewritingText, setTypewritingText] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (event) {
      setTitle(event.title)
      setDescription(event.description)
      setStartDate(new Date(event.startDate).toISOString().split('T')[0])
      setEndDate(event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '')
      setColor(event.color)
      setIcon(event.icon)
      setVisibleAudience(event.visibleAudience)
      setFormError('')
    } else {
      // Reset form when creating new event
      setFormError('')
    }
  }, [event])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    // Validate required fields
    if (!title.trim()) {
      setFormError('Please enter an event title.')
      return
    }

    if (!description.trim()) {
      setFormError('Please enter an event description.')
      return
    }

    if (!startDate) {
      setFormError('Please select a start date.')
      return
    }

    if (visibleAudience.length === 0) {
      setFormError('Please select at least one visible audience level.')
      return
    }

    const start = new Date(startDate)
    
    if (isNaN(start.getTime())) {
      setFormError('Invalid start date format. Please check your date.')
      return
    }

    // End date is optional - if provided, validate it
    let end: Date | null = null
    if (endDate) {
      end = new Date(endDate)
      if (isNaN(end.getTime())) {
        setFormError('Invalid end date format. Please check your date.')
        return
      }
      if (start >= end) {
        setFormError('Start date must be before end date.')
        return
      }
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        startDate: start,
        endDate: end, // Can be null
        color,
        icon,
        visibleAudience,
      })
    } catch (error: any) {
      setFormError(error.message || 'Failed to save event. Please try again.')
    }
  }

  const handleAudienceToggle = (level: EventLevel) => {
    setVisibleAudience((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    )
  }

  const handleAiAction = async (action: 'generate' | 'rewrite' | 'shorten') => {
    // Generate can work without any fields filled - it creates a generic template
    if ((action === 'rewrite' || action === 'shorten') && !description.trim()) {
      toast.error('Please enter a description first.', { autoClose: 3000 })
      return
    }

    setAiAction(action)
    setTypewritingText('')

    try {
      const response = await fetch('/api/ai/event-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventTitle: title.trim(),
          currentDescription: description.trim(),
          action,
        }),
      })

      const data = await response.json()

      if (response.ok && data.description) {
        // Typewriting effect
        const fullText = data.description
        let currentIndex = 0
        setTypewritingText('')

        const typeInterval = setInterval(() => {
          if (currentIndex < fullText.length) {
            setTypewritingText(fullText.substring(0, currentIndex + 1))
            currentIndex++
          } else {
            clearInterval(typeInterval)
            // Set the final text to description after typewriting completes
            setTimeout(() => {
              setDescription(fullText)
              setAiAction(null)
              setTypewritingText('')
            }, 300)
          }
        }, 1) // Adjust speed: lower = faster typing

        // Store interval reference for cleanup
        ;(window as any).__eventTypeInterval = typeInterval
      } else {
        toast.error(data.error || `Failed to ${action} description.`, {
          autoClose: 5000,
        })
        setAiAction(null)
        setTypewritingText('')
      }
    } catch (error) {
      console.error(`Error ${action}ing description:`, error)
      toast.error(`Network error occurred while ${action}ing description.`, {
        autoClose: 5000,
      })
      setAiAction(null)
      setTypewritingText('')
    }
  }

  // Cleanup typewriting interval on unmount
  useEffect(() => {
    return () => {
      if ((window as any).__eventTypeInterval) {
        clearInterval((window as any).__eventTypeInterval)
      }
    }
  }, [])

  const getIconComponent = (iconName: string) => {
    const IconComponent =
      (PhosphorIcons as any)[iconName] || PhosphorIcons.Calendar
    return IconComponent
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-8 bg-gradient-to-br from-gray-50 to-blue-50"
    >
      {/* Error Message */}
      {formError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-2">
            <X
              size={18}
              className="text-red-600 mt-0.5 flex-shrink-0"
              weight="bold"
            />
            <p
              className="text-sm text-red-800"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              {formError}
            </p>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6 mb-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-md">
            <Sparkle size={32} className="text-blue-900" weight="fill" />
          </div>
          <div className="flex-1">
            <h3
              className="text-xl font-medium text-white mb-1"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              {event ? 'Update Event Details' : 'Create New Event'}
            </h3>
            <p
              className="text-sm text-blue-100"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              Fill in all required fields to {event ? 'update' : 'create'} an
              event or announcement
            </p>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
            <TextT size={20} className="text-white" weight="fill" />
          </div>
          <label
            className="text-sm font-medium text-gray-900"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            Title *
          </label>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="e.g., Annual Sports Festival, Midterm Examinations"
          className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all"
          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
        />
        <div className="mt-2 flex items-start gap-2 text-xs text-gray-600">
          <Info
            size={14}
            className="text-blue-600 mt-0.5 flex-shrink-0"
            weight="duotone"
          />
          <span style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
            Keep it concise and descriptive. This will be displayed prominently
            to students.
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-white" weight="fill" />
            </div>
            <label
              className="text-sm font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              Description *
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAiAction('generate')}
              disabled={loading || aiAction !== null}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              title="Generate a generic event description template"
            >
              {aiAction === 'generate' ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkle size={14} weight="fill" />
                  <span>Generate</span>
                </>
              )}
            </button>
            {description.trim() && (
              <>
                <button
                  type="button"
                  onClick={() => handleAiAction('rewrite')}
                  disabled={loading || aiAction !== null}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-br from-emerald-800 to-emerald-900 hover:from-emerald-900 hover:to-emerald-950 text-white text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  title="Rewrite and improve description"
                >
                  {aiAction === 'rewrite' ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Rewriting...</span>
                    </>
                  ) : (
                    <>
                      <ArrowsClockwise size={14} weight="fill" />
                      <span>Rewrite</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleAiAction('shorten')}
                  disabled={loading || aiAction !== null}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-br from-orange-800 to-orange-900 hover:from-orange-900 hover:to-orange-950 text-white text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  title="Shorten description"
                >
                  {aiAction === 'shorten' ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Shortening...</span>
                    </>
                  ) : (
                    <>
                      <Minus size={14} weight="fill" />
                      <span>Shorten</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
        <textarea
          value={aiAction !== null ? typewritingText : description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          placeholder="Provide detailed information about the event, including location, requirements, and any important notes..."
          className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all resize-none"
          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          disabled={aiAction !== null}
        />
        <div className="mt-2 flex items-start gap-2 text-xs text-gray-600">
          <Lightbulb
            size={14}
            className="text-yellow-600 mt-0.5 flex-shrink-0"
            weight="duotone"
          />
          <span style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
            Include all relevant details students need to know. Be clear and
            specific. Use AI tools to generate, rewrite, or shorten your
            description.
          </span>
        </div>
      </div>

      {/* Date Range */}
      <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
            <Clock size={20} className="text-white" weight="fill" />
          </div>
          <label
            className="text-sm font-medium text-gray-900"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            Event Duration *
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              className="block text-xs font-medium text-gray-600 mb-2"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Start Date *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            />
          </div>
            <div>
              <label
                className="block text-xs font-medium text-gray-600 mb-2"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                End Date <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              />
            </div>
        </div>
        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info
              size={14}
              className="text-blue-600 mt-0.5 flex-shrink-0"
              weight="duotone"
            />
            <div
              className="text-xs text-blue-800"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              <strong>Tip:</strong> Events will automatically appear on the
              calendar on the start date. End date is optional - if provided, it must be after the start date.
            </div>
          </div>
        </div>
      </div>

      {/* Color Picker */}
      <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
            <Palette size={20} className="text-white" weight="fill" />
          </div>
          <label
            className="text-sm font-medium text-gray-900"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            Card Color *
          </label>
        </div>
        <div className="grid grid-cols-8 gap-x-0.5 gap-y-1">
          {EVENT_COLORS.map((c) => {
            const colorMap: Record<string, string> = {
              'blue-900': 'bg-gradient-to-br from-blue-900 to-blue-800',
              'blue-800': 'bg-gradient-to-br from-blue-800 to-blue-700',
              'red-800': 'bg-gradient-to-br from-red-800 to-red-700',
              'emerald-800':
                'bg-gradient-to-br from-emerald-800 to-emerald-700',
              'yellow-800': 'bg-gradient-to-br from-yellow-800 to-yellow-700',
              'orange-800': 'bg-gradient-to-br from-orange-800 to-orange-700',
              'violet-800': 'bg-gradient-to-br from-violet-800 to-violet-700',
              'purple-800': 'bg-gradient-to-br from-purple-800 to-purple-700',
            }
            const isSelected = color === c
            return (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`
                  relative w-12 h-12 border-2 transition-all duration-200
                  ${
                    colorMap[c] || 'bg-gradient-to-br from-blue-900 to-blue-800'
                  }
                  ${
                    isSelected
                      ? 'border-blue-900 ring-2 ring-offset-2 ring-blue-500'
                      : 'border-gray-300'
                  }
                  hover:scale-110 cursor-pointer
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                  flex items-center justify-center
                `}
                title={c}
                aria-label={`Select ${c} color`}
              >
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check size={16} className="text-white" weight="bold" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex items-start gap-2 text-xs text-gray-600">
          <Lightbulb
            size={14}
            className="text-yellow-600 mt-0.5 flex-shrink-0"
            weight="duotone"
          />
          <span style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
            Choose a color that matches the event theme. This will be used for
            the event card background.
          </span>
        </div>
      </div>

      {/* Icon Picker */}
      <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
            <Bell size={20} className="text-white" weight="fill" />
          </div>
          <label
            className="text-sm font-medium text-gray-900"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            Event Icon *
          </label>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowIconPicker(!showIconPicker)}
            className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg flex items-center justify-between hover:border-blue-400 hover:bg-blue-50 transition-all bg-white"
          >
            <div className="flex items-center gap-3">
              {(() => {
                const IconComponent = getIconComponent(icon)
                return (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
                    <IconComponent
                      size={20}
                      className="text-white"
                      weight="fill"
                    />
                  </div>
                )
              })()}
              <span
                className="text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                {icon}
              </span>
            </div>
            <Calendar size={18} className="text-gray-400" weight="bold" />
          </button>
          {showIconPicker && (
            <div className="absolute z-10 mt-2 w-full bg-white border-2 border-blue-200 rounded-lg shadow-xl p-4 max-h-64 overflow-y-auto">
              <div
                className="mb-2 text-xs font-medium text-gray-600"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Select an icon:
              </div>
              <div className="grid grid-cols-4 gap-3">
                {COMMON_ICONS.map((iconName) => {
                  const IconComponent = getIconComponent(iconName)
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => {
                        setIcon(iconName)
                        setShowIconPicker(false)
                      }}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        icon === iconName
                          ? 'border-blue-900 bg-blue-50 shadow-md scale-105'
                          : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      <IconComponent
                        size={24}
                        className={
                          icon === iconName ? 'text-blue-900' : 'text-gray-600'
                        }
                        weight="fill"
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-start gap-2 text-xs text-gray-600">
          <Info
            size={14}
            className="text-blue-600 mt-0.5 flex-shrink-0"
            weight="duotone"
          />
          <span style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
            Choose an icon that represents your event. This will be displayed on
            event cards.
          </span>
        </div>
      </div>

      {/* Visible Audience */}
      <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
            <Users size={20} className="text-white" weight="fill" />
          </div>
          <label
            className="text-sm font-medium text-gray-900"
            style={{ fontFamily: 'Poppins', fontWeight: 500 }}
          >
            Visible Audience (Levels) *
          </label>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-gray-50 border-2 border-blue-200 rounded-lg p-5">
          <div className="grid grid-cols-3 gap-3">
            {EVENT_LEVELS.map((level) => {
              const levelLabels: Record<EventLevel, string> = {
                'junior-high-school': 'Junior High School',
                'senior-high-school': 'Senior High School',
                college: 'College',
              }
              const isSelected = visibleAudience.includes(level)
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleAudienceToggle(level)}
                  className={`px-4 py-4 rounded-lg border-2 text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    isSelected
                      ? 'border-blue-900 bg-gradient-to-br from-blue-800 to-blue-900 text-white shadow-lg shadow-blue-900/30 scale-105'
                      : 'border-gray-200 hover:border-blue-400 hover:bg-white text-gray-700 bg-white'
                  }`}
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {isSelected && <Check size={16} weight="bold" />}
                  {levelLabels[level]}
                </button>
              )
            })}
          </div>
        </div>
        {visibleAudience.length === 0 && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <X
                size={14}
                className="text-red-600 mt-0.5 flex-shrink-0"
                weight="bold"
              />
              <span
                className="text-xs text-red-800"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Please select at least one level. The event will only be visible
                to students in the selected levels.
              </span>
            </div>
          </div>
        )}
        {visibleAudience.length > 0 && (
          <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Check
                size={14}
                className="text-emerald-600 mt-0.5 flex-shrink-0"
                weight="bold"
              />
              <div
                className="text-xs text-emerald-800"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                <strong>Selected:</strong>{' '}
                {visibleAudience
                  .map((l) => {
                    const labels: Record<EventLevel, string> = {
                      'junior-high-school': 'Junior High School',
                      'senior-high-school': 'Senior High School',
                      college: 'College',
                    }
                    return labels[l]
                  })
                  .join(', ')}
              </div>
            </div>
          </div>
        )}
        <div className="mt-3 flex items-start gap-2 text-xs text-gray-600">
          <Info
            size={14}
            className="text-blue-600 mt-0.5 flex-shrink-0"
            weight="duotone"
          />
          <span style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
            Select which education levels can see this event. You can select
            multiple levels.
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Info size={14} className="text-blue-600" weight="duotone" />
            <span style={{ fontFamily: 'Poppins', fontWeight: 300 }}>
              All fields marked with * are required
            </span>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="rounded-lg px-6 py-3 border-2 border-gray-300 hover:border-gray-400"
              disabled={loading}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-lg bg-gradient-to-br from-blue-800 to-blue-900 text-white hover:from-blue-900 hover:to-blue-950 px-8 py-3 shadow-lg shadow-blue-900/30 hover:shadow-xl transition-all"
              disabled={loading || visibleAudience.length === 0}
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </span>
              ) : event ? (
                <span className="flex items-center gap-2">
                  <Check size={18} weight="bold" />
                  Update Event
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkle size={18} weight="fill" />
                  Create Event
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
