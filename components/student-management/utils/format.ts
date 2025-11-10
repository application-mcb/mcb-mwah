// Get date range for filtering
export const getDateRange = (days: number) => {
  const now = new Date()
  const pastDate = new Date()
  pastDate.setDate(now.getDate() - days)
  return pastDate
}

export const getDateTimestamp = (
  dateInput:
    | string
    | number
    | Date
    | { toDate: () => Date }
    | { _seconds: number; _nanoseconds?: number }
    | { seconds: number; nanoseconds?: number }
    | null
    | undefined
): number => {
  try {
    if (!dateInput) {
      return 0
    }

    let date: Date

    // Handle Date objects first (check before other object types)
    if (dateInput instanceof Date) {
      date = dateInput
    }
    // Handle Firestore Timestamp objects (before JSON serialization)
    else if (typeof dateInput === 'object' && 'toDate' in dateInput) {
      date = dateInput.toDate()
    }
    // Handle serialized Firestore timestamps (after JSON serialization)
    else if (typeof dateInput === 'object') {
      if ('_seconds' in dateInput && '_nanoseconds' in dateInput) {
        const seconds = dateInput._seconds
        const nanoseconds = dateInput._nanoseconds || 0
        date = new Date(seconds * 1000 + nanoseconds / 1000000)
      } else if ('seconds' in dateInput && 'nanoseconds' in dateInput) {
        const seconds = dateInput.seconds
        const nanoseconds = dateInput.nanoseconds || 0
        date = new Date(seconds * 1000 + nanoseconds / 1000000)
      } else {
        return 0
      }
    }
    // Handle string dates
    else if (typeof dateInput === 'string') {
      date = new Date(dateInput)
    }
    // Handle number timestamps (milliseconds)
    else if (typeof dateInput === 'number') {
      date = new Date(dateInput)
    } else {
      return 0
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 0
    }

    return date.getTime()
  } catch {
    return 0
  }
}

export const formatFullName = (
  firstName?: string,
  middleName?: string,
  lastName?: string,
  nameExtension?: string
) => {
  if (!lastName && !firstName) return 'N/A'

  const parts: string[] = []

  // Last name first
  if (lastName) {
    parts.push(lastName)
  }

  // First name
  if (firstName) {
    parts.push(firstName)
  }

  // Middle name (if exists, show as initial with period)
  if (middleName && middleName.trim()) {
    const middleInitial = middleName.charAt(0).toUpperCase()
    parts.push(`${middleInitial}.`)
  }

  // Extension (if exists)
  if (nameExtension && nameExtension.trim()) {
    parts.push(nameExtension)
  }

  return parts.join(', ')
}

export const formatDate = (
  dateInput:
    | string
    | number
    | Date
    | { toDate: () => Date }
    | { _seconds: number; _nanoseconds?: number }
    | { seconds: number; nanoseconds?: number }
    | null
    | undefined
) => {
  try {
    if (!dateInput) {
      return 'Invalid Date'
    }

    let date: Date

    // Handle Date objects first (check before other object types)
    if (dateInput instanceof Date) {
      date = dateInput
    }
    // Handle Firestore Timestamp objects (before JSON serialization)
    else if (typeof dateInput === 'object' && 'toDate' in dateInput) {
      date = dateInput.toDate()
    }
    // Handle serialized Firestore timestamps (after JSON serialization)
    else if (typeof dateInput === 'object') {
      if ('_seconds' in dateInput && '_nanoseconds' in dateInput) {
        const seconds = dateInput._seconds
        const nanoseconds = dateInput._nanoseconds || 0
        date = new Date(seconds * 1000 + nanoseconds / 1000000)
      } else if ('seconds' in dateInput && 'nanoseconds' in dateInput) {
        const seconds = dateInput.seconds
        const nanoseconds = dateInput.nanoseconds || 0
        date = new Date(seconds * 1000 + nanoseconds / 1000000)
      } else {
        return 'Invalid Date'
      }
    }
    // Handle string dates
    else if (typeof dateInput === 'string') {
      date = new Date(dateInput)
    }
    // Handle number timestamps (milliseconds)
    else if (typeof dateInput === 'number') {
      date = new Date(dateInput)
    } else {
      return 'Invalid Date'
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date'
    }

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

export const formatBirthDate = (
  dateInput: string | Date | null | undefined
) => {
  try {
    if (!dateInput) {
      return 'Invalid Date'
    }

    let date: Date

    // Handle Date objects first
    if (dateInput instanceof Date) {
      date = dateInput
    }
    // Handle string dates (YYYY-MM-DD format)
    else if (typeof dateInput === 'string') {
      date = new Date(dateInput)
    } else {
      return 'Invalid Date'
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date'
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return 'Invalid Date'
  }
}

export const getInitials = (firstName?: string, _lastName?: string) => {
  const first = firstName?.charAt(0)?.toUpperCase() || ''
  return first
}
