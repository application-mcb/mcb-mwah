'use client'

import Image from 'next/image'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import {
  Shield,
  Clock,
  ArrowsClockwise,
  CheckCircle,
  Info,
  ShieldCheck,
  IdentificationCard,
  BookOpen,
  ChartBar,
  ListChecks,
  Files,
  Robot,
  CalendarBlank,
  SquaresFour,
  ChalkboardTeacher,
  ChatsCircle,
  Users,
  GraduationCap,
} from '@phosphor-icons/react'

type AuditStatus = 'success' | 'info'
type AuditCategory =
  | 'access'
  | 'enrollment'
  | 'course'
  | 'analytics'
  | 'subjects'
  | 'tasks'
  | 'documents'
  | 'ai'
  | 'events'
  | 'sections'
  | 'teachers'
  | 'chat'
  | 'students'
  | 'grades'

type AuditLogEntry = {
  id: string
  actorName: string
  actorEmail: string
  action: string
  timestamp: string
  context: string
  status: AuditStatus
  category: AuditCategory
}
const statusStyles: Record<
  AuditStatus,
  { badge: string; text: string; icon: ReactNode }
> = {
  success: {
    badge: 'bg-blue-900/10 text-blue-900',
    text: 'Action completed',
    icon: <CheckCircle size={16} weight="fill" />,
  },
  info: {
    badge: 'bg-blue-900/10 text-blue-900/70',
    text: 'System note',
    icon: <Info size={16} weight="fill" />,
  },
}

const categoryStyles: Record<
  AuditCategory,
  { label: string; icon: ReactNode; accent: string; dot: string }
> = {
  access: {
    label: 'Access',
    icon: <ShieldCheck size={18} weight="fill" />,
    accent: 'border-blue-900/30',
    dot: 'bg-blue-900',
  },
  enrollment: {
    label: 'Enrollment',
    icon: <IdentificationCard size={18} weight="fill" />,
    accent: 'border-blue-800/30',
    dot: 'bg-blue-800',
  },
  course: {
    label: 'Course',
    icon: <BookOpen size={18} weight="fill" />,
    accent: 'border-blue-700/30',
    dot: 'bg-blue-700',
  },
  analytics: {
    label: 'Analytics',
    icon: <ChartBar size={18} weight="fill" />,
    accent: 'border-blue-600/30',
    dot: 'bg-blue-600',
  },
  subjects: {
    label: 'Subjects',
    icon: <BookOpen size={18} />,
    accent: 'border-blue-500/30',
    dot: 'bg-blue-500',
  },
  tasks: {
    label: 'Tasks',
    icon: <ListChecks size={18} weight="fill" />,
    accent: 'border-blue-400/30',
    dot: 'bg-blue-400',
  },
  documents: {
    label: 'Documents',
    icon: <Files size={18} weight="fill" />,
    accent: 'border-blue-300/30',
    dot: 'bg-blue-300',
  },
  ai: {
    label: 'AI Session',
    icon: <Robot size={18} weight="fill" />,
    accent: 'border-blue-400/30',
    dot: 'bg-blue-400',
  },
  events: {
    label: 'Events',
    icon: <CalendarBlank size={18} weight="fill" />,
    accent: 'border-blue-500/30',
    dot: 'bg-blue-500',
  },
  sections: {
    label: 'Sections',
    icon: <SquaresFour size={18} weight="fill" />,
    accent: 'border-blue-600/30',
    dot: 'bg-blue-600',
  },
  teachers: {
    label: 'Faculty',
    icon: <ChalkboardTeacher size={18} weight="fill" />,
    accent: 'border-blue-700/30',
    dot: 'bg-blue-700',
  },
  chat: {
    label: 'Chat',
    icon: <ChatsCircle size={18} weight="fill" />,
    accent: 'border-blue-500/30',
    dot: 'bg-blue-500',
  },
  students: {
    label: 'Students',
    icon: <Users size={18} weight="fill" />,
    accent: 'border-blue-400/30',
    dot: 'bg-blue-400',
  },
  grades: {
    label: 'Grades',
    icon: <GraduationCap size={18} weight="fill" />,
    accent: 'border-blue-600/30',
    dot: 'bg-blue-600',
  },
}

interface RegistrarAuditLogsProps {
  registrarName?: string
  registrarEmail?: string
  registrarAvatarUrl?: string
}

const getInitials = (name?: string, email?: string) => {
  if (name) {
    const [first = '', second = ''] = name.trim().split(' ')
    return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase() || 'RG'
  }
  if (email) {
    return email.charAt(0).toUpperCase() || 'RG'
  }
  return 'RG'
}

const AuditLogsSkeleton = () => {
  return (
    <div className="p-6 space-y-6" style={{ fontFamily: 'Poppins' }}>
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6 space-y-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/30" />
          <div className="space-y-2">
            <div className="h-5 bg-white/60 rounded w-40" />
            <div className="h-3 bg-white/40 rounded w-56" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((chip) => (
            <div
              key={`audit-chip-${chip}`}
              className="h-8 w-28 rounded-full bg-white/25"
            />
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {[1, 2].map((summary) => (
          <div
            key={`audit-summary-${summary}`}
            className="rounded-xl border border-blue-100 bg-white shadow-sm p-4 space-y-3 animate-pulse"
          >
            <div className="h-4 rounded bg-gray-100 w-32" />
            <div className="h-3 rounded bg-gray-100 w-24" />
            <div className="h-20 rounded-xl bg-gray-50" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-blue-100 bg-white shadow-sm divide-y divide-blue-50">
        {[1, 2, 3, 4, 5].map((row) => (
          <div key={`audit-row-${row}`} className="p-4 space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 rounded bg-gray-100 w-2/3" />
                <div className="h-3 rounded bg-gray-100 w-1/2" />
              </div>
              <div className="w-16 h-5 rounded-full bg-gray-100" />
            </div>
            <div className="h-3 rounded bg-gray-50 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

const RegistrarAuditLogs = ({
  registrarName,
  registrarEmail,
  registrarAvatarUrl,
}: RegistrarAuditLogsProps) => {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const normalizeLogEntry = useCallback((entry: any): AuditLogEntry => {
    const hasCategory = Boolean(
      categoryStyles[entry?.category as AuditCategory]
    )
    const category: AuditCategory = hasCategory ? entry.category : 'enrollment'
    const status: AuditStatus = entry?.status === 'success' ? 'success' : 'info'

    return {
      id:
        String(entry?.id || entry?.docId || entry?.shortId) ||
        Math.floor(100000 + Math.random() * 900000).toString(),
      actorName: entry?.actorName || 'Unknown user',
      actorEmail: entry?.actorEmail || '',
      action: entry?.action || 'Unknown action',
      timestamp:
        entry?.createdAt || entry?.timestamp || new Date().toISOString(),
      context: entry?.context || '',
      status,
      category,
    }
  }, [])

  const loadAuditLogs = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const response = await fetch('/api/audit-logs')
      if (!response.ok) {
        throw new Error('Failed to load audit logs')
      }
      const data = await response.json()
      if (Array.isArray(data.logs)) {
        const normalized = data.logs.map((log: any) => normalizeLogEntry(log))
        setEntries(normalized)
      } else {
        setEntries([])
      }
    } catch (error) {
      console.warn('Error loading audit logs:', error)
      setEntries([])
      setLoadError('Unable to load audit logs right now.')
    } finally {
      setLoading(false)
    }
  }, [normalizeLogEntry])

  useEffect(() => {
    loadAuditLogs()
  }, [loadAuditLogs])

  const sortedEntries = useMemo(() => {
    return [...entries].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }, [entries])

  const resolvedName = registrarName || 'Registrar'
  const resolvedEmail = registrarEmail || 'registrar@example.com'
  const registrarInitials = useMemo(
    () => getInitials(resolvedName, resolvedEmail),
    [resolvedName, resolvedEmail]
  )
  const timestampFormatter = useMemo(() => {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }, [])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | AuditCategory>(
    'all'
  )
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  const filteredEntries = useMemo(() => {
    return sortedEntries.filter((entry) => {
      if (categoryFilter !== 'all' && entry.category !== categoryFilter) {
        return false
      }

      if (startDate) {
        const entryDate = new Date(entry.timestamp).getTime()
        const start = new Date(startDate).getTime()
        if (entryDate < start) {
          return false
        }
      }

      if (endDate) {
        const entryDate = new Date(entry.timestamp).getTime()
        const end = new Date(endDate).setHours(23, 59, 59, 999)
        if (entryDate > end) {
          return false
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const haystack = [
          entry.action,
          entry.context,
          entry.actorName,
          entry.actorEmail,
          entry.id,
        ]
          .join(' ')
          .toLowerCase()
        return haystack.includes(q)
      }

      return true
    })
  }, [sortedEntries, categoryFilter, startDate, endDate, searchQuery])

  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredEntries.slice(startIndex, startIndex + pageSize)
  }, [filteredEntries, currentPage])

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize))

  if (loading) {
    return <AuditLogsSkeleton />
  }

  return (
    <section
      className="min-h-screen bg-gradient-to-b from-white via-blue-50/40 to-white px-6 py-8"
      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="rounded-xl border border-blue-100 bg-white/80 p-6 shadow-lg space-y-4">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-900 text-white flex items-center justify-center shadow-md overflow-hidden">
                {registrarAvatarUrl ? (
                  <Image
                    src={registrarAvatarUrl}
                    alt={resolvedName}
                    width={56}
                    height={56}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-medium">
                    {registrarInitials}
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs text-blue-900/80">Audit Channel</p>
                <h1 className="text-xl text-blue-900 font-medium">
                  System Activity Logs
                </h1>
                <p className="text-xs text-blue-900/70">
                  Live activity feed for registrar dashboard actions.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-lg bg-blue-900 text-white px-4 py-2 flex items-center gap-2 text-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-900"
              aria-label="Sync audit feed"
              onClick={loadAuditLogs}
              disabled={loading}
            >
              <ArrowsClockwise size={16} weight="bold" />
              Sync Audit Feed
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-white/90 shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-blue-100 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 flex-1">
              <label className="flex flex-col gap-1 text-xs text-blue-900/70">
                <span>Search actions</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by text, ID, or user..."
                  className="w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm text-blue-900 placeholder:text-blue-900/40 focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-blue-900/70">
                <span>Category</span>
                <select
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(
                      event.target.value as 'all' | AuditCategory
                    )
                  }
                  className="w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm text-blue-900 focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                >
                  <option value="all">All activity</option>
                  {Object.entries(categoryStyles).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3 md:w-auto">
              <label className="flex flex-col gap-1 text-xs text-blue-900/70">
                <span>From</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm text-blue-900 focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-blue-900/70">
                <span>To</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm text-blue-900 focus:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setCategoryFilter('all')
                setStartDate('')
                setEndDate('')
              }}
              className="self-start rounded-lg border border-blue-900/20 px-3 py-2 text-xs font-medium text-blue-900 transition hover:bg-blue-50"
            >
              Reset
            </button>
          </div>
          <div className="px-6 py-4 border-b border-blue-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-medium text-blue-900">
                Recent actions
              </h2>
              <p className="text-xs text-blue-900/70">
                Showing {filteredEntries.length} of {sortedEntries.length}{' '}
                entries for QA verification.
              </p>
            </div>
            <div className="text-xs text-blue-900/70">
              Page {currentPage} of {totalPages}
            </div>
          </div>
          <div className="divide-y divide-blue-50 relative">
            {paginatedEntries.length === 0 ? (
              <div className="px-6 py-8 text-sm text-blue-900/70">
                {loadError || 'No audit activity recorded yet.'}
              </div>
            ) : (
              paginatedEntries.map((entry, index) => {
                const { badge, text, icon } = statusStyles[entry.status]
                const category = categoryStyles[entry.category]
                const formattedId = `LOG-${entry.id.padStart(3, '0')}`
                const timestamp = timestampFormatter.format(
                  new Date(entry.timestamp)
                )
                const isLast = index === sortedEntries.length - 1
                return (
                  <article
                    key={entry.id}
                    className="px-6 py-5 flex flex-col gap-4 md:flex-row md:items-center md:gap-6"
                  >
                    <div className="flex gap-4 w-full">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-12 h-12 rounded-xl border ${category.accent} bg-white flex items-center justify-center text-blue-900 shadow-sm`}
                        >
                          {category.icon}
                        </div>
                        {!isLast && (
                          <div className="w-px flex-1 bg-gradient-to-b from-blue-100 via-blue-50 to-transparent mt-2" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-blue-900/70">
                          <span className="px-2 py-1 rounded-lg bg-blue-50 border border-blue-100 font-mono tracking-tight text-blue-900">
                            {formattedId}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-900/5 border border-blue-100 text-blue-900 text-[11px] uppercase tracking-wide">
                            <span
                              className={`w-2 h-2 rounded-full ${category.dot}`}
                            />
                            {category.label}
                          </span>
                          <span className="inline-flex items-center gap-1 text-blue-900/60 text-[11px] font-mono">
                            <Clock size={12} weight="bold" />
                            {timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-blue-900/70">
                          {entry.actorName}{' '}
                          <span className="text-blue-900/50">
                            ({entry.actorEmail})
                          </span>
                        </p>
                        <p className="text-base text-blue-900 font-medium">
                          {entry.action}
                        </p>
                        <p className="text-[11px] text-blue-900/80 font-mono tracking-tight">
                          {entry.context}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 md:flex-col md:items-end md:gap-2">
                      <div
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-medium ${badge}`}
                      >
                        {icon}
                        {text}
                      </div>
                      <p className="text-xs text-blue-900/60 font-mono tracking-tight">
                        #{entry.id.padStart(4, '0')}
                      </p>
                    </div>
                  </article>
                )
              })
            )}
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-t border-blue-100 text-xs text-blue-900">
            <p>
              Showing {(currentPage - 1) * pageSize + 1}-
              {Math.min(currentPage * pageSize, filteredEntries.length)} of{' '}
              {filteredEntries.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-blue-100 px-3 py-1 text-xs font-medium text-blue-900 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="rounded-lg border border-blue-100 px-3 py-1 text-xs font-medium text-blue-900 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default RegistrarAuditLogs
