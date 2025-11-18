export type ValidationStatus = 'valid' | 'warning' | 'invalid' | 'pending'

export interface ValidationField {
  field: string
  expectedValue?: string
  foundValue?: string
  confidence: number
  match: boolean
  notes?: string
}

export interface ValidationDetails {
  matches: ValidationField[]
  mismatches: ValidationField[]
  missingFields: string[]
  extraFields: string[]
}

export interface DocumentValidation {
  extractedText: string
  validationSummary: string
  validationStatus: ValidationStatus
  validationDetails: ValidationDetails
  confidenceScore: number
  keyFindings: string[]
  scannedAt: string
  scannedBy?: string | null
  scanVersion: number
  ocrMethod?: 'gemini' | 'tesseract' | 'hybrid'
}

export interface ScanDocumentRequest {
  documentId: string
  userId: string
  documentType: string
  studentEnrollmentData?: any
  registrarUid?: string
}

export interface ScanDocumentResponse {
  success: boolean
  validation?: DocumentValidation
  error?: string
}

