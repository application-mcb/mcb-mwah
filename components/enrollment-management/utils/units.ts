export const getTotalUnits = (
  subjectIds: string[],
  subjects: Record<string, { lectureUnits?: number; labUnits?: number }>
) => {
  return subjectIds.reduce((sum, id) => {
    const s = subjects[id]
    if (!s) return sum
    const lu = Number(s.lectureUnits || 0)
    const la = Number(s.labUnits || 0)
    return sum + lu + la
  }, 0)
}


