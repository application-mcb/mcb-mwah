'use client'

export function useSubjectSelection({
  setSelectedSubjects,
}: {
  setSelectedSubjects: (updater: (prev: string[]) => string[]) => void
}) {
  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects((prev) => {
      const isSelected = prev.includes(subjectId)
      if (isSelected) return prev.filter((id) => id !== subjectId)
      return [...prev, subjectId]
    })
  }

  return { handleSubjectToggle }
}

export default useSubjectSelection
