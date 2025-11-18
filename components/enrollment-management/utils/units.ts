export const getTotalUnits = (
  subjectIds: string[],
  subjects: Record<string, { lectureUnits?: number; labUnits?: number }>
) => {
  const total = subjectIds.reduce((sum, id) => {
    const s = subjects[id]
    if (!s) {
      console.warn(`Subject ${id} not found in subjects record`)
      return sum
    }
    const lu = Number(s.lectureUnits || 0)
    const la = Number(s.labUnits || 0)
    return sum + lu + la
  }, 0)
  
  console.log(`getTotalUnits: ${subjectIds.length} subject IDs, found ${subjectIds.filter(id => subjects[id]).length} in subjects record, total units: ${total}`)
  return total
}


