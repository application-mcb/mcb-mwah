'use client'

export function useSubjectSelection({
  setSelectedSubjectSets,
  setSelectedSubjects,
}: {
  setSelectedSubjectSets: (updater: (prev: string[]) => string[]) => void
  setSelectedSubjects: (updater: (prev: string[]) => string[]) => void
}) {
  const handleSubjectSetToggle = (subjectSetId: string, subjectIds: string[]) => {
    setSelectedSubjectSets((prev) => {
      const isSelected = prev.includes(subjectSetId)
      let newSelectedSets
      if (isSelected) {
        newSelectedSets = prev.filter((id) => id !== subjectSetId)
        setSelectedSubjects((prevSubjects) =>
          prevSubjects.filter((id) => !subjectIds.includes(id))
        )
      } else {
        newSelectedSets = [...prev, subjectSetId]
        setSelectedSubjects((prevSubjects) => {
          const newSubjects = [...prevSubjects]
          subjectIds.forEach((subjectId) => {
            if (!newSubjects.includes(subjectId)) newSubjects.push(subjectId)
          })
          return newSubjects
        })
      }
      return newSelectedSets
    })
  }

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects((prev) => {
      const isSelected = prev.includes(subjectId)
      if (isSelected) return prev.filter((id) => id !== subjectId)
      return [...prev, subjectId]
    })
  }

  return { handleSubjectSetToggle, handleSubjectToggle }
}

export default useSubjectSelection


