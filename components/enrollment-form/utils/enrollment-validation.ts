export const validatePersonalInfo = (personalInfo: any) => {
  // First name validation
  if (!personalInfo.firstName?.trim()) {
    return { isValid: false, message: 'Please enter your first name' }
  }

  // Last name validation
  if (!personalInfo.lastName?.trim()) {
    return { isValid: false, message: 'Please enter your last name' }
  }

  // Date of birth validation
  if (!personalInfo.birthMonth) {
    return { isValid: false, message: 'Please select your birth month' }
  }

  if (!personalInfo.birthDay) {
    return { isValid: false, message: 'Please select your birth day' }
  }

  if (!personalInfo.birthYear) {
    return { isValid: false, message: 'Please select your birth year' }
  }

  // Phone number validation
  if (!personalInfo.phone?.trim()) {
    return { isValid: false, message: 'Please enter your phone number' }
  }

  if (!personalInfo.phone.startsWith('+63')) {
    return { isValid: false, message: 'Phone number must start with +63' }
  }

  const phoneDigits = personalInfo.phone.replace(/\D/g, '')
  if (phoneDigits.length !== 12) {
    // +63 (2) + 10 digits = 12 total
    return { isValid: false, message: 'Please enter a valid 10-digit Philippine phone number' }
  }

  // Gender validation
  if (!personalInfo.gender) {
    return { isValid: false, message: 'Please select your gender' }
  }

  // Civil status validation
  if (!personalInfo.civilStatus) {
    return { isValid: false, message: 'Please select your civil status' }
  }

  // Additional required field validation
  if (!personalInfo.email?.trim()) {
    return { isValid: false, message: 'Please enter your email address' }
  }

  if (!personalInfo.placeOfBirth?.trim()) {
    return { isValid: false, message: 'Please enter your place of birth' }
  }

  if (!personalInfo.citizenship?.trim()) {
    return { isValid: false, message: 'Please enter your citizenship' }
  }

  if (!personalInfo.religion?.trim()) {
    return { isValid: false, message: 'Please enter your religion' }
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(personalInfo.email)) {
    return { isValid: false, message: 'Please enter a valid email address' }
  }

  return { isValid: true, message: '' }
}

export const validateCompliance = (complianceChecked: boolean) => {
  if (!complianceChecked) {
    return { isValid: false, message: 'Please check the compliance box to proceed' }
  }
  return { isValid: true, message: '' }
}

export const validateDocuments = (documentsStatus: any) => {
  if (!documentsStatus?.isComplete) {
    return {
      isValid: false,
      message: `Please upload all required documents (${documentsStatus?.required || 4}) before submitting your enrollment. You have uploaded ${documentsStatus?.uploaded || 0} of ${documentsStatus?.required || 4} required documents.`
    }
  }
  return { isValid: true, message: '' }
}
