export const formatPhoneNumber = (value: string) => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '')

  // If empty, return empty
  if (!digits) return ''

  // If starts with 63, keep it
  if (digits.startsWith('63')) {
    const withoutCountryCode = digits.substring(2)
    if (withoutCountryCode.length <= 10) {
      // Format as +63 XXX XXX XXXX
      const formatted = withoutCountryCode.replace(
        /(\d{3})(\d{3})(\d{4})/,
        '$1 $2 $3'
      )
      return `+63${formatted}`
    }
  }

  // If starts with 0, remove it and add +63
  if (digits.startsWith('0')) {
    const withoutZero = digits.substring(1)
    if (withoutZero.length <= 10) {
      const formatted = withoutZero.replace(
        /(\d{3})(\d{3})(\d{4})/,
        '$1 $2 $3'
      )
      return `+63${formatted}`
    }
  }

  // If doesn't start with 63 or 0, treat as local number
  if (digits.length <= 10) {
    const formatted = digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
    return `+63${formatted}`
  }

  // If too long, truncate to 10 digits
  const truncated = digits.substring(0, 10)
  const formatted = truncated.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
  return `+63${formatted}`
}

export const calculateAgeFromValues = (
  birthMonth: string,
  birthDay: string,
  birthYear: string
) => {
  if (!birthMonth || !birthDay || !birthYear) {
    return null
  }

  const birthDate = new Date(
    parseInt(birthYear),
    parseInt(birthMonth) - 1,
    parseInt(birthDay)
  )
  const today = new Date()

  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  // If birthday hasn't occurred this year yet, subtract 1 from age
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--
  }

  // Validate that the calculated age is reasonable (between 5 and 100)
  if (age >= 5 && age <= 100) {
    console.log(
      `Age calculated: ${age} years old (DOB: ${birthMonth}/${birthDay}/${birthYear})`
    )
    return age
  } else {
    console.log(`Invalid age calculated: ${age} (must be between 5-100)`)
    return null
  }
}

// Helper function to determine if a grade level is regular or irregular
export const isRegularGradeLevel = (gradeLevel: number): boolean => {
  // Regular grades: 7 (JHS entry), 11 (SHS entry), 1 (College freshman)
  return gradeLevel === 7 || gradeLevel === 11 || gradeLevel === 1
}

// Helper function to determine if a college year/semester combination is regular or irregular
export const isRegularYearSemester = (
  yearLevel: number,
  semester: 'first-sem' | 'second-sem'
): boolean => {
  // Regular: Only Year 1 First Semester is the starting point
  // Everything else is irregular (transferees, returnees, etc.)
  return yearLevel === 1 && semester === 'first-sem'
}
