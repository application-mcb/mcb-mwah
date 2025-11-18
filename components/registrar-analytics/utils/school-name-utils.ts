const abbreviations: Record<string, string> = {
  college: 'coll',
  university: 'univ',
  institute: 'inst',
  institution: 'inst',
  school: 'sch',
  'high school': 'hs',
  elementary: 'elem',
  national: 'natl',
  of: 'of',
  the: 'the',
}

const levenshteinDistance = (str1: string, str2: string): number => {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = []

  for (let i = 0; i <= m; i++) {
    dp[i] = [i]
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + 1)
      }
    }
  }

  return dp[m][n]
}

const calculateSimilarity = (str1: string, str2: string): number => {
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 100
  const distance = levenshteinDistance(str1, str2)
  return ((maxLen - distance) / maxLen) * 100
}

const normalizeSchoolName = (name: string): string => {
  if (!name) return ''

  let normalized = name.toLowerCase().trim()
  normalized = normalized.replace(/\s+/g, ' ')
  normalized = normalized.replace(/[^\w\s]/g, '')

  Object.entries(abbreviations).forEach(([full, abbrev]) => {
    const regex = new RegExp(`\\b${full}\\b`, 'gi')
    normalized = normalized.replace(regex, abbrev)
  })

  return normalized.trim()
}

export const normalizeSchoolNames = (schoolNames: string[]): Record<string, string> => {
  const normalizedMap: Record<string, string> = {}
  const groups: Array<{ canonical: string; variants: string[] }> = []

  const normalizedNames = schoolNames.map((name) => ({
    original: name,
    normalized: normalizeSchoolName(name),
  }))

  normalizedNames.forEach(({ original, normalized }) => {
    if (!normalized) {
      normalizedMap[original] = original
      return
    }

    let foundGroup = false
    for (const group of groups) {
      const groupNormalized = normalizeSchoolName(group.canonical)
      const similarity = calculateSimilarity(normalized, groupNormalized)

      if (similarity >= 85) {
        group.variants.push(original)
        normalizedMap[original] = group.canonical
        foundGroup = true
        break
      }
    }

    if (!foundGroup) {
      groups.push({
        canonical: original,
        variants: [original],
      })
      normalizedMap[original] = original
    }
  })

  const variantCounts: Record<string, number> = {}
  schoolNames.forEach((name) => {
    variantCounts[name] = (variantCounts[name] || 0) + 1
  })

  groups.forEach((group) => {
    let mostFrequent = group.canonical
    let maxCount = variantCounts[group.canonical] || 0

    group.variants.forEach((variant) => {
      const count = variantCounts[variant] || 0
      if (count > maxCount) {
        maxCount = count
        mostFrequent = variant
      }
    })

    group.variants.forEach((variant) => {
      normalizedMap[variant] = mostFrequent
    })
  })

  return normalizedMap
}

