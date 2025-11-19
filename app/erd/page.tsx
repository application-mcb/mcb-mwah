'use client'

import { useState, useEffect, useRef } from 'react'
import mermaid from 'mermaid'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Database,
  Spinner,
  Eye,
  EyeSlash,
  Printer,
} from '@phosphor-icons/react'

interface FieldDefinition {
  name: string
  type: string
  required: boolean
  description?: string
  isPrimaryKey?: boolean
  isForeignKey?: boolean
  references?: string
}

interface CollectionSchema {
  name: string
  fields: FieldDefinition[]
  subcollections?: string[]
  description?: string
}

interface Relationship {
  from: string
  to: string
  via: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'
}

export default function ERDPage() {
  const [schema, setSchema] = useState<{
    collections: CollectionSchema[]
    relationships: Relationship[]
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFullFields, setShowFullFields] = useState(false)
  const mermaidRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const response = await fetch('/api/erd')
        const data = await response.json()

        if (data.success) {
          setSchema(data)
        } else {
          setError(data.error || 'Failed to load schema')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSchema()
  }, [])

  useEffect(() => {
    if (!schema || !mermaidRef.current) return

    const generateMermaidDiagram = () => {
      let diagram = 'erDiagram\n\n'

      // Helper function to clean entity names
      const cleanEntityName = (name: string): string => {
        return name
          .replace(/\//g, '_')
          .replace(/\{.*?\}/g, '')
          .replace(/[^a-zA-Z0-9_]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '')
      }

      // Generate entities (collections)
      schema.collections.forEach((collection) => {
        const entityName = cleanEntityName(collection.name)

        diagram += `    ${entityName} {\n`

        // Filter fields based on view mode
        let fieldsToShow: FieldDefinition[]
        if (showFullFields) {
          // Show all fields in full view
          fieldsToShow = collection.fields
        } else {
          // Compact view: show only essential fields
          fieldsToShow = collection.fields.filter(
            (field) =>
              field.isPrimaryKey ||
              field.isForeignKey ||
              field.name === 'id' ||
              field.name === 'uid' ||
              field.name === 'name' ||
              field.name === 'email' ||
              field.name === 'userId' ||
              field.name === 'code' ||
              field.name === 'title' ||
              field.name === 'status' ||
              field.name === 'firstName' ||
              field.name === 'lastName' ||
              field.name === 'createdAt'
          )

          // If no important fields found, show first 8 fields
          if (fieldsToShow.length === 0) {
            fieldsToShow = collection.fields.slice(0, 8)
          }
        }

        fieldsToShow.forEach((field) => {
          // Clean field type for Mermaid (must be a single word/simple identifier)
          let cleanType = field.type
            .replace(/\s*\([^)]*\)/g, '') // Remove parentheses and content
            .replace(/'/g, '') // Remove single quotes
            .replace(/\|.*$/g, '') // Remove everything after pipe (union types)
            .replace(/[^a-zA-Z0-9]/g, '') // Remove all special chars (no spaces)
            .trim()

          // Simplify complex types to common base types
          const typeLower = cleanType.toLowerCase()
          if (typeLower.includes('iso') || typeLower.includes('string')) {
            cleanType = 'string'
          } else if (
            typeLower.includes('number') ||
            typeLower.includes('int')
          ) {
            cleanType = 'number'
          } else if (typeLower.includes('boolean') || typeLower === 'bool') {
            cleanType = 'boolean'
          } else if (
            typeLower.includes('object') ||
            typeLower.includes('record')
          ) {
            cleanType = 'object'
          } else if (typeLower.includes('array') || typeLower.includes('[]')) {
            cleanType = 'array'
          } else if (cleanType === '') {
            cleanType = 'any'
          }

          // Limit type length (keep it simple for Mermaid)
          if (cleanType.length > 15) {
            cleanType = cleanType.substring(0, 15)
          }

          // Clean field name for Mermaid (remove dots, replace with underscores)
          let cleanFieldName = field.name
            .replace(/\./g, '_') // Replace dots with underscores
            .replace(/[^a-zA-Z0-9_]/g, '_') // Replace other special chars with underscores
            .replace(/_+/g, '_') // Collapse multiple underscores
            .replace(/^_|_$/g, '') // Remove leading/trailing underscores

          // Ensure field name is not empty
          if (!cleanFieldName) {
            cleanFieldName = 'field'
          }

          let fieldLine = `        ${cleanType} ${cleanFieldName}`
          if (field.isPrimaryKey) {
            fieldLine += ' PK'
          }
          if (field.isForeignKey) {
            fieldLine += ' FK'
          }
          diagram += fieldLine + '\n'
        })

        // Don't add ellipsis - Mermaid doesn't support it in entity definitions
        // The field count is shown in the summary section instead

        diagram += '    }\n\n'
      })

      // Generate relationships
      schema.relationships.forEach((rel) => {
        const fromEntity = cleanEntityName(rel.from)
        const toEntity = cleanEntityName(rel.to)

        let relationSymbol = '||--o{'
        if (rel.type === 'one-to-one') {
          relationSymbol = '||--||'
        } else if (rel.type === 'one-to-many') {
          relationSymbol = '||--o{'
        } else if (rel.type === 'many-to-one') {
          relationSymbol = '}o--||'
        } else if (rel.type === 'many-to-many') {
          relationSymbol = '}o--o{'
        }

        diagram += `    ${fromEntity} ${relationSymbol} ${toEntity} : "${rel.via}"\n`
      })

      return diagram
    }

    const diagramCode = generateMermaidDiagram()

    // Initialize Mermaid
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      er: {
        fontSize: 12,
      },
    })

    // Clear previous content
    if (mermaidRef.current) {
      mermaidRef.current.innerHTML = ''
    }

    // Render diagram
    mermaid
      .render('erd-diagram', diagramCode)
      .then((result) => {
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = result.svg
        }
      })
      .catch((err) => {
        console.error('Error rendering Mermaid diagram:', err)
        setError('Failed to render ERD diagram')
      })
  }, [schema, showFullFields])

  // Print styles hook - must be before any conditional returns
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @media print {
        body * {
          visibility: hidden;
        }
        .print-container,
        .print-container * {
          visibility: visible;
        }
        .print-container {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print {
          display: none !important;
        }
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner
            size={48}
            className="mx-auto text-blue-900 animate-spin mb-4"
          />
          <p
            className="text-gray-600"
            style={{ fontFamily: 'Poppins', fontWeight: 300 }}
          >
            Loading ERD schema...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p
              className="text-red-600 mb-4"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              {error}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!schema) {
    return null
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-white to-blue-50 p-6 print-container overflow-auto"
      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Card className="mb-6 border-none bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 shadow-lg no-print">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center aspect-square shadow-md">
                  <Database size={24} className="text-white" weight="fill" />
                </div>
                <div>
                  <CardTitle
                    className="text-2xl font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    Entity Relationship Diagram
                  </CardTitle>
                  <p
                    className="text-sm text-gray-600 mt-1"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    Firebase Firestore Collections & Relationships
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFullFields(!showFullFields)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-900 text-white hover:bg-blue-800 transition-colors"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  {showFullFields ? (
                    <>
                      <EyeSlash size={18} weight="fill" />
                      <span>Compact View</span>
                    </>
                  ) : (
                    <>
                      <Eye size={18} weight="fill" />
                      <span>Full View</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-900 text-white hover:bg-blue-800 transition-colors"
                  style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                >
                  <Printer size={18} weight="fill" />
                  <span>Print ERD</span>
                </button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* ERD Diagram */}
        <Card className="border-none bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 shadow-lg overflow-hidden">
          <CardContent className="p-6">
            <div
              ref={mermaidRef}
              className="w-full overflow-auto"
              style={{ fontFamily: 'Poppins', fontWeight: 300 }}
            />
          </CardContent>
        </Card>

        {/* Collections Summary */}
        <Card className="mt-6 border-none bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 shadow-lg no-print">
          <CardHeader>
            <CardTitle
              className="text-xl font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Collections Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schema.collections.map((collection) => (
                <div
                  key={collection.name}
                  className="p-4 rounded-lg border border-blue-100 bg-blue-50/50 hover:bg-blue-50 transition-colors"
                >
                  <h3
                    className="font-medium text-blue-900 mb-2"
                    style={{ fontFamily: 'Poppins', fontWeight: 500 }}
                  >
                    {collection.name}
                  </h3>
                  {collection.description && (
                    <p
                      className="text-xs text-gray-600 mb-2"
                      style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                    >
                      {collection.description}
                    </p>
                  )}
                  <p
                    className="text-xs text-blue-900/70"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    {collection.fields.length} field
                    {collection.fields.length !== 1 ? 's' : ''}
                  </p>
                  {collection.subcollections &&
                    collection.subcollections.length > 0 && (
                      <p
                        className="text-xs text-blue-900/70 mt-1"
                        style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                      >
                        {collection.subcollections.length} subcollection
                        {collection.subcollections.length !== 1 ? 's' : ''}
                      </p>
                    )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Relationships Summary */}
        <Card className="mt-6 border-none bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100 shadow-lg no-print">
          <CardHeader>
            <CardTitle
              className="text-xl font-medium bg-gradient-to-r from-blue-900 to-blue-800 bg-clip-text text-transparent"
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
            >
              Relationships
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schema.relationships.map((rel, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border border-blue-100 bg-blue-50/50"
                >
                  <p
                    className="text-sm text-blue-900"
                    style={{ fontFamily: 'Poppins', fontWeight: 400 }}
                  >
                    <span className="font-medium">{rel.from}</span>{' '}
                    <span className="text-blue-900/70">
                      {rel.type === 'one-to-many'
                        ? 'has many'
                        : rel.type === 'many-to-one'
                        ? 'belongs to'
                        : rel.type === 'one-to-one'
                        ? 'has one'
                        : 'has many'}
                    </span>{' '}
                    <span className="font-medium">{rel.to}</span>
                  </p>
                  <p
                    className="text-xs text-gray-600 mt-1"
                    style={{ fontFamily: 'Poppins', fontWeight: 300 }}
                  >
                    via <code className="text-blue-900">{rel.via}</code>
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
