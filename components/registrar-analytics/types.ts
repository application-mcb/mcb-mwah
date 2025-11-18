export interface RegistrarAnalyticsProps {
  registrarUid: string
  registrarName?: string
}

export interface AnalyticsData {
  studentsByGrade: Record<number, number>
  studentsByStrand: Record<string, number>
  studentsByCourse: Record<string, number>
  regularVsIrregular: { regular: number; irregular: number }
  locationBreakdown: {
    barangay: Record<string, number>
    municipality: Record<string, number>
    province: Record<string, number>
  }
  religionDistribution: Record<string, number>
  birthdateRange: {
    min: string | null
    max: string | null
    ageGroups: Record<string, number>
  }
  genderDistribution: Record<string, number>
  previousSchoolType: Record<string, number>
  previousSchoolDistribution: Record<string, number>
}

export interface StudentProfile {
  uid: string
  province?: string
  municipality?: string
  barangay?: string
  previousSchoolName?: string
  previousSchoolType?: string
  [key: string]: any
}

export interface InsightsContent {
  gradeLevelInsight: string
  gradeLevelForecast: string
  strandInsight: string
  strandForecast: string
  courseInsight: string
  courseForecast: string
  regularIrregularInsight: string
  regularIrregularForecast: string
  genderInsight: string
  genderForecast: string
  religionInsight: string
  religionForecast: string
  ageInsight: string
  ageForecast: string
  provinceInsight: string
  provinceForecast: string
  municipalityInsight: string
  municipalityForecast: string
  barangayInsight: string
  barangayForecast: string
  schoolTypeInsight: string
  schoolTypeForecast: string
  schoolInsight: string
  schoolForecast: string
}

export interface ChartDataPoint {
  name: string
  students: number
}

export interface ChartDataPointWithFullName extends ChartDataPoint {
  fullName?: string
}

export interface PieChartDataPoint {
  name: string
  value: number
}

export interface RegularIrregularDataPoint {
  name: string
  value: number
}

export interface ComparisonData {
  ay: string
  analytics: AnalyticsData
  totalStudents: number
  studentsByDepartment: {
    jhs: number
    shs: number
    college: number
  }
}

export interface ComparisonChartDataPoint {
  name: string
  [ay: string]: string | number
}

