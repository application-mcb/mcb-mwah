export interface ScholarshipForm {
  code: string
  name: string
  value: number
  minUnit: number
}

export const loadScholarshipsApi = async () => {
  const response = await fetch('/api/scholarships')
  const data = await response.json()
  if (!response.ok || !data.scholarships) throw new Error(data.error || 'Failed to load scholarships')
  return data.scholarships as any[]
}

export const createScholarshipApi = async (form: ScholarshipForm) => {
  const response = await fetch('/api/scholarships', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  })
  const data = await response.json()
  if (!response.ok || !data.success) throw new Error(data.error || 'Failed to create scholarship')
  return true
}

export const updateScholarshipApi = async (id: string, form: ScholarshipForm) => {
  const response = await fetch(`/api/scholarships/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  })
  const data = await response.json()
  if (!response.ok || !data.success) throw new Error(data.error || 'Failed to update scholarship')
  return true
}

export const deleteScholarshipApi = async (id: string) => {
  const response = await fetch(`/api/scholarships/${id}`, { method: 'DELETE' })
  const data = await response.json()
  if (!response.ok || !data.success) throw new Error(data.error || 'Failed to delete scholarship')
  return true
}


