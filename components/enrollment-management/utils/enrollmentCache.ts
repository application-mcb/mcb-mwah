import { SubjectData } from '@/lib/subject-database'
import {
  ExtendedEnrollmentData,
  StudentProfile,
  StudentDocuments,
  SubjectSetData,
  ScholarshipData,
  SubjectAssignmentData,
} from '../types'
import { setupRealtimeListenerUtil } from './realtime'
import {
  fetchSubjectSets,
  fetchSubjects,
  fetchGrades,
  fetchCourses,
  fetchSubjectAssignments,
  fetchProfilesForEnrollments,
  fetchDocumentsForEnrollments,
} from './data-loaders'

type Listener = (state: EnrollmentCacheState) => void

export type EnrollmentCacheState = {
  enrollments: ExtendedEnrollmentData[]
  studentProfiles: Record<string, StudentProfile>
  studentDocuments: Record<string, StudentDocuments>
  subjectSets: Record<number, SubjectSetData[]>
  allSubjectSets: SubjectSetData[]
  subjects: Record<string, SubjectData>
  grades: Record<string, { color: string }>
  courses: Record<string, { color: string }>
  scholarships: ScholarshipData[]
  subjectAssignments: SubjectAssignmentData[]
  currentAYFilter: string
  currentSemesterFilter: string
  // UI prefs
  sortOption: string
  searchQuery: string
  currentPage: number
  // flags
  loading: boolean
  allDataLoaded: boolean
  lastUpdated: number
}

const IDLE_TTL_MS = 300000 // 5 minutes

class EnrollmentCache {
  private state: EnrollmentCacheState = {
    enrollments: [],
    studentProfiles: {},
    studentDocuments: {},
    subjectSets: {},
    allSubjectSets: [],
    subjects: {},
    grades: {},
    courses: {},
    scholarships: [],
    subjectAssignments: [],
    currentAYFilter: '',
    currentSemesterFilter: '',
    sortOption: 'latest',
    searchQuery: '',
    currentPage: 1,
    loading: true,
    allDataLoaded: false,
    lastUpdated: 0,
  }

  private listeners = new Set<Listener>()
  private refCount = 0
  private idleTimer: any = null
  private unsubscribeFn: null | (() => void) = null

  getSnapshot(): EnrollmentCacheState {
    return { ...this.state }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  setPartial(partial: Partial<EnrollmentCacheState>) {
    this.state = { ...this.state, ...partial, lastUpdated: Date.now() }
    for (const l of this.listeners) l(this.getSnapshot())
  }

  async ensureRealtime(toastError?: (m: string, o?: any) => void) {
    // reacquire cancels idle shutdown
    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
      this.idleTimer = null
    }

    this.refCount += 1
    if (this.unsubscribeFn) return

    // Begin initial loading state only if we have no data
    if (!this.state.allDataLoaded && this.state.enrollments.length === 0) {
      this.setPartial({ loading: true })
    }

    const setUnsubscribe = (fn: () => void) => {
      this.unsubscribeFn = fn
    }

    const setEnrollments = (items: ExtendedEnrollmentData[]) => {
      this.setPartial({ enrollments: items })
    }

    const loadStudentProfiles = async (
      enrollmentData: ExtendedEnrollmentData[]
    ) => {
      try {
        const profiles = await fetchProfilesForEnrollments(enrollmentData)
        this.setPartial({ studentProfiles: profiles as any })
      } catch (err) {
        // noop, logging handled upstream if needed
      }
    }

    const loadStudentDocuments = async (
      enrollmentData: ExtendedEnrollmentData[]
    ) => {
      try {
        const documents = await fetchDocumentsForEnrollments(enrollmentData)
        this.setPartial({ studentDocuments: documents as any })
      } catch (err) {
        // noop
      }
    }

    const loadSubjectSets = async () => {
      try {
        const { allSubjectSets, subjectSetsByGrade } = await fetchSubjectSets()
        this.setPartial({
          subjectSets: subjectSetsByGrade as any,
          allSubjectSets: allSubjectSets as any,
        })
      } catch (err) {}
    }

    const loadSubjects = async () => {
      try {
        const subjectsMap = await fetchSubjects()
        this.setPartial({ subjects: subjectsMap as any })
      } catch (err) {}
    }

    const loadGrades = async () => {
      try {
        const gradesMap = await fetchGrades()
        this.setPartial({ grades: gradesMap as any })
      } catch (err) {}
    }

    const loadCourses = async () => {
      try {
        const coursesMap = await fetchCourses()
        this.setPartial({ courses: coursesMap as any })
      } catch (err) {}
    }

    const loadScholarships = async () => {
      // Scholarships are also loaded from UI, but cache them when listener asks
      // No-op here unless underlying util depends on it elsewhere
    }

    const loadSubjectAssignments = async () => {
      try {
        const items = await fetchSubjectAssignments()
        this.setPartial({ subjectAssignments: items as any })
      } catch (err) {}
    }

    await setupRealtimeListenerUtil({
      setLoading: (v: boolean) => this.setPartial({ loading: v }),
      setAllDataLoaded: (v: boolean) => this.setPartial({ allDataLoaded: v }),
      setError: (_: string) => {},
      setCurrentAYFilter: (v: string) => this.setPartial({ currentAYFilter: v }),
      setCurrentSemesterFilter: (v: string) =>
        this.setPartial({ currentSemesterFilter: v }),
      setEnrollments: (items: ExtendedEnrollmentData[]) => setEnrollments(items),
      loadStudentProfiles: (e: ExtendedEnrollmentData[]) =>
        loadStudentProfiles(e),
      loadStudentDocuments: (e: ExtendedEnrollmentData[]) =>
        loadStudentDocuments(e),
      loadSubjectSets,
      loadSubjects,
      loadGrades,
      loadCourses,
      loadScholarships,
      loadSubjectAssignments,
      setUnsubscribe,
      toastError: (msg: string, opts?: any) => toastError?.(msg, opts),
    })
  }

  release() {
    if (this.refCount > 0) this.refCount -= 1
    if (this.refCount > 0) return

    if (this.idleTimer) clearTimeout(this.idleTimer)
    this.idleTimer = setTimeout(() => {
      if (this.refCount === 0 && this.unsubscribeFn) {
        try {
          this.unsubscribeFn()
        } catch {}
        this.unsubscribeFn = null
      }
    }, IDLE_TTL_MS)
  }

  reset() {
    if (this.unsubscribeFn) {
      try {
        this.unsubscribeFn()
      } catch {}
      this.unsubscribeFn = null
    }
    this.state = {
      enrollments: [],
      studentProfiles: {},
      studentDocuments: {},
      subjectSets: {},
      allSubjectSets: [],
      subjects: {},
      grades: {},
      courses: {},
      scholarships: [],
      subjectAssignments: [],
      currentAYFilter: '',
      currentSemesterFilter: '',
      sortOption: 'latest',
      searchQuery: '',
      currentPage: 1,
      loading: true,
      allDataLoaded: false,
      lastUpdated: 0,
    }
  }
}

const enrollmentCache = new EnrollmentCache()
export default enrollmentCache


