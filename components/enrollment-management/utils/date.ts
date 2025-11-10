export const getDateRange = (days: number) => {
  const now = new Date()
  const pastDate = new Date()
  pastDate.setDate(now.getDate() - days)
  return pastDate
}

export const getDateTimestamp = (dateInput: any): number => {
  try {
    let date: Date
    if (dateInput && typeof dateInput === 'object' && 'toDate' in dateInput) {
      date = dateInput.toDate()
    } else if (
      dateInput &&
      typeof dateInput === 'object' &&
      ('_seconds' in dateInput || 'seconds' in dateInput)
    ) {
      const seconds = (dateInput as any)._seconds || (dateInput as any).seconds
      const nanoseconds = (dateInput as any)._nanoseconds || (dateInput as any).nanoseconds || 0
      date = new Date(seconds * 1000 + nanoseconds / 1000000)
    } else if (typeof dateInput === 'string') {
      date = new Date(dateInput)
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput)
    } else if (dateInput instanceof Date) {
      date = dateInput
    } else {
      return 0
    }
    if (isNaN(date.getTime())) return 0
    return date.getTime()
  } catch {
    return 0
  }
}

export const formatDate = (dateInput: any) => {
  try {
    let date: Date
    if (dateInput && typeof dateInput === 'object' && 'toDate' in dateInput) {
      date = dateInput.toDate()
    } else if (
      dateInput &&
      typeof dateInput === 'object' &&
      ('_seconds' in dateInput || 'seconds' in dateInput)
    ) {
      const seconds = (dateInput as any)._seconds || (dateInput as any).seconds
      const nanoseconds = (dateInput as any)._nanoseconds || (dateInput as any).nanoseconds || 0
      date = new Date(seconds * 1000 + nanoseconds / 1000000)
    } else if (typeof dateInput === 'string') {
      date = new Date(dateInput)
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput)
    } else if (dateInput instanceof Date) {
      date = dateInput
    } else {
      return 'Invalid Date'
    }
    if (isNaN(date.getTime())) return 'Invalid Date'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'Invalid Date'
  }
}

export const formatBirthDate = (dateInput: any) => {
  try {
    let date: Date
    if (typeof dateInput === 'string') {
      date = new Date(dateInput)
    } else if (dateInput instanceof Date) {
      date = dateInput
    } else {
      return 'Invalid Date'
    }
    if (isNaN(date.getTime())) return 'Invalid Date'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return 'Invalid Date'
  }
}

export const getTimeAgoInfo = (dateInput: any) => {
  try {
    let date: Date
    if (dateInput && typeof dateInput === 'object' && 'toDate' in dateInput) {
      date = dateInput.toDate()
    } else if (
      dateInput &&
      typeof dateInput === 'object' &&
      ('_seconds' in dateInput || 'seconds' in dateInput)
    ) {
      const seconds = (dateInput as any)._seconds || (dateInput as any).seconds
      const nanoseconds = (dateInput as any)._nanoseconds || (dateInput as any).nanoseconds || 0
      date = new Date(seconds * 1000 + nanoseconds / 1000000)
    } else if (typeof dateInput === 'string') {
      date = new Date(dateInput)
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput)
    } else if (dateInput instanceof Date) {
      date = dateInput
    } else {
      return { text: 'Invalid Date', color: '#6b7280' }
    }
    if (isNaN(date.getTime())) return { text: 'Invalid Date', color: '#6b7280' }
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    const diffInWeeks = Math.floor(diffInDays / 7)
    const diffInMonths = Math.floor(diffInDays / 30)
    if (diffInMinutes < 1) return { text: 'Just now', color: '#065f46' }
    if (diffInMinutes < 60) return { text: `${diffInMinutes}m ago`, color: '#065f46' }
    if (diffInHours < 24) return { text: `${diffInHours}h ago`, color: '#065f46' }
    if (diffInDays < 3) return { text: `${diffInDays}d ago`, color: '#92400e' }
    if (diffInDays < 7) return { text: `${diffInDays}d ago`, color: '#92400e' }
    if (diffInWeeks < 4) return { text: `${diffInWeeks}w ago`, color: '#9a3412' }
    if (diffInMonths < 12) return { text: `${diffInMonths}mo ago`, color: '#991b1b' }
    return { text: '>1y ago', color: '#7f1d1d' }
  } catch {
    return { text: 'Invalid Date', color: '#6b7280' }
  }
}


