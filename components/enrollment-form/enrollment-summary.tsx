'use client'

import { Button } from '@/components/ui/button'
import { Check, BookOpen, X, Stack } from '@phosphor-icons/react'
import { getSubjectIcon, getColorValue } from '@/components/enrollment-form/utilities'

type EnrollmentSummaryProps = {
  enrollmentToShow: any
  subjects: any[]
  loadingSubjects: boolean
  subjectsCarouselIndex: number
  onSetSubjectsCarouselIndex: (index: number) => void
  onShowDeleteModal: () => void
}

export default function EnrollmentSummary({
  enrollmentToShow,
  subjects,
  loadingSubjects,
  subjectsCarouselIndex,
  onSetSubjectsCarouselIndex,
  onShowDeleteModal,
}: EnrollmentSummaryProps) {
  const formatDate = (dateInput: any) => {
    try {
      let date: Date

      // Handle Firestore Timestamp objects (before JSON serialization)
      if (
        dateInput &&
        typeof dateInput === 'object' &&
        'toDate' in dateInput
      ) {
        date = dateInput.toDate()
      }
      // Handle serialized Firestore timestamps (after JSON serialization)
      else if (
        dateInput &&
        typeof dateInput === 'object' &&
        ('_seconds' in dateInput || 'seconds' in dateInput)
      ) {
        const seconds = dateInput._seconds || dateInput.seconds
        const nanoseconds =
          dateInput._nanoseconds || dateInput.nanoseconds || 0
        date = new Date(seconds * 1000 + nanoseconds / 1000000)
      }
      // Handle string dates
      else if (typeof dateInput === 'string') {
        date = new Date(dateInput)
      }
      // Handle number timestamps (milliseconds)
      else if (typeof dateInput === 'number') {
        date = new Date(dateInput)
      }
      // Handle Date objects
      else if (dateInput instanceof Date) {
        date = dateInput
      } else {
        return 'Invalid Date'
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date'
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'Invalid Date'
    }
  }

  const formatFullName = (
    firstName?: string,
    middleName?: string,
    lastName?: string,
    nameExtension?: string
  ) => {
    if (!lastName && !firstName) return 'N/A'

    const parts: string[] = []

    // Last name first
    if (lastName) {
      parts.push(lastName)
    }

    // First name
    if (firstName) {
      parts.push(firstName)
    }

    // Middle name (if exists, show as initial with period)
    if (middleName && middleName.trim()) {
      const middleInitial = middleName.charAt(0).toUpperCase()
      parts.push(`${middleInitial}.`)
    }

    // Extension (if exists)
    if (nameExtension && nameExtension.trim()) {
      parts.push(nameExtension)
    }

    return parts.join(', ')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enrolled':
        return 'bg-blue-900 text-white'
      case 'approved':
        return 'bg-gray-100 text-gray-800'
      case 'pending':
        return 'bg-gray-200 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'enrolled':
        return <Check size={16} weight="bold" />
      case 'approved':
        return <Check size={16} weight="bold" />
      case 'pending':
        return <Check size={16} weight="bold" />
      default:
        return <Check size={16} weight="bold" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-900 flex items-center justify-center">
              <Check size={20} className="text-white" weight="bold" />
            </div>
            <div>
              <h1
                className="text-2xl font-medium text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                Enrollment Submitted
              </h1>
              <p className="text-sm text-gray-600">
                Your enrollment application has been submitted and is being
                processed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment Details Grid */}
      <div className="space-y-6">
        {/* First Row - Personal Info, Academic Info, Actions */}

        {/* Second Row - Subjects Carousel */}
        <div className="bg-white p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-blue-900 flex items-center justify-center">
              <BookOpen size={16} className="text-white" weight="bold" />
            </div>
            <h3
              className="text-lg font-medium text-gray-900"
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              Enrolled Subjects
            </h3>
          </div>

          {/* Subjects Carousel */}
          <div className="relative overflow-hidden">
            {loadingSubjects ? (
              <div className="flex justify-center">
                <div className="p-8 bg-gray-50 border border-gray-200 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-900/30 border-t-blue-900 mx-auto mb-3"></div>
                  <h4
                    className="text-sm font-medium text-gray-500 mb-2"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Loading subjects...
                  </h4>
                  <p
                    className="text-xs text-gray-400"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Please wait while we fetch your enrolled subjects
                  </p>
                </div>
              </div>
            ) : subjects && subjects.length > 0 ? (
              <>
                <div
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{
                    transform: `translateX(-${subjectsCarouselIndex * 100}%)`,
                  }}
                >
                  {Array.from({ length: Math.ceil(subjects.length / 3) }).map(
                    (_, groupIndex) => (
                      <div
                        key={groupIndex}
                        className="w-full flex-shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-500"
                        style={{ animationDelay: `${groupIndex * 150}ms` }}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {subjects
                            .slice(groupIndex * 3, (groupIndex + 1) * 3)
                            .map((subject: any, subjectIndex: number) => {
                              const IconComponent = getSubjectIcon(subject)
                              return (
                                <div
                                  key={subject.id}
                                  className="group p-6 border-none hover:shadow-lg hover:-translate-y-2 transition-all duration-300 ease-in-out border-1 shadow-sm transform hover:scale-105 animate-in fade-in slide-in-from-bottom-4"
                                  style={{
                                    backgroundColor: getColorValue(
                                      subject.color
                                    ),
                                    borderLeftColor: getColorValue(
                                      subject.color
                                    ),
                                    animationDelay: `${
                                      groupIndex * 150 +
                                      subjectIndex * 75 +
                                      200
                                    }ms`,
                                    animationFillMode: 'both',
                                  }}
                                >
                                  {/* Card Header */}
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                      <div className="w-16 h-16 bg-white flex items-center justify-center flex-shrink-0">
                                        <IconComponent
                                          size={32}
                                          style={{
                                            color: getColorValue(
                                              subject.color
                                            ),
                                          }}
                                          weight="fill"
                                        />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-3">
                                          <h3
                                            className="text-lg font-medium text-white"
                                            style={{
                                              fontFamily: 'Poppins',
                                              fontWeight: 500,
                                            }}
                                          >
                                            {subject.code}
                                          </h3>
                                        </div>
                                        <div className="flex gap-1">
                                          <div className="w-3 h-3 bg-white"></div>
                                          <div className="w-3 h-3 bg-white/80"></div>
                                          <div className="w-3 h-3 bg-white/60"></div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4 mb-4">
                                    <div className="flex items-center p-1 text-xs font-medium rounded-none border border-white/30 bg-white/20 text-white">
                                      <BookOpen
                                        size={12}
                                        className="mr-1"
                                        weight="duotone"
                                      />
                                      Grade {subject.gradeLevel}
                                    </div>
                                    <div className="flex items-center p-1 text-xs font-medium rounded-none border border-white/30 bg-white/20 text-white">
                                      <Stack size={12} className="mr-1" weight="duotone" />
                                      {(subject.lectureUnits || 0) +
                                        (subject.labUnits || 0)}{' '}
                                      units
                                    </div>
                                  </div>

                                  <div className="flex flex-col text-xs truncate-2-lines font-light text-justify">
                                    <span className="text-white text-sm font-medium">
                                      {subject.code} {subject.name}
                                    </span>
                                    <span className="text-white">
                                      {subject.description}
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Subjects carousel dots */}
                <div className="flex justify-center mt-4 space-x-2">
                  {Array.from({ length: Math.ceil(subjects.length / 3) }).map(
                    (_, index) => (
                      <button
                        key={index}
                        onClick={() => onSetSubjectsCarouselIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                          index === subjectsCarouselIndex
                            ? 'bg-blue-900'
                            : 'bg-gray-300'
                        }`}
                      />
                    )
                  )}
                </div>
              </>
            ) : (
              <div className="flex-shrink-0 w-full">
                <div className="p-8 bg-gray-50 border border-gray-200 text-center">
                  <BookOpen
                    size={32}
                    className="mx-auto text-gray-400 mb-3"
                  />
                  <h4
                    className="text-sm font-medium text-gray-500 mb-2"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    No subjects found
                  </h4>
                  <p
                    className="text-xs text-gray-400"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    No subjects are currently assigned to your grade level
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={onShowDeleteModal}
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <X size={16} className="mr-2" />
          Delete Enrollment Submission
        </Button>
      </div>
    </div>
  )
}
