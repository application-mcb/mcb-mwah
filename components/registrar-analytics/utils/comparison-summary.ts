import { ComparisonData } from '../types'

export const generateComparisonSummary = (
  comparisonData: ComparisonData[]
): string => {
  if (comparisonData.length === 0) {
    return 'No comparison data available.'
  }

  if (comparisonData.length === 1) {
    const data = comparisonData[0]
    return `Academic Year ${data.ay} shows ${data.totalStudents} total students: ${data.studentsByDepartment.jhs} JHS, ${data.studentsByDepartment.shs} SHS, ${data.studentsByDepartment.college} College. Regular students: ${data.analytics.regularVsIrregular.regular}, Irregular: ${data.analytics.regularVsIrregular.irregular}.`
  }

  // Calculate trends
  const totals = comparisonData.map((d) => d.totalStudents)
  const totalChange = totals[totals.length - 1] - totals[0]
  const percentChange =
    totals[0] > 0 ? ((totalChange / totals[0]) * 100).toFixed(1) : '0'

  // Find AY with most students
  const maxAY = comparisonData.reduce((max, curr) =>
    curr.totalStudents > max.totalStudents ? curr : max
  )

  // Calculate department trends
  const jhsTotals = comparisonData.map((d) => d.studentsByDepartment.jhs)
  const shsTotals = comparisonData.map((d) => d.studentsByDepartment.shs)
  const collegeTotals = comparisonData.map((d) => d.studentsByDepartment.college)

  const jhsChange = jhsTotals[jhsTotals.length - 1] - jhsTotals[0]
  const shsChange = shsTotals[shsTotals.length - 1] - shsTotals[0]
  const collegeChange =
    collegeTotals[collegeTotals.length - 1] - collegeTotals[0]

  // Build summary (aim for ~50 words)
  const trendDirection =
    totalChange > 0 ? 'increased' : totalChange < 0 ? 'decreased' : 'remained stable'
  const absChange = Math.abs(totalChange)

  let summary = `Comparing ${comparisonData.length} academic years: Total enrollment ${trendDirection} by ${absChange} students (${percentChange}%). `
  summary += `Peak enrollment: ${maxAY.ay} with ${maxAY.totalStudents} students. `
  
  const departmentChanges: string[] = []
  if (jhsChange !== 0) {
    departmentChanges.push(`JHS ${jhsChange > 0 ? '+' : ''}${jhsChange}`)
  }
  if (shsChange !== 0) {
    departmentChanges.push(`SHS ${shsChange > 0 ? '+' : ''}${shsChange}`)
  }
  if (collegeChange !== 0) {
    departmentChanges.push(`College ${collegeChange > 0 ? '+' : ''}${collegeChange}`)
  }

  if (departmentChanges.length > 0) {
    summary += `Department changes: ${departmentChanges.join(', ')}. `
  }

  // Add key insight about regular vs irregular
  const avgIrregular = comparisonData.reduce(
    (sum, d) =>
      sum +
      (d.analytics.regularVsIrregular.irregular / d.totalStudents) * 100,
    0
  ) / comparisonData.length

  summary += `Average irregular rate: ${avgIrregular.toFixed(1)}%.`

  // Trim to approximately 50 words (roughly 300-350 characters)
  if (summary.length > 350) {
    summary = summary.substring(0, 347) + '...'
  }

  return summary
}

