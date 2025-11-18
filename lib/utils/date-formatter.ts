// Date formatting utilities for events

/**
 * Format a date as words (e.g., "January 15, 2024")
 * @param date - Date object or ISO string
 * @returns Formatted date string
 */
export const formatDateAsWords = (date: Date | string): string => {
  const dateObj = date instanceof Date ? date : new Date(date)

  if (isNaN(dateObj.getTime())) {
    return 'Invalid date'
  }

  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format a date range as words (e.g., "January 15 - January 20, 2024")
 * @param startDate - Start date object or ISO string
 * @param endDate - End date object or ISO string (optional - if null, shows only start date)
 * @returns Formatted date range string
 */
export const formatDateRangeAsWords = (
  startDate: Date | string,
  endDate: Date | string | null
): string => {
  const start = startDate instanceof Date ? startDate : new Date(startDate)

  if (isNaN(start.getTime())) {
    return 'Invalid date'
  }

  // If no end date, just show the start date
  if (!endDate) {
    return formatDateAsWords(start)
  }

  const end = endDate instanceof Date ? endDate : new Date(endDate)

  if (isNaN(end.getTime())) {
    return formatDateAsWords(start)
  }

  // If start and end are the same day, just show one date
  if (start.toDateString() === end.toDateString()) {
    return formatDateAsWords(start)
  }

  const startFormatted = start.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  })

  const endFormatted = end.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  // If same month, only show year once
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${startFormatted} - ${end.toLocaleDateString('en-US', { day: 'numeric' })}, ${end.getFullYear()}`
  }

  return `${startFormatted} - ${endFormatted}`
}

/**
 * Get relative time description (e.g., "in 3 days", "2 days ago")
 * @param date - Date object or ISO string
 * @returns Relative time string
 */
export const getRelativeTime = (date: Date | string): string => {
  const dateObj = date instanceof Date ? date : new Date(date)
  const now = new Date()
  const diffInMs = dateObj.getTime() - now.getTime()
  const diffInDays = Math.floor(Math.abs(diffInMs) / (1000 * 60 * 60 * 24))

  if (diffInMs < 0) {
    // Past date
    if (diffInDays === 0) {
      return 'today'
    } else if (diffInDays === 1) {
      return 'yesterday'
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7)
      return `${weeks} week${weeks === 1 ? '' : 's'} ago`
    } else {
      return formatDateAsWords(dateObj)
    }
  } else {
    // Future date
    if (diffInDays === 0) {
      return 'today'
    } else if (diffInDays === 1) {
      return 'tomorrow'
    } else if (diffInDays < 7) {
      return `in ${diffInDays} days`
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7)
      return `in ${weeks} week${weeks === 1 ? '' : 's'}`
    } else {
      return formatDateAsWords(dateObj)
    }
  }
}

