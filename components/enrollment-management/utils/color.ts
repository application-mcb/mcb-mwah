export const getBgColor = (color: string): string => {
  const colorMap: { [key: string]: string } = {
    'blue-900': '#1e40af',
    'blue-800': '#1e3a8a',
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
    'purple-700': '#8b5cf6',
    'purple-800': '#6b21a8',
    'indigo-700': '#4338ca',
    'indigo-800': '#312e81',
  }
  return colorMap[color] || '#1e40af'
}

export const getStatusHexColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'approved':
      return '#22c55e'
    case 'pending':
      return '#eab308'
    case 'rejected':
      return '#ef4444'
    case 'enrolled':
      return '#3b82f6'
    default:
      return '#6b7280'
  }
}

export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'approved':
      return 'bg-green-100 text-green-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'rejected':
      return 'bg-red-100 text-red-800'
    case 'enrolled':
      return 'bg-blue-100 text-blue-900'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}


