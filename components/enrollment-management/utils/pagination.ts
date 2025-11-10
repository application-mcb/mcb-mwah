export const paginate = <T,>(items: T[], page: number, perPage: number) => {
  const startIndex = (page - 1) * perPage
  const endIndex = startIndex + perPage
  return items.slice(startIndex, endIndex)
}

export const getTotalPages = (totalItems: number, perPage: number) => {
  return Math.ceil(totalItems / perPage)
}


