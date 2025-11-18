'use client'

import React from 'react'
import {
  CheckCircle,
  XCircle,
  GraduationCap,
  FileText,
  BookOpen,
  Calculator,
  Shield,
  User,
} from '@phosphor-icons/react'

interface AIMessageFormatterProps {
  content: string
  subjects?: Array<{
    id: string
    code: string
    name: string
    description?: string
    lectureUnits?: number
    labUnits?: number
    totalUnits?: number
  }>
  transcript?: {
    isCollege: boolean
    transcriptData: Array<{
      subjectName: string
      subjectCode: string
      period1: number | null
      period2: number | null
      period3: number | null
      period4: number | null
      average: number | null
      finalGrade: number | null
      specialStatus: string | null
    }>
    metadata: {
      studentName: string
      studentLevel: string
      studentSection: string | null
      studentSemester: string | null
      ayCode: string
    }
  } | null
}

export default function AIMessageFormatter({
  content,
  subjects = [],
  transcript = null,
}: AIMessageFormatterProps) {
  // Extract sections from content
  const extractSection = (
    text: string,
    startMarker: string,
    endMarker: string
  ): string | null => {
    const startIdx = text.toLowerCase().indexOf(startMarker.toLowerCase())
    if (startIdx === -1) return null

    const endIdx = endMarker
      ? text
          .toLowerCase()
          .indexOf(endMarker.toLowerCase(), startIdx + startMarker.length)
      : text.length

    if (endIdx === -1)
      return text.substring(startIdx + startMarker.length).trim()

    return text.substring(startIdx + startMarker.length, endIdx).trim()
  }

  const extractEnrollmentInfo = (text: string): string => {
    const match = text.match(
      /enrolled for (AY\d+),?\s*(Grade \d+|.*?),?\s*(?:in section\s+)?([^.]*)/i
    )
    if (match) {
      return `${match[1]}${match[2] ? `, ${match[2]}` : ''}${
        match[3] ? `, Section: ${match[3]}` : ''
      }`
    }
    return (
      extractSection(text, 'Enrollment Status', 'Missing') ||
      'Enrollment information available'
    )
  }

  const extractDocumentsInfo = (text: string): string => {
    if (
      text.toLowerCase().includes('no missing') ||
      text.toLowerCase().includes('all required')
    ) {
      return 'All required documents have been submitted.'
    }
    return (
      extractSection(text, 'Missing Documents', 'Subjects') ||
      'Document status information available'
    )
  }

  const extractSubjectsFromText = (text: string): string[] => {
    const subjectsMatch = text.match(
      /subjects?:?\s*([\s\S]+?)(?:\.|Grades|Scholarship|$)/i
    )
    if (subjectsMatch) {
      const subjectsText = subjectsMatch[1]
      const subjects = subjectsText
        .split(/[,;]|and/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.toLowerCase().includes('following'))
      return subjects
    }
    return []
  }

  const extractScholarshipInfo = (text: string): string => {
    const match = text.match(/scholarship[^:]*:\s*([^.]*)/i)
    if (match) {
      return match[1].trim()
    }
    return (
      extractSection(text, 'Scholarship', '') ||
      'Scholarship information available'
    )
  }

  // Check if content contains structured information (check for section headers or specific question types)
  const hasStructuredSections =
    content.includes('**Enrollment Status:**') ||
    content.includes('**Missing Documents:**') ||
    content.includes('**Subjects:**') ||
    content.includes('**Grades:**') ||
    content.includes('**Scholarship:**') ||
    content.includes('Enrollment Status:') ||
    content.includes('Missing Documents:') ||
    content.includes('Subjects:') ||
    content.includes('Grades:') ||
    content.includes('Scholarship:')

  // Also check for natural mentions (without headers)
  const mentionsEnrollment =
    content.toLowerCase().includes('enrolled for') ||
    content.toLowerCase().includes('enrollment status') ||
    (content.toLowerCase().includes('academic year') &&
      content.toLowerCase().includes('grade'))

  const mentionsDocuments =
    content.toLowerCase().includes('missing documents') ||
    content.toLowerCase().includes('all required documents') ||
    content.toLowerCase().includes('documents have been submitted')

  const mentionsGrades =
    content.toLowerCase().includes('grades') ||
    content.toLowerCase().includes('grade information') ||
    content.toLowerCase().includes('available in the grades tab')

  const mentionsScholarship =
    content.toLowerCase().includes('scholarship') ||
    content.toLowerCase().includes('scholarship with')

  const mentionsTranscript =
    content.toLowerCase().includes('transcript') ||
    content.toLowerCase().includes('transcript:') ||
    transcript !== null

  // Check for subject-related questions even without headers
  const isSubjectQuestion =
    content.toLowerCase().includes('subject') ||
    content.toLowerCase().includes('courses') ||
    content.toLowerCase().includes('classes') ||
    content.toLowerCase().includes('what subjects') ||
    content.toLowerCase().includes('which subjects')

  const hasEnrollmentStatus =
    hasStructuredSections ||
    mentionsEnrollment ||
    (content.toLowerCase().includes('enrollment') &&
      !content.toLowerCase().includes('enrollment date'))
  const hasMissingDocuments =
    hasStructuredSections ||
    mentionsDocuments ||
    content.toLowerCase().includes('document status')
  // Check transcript first (takes priority)
  const hasTranscript = mentionsTranscript || transcript !== null
  // If transcript is present, don't show subjects (transcript takes priority)
  const hasSubjects =
    !hasTranscript &&
    (hasStructuredSections ||
      isSubjectQuestion ||
      (subjects.length > 0 &&
        (isSubjectQuestion || content.toLowerCase().includes('subjects:'))))
  const hasGrades =
    hasStructuredSections ||
    mentionsGrades ||
    (content.toLowerCase().includes('grade') &&
      !content.toLowerCase().includes('grade level') &&
      !content.toLowerCase().includes('grade 8'))
  const hasScholarship =
    hasStructuredSections ||
    mentionsScholarship ||
    content.toLowerCase().includes('scholarship')

  // Extract introduction text (friendly greeting at the start)
  const extractIntroduction = (text: string): string | null => {
    const lines = text.split('\n').filter((line) => line.trim())
    if (lines.length === 0) return null

    const firstLine = lines[0].trim()
    // Check if first line is a friendly greeting/intro
    const introPatterns = [
      /^(sure|i'd be happy|i'd be glad|absolutely|of course|here's|here is)/i,
      /^(let me|i can|i'll)/i,
    ]

    if (introPatterns.some((pattern) => pattern.test(firstLine))) {
      // Find where the intro ends (usually before section headers or bullet lists)
      let introEnd = lines.length
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (
          line.startsWith('**') ||
          line.includes(':') ||
          /^[\*\-\•]/.test(line) ||
          line.toLowerCase().includes('enrollment status') ||
          line.toLowerCase().includes('missing documents') ||
          line.toLowerCase().includes('subjects:') ||
          line.toLowerCase().includes('grades:') ||
          line.toLowerCase().includes('scholarship:')
        ) {
          introEnd = i
          break
        }
      }
      return lines.slice(0, introEnd).join(' ').trim()
    }

    return null
  }

  // Format regular text content
  const formatTextContent = (text: string) => {
    const lines = text.split('\n').filter((line) => line.trim())
    const elements: React.ReactNode[] = []
    let currentList: string[] = []
    let hasSuggestion = false
    let suggestionText = ''

    // Extract introduction
    const introduction = extractIntroduction(text)

    // Check for follow-up suggestions
    const suggestionPatterns = [
      /would you like to know about/i,
      /would you like to see/i,
      /would you like/i,
      /want to know about/i,
      /interested in/i,
    ]

    // Check if list items are subject codes (to filter them out when subjects table is shown)
    const isSubjectCode = (item: string): boolean => {
      // Subject codes typically match patterns like "GE5", "ITC102", "PE2", etc.
      return (
        /^[A-Z]{2,6}\d+/.test(item.trim()) ||
        /^[A-Z]{2,6}\s*-/.test(item.trim())
      )
    }

    const flushList = () => {
      if (currentList.length > 0) {
        // Filter out subject codes if subjects table is being shown
        const filteredList = hasSubjects
          ? currentList.filter((item) => !isSubjectCode(item))
          : currentList

        if (filteredList.length > 0) {
          elements.push(
            <ul
              key={`list-${elements.length}`}
              className="space-y-1.5 mt-2 mb-3"
            >
              {filteredList.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-gray-700"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  <span className="text-blue-900 mt-1.5 flex-shrink-0">•</span>
                  <span>{item.trim()}</span>
                </li>
              ))}
            </ul>
          )
        }
        currentList = []
      }
    }

    // Skip introduction lines if found
    let startIndex = 0
    if (introduction) {
      const introLines = introduction.split('\n').filter((l) => l.trim()).length
      startIndex = introLines
    }

    lines.forEach((line, index) => {
      // Skip introduction lines
      if (index < startIndex) return

      const trimmed = line.trim()

      // Check if this line contains a suggestion
      const isSuggestion = suggestionPatterns.some((pattern) =>
        pattern.test(trimmed)
      )
      if (isSuggestion && !hasSuggestion) {
        hasSuggestion = true
        suggestionText = trimmed
        flushList()
        return
      }

      // Skip subject code bullets if subjects table is shown
      if (/^[\*\-\•]\s+/.test(trimmed)) {
        const item = trimmed.replace(/^[\*\-\•]\s+/, '')
        // Skip if it's a subject code and we're showing subjects table
        if (hasSubjects && isSubjectCode(item)) {
          return
        }
        flushList()
        currentList.push(item)
        return
      }

      if (
        trimmed.endsWith(':') &&
        trimmed.length < 50 &&
        !trimmed.includes('**')
      ) {
        flushList()
        return
      }

      if (
        trimmed.length > 0 &&
        !trimmed.includes('**Enrollment Status:**') &&
        !trimmed.includes('**Missing Documents:**') &&
        !trimmed.includes('**Subjects:**') &&
        !trimmed.includes('**Grades:**') &&
        !trimmed.includes('**Scholarship:**') &&
        !trimmed.includes('Enrollment Status:') &&
        !trimmed.includes('Missing Documents:') &&
        !trimmed.includes('Subjects:') &&
        !trimmed.includes('Grades:') &&
        !trimmed.includes('Scholarship:') &&
        !isSuggestion
      ) {
        flushList()
        elements.push(
          <p
            key={`para-${index}`}
            className="text-sm text-gray-700 mb-2"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            {trimmed}
          </p>
        )
      }
    })

    flushList()

    // Add suggestion at the end if found
    if (hasSuggestion && suggestionText) {
      elements.push(
        <div key="suggestion" className="mt-4 pt-3 border-t border-gray-200">
          <p
            className="text-sm text-blue-900 italic"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            {suggestionText}
          </p>
        </div>
      )
    }

    return { introduction, elements }
  }

  // Format content and extract introduction
  const formattedContent = formatTextContent(content)
  const introduction = formattedContent.introduction
  const elements = formattedContent.elements

  // Check if response has markdown headers (comprehensive request) vs natural text (specific question)
  const hasMarkdownHeaders =
    content.includes('**Enrollment Status:**') ||
    content.includes('**Missing Documents:**') ||
    content.includes('**Subjects:**') ||
    content.includes('**Grades:**') ||
    content.includes('**Scholarship:**')

  // If it's a comprehensive request with headers, show structured sections
  // If it's a specific question with natural text, show it naturally
  if (
    hasMarkdownHeaders &&
    (hasEnrollmentStatus ||
      hasMissingDocuments ||
      hasSubjects ||
      hasGrades ||
      hasScholarship)
  ) {
    return (
      <div className="space-y-4">
        {/* Introduction */}
        {introduction && (
          <p
            className="text-sm text-gray-700 mb-3"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            {introduction}
          </p>
        )}
        {hasEnrollmentStatus && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 aspect-square bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
                <GraduationCap size={14} weight="fill" className="text-white" />
              </div>
              <h4
                className="text-sm font-medium text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                Enrollment Status
              </h4>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3">
              <p
                className="text-sm text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                {extractEnrollmentInfo(content)}
              </p>
            </div>
          </div>
        )}

        {hasMissingDocuments && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 aspect-square bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
                {content.toLowerCase().includes('no missing') ||
                content.toLowerCase().includes('all required') ? (
                  <CheckCircle size={14} weight="fill" className="text-white" />
                ) : (
                  <XCircle size={14} weight="fill" className="text-white" />
                )}
              </div>
              <h4
                className="text-sm font-medium text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                Documents Status
              </h4>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3">
              <p
                className="text-sm text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                {extractDocumentsInfo(content)}
              </p>
            </div>
          </div>
        )}

        {hasSubjects && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 aspect-square bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
                <GraduationCap size={14} weight="fill" className="text-white" />
              </div>
              <h4
                className="text-sm font-medium text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                Assigned Subjects
              </h4>
            </div>
            <div className="overflow-hidden bg-white border border-gray-200 rounded-xl">
              {subjects.length > 0 ? (
                <table className="min-w-full border-collapse border border-gray-200">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                        Code
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                        Title
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                        Lecture Units
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                        Lab Units
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Units
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subjects.map((subject) => (
                      <tr key={subject.id}>
                        <td className="px-4 py-2 text-xs text-gray-900 border-r border-gray-200 font-mono">
                          {subject.code || 'N/A'}
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-900 border-r border-gray-200">
                          {subject.name || 'N/A'}
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-700 border-r border-gray-200 text-center">
                          {subject.lectureUnits || 0}
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-700 border-r border-gray-200 text-center">
                          {subject.labUnits || 0}
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-900 text-center font-medium">
                          {subject.totalUnits ||
                            (subject.lectureUnits || 0) +
                              (subject.labUnits || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-4">
                  <p
                    className="text-sm text-gray-500 text-center"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    {extractSection(content, 'Subjects', 'Grades') ||
                      'Subject information available'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {hasGrades && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 aspect-square bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
                <Calculator size={14} weight="fill" className="text-white" />
              </div>
              <h4
                className="text-sm font-medium text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                Grades Information
              </h4>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3">
              <p
                className="text-sm text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                {extractSection(content, 'Grades', 'Scholarship') ||
                  extractSection(content, 'Grade data', 'Scholarship') ||
                  'Grade information is available in the Grades tab.'}
              </p>
            </div>
          </div>
        )}

        {hasScholarship && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 aspect-square bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
                <Shield size={14} weight="fill" className="text-white" />
              </div>
              <h4
                className="text-sm font-medium text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                Scholarship
              </h4>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-3">
              <p
                className="text-sm text-gray-700"
                style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              >
                {extractScholarshipInfo(content)}
              </p>
            </div>
          </div>
        )}

        {hasTranscript && transcript && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 aspect-square bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
                <FileText size={14} weight="fill" className="text-white" />
              </div>
              <h4
                className="text-sm font-medium text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                Transcript
              </h4>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              {/* Transcript Metadata */}
              <div className="mb-4 pb-3 border-b border-gray-200">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span
                      className="text-gray-500"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      Student:
                    </span>
                    <span
                      className="ml-2 text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      {transcript.metadata.studentName}
                    </span>
                  </div>
                  <div>
                    <span
                      className="text-gray-500"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      Level:
                    </span>
                    <span
                      className="ml-2 text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      {transcript.metadata.studentLevel}
                    </span>
                  </div>
                  {transcript.metadata.studentSection && (
                    <div>
                      <span
                        className="text-gray-500"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        Section:
                      </span>
                      <span
                        className="ml-2 text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {transcript.metadata.studentSection}
                      </span>
                    </div>
                  )}
                  {transcript.isCollege &&
                    transcript.metadata.studentSemester && (
                      <div>
                        <span
                          className="text-gray-500"
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          Semester:
                        </span>
                        <span
                          className="ml-2 text-gray-900"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          {transcript.metadata.studentSemester}
                        </span>
                      </div>
                    )}
                  <div className="col-span-2">
                    <span
                      className="text-gray-500"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      Academic Year:
                    </span>
                    <span
                      className="ml-2 text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      {transcript.metadata.ayCode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transcript Table */}
              {transcript.transcriptData &&
              transcript.transcriptData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th
                          className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          Subject
                        </th>
                        <th
                          className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          Code
                        </th>
                        {transcript.isCollege ? (
                          <>
                            <th
                              className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              Prelim
                            </th>
                            <th
                              className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              Midterm
                            </th>
                            <th
                              className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              Finals
                            </th>
                            <th
                              className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              Average
                            </th>
                            <th
                              className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              Final Grade
                            </th>
                          </>
                        ) : (
                          <>
                            <th
                              className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              Q1
                            </th>
                            <th
                              className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              Q2
                            </th>
                            <th
                              className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              Q3
                            </th>
                            <th
                              className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              Q4
                            </th>
                            <th
                              className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              Average
                            </th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transcript.transcriptData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td
                            className="px-3 py-2 text-xs text-gray-900 border-r border-gray-200"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            {row.subjectName}
                          </td>
                          <td
                            className="px-3 py-2 text-xs text-gray-700 border-r border-gray-200 font-mono"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            {row.subjectCode || '-'}
                          </td>
                          {transcript.isCollege ? (
                            <>
                              <td
                                className="px-3 py-2 text-xs text-gray-700 text-center border-r border-gray-200"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {row.specialStatus ||
                                  (row.period1 !== null
                                    ? row.period1.toFixed(1)
                                    : '-')}
                              </td>
                              <td
                                className="px-3 py-2 text-xs text-gray-700 text-center border-r border-gray-200"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {row.specialStatus ||
                                  (row.period2 !== null
                                    ? row.period2.toFixed(1)
                                    : '-')}
                              </td>
                              <td
                                className="px-3 py-2 text-xs text-gray-700 text-center border-r border-gray-200"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {row.specialStatus ||
                                  (row.period3 !== null
                                    ? row.period3.toFixed(1)
                                    : '-')}
                              </td>
                              <td
                                className="px-3 py-2 text-xs text-gray-900 text-center font-medium border-r border-gray-200"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {row.specialStatus ||
                                  (row.average !== null
                                    ? row.average.toFixed(1)
                                    : '-')}
                              </td>
                              <td
                                className="px-3 py-2 text-xs text-gray-900 text-center font-medium"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {row.specialStatus ||
                                  (row.finalGrade !== null
                                    ? row.finalGrade.toFixed(2)
                                    : '-')}
                              </td>
                            </>
                          ) : (
                            <>
                              <td
                                className="px-3 py-2 text-xs text-gray-700 text-center border-r border-gray-200"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {row.specialStatus ||
                                  (row.period1 !== null
                                    ? row.period1.toFixed(1)
                                    : '-')}
                              </td>
                              <td
                                className="px-3 py-2 text-xs text-gray-700 text-center border-r border-gray-200"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {row.specialStatus ||
                                  (row.period2 !== null
                                    ? row.period2.toFixed(1)
                                    : '-')}
                              </td>
                              <td
                                className="px-3 py-2 text-xs text-gray-700 text-center border-r border-gray-200"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {row.specialStatus ||
                                  (row.period3 !== null
                                    ? row.period3.toFixed(1)
                                    : '-')}
                              </td>
                              <td
                                className="px-3 py-2 text-xs text-gray-700 text-center border-r border-gray-200"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {row.specialStatus ||
                                  (row.period4 !== null
                                    ? row.period4.toFixed(1)
                                    : '-')}
                              </td>
                              <td
                                className="px-3 py-2 text-xs text-gray-900 text-center font-medium"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {row.specialStatus ||
                                  (row.average !== null
                                    ? row.average.toFixed(1)
                                    : '-')}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p
                  className="text-sm text-gray-500 text-center"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  No grades recorded for this academic year.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Render any remaining content */}
        {elements.length > 0 && <div className="mt-4">{elements}</div>}
      </div>
    )
  }

  // For specific questions with natural text, show structured sections only if subjects table or transcript is needed
  // Transcript takes priority over subjects - if transcript exists, don't show subjects
  if (
    ((hasTranscript && transcript) ||
      (hasSubjects && subjects.length > 0 && !hasTranscript)) &&
    !hasMarkdownHeaders
  ) {
    return (
      <div className="space-y-4">
        {/* Introduction */}
        {introduction && (
          <p
            className="text-sm text-gray-700 mb-3"
            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
          >
            {introduction}
          </p>
        )}
        {/* Subjects Table - Only show if transcript is NOT present */}
        {hasSubjects && subjects.length > 0 && !hasTranscript && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 aspect-square bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
                <BookOpen size={14} weight="fill" className="text-white" />
              </div>
              <h4
                className="text-sm font-medium text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                Assigned Subjects
              </h4>
            </div>
            <div className="overflow-hidden bg-white border border-gray-200 rounded-xl">
              <table className="min-w-full border-collapse border border-gray-200">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Code
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Title
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Lecture Units
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                      Lab Units
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Units
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subjects.map((subject) => (
                    <tr key={subject.id}>
                      <td className="px-4 py-2 text-xs text-gray-900 border-r border-gray-200 font-mono">
                        {subject.code || 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-900 border-r border-gray-200">
                        {subject.name || 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-700 border-r border-gray-200 text-center">
                        {subject.lectureUnits || 0}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-700 border-r border-gray-200 text-center">
                        {subject.labUnits || 0}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-900 text-center font-medium">
                        {subject.totalUnits ||
                          (subject.lectureUnits || 0) + (subject.labUnits || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Transcript Section */}
        {hasTranscript && transcript && (
          <div className="space-y-2 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 aspect-square bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg flex items-center justify-center">
                <FileText size={14} weight="fill" className="text-white" />
              </div>
              <h4
                className="text-sm font-medium text-gray-900"
                style={{ fontFamily: 'Poppins', fontWeight: 500 }}
              >
                Transcript
              </h4>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              {/* Transcript Metadata */}
              <div className="mb-4 pb-3 border-b border-gray-200">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span
                      className="text-gray-500"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      Student:
                    </span>
                    <span
                      className="ml-2 text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      {transcript.metadata.studentName}
                    </span>
                  </div>
                  <div>
                    <span
                      className="text-gray-500"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      Level:
                    </span>
                    <span
                      className="ml-2 text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      {transcript.metadata.studentLevel}
                    </span>
                  </div>
                  {transcript.metadata.studentSection && (
                    <div>
                      <span
                        className="text-gray-500"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        Section:
                      </span>
                      <span
                        className="ml-2 text-gray-900"
                        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                      >
                        {transcript.metadata.studentSection}
                      </span>
                    </div>
                  )}
                  {transcript.isCollege &&
                    transcript.metadata.studentSemester && (
                      <div>
                        <span
                          className="text-gray-500"
                          style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                        >
                          Semester:
                        </span>
                        <span
                          className="ml-2 text-gray-900"
                          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                        >
                          {transcript.metadata.studentSemester}
                        </span>
                      </div>
                    )}
                  <div className="col-span-2">
                    <span
                      className="text-gray-500"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      Academic Year:
                    </span>
                    <span
                      className="ml-2 text-gray-900"
                      style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                    >
                      {transcript.metadata.ayCode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transcript Table */}
              {transcript.transcriptData &&
              transcript.transcriptData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th
                          className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          Subject
                        </th>
                        <th
                          className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200"
                          style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        >
                          Code
                        </th>
                        {transcript.isCollege ? (
                          <>
                            <th
                              className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              Prelim
                            </th>
                            <th
                              className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              Midterm
                            </th>
                            <th
                              className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              Finals
                            </th>
                            <th
                              className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              Average
                            </th>
                            <th
                              className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              Final Grade
                            </th>
                          </>
                        ) : (
                          <>
                            <th
                              className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              Q1
                            </th>
                            <th
                              className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              Q2
                            </th>
                            <th
                              className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              Q3
                            </th>
                            <th
                              className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-200"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              Q4
                            </th>
                            <th
                              className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase tracking-wider"
                              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                            >
                              Average
                            </th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transcript.transcriptData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td
                            className="px-3 py-2 text-xs text-gray-900 border-r border-gray-200"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            {row.subjectName}
                          </td>
                          <td
                            className="px-3 py-2 text-xs text-gray-700 border-r border-gray-200 font-mono"
                            style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                          >
                            {row.subjectCode || '-'}
                          </td>
                          {transcript.isCollege ? (
                            <>
                              <td
                                className="px-3 py-2 text-xs text-gray-700 text-center border-r border-gray-200"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {row.specialStatus ||
                                  (row.period1 !== null
                                    ? row.period1.toFixed(1)
                                    : '-')}
                              </td>
                              <td
                                className="px-3 py-2 text-xs text-gray-700 text-center border-r border-gray-200"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {row.specialStatus ||
                                  (row.period2 !== null
                                    ? row.period2.toFixed(1)
                                    : '-')}
                              </td>
                              <td
                                className="px-3 py-2 text-xs text-gray-700 text-center border-r border-gray-200"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {row.specialStatus ||
                                  (row.period3 !== null
                                    ? row.period3.toFixed(1)
                                    : '-')}
                              </td>
                              <td
                                className="px-3 py-2 text-xs text-gray-900 text-center font-medium border-r border-gray-200"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {row.specialStatus ||
                                  (row.average !== null
                                    ? row.average.toFixed(1)
                                    : '-')}
                              </td>
                              <td
                                className="px-3 py-2 text-xs text-gray-900 text-center font-medium"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {row.specialStatus ||
                                  (row.finalGrade !== null
                                    ? row.finalGrade.toFixed(2)
                                    : '-')}
                              </td>
                            </>
                          ) : (
                            <>
                              <td
                                className="px-3 py-2 text-xs text-gray-700 text-center border-r border-gray-200"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {row.specialStatus ||
                                  (row.period1 !== null
                                    ? row.period1.toFixed(1)
                                    : '-')}
                              </td>
                              <td
                                className="px-3 py-2 text-xs text-gray-700 text-center border-r border-gray-200"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {row.specialStatus ||
                                  (row.period2 !== null
                                    ? row.period2.toFixed(1)
                                    : '-')}
                              </td>
                              <td
                                className="px-3 py-2 text-xs text-gray-700 text-center border-r border-gray-200"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {row.specialStatus ||
                                  (row.period3 !== null
                                    ? row.period3.toFixed(1)
                                    : '-')}
                              </td>
                              <td
                                className="px-3 py-2 text-xs text-gray-700 text-center border-r border-gray-200"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {row.specialStatus ||
                                  (row.period4 !== null
                                    ? row.period4.toFixed(1)
                                    : '-')}
                              </td>
                              <td
                                className="px-3 py-2 text-xs text-gray-900 text-center font-medium"
                                style={{
                                  fontFamily: 'Poppins',
                                  fontWeight: 400,
                                }}
                              >
                                {row.specialStatus ||
                                  (row.average !== null
                                    ? row.average.toFixed(1)
                                    : '-')}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p
                  className="text-sm text-gray-500 text-center"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  No grades recorded for this academic year.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Render any remaining content */}
        {elements.length > 0 && <div className="mt-4">{elements}</div>}
      </div>
    )
  }

  // Default formatting for natural text responses (specific questions)
  return (
    <div className="space-y-2">
      {introduction && (
        <p
          className="text-sm text-gray-700 mb-3"
          style={{ fontFamily: 'Poppins', fontWeight: 400 }}
        >
          {introduction}
        </p>
      )}
      {elements}
    </div>
  )
}
