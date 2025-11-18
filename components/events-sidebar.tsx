'use client'

import { useState, useEffect, useRef } from 'react'
import { EventData } from '@/lib/types/events'
import { formatDateRangeAsWords } from '@/lib/utils/date-formatter'
import {
  Calendar,
  CaretRight,
  Bell,
  ChatCircleDots,
  PaperPlaneTilt,
  MagnifyingGlass,
} from '@phosphor-icons/react'
import * as PhosphorIcons from '@phosphor-icons/react'
import ChatInterface from './chat/chat-interface'
import { ContactData } from '@/lib/chat-database'
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { toast } from 'react-toastify'

interface EventsSidebarProps {
  level: string | null
  userId: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  hideHeader?: boolean // New prop to hide the header
}

export default function EventsSidebar({
  level,
  userId,
  isCollapsed: externalIsCollapsed,
  onToggleCollapse: externalOnToggleCollapse,
  hideHeader = false,
}: EventsSidebarProps) {
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false)
  const isCollapsed =
    externalIsCollapsed !== undefined
      ? externalIsCollapsed
      : internalIsCollapsed
  const [events, setEvents] = useState<EventData[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'events' | 'chat'>('events')
  const [contacts, setContacts] = useState<ContactData[]>([])
  const [selectedContact, setSelectedContact] = useState<ContactData | null>(
    null
  )
  const [contactsLoading, setContactsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const previousContacts = useRef<ContactData[]>([])

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Build API URL - if level is null, don't include it (API will return all events)
        const activeUrl = level ? `/api/events?level=${level}` : '/api/events'
        const upcomingUrl = level
          ? `/api/events?level=${level}&type=upcoming`
          : '/api/events?type=upcoming'

        // Fetch active events
        const activeResponse = await fetch(activeUrl)
        const activeData = await activeResponse.json()

        // Fetch upcoming events
        const upcomingResponse = await fetch(upcomingUrl)
        const upcomingData = await upcomingResponse.json()

        // Combine active and upcoming events, removing duplicates by id
        const activeEvents =
          activeData.success && activeData.events ? activeData.events : []
        const upcomingEvents =
          upcomingData.success && upcomingData.events ? upcomingData.events : []

        // Create a Map to deduplicate by event id
        const eventsMap = new Map()
        activeEvents.forEach((event: any) => {
          eventsMap.set(event.id, event)
        })
        upcomingEvents.forEach((event: any) => {
          eventsMap.set(event.id, event)
        })

        // Convert Map values to array
        const allEvents = Array.from(eventsMap.values())

        setEvents(allEvents)
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setLoading(false)
      }
    }

    if (view === 'events') {
      fetchEvents()
      // Refresh events every 5 minutes
      const interval = setInterval(fetchEvents, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [level, view])

  useEffect(() => {
    if (view === 'chat') {
      const fetchContacts = async () => {
        try {
          setContactsLoading(true)
          const response = await fetch(
            `/api/chat/contacts?userId=${userId}&role=student`
          )
          const data = await response.json()

          if (data.success) {
            // Update previous contacts before setting new ones
            setContacts((prevContacts) => {
              previousContacts.current = [...prevContacts]
              return data.contacts
            })
          }
        } catch (error) {
          console.error('Error fetching contacts:', error)
        } finally {
          setContactsLoading(false)
        }
      }

      fetchContacts()

      const chatsQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', userId),
        orderBy('lastMessageAt', 'desc'),
        limit(100)
      )

      const unsubscribe = onSnapshot(chatsQuery, async () => {
        await fetchContacts()
      })

      return () => unsubscribe()
    }
  }, [view, userId])

  const handleContactClick = async (contact: ContactData) => {
    if (!contact.chatId) {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studentId: userId,
            registrarId: contact.uid,
          }),
        })

        const data = await response.json()

        if (data.success && data.chatId) {
          setSelectedContact({
            ...contact,
            chatId: data.chatId,
          })
        } else {
          toast.error(data.error || 'Failed to create chat')
        }
      } catch (error) {
        console.error('Error creating chat:', error)
        toast.error('Failed to create chat')
      }
    } else {
      setSelectedContact(contact)
    }
  }

  const handleToggleCollapse = () => {
    if (externalOnToggleCollapse) {
      externalOnToggleCollapse()
    } else {
      setInternalIsCollapsed((prev) => !prev)
    }
  }

  const getIconComponent = (iconName: string) => {
    const IconComponent =
      (PhosphorIcons as any)[iconName] || PhosphorIcons.Calendar
    return IconComponent
  }

  if (isCollapsed) {
    return (
      <aside className="w-16 sm:w-20 bg-white/60 shadow-lg flex flex-col transition-all duration-300 h-screen fixed right-0 top-0 z-10 border-l border-blue-100 overflow-hidden">
        <div className="px-2 sm:px-3 py-3 sm:py-4 border-b border-blue-900 bg-gradient-to-br from-blue-800 to-blue-900 text-white flex flex-col items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleToggleCollapse}
            className="w-8 h-8 sm:w-10 sm:h-10 bg-white text-blue-900 flex items-center justify-center rounded-xl transition-all duration-200 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Expand panel"
          >
            {view === 'events' ? (
              <Bell size={18} className="sm:w-5 sm:h-5" weight="fill" />
            ) : (
              <ChatCircleDots
                size={18}
                className="sm:w-5 sm:h-5"
                weight="fill"
              />
            )}
          </button>
        </div>
      </aside>
    )
  }

  if (selectedContact && view === 'chat') {
    return (
      <aside className="w-full sm:w-80 md:w-96 bg-white/60 shadow-lg flex flex-col transition-all duration-300 h-screen fixed right-0 top-0 z-10 border-l border-blue-100">
        <ChatInterface
          chatId={selectedContact.chatId!}
          userId={userId}
          contact={selectedContact}
          onBack={() => setSelectedContact(null)}
          onToggleCollapse={handleToggleCollapse}
        />
      </aside>
    )
  }

  const renderContent = () => {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {view === 'chat' ? (
          <>
            {/* Search Bar */}
            <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3">
              <input
                type="text"
                placeholder="Search registrars..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-sm"
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 300,
                }}
              />
            </div>
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
              {contactsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm animate-pulse"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-blue-100"></div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-100 border-2 border-white"></div>
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="h-4 bg-blue-100 rounded w-32"></div>
                            <div className="h-5 w-5 bg-blue-100 rounded-lg"></div>
                          </div>
                          <div className="h-3 bg-blue-50 rounded w-3/4"></div>
                          <div className="h-3 bg-blue-50 rounded w-2/3"></div>
                          <div className="h-2 bg-blue-50 rounded w-20"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                (() => {
                  // Filter contacts based on search query
                  const filteredContacts = contacts.filter((contact) => {
                    if (!searchQuery.trim()) return true

                    const query = searchQuery.toLowerCase().trim()
                    const name = contact.name.toLowerCase()
                    const email = contact.email.toLowerCase()

                    return name.includes(query) || email.includes(query)
                  })

                  if (filteredContacts.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                          <ChatCircleDots
                            size={32}
                            className="text-white"
                            weight="duotone"
                          />
                        </div>
                        <p
                          className="text-sm text-black"
                          style={{ fontFamily: 'monospace', fontWeight: 300 }}
                        >
                          {searchQuery.trim()
                            ? 'No registrars found'
                            : 'No registrars available'}
                        </p>
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-3">
                      {filteredContacts.map((contact, index) => {
                        const isNew =
                          previousContacts.current.length > 0 &&
                          !previousContacts.current.find(
                            (c) => c.uid === contact.uid
                          )
                        const animationDelay = isNew ? 0 : index * 50

                        return (
                          <div
                            key={contact.uid}
                            className={`bg-white rounded-xl p-4 border border-blue-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer ${
                              isNew ? 'animate-slide-up' : ''
                            }`}
                            style={{
                              animationDelay: `${animationDelay}ms`,
                              fontFamily: 'Poppins',
                            }}
                            onClick={() => handleContactClick(contact)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                handleContactClick(contact)
                              }
                            }}
                            tabIndex={0}
                            role="button"
                            aria-label={`Chat with ${contact.name}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="relative flex-shrink-0">
                                {(() => {
                                  const getColorClass = (color?: string) => {
                                    const colorMap: Record<string, string> = {
                                      'blue-900': 'bg-blue-900',
                                      'red-800': 'bg-red-800',
                                      'emerald-800': 'bg-emerald-800',
                                      'yellow-800': 'bg-yellow-800',
                                      'orange-800': 'bg-orange-800',
                                      'violet-800': 'bg-violet-800',
                                      'purple-800': 'bg-purple-800',
                                    }
                                    return color && colorMap[color]
                                      ? colorMap[color]
                                      : 'bg-gradient-to-br from-blue-800 to-blue-900'
                                  }
                                  return (
                                    <>
                                      <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden ${getColorClass(
                                          contact.color
                                        )}`}
                                      >
                                        {contact.photoURL ? (
                                          <img
                                            src={contact.photoURL}
                                            alt={contact.name}
                                            className="w-12 h-12 rounded-full object-cover"
                                          />
                                        ) : (
                                          <span className="text-white text-lg font-medium">
                                            {contact.name
                                              .charAt(0)
                                              .toUpperCase()}
                                          </span>
                                        )}
                                      </div>
                                      {contact.color && (
                                        <div
                                          className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${getColorClass(
                                            contact.color
                                          )}`}
                                        />
                                      )}
                                    </>
                                  )
                                })()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <h3
                                    className="text-sm font-medium text-black truncate"
                                    style={{
                                      fontFamily: 'monospace',
                                      fontWeight: 500,
                                    }}
                                  >
                                    {contact.name}
                                  </h3>
                                  {contact.unreadCount > 0 && (
                                    <span
                                      className="bg-blue-900 text-white text-xs font-medium px-2 py-0.5 rounded-lg flex-shrink-0"
                                      style={{ fontFamily: 'monospace' }}
                                    >
                                      {contact.unreadCount}
                                    </span>
                                  )}
                                </div>
                                <p
                                  className="text-xs text-black truncate mb-1"
                                  style={{
                                    fontFamily: 'monospace',
                                    fontWeight: 300,
                                  }}
                                >
                                  Registrar
                                </p>
                                {contact.lastMessage && (
                                  <p
                                    className="text-xs text-black truncate mb-1"
                                    style={{
                                      fontFamily: 'monospace',
                                      fontWeight: 300,
                                    }}
                                  >
                                    {contact.lastMessage}
                                  </p>
                                )}
                                {contact.lastMessageAt && (
                                  <p
                                    className="text-[10px] text-black"
                                    style={{
                                      fontFamily: 'monospace',
                                      fontWeight: 300,
                                    }}
                                  >
                                    {(() => {
                                      try {
                                        const date = new Date(
                                          contact.lastMessageAt
                                        )
                                        if (isNaN(date.getTime())) {
                                          return ''
                                        }
                                        return date.toLocaleDateString(
                                          'en-US',
                                          {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          }
                                        )
                                      } catch {
                                        return ''
                                      }
                                    })()}
                                  </p>
                                )}
                              </div>
                              <div className="flex-shrink-0 flex items-center">
                                <PaperPlaneTilt
                                  size={18}
                                  className="text-blue-900"
                                  weight="fill"
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()
              )}
            </div>
          </>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-900/30 border-t-blue-900"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Calendar size={32} className="text-white" weight="duotone" />
            </div>
            <p
              className="text-sm text-blue-900"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            >
              No active events
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
            {/* Timeline Events */}
            <div className="relative">
              {events.map((event, index) => {
                const IconComponent = getIconComponent(event.icon)
                const colorMap: Record<
                  string,
                  { bg: string; border: string; dot: string; gradient: string }
                > = {
                  'blue-900': {
                    bg: 'bg-blue-900',
                    border: 'border-blue-900',
                    dot: 'bg-blue-900',
                    gradient: 'from-blue-900 to-blue-800',
                  },
                  'blue-800': {
                    bg: 'bg-blue-800',
                    border: 'border-blue-800',
                    dot: 'bg-blue-800',
                    gradient: 'from-blue-800 to-blue-700',
                  },
                  'red-800': {
                    bg: 'bg-red-800',
                    border: 'border-red-800',
                    dot: 'bg-red-800',
                    gradient: 'from-red-800 to-red-700',
                  },
                  'emerald-800': {
                    bg: 'bg-emerald-800',
                    border: 'border-emerald-800',
                    dot: 'bg-emerald-800',
                    gradient: 'from-emerald-800 to-emerald-700',
                  },
                  'yellow-800': {
                    bg: 'bg-yellow-800',
                    border: 'border-yellow-800',
                    dot: 'bg-yellow-800',
                    gradient: 'from-yellow-800 to-yellow-700',
                  },
                  'orange-800': {
                    bg: 'bg-orange-800',
                    border: 'border-orange-800',
                    dot: 'bg-orange-800',
                    gradient: 'from-orange-800 to-orange-700',
                  },
                  'violet-800': {
                    bg: 'bg-violet-800',
                    border: 'border-violet-800',
                    dot: 'bg-violet-800',
                    gradient: 'from-violet-800 to-violet-700',
                  },
                  'purple-800': {
                    bg: 'bg-purple-800',
                    border: 'border-purple-800',
                    dot: 'bg-purple-800',
                    gradient: 'from-purple-800 to-purple-700',
                  },
                }
                const colorClasses =
                  colorMap[event.color] || colorMap['blue-900']
                const nextEvent = events[index + 1]
                const nextColorClasses = nextEvent
                  ? colorMap[nextEvent.color] || colorMap['blue-900']
                  : null

                // Calculate days left
                const now = new Date()
                const startDate = new Date(event.startDate)
                const endDate = event.endDate ? new Date(event.endDate) : null

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

                // Get gradient classes for connecting lines
                const getGradientClasses = (
                  fromColor: string,
                  toColor: string
                ) => {
                  const gradientMap: Record<string, Record<string, string>> = {
                    'blue-900': {
                      'blue-900': 'from-blue-900 to-blue-900',
                      'blue-800': 'from-blue-900 to-blue-800',
                      'red-800': 'from-blue-900 to-red-800',
                      'emerald-800': 'from-blue-900 to-emerald-800',
                      'yellow-800': 'from-blue-900 to-yellow-800',
                      'orange-800': 'from-blue-900 to-orange-800',
                      'violet-800': 'from-blue-900 to-violet-800',
                      'purple-800': 'from-blue-900 to-purple-800',
                    },
                    'blue-800': {
                      'blue-900': 'from-blue-800 to-blue-900',
                      'blue-800': 'from-blue-800 to-blue-800',
                      'red-800': 'from-blue-800 to-red-800',
                      'emerald-800': 'from-blue-800 to-emerald-800',
                      'yellow-800': 'from-blue-800 to-yellow-800',
                      'orange-800': 'from-blue-800 to-orange-800',
                      'violet-800': 'from-blue-800 to-violet-800',
                      'purple-800': 'from-blue-800 to-purple-800',
                    },
                    'red-800': {
                      'blue-900': 'from-red-800 to-blue-900',
                      'blue-800': 'from-red-800 to-blue-800',
                      'red-800': 'from-red-800 to-red-800',
                      'emerald-800': 'from-red-800 to-emerald-800',
                      'yellow-800': 'from-red-800 to-yellow-800',
                      'orange-800': 'from-red-800 to-orange-800',
                      'violet-800': 'from-red-800 to-violet-800',
                      'purple-800': 'from-red-800 to-purple-800',
                    },
                    'emerald-800': {
                      'blue-900': 'from-emerald-800 to-blue-900',
                      'blue-800': 'from-emerald-800 to-blue-800',
                      'red-800': 'from-emerald-800 to-red-800',
                      'emerald-800': 'from-emerald-800 to-emerald-800',
                      'yellow-800': 'from-emerald-800 to-yellow-800',
                      'orange-800': 'from-emerald-800 to-orange-800',
                      'violet-800': 'from-emerald-800 to-violet-800',
                      'purple-800': 'from-emerald-800 to-purple-800',
                    },
                    'yellow-800': {
                      'blue-900': 'from-yellow-800 to-blue-900',
                      'blue-800': 'from-yellow-800 to-blue-800',
                      'red-800': 'from-yellow-800 to-red-800',
                      'emerald-800': 'from-yellow-800 to-emerald-800',
                      'yellow-800': 'from-yellow-800 to-yellow-800',
                      'orange-800': 'from-yellow-800 to-orange-800',
                      'violet-800': 'from-yellow-800 to-violet-800',
                      'purple-800': 'from-yellow-800 to-purple-800',
                    },
                    'orange-800': {
                      'blue-900': 'from-orange-800 to-blue-900',
                      'blue-800': 'from-orange-800 to-blue-800',
                      'red-800': 'from-orange-800 to-red-800',
                      'emerald-800': 'from-orange-800 to-emerald-800',
                      'yellow-800': 'from-orange-800 to-yellow-800',
                      'orange-800': 'from-orange-800 to-orange-800',
                      'violet-800': 'from-orange-800 to-violet-800',
                      'purple-800': 'from-orange-800 to-purple-800',
                    },
                    'violet-800': {
                      'blue-900': 'from-violet-800 to-blue-900',
                      'blue-800': 'from-violet-800 to-blue-800',
                      'red-800': 'from-violet-800 to-red-800',
                      'emerald-800': 'from-violet-800 to-emerald-800',
                      'yellow-800': 'from-violet-800 to-yellow-800',
                      'orange-800': 'from-violet-800 to-orange-800',
                      'violet-800': 'from-violet-800 to-violet-800',
                      'purple-800': 'from-violet-800 to-purple-800',
                    },
                    'purple-800': {
                      'blue-900': 'from-purple-800 to-blue-900',
                      'blue-800': 'from-purple-800 to-blue-800',
                      'red-800': 'from-purple-800 to-red-800',
                      'emerald-800': 'from-purple-800 to-emerald-800',
                      'yellow-800': 'from-purple-800 to-yellow-800',
                      'orange-800': 'from-purple-800 to-orange-800',
                      'violet-800': 'from-purple-800 to-violet-800',
                      'purple-800': 'from-purple-800 to-purple-800',
                    },
                  }
                  return (
                    gradientMap[fromColor]?.[toColor] ||
                    'from-blue-900 to-blue-800'
                  )
                }

                return (
                  <div
                    key={event.id}
                    className="relative flex items-start gap-3 sm:gap-4 group mb-8 sm:mb-10"
                  >
                    {/* Vertical connector line to next event - gradient between current and next */}
                    {nextEvent && (
                      <div
                        className={`absolute left-6 sm:left-8 w-0.5 bg-gradient-to-b ${getGradientClasses(
                          event.color,
                          nextEvent.color
                        )} z-0`}
                        style={{ top: '1.75rem', height: 'calc(100% + 1rem)' }}
                      ></div>
                    )}

                    {/* Timeline Node */}
                    <div className="relative z-10 flex-shrink-0">
                      {/* Connecting Line to Timeline - uses event color */}
                      <div
                        className={`absolute left-0 top-5 sm:top-6 w-6 sm:w-8 h-0.5 bg-gradient-to-r ${getGradientClasses(
                          event.color,
                          event.color
                        )} opacity-60`}
                      ></div>

                      {/* Event Icon Node */}
                      <div
                        className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl ${colorClasses.bg} border-2 sm:border-4 border-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                      >
                        <IconComponent
                          size={20}
                          className="text-white sm:w-7 sm:h-7"
                          weight="fill"
                        />
                      </div>

                      {/* Timeline Dot */}
                      <div
                        className={`absolute -left-1.5 sm:-left-2 top-5 sm:top-6 w-3 h-3 sm:w-4 sm:h-4 ${colorClasses.dot} rounded-full border-2 sm:border-4 border-white shadow-md z-20`}
                      ></div>
                    </div>

                    {/* Event Content Card */}
                    <div className="flex-1 min-w-0 pt-1">
                      {(() => {
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
                        const gradientClass =
                          gradientMap[event.color] ||
                          'from-blue-900 to-blue-800'

                        return (
                          <div
                            className={`p-3 sm:p-4 rounded-xl bg-gradient-to-br ${gradientClass} shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20`}
                          >
                            <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2">
                              <h3
                                className="text-xs sm:text-sm font-medium text-white flex-1 min-w-0"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 500,
                                }}
                              >
                                {event.title}
                              </h3>
                              {daysText && (
                                <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-lg px-1.5 sm:px-2 py-0.5 sm:py-1 border border-white/30">
                                  <span
                                    className="text-[9px] sm:text-[10px] font-medium text-white whitespace-nowrap"
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
                              className="text-[11px] sm:text-xs text-white/90 mb-2 sm:mb-3 line-clamp-2 leading-relaxed"
                              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                            >
                              {event.description}
                            </p>
                            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-white/80 bg-white/10 rounded-lg px-1.5 sm:px-2 py-1 sm:py-1.5 w-fit">
                              <Calendar
                                size={10}
                                className="sm:w-3 sm:h-3"
                                weight="duotone"
                              />
                              <span
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 300,
                                }}
                              >
                                {formatDateRangeAsWords(
                                  event.startDate,
                                  event.endDate
                                )}
                              </span>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (hideHeader) {
    return renderContent()
  }

  return (
    <aside className="w-full sm:w-80 md:w-96 bg-white/60 shadow-lg flex flex-col transition-all duration-300 h-screen fixed right-0 top-0 z-10 border-l border-blue-100">
      <div className="px-3 sm:px-4 py-3 sm:py-4 border-b border-blue-900 bg-gradient-to-br from-blue-800 to-blue-900 text-white flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white text-blue-900 flex items-center justify-center rounded-xl flex-shrink-0">
            {view === 'events' ? (
              <Bell size={18} className="sm:w-5 sm:h-5" weight="fill" />
            ) : (
              <ChatCircleDots
                size={18}
                className="sm:w-5 sm:h-5"
                weight="fill"
              />
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView(view === 'events' ? 'chat' : 'events')}
            className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white flex-shrink-0 ${
              view === 'chat'
                ? 'border-white/40 text-white hover:bg-white/20'
                : 'border-white/20 text-white/60 hover:bg-white/10'
            }`}
            aria-label={
              view === 'events' ? 'Switch to chat' : 'Switch to events'
            }
            tabIndex={0}
          >
            {view === 'events' ? (
              <ChatCircleDots
                size={16}
                className="sm:w-[18px] sm:h-[18px]"
                weight="fill"
              />
            ) : (
              <Bell
                size={16}
                className="sm:w-[18px] sm:h-[18px]"
                weight="fill"
              />
            )}
          </button>
          <button
            type="button"
            onClick={handleToggleCollapse}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl border border-white/40 text-white transition-all duration-200 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white flex-shrink-0"
            aria-label="Collapse panel"
            tabIndex={0}
          >
            <CaretRight
              size={16}
              className="sm:w-[18px] sm:h-[18px]"
              weight="bold"
            />
          </button>
        </div>
      </div>
      {renderContent()}
      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </aside>
  )
}
