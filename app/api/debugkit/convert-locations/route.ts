import { NextResponse } from 'next/server'
import {
  getProvinces,
  getMunicipalitiesByProvince,
  getBarangaysByMunicipality,
  Province,
  Municipality,
  Barangay,
} from '@/lib/philippines-locations'
import { StudentDatabase, StudentData } from '@/lib/firestore-database'

type LocationCodes = NonNullable<StudentData['locationCodes']>

const municipalityCache = new Map<string, Municipality[]>()
const barangayCache = new Map<string, Barangay[]>()

const getMunicipalitiesCached = async (provinceCode: string) => {
  if (!provinceCode) return []
  if (!municipalityCache.has(provinceCode)) {
    municipalityCache.set(
      provinceCode,
      await getMunicipalitiesByProvince(provinceCode)
    )
  }
  return municipalityCache.get(provinceCode) || []
}

const getBarangaysCached = async (municipalityCode: string) => {
  if (!municipalityCode) return []
  if (!barangayCache.has(municipalityCode)) {
    barangayCache.set(
      municipalityCode,
      await getBarangaysByMunicipality(municipalityCode)
    )
  }
  return barangayCache.get(municipalityCode) || []
}

const normalizeProvince = (
  value: string,
  provinces: Province[]
):
  | {
      name: string
      code: string
      changed: boolean
    }
  | null => {
  if (!value) return null

  const matchByName = provinces.find(
    (province) => province.name.toLowerCase() === value.toLowerCase()
  )
  if (matchByName) {
    return {
      name: matchByName.name,
      code: matchByName.code,
      changed: matchByName.name !== value,
    }
  }

  const matchByCode = provinces.find(
    (province) =>
      province.code === value ||
      province.psgc10DigitCode === value ||
      province.psgc10DigitCode === value.padStart(10, '0')
  )

  if (matchByCode) {
    return {
      name: matchByCode.name,
      code: matchByCode.code,
      changed: true,
    }
  }

  return null
}

const normalizeMunicipality = async (
  value: string,
  provinceCode: string
) => {
  if (!value || !provinceCode) return null

  const municipalities = await getMunicipalitiesCached(provinceCode)
  if (municipalities.length === 0) return null

  const matchByName = municipalities.find(
    (municipality) => municipality.name.toLowerCase() === value.toLowerCase()
  )

  if (matchByName) {
    return {
      name: matchByName.name,
      code: matchByName.code,
      changed: matchByName.name !== value,
    }
  }

  const matchByCode = municipalities.find(
    (municipality) =>
      municipality.code === value ||
      municipality.psgc10DigitCode === value ||
      municipality.psgc10DigitCode === value.padStart(10, '0')
  )

  if (matchByCode) {
    return {
      name: matchByCode.name,
      code: matchByCode.code,
      changed: true,
    }
  }

  return null
}

const normalizeBarangay = async (
  value: string,
  municipalityCode: string
) => {
  if (!value || !municipalityCode) return null

  const barangays = await getBarangaysCached(municipalityCode)
  if (barangays.length === 0) return null

  const matchByName = barangays.find(
    (barangay) => barangay.name.toLowerCase() === value.toLowerCase()
  )

  if (matchByName) {
    return {
      name: matchByName.name,
      code: matchByName.code,
      changed: matchByName.name !== value,
    }
  }

  const matchByCode = barangays.find(
    (barangay) =>
      barangay.code === value ||
      barangay.psgc10DigitCode === value ||
      barangay.psgc10DigitCode === value.padStart(10, '0')
  )

  if (matchByCode) {
    return {
      name: matchByCode.name,
      code: matchByCode.code,
      changed: true,
    }
  }

  return null
}

export async function POST() {
  try {
    const provinces = await getProvinces()
    const students = await StudentDatabase.getAllStudents()

    let updatedCount = 0
    let unchangedCount = 0

    for (const student of students) {
      const updates: Partial<StudentData> = {}
      const locationCodes: LocationCodes = {
        ...(student.locationCodes || {}),
      }
      let changed = false

      const resolvedProvince = normalizeProvince(student.province, provinces)

      const provinceCode =
        resolvedProvince?.code || student.locationCodes?.province || ''

      if (resolvedProvince) {
        if (resolvedProvince.changed) {
          updates.province = resolvedProvince.name
          changed = true
        }
        locationCodes.province = resolvedProvince.code
      }

      const resolvedMunicipality = await normalizeMunicipality(
        student.municipality,
        provinceCode
      )

      const municipalityCode =
        resolvedMunicipality?.code ||
        student.locationCodes?.municipality ||
        ''

      if (resolvedMunicipality) {
        if (resolvedMunicipality.changed) {
          updates.municipality = resolvedMunicipality.name
          changed = true
        }
        locationCodes.municipality = resolvedMunicipality.code
      }

      const resolvedBarangay = await normalizeBarangay(
        student.barangay,
        municipalityCode
      )

      if (resolvedBarangay) {
        if (resolvedBarangay.changed) {
          updates.barangay = resolvedBarangay.name
          changed = true
        }
        locationCodes.barangay = resolvedBarangay.code
      }

      const resolvedPrevProvince = normalizeProvince(
        student.previousSchoolProvince,
        provinces
      )

      const prevProvinceCode =
        resolvedPrevProvince?.code ||
        student.locationCodes?.previousSchoolProvince ||
        ''

      if (resolvedPrevProvince) {
        if (resolvedPrevProvince.changed) {
          updates.previousSchoolProvince = resolvedPrevProvince.name
          changed = true
        }
        locationCodes.previousSchoolProvince = resolvedPrevProvince.code
      }

      const resolvedPrevMunicipality = await normalizeMunicipality(
        student.previousSchoolMunicipality,
        prevProvinceCode
      )

      if (resolvedPrevMunicipality) {
        if (resolvedPrevMunicipality.changed) {
          updates.previousSchoolMunicipality = resolvedPrevMunicipality.name
          changed = true
        }
        locationCodes.previousSchoolMunicipality = resolvedPrevMunicipality.code
      }

      if (changed) {
        updates.locationCodes = locationCodes
        await StudentDatabase.updateStudent(student.uid, updates)
        updatedCount += 1
      } else {
        const hadMissingCodes =
          !student.locationCodes ||
          !student.locationCodes.province ||
          !student.locationCodes.municipality ||
          !student.locationCodes.barangay ||
          !student.locationCodes.previousSchoolProvince ||
          !student.locationCodes.previousSchoolMunicipality

        if (hadMissingCodes) {
          await StudentDatabase.updateStudent(student.uid, {
            locationCodes,
          })
          updatedCount += 1
        } else {
          unchangedCount += 1
        }
      }
    }

    return NextResponse.json({
      success: true,
      total: students.length,
      updated: updatedCount,
      unchanged: unchangedCount,
    })
  } catch (error: any) {
    console.error('Location conversion error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to convert legacy locations',
      },
      { status: 500 }
    )
  }
}

