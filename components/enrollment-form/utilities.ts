import {
  Calculator,
  Atom,
  Book,
  Globe,
  Monitor,
  Palette,
  MusicNote,
  BookOpen,
} from '@phosphor-icons/react'

// Function to get appropriate icon based on subject content
export const getSubjectIcon = (subject: any) => {
  const subjectName = (subject.name || '').toLowerCase()
  const subjectCode = (subject.code || '').toLowerCase()

  // Math-related subjects
  if (
    subjectName.includes('math') ||
    subjectName.includes('calculus') ||
    subjectName.includes('algebra') ||
    subjectName.includes('geometry') ||
    subjectName.includes('trigonometry') ||
    subjectName.includes('statistics') ||
    subjectCode.includes('math') ||
    subjectCode.includes('calc')
  ) {
    return Calculator
  }

  // Science-related subjects
  if (
    subjectName.includes('science') ||
    subjectName.includes('physics') ||
    subjectName.includes('chemistry') ||
    subjectName.includes('biology') ||
    subjectName.includes('geology') ||
    subjectName.includes('astronomy') ||
    subjectCode.includes('sci') ||
    subjectCode.includes('phy') ||
    subjectCode.includes('chem') ||
    subjectCode.includes('bio')
  ) {
    return Atom
  }

  // Language/English subjects
  if (
    subjectName.includes('english') ||
    subjectName.includes('language') ||
    subjectName.includes('literature') ||
    subjectName.includes('grammar') ||
    subjectName.includes('reading') ||
    subjectName.includes('writing') ||
    subjectCode.includes('eng') ||
    subjectCode.includes('lang')
  ) {
    return Book
  }

  // Social Studies/History subjects
  if (
    subjectName.includes('history') ||
    subjectName.includes('social') ||
    subjectName.includes('geography') ||
    subjectName.includes('civics') ||
    subjectName.includes('economics') ||
    subjectName.includes('government') ||
    subjectCode.includes('hist') ||
    subjectCode.includes('soc') ||
    subjectCode.includes('geo')
  ) {
    return Globe
  }

  // Computer/Technology subjects
  if (
    subjectName.includes('computer') ||
    subjectName.includes('technology') ||
    subjectName.includes('programming') ||
    subjectName.includes('coding') ||
    subjectName.includes('ict') ||
    subjectName.includes('digital') ||
    subjectCode.includes('comp') ||
    subjectCode.includes('tech') ||
    subjectCode.includes('prog')
  ) {
    return Monitor
  }

  // Art subjects
  if (
    subjectName.includes('art') ||
    subjectName.includes('drawing') ||
    subjectName.includes('painting') ||
    subjectName.includes('visual') ||
    subjectName.includes('design') ||
    subjectCode.includes('art') ||
    subjectCode.includes('draw')
  ) {
    return Palette
  }

  // Music subjects
  if (
    subjectName.includes('music') ||
    subjectName.includes('choir') ||
    subjectName.includes('band') ||
    subjectName.includes('orchestra') ||
    subjectCode.includes('music')
  ) {
    return MusicNote
  }

  // Default icon for other subjects
  return BookOpen
}

// Function to get appropriate icon color based on background
export const getIconColor = (color: string): string => {
  const colorMap: Record<string, string> = {
    'blue-900': '#1d4ed8',
    'blue-900': '#1e40af',
    'red-700': '#b91c1c',
    'red-800': '#991b1b',
    'emerald-700': '#047857',
    'emerald-800': '#065f46',
    'yellow-700': '#a16207',
    'yellow-800': '#92400e',
    'orange-700': '#c2410c',
    'orange-800': '#9a3412',
    'violet-700': '#7c3aed',
    'violet-800': '#5b21b6',
    'purple-700': '#7c3aed',
    'purple-800': '#6b21a8',
    'indigo-700': '#4338ca',
    'indigo-800': '#312e81',
  }
  return colorMap[color] || '#1e40af' // Default to blue if color not found
}

// Helper function to get color value (matches subject-form.tsx getCourseColorValue)
export const getColorValue = (color: string): string => {
  const colorMap: Record<string, string> = {
    'blue-900': '#1e40af',
    'red-800': '#991b1b',
    'emerald-800': '#065f46',
    'yellow-800': '#92400e',
    'orange-800': '#9a3412',
    'violet-800': '#5b21b6',
    'purple-800': '#6b21a8',
    'blue-900': '#1d4ed8',
    'red-700': '#b91c1c',
    'emerald-700': '#047857',
    'yellow-700': '#a16207',
    'orange-700': '#c2410c',
    'violet-700': '#7c3aed',
    'purple-700': '#8b5cf6',
    'indigo-800': '#312e81',
    'indigo-700': '#4338ca',
    'blue-900': '#1e3a8a',
  }
  return colorMap[color] || '#065f46' // Default to emerald-800 (same as subject-form.tsx)
}
