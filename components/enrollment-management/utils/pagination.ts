export const paginate = <T,>(items: T[], page: number, perPage: number) => {
  const startIndex = (page - 1) * perPage
  const endIndex = startIndex + perPage
  const sliced = items.slice(startIndex, endIndex)
  // Pad with null to always have perPage rows
  const padded = [...sliced]
  while (padded.length < perPage) {
    padded.push(null as any)
  }
  return padded
}

export const getTotalPages = (totalItems: number, perPage: number) => {
  return Math.ceil(totalItems / perPage)
}


