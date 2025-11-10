export const formatFullName = (
  firstName?: string,
  middleName?: string,
  lastName?: string,
  nameExtension?: string
) => {
  if (!lastName && !firstName) return 'N/A'
  const parts: string[] = []
  if (lastName) parts.push(lastName)
  if (firstName) parts.push(firstName)
  if (middleName && middleName.trim()) {
    const middleInitial = middleName.charAt(0).toUpperCase()
    parts.push(`${middleInitial}.`)
  }
  if (nameExtension && nameExtension.trim()) parts.push(nameExtension)
  return parts.join(', ')
}

export const getInitials = (firstName?: string, lastName?: string) => {
  const first = firstName?.charAt(0)?.toUpperCase() || ''
  return first
}

export const buildDeleteConfirmText = (enrollment: any) => {
  const parts = [
    enrollment?.personalInfo?.firstName,
    enrollment?.personalInfo?.middleName
      ? enrollment.personalInfo.middleName.charAt(0).toUpperCase() + '.'
      : '',
    enrollment?.personalInfo?.lastName,
    enrollment?.personalInfo?.nameExtension,
  ].filter(Boolean)
  return `Are you sure you want to delete "${parts.join(' ')}"?`
}
