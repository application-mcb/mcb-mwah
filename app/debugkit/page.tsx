'use client';

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

type ConversionStats = {
  total: number
  updated: number
  unchanged: number
}

export default function DebugKitPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [conversionLoading, setConversionLoading] = useState(false)
  const [conversionError, setConversionError] = useState('')
  const [conversionStats, setConversionStats] = useState<ConversionStats | null>(
    null
  )
  const [gradeIdLoading, setGradeIdLoading] = useState(false)
  const [gradeIdError, setGradeIdError] = useState('')
  const [gradeIdStats, setGradeIdStats] = useState<{
    total: number
    collegeEnrollments?: number
    highSchoolEnrollments?: number
    updated: number
    alreadyHasGradeId: number
    errors: number
    errorDetails?: string[]
  } | null>(null)

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/registrar/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Registrar registered successfully!')
        setFormData({ email: '', password: '', firstName: '', lastName: '' })
      } else {
        setMessage(data.error || 'Registration failed')
      }
    } catch (error) {
      setMessage('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleConvertLocations = async () => {
    setConversionLoading(true)
    setConversionError('')
    setConversionStats(null)

    try {
      const response = await fetch('/api/debugkit/convert-locations', {
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Conversion failed')
      }

      setConversionStats({
        total: data.total,
        updated: data.updated,
        unchanged: data.unchanged,
      })
    } catch (error: any) {
      setConversionError(error.message || 'Conversion failed')
    } finally {
      setConversionLoading(false)
    }
  }

  const handleFixGradeId = async () => {
    setGradeIdLoading(true)
    setGradeIdError('')
    setGradeIdStats(null)

    try {
      const response = await fetch('/api/debugkit/fix-grade-id', {
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'GradeId fix failed')
      }

      setGradeIdStats({
        total: data.total,
        updated: data.updated,
        alreadyHasGradeId: data.alreadyHasGradeId,
        errors: data.errors,
        errorDetails: data.errorDetails,
      })
    } catch (error: any) {
      setGradeIdError(error.message || 'GradeId fix failed')
    } finally {
      setGradeIdLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1
            className="text-3xl font-light text-gray-900"
            style={{ fontFamily: 'Poppins' }}
          >
            Registrar Debug Kit
          </h1>
          <p
            className="text-sm text-gray-600 mt-1"
            style={{ fontFamily: 'Poppins' }}
          >
            Internal utilities for registrar onboarding and maintenance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <div>
              <h2
                className="text-xl font-light text-gray-900"
                style={{ fontFamily: 'Poppins' }}
              >
                Register Registrar
              </h2>
              <p
                className="text-xs text-gray-600"
                style={{ fontFamily: 'Poppins' }}
              >
                Create registrar credentials for testing or recovery
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label
                  htmlFor="firstName"
                  className="text-sm font-light"
                  style={{ fontFamily: 'Poppins' }}
                >
                  First Name
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                />
              </div>

              <div>
                <Label
                  htmlFor="lastName"
                  className="text-sm font-light"
                  style={{ fontFamily: 'Poppins' }}
                >
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                />
              </div>

              <div>
                <Label
                  htmlFor="email"
                  className="text-sm font-light"
                  style={{ fontFamily: 'Poppins' }}
                >
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                />
              </div>

              <div>
                <Label
                  htmlFor="password"
                  className="text-sm font-light"
                  style={{ fontFamily: 'Poppins' }}
                >
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="mt-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {loading ? 'Registering...' : 'Register Registrar'}
              </Button>
            </form>

            {message && (
              <div
                className={`mt-2 p-3 rounded text-sm ${
                  message.includes('successfully')
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {message}
              </div>
            )}
          </Card>

          <Card className="p-6 space-y-4">
            <div>
              <h2
                className="text-xl font-light text-gray-900"
                style={{ fontFamily: 'Poppins' }}
              >
                Legacy Address Converter
              </h2>
              <p
                className="text-xs text-gray-600"
                style={{ fontFamily: 'Poppins' }}
              >
                Normalize student location fields and backfill PSGC codes for all
                existing records
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleConvertLocations}
                disabled={conversionLoading}
                className="w-full"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {conversionLoading ? 'Converting...' : 'Convert Legacy Addresses'}
              </Button>

              {conversionError && (
                <div
                  className="p-3 rounded bg-red-100 text-red-800 text-sm"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {conversionError}
                </div>
              )}

              {conversionStats && (
                <div
                  className="p-3 rounded bg-green-50 border border-green-200 text-sm space-y-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  <p className="text-green-900 font-medium">
                    Conversion complete
                  </p>
                  <p>Total students: {conversionStats.total}</p>
                  <p>Updated records: {conversionStats.updated}</p>
                  <p>Already normalized: {conversionStats.unchanged}</p>
                </div>
              )}

              <div
                className="text-xs text-gray-500"
                style={{ fontFamily: 'Poppins' }}
              >
                The conversion process may take several seconds. Keep this tab
                open until it completes.
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div>
              <h2
                className="text-xl font-light text-gray-900"
                style={{ fontFamily: 'Poppins' }}
              >
                Fix Missing GradeId
              </h2>
              <p
                className="text-xs text-gray-600"
                style={{ fontFamily: 'Poppins' }}
              >
                Backfill gradeId for all existing high school enrollment records
                that are missing this field
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleFixGradeId}
                disabled={gradeIdLoading}
                className="w-full"
                style={{ fontFamily: 'Poppins', fontWeight: 300 }}
              >
                {gradeIdLoading ? 'Fixing...' : 'Fix GradeId'}
              </Button>

              {gradeIdError && (
                <div
                  className="p-3 rounded bg-red-100 text-red-800 text-sm"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  {gradeIdError}
                </div>
              )}

              {gradeIdStats && (
                <div
                  className="p-3 rounded bg-green-50 border border-green-200 text-sm space-y-1"
                  style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                >
                  <p className="text-green-900 font-medium">
                    GradeId fix complete
                  </p>
                  <p>Total enrollments processed: {gradeIdStats.total}</p>
                  {gradeIdStats.collegeEnrollments !== undefined && (
                    <p>College enrollments (skipped): {gradeIdStats.collegeEnrollments}</p>
                  )}
                  {gradeIdStats.highSchoolEnrollments !== undefined && (
                    <p>High school enrollments: {gradeIdStats.highSchoolEnrollments}</p>
                  )}
                  <p>Updated records: {gradeIdStats.updated}</p>
                  <p>Already had gradeId: {gradeIdStats.alreadyHasGradeId}</p>
                  {gradeIdStats.errors > 0 && (
                    <>
                      <p className="text-red-700">
                        Errors: {gradeIdStats.errors}
                      </p>
                      {gradeIdStats.errorDetails && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-red-700 text-xs">
                            View error details
                          </summary>
                          <ul className="mt-1 space-y-1 text-xs text-red-600 max-h-32 overflow-y-auto">
                            {gradeIdStats.errorDetails.map((detail, idx) => (
                              <li key={idx}>{detail}</li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </>
                  )}
                </div>
              )}

              <div
                className="text-xs text-gray-500"
                style={{ fontFamily: 'Poppins' }}
              >
                The fix process may take several seconds. Keep this tab open
                until it completes.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
