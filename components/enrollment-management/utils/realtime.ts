import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase-server'

interface ExtendedEnrollmentDataLite {
  id?: string
  updatedAt?: any
  [key: string]: any
}

interface Args {
  setLoading: (v: boolean) => void
  setAllDataLoaded: (v: boolean) => void
  setError: (v: string) => void
  setCurrentAYFilter: (v: string) => void
  setCurrentSemesterFilter: (v: string) => void
  setEnrollments: (items: ExtendedEnrollmentDataLite[]) => void
  loadStudentProfiles: (enrollments: ExtendedEnrollmentDataLite[]) => Promise<void>
  loadStudentDocuments: (enrollments: ExtendedEnrollmentDataLite[]) => Promise<void>
  loadSubjectSets: () => Promise<void>
  loadSubjects: () => Promise<void>
  loadGrades: () => Promise<void>
  loadCourses: () => Promise<void>
  loadScholarships: () => Promise<void>
  loadSubjectAssignments: () => Promise<void>
  setUnsubscribe: (fn: (() => void) | null) => void
  toastError: (msg: string, opts?: any) => void
}

export async function setupRealtimeListenerUtil({
  setLoading,
  setAllDataLoaded,
  setError,
  setCurrentAYFilter,
  setCurrentSemesterFilter,
  setEnrollments,
  loadStudentProfiles,
  loadStudentDocuments,
  loadSubjectSets,
  loadSubjects,
  loadGrades,
  loadCourses,
  loadScholarships,
  loadSubjectAssignments,
  setUnsubscribe,
  toastError,
}: Args) {
  try {
    setLoading(true)
    setAllDataLoaded(false)
    setError('')

    const response = await fetch('/api/enrollment?getConfig=true')
    const configData = await response.json()
    if (!response.ok || !configData.ayCode) {
      throw new Error('Failed to get system configuration')
    }

    const ayCode = configData.ayCode
    const semester = configData.semester || '1'
    setCurrentAYFilter(ayCode)
    setCurrentSemesterFilter(semester)

    const enrollmentsRef = collection(db, 'enrollments')
    const q = query(enrollmentsRef, where('ayCode', '==', ayCode))

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const enrollments: ExtendedEnrollmentDataLite[] = []
        for (const doc of snapshot.docs) {
          const enrollmentDoc = doc.data() as any
          if (enrollmentDoc.enrollmentData) {
            enrollments.push({ ...enrollmentDoc.enrollmentData, id: doc.id })
          }
        }
        enrollments.sort((a, b) => {
          const dateA = new Date(a.updatedAt).getTime()
          const dateB = new Date(b.updatedAt).getTime()
          return dateB - dateA
        })

        setEnrollments(enrollments)
        setError('')

        try {
          await Promise.all([
            loadStudentProfiles(enrollments),
            loadStudentDocuments(enrollments),
            loadSubjectSets(),
            loadSubjects(),
            loadGrades(),
            loadCourses(),
            loadScholarships(),
            loadSubjectAssignments(),
          ])
          setAllDataLoaded(true)
        } catch (dataError) {
          setError('Failed to load all required data')
        }
      },
      (error) => {
        setError('Failed to listen for real-time updates')
        toastError(
          'Failed to connect to real-time updates. Table may not update automatically.',
          { autoClose: 8000 }
        )
      }
    )

    setUnsubscribe(unsubscribe)
  } catch (error: any) {
    setError('Failed to setup real-time updates: ' + error.message)
    toastError('Unable to setup live table updates. Please check your connection.', {
      autoClose: 10000,
    })
  } finally {
    setLoading(false)
  }
}


