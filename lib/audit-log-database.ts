import {
  addDoc,
  collection,
  getDocs,
  limit as limitDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase-server'

export type AuditCategory =
  | 'access'
  | 'enrollment'
  | 'course'
  | 'analytics'
  | 'subjects'
  | 'tasks'
  | 'documents'
  | 'ai'
  | 'events'
  | 'sections'
  | 'teachers'
  | 'chat'
  | 'students'
  | 'grades'

export type AuditStatus = 'success' | 'info'

export interface CreateAuditLogInput {
  action: string
  category: AuditCategory
  status?: AuditStatus
  context?: string
  actorId?: string
  actorName?: string
  actorEmail?: string
  actorRole?: string
  source?: string
  metadata?: Record<string, any>
}

export interface AuditLogRecord extends CreateAuditLogInput {
  id: string
  docId: string
  createdAt: string
  metadata?: Record<string, any>
}

const COLLECTION = 'auditLogs'

const CATEGORY_FALLBACK: AuditCategory = 'enrollment'
const CATEGORIES: Set<AuditCategory> = new Set([
  'access',
  'enrollment',
  'course',
  'analytics',
  'subjects',
  'tasks',
  'documents',
  'ai',
  'events',
  'sections',
  'teachers',
  'chat',
  'students',
  'grades',
])

const normalizeTimestamp = (value: any): string => {
  if (!value) {
    return new Date().toISOString()
  }

  if (value instanceof Timestamp) {
    return value.toDate().toISOString()
  }

  if (typeof value === 'string') {
    return new Date(value).toISOString()
  }

  if (value?.toDate) {
    return value.toDate().toISOString()
  }

  return new Date().toISOString()
}

const resolveCategory = (category: string | AuditCategory): AuditCategory => {
  return CATEGORIES.has(category as AuditCategory)
    ? (category as AuditCategory)
    : CATEGORY_FALLBACK
}

const generateShortId = (): string => {
  const randomPortion = Math.floor(100000 + Math.random() * 900000).toString()
  return randomPortion
}

const pruneUndefined = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map(pruneUndefined).filter((v) => v !== undefined)
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((acc: any, [key, val]) => {
      const cleaned = pruneUndefined(val)
      if (cleaned !== undefined) {
        acc[key] = cleaned
      }
      return acc
    }, {})
  }
  return value === undefined ? undefined : value
}

export class AuditLogDatabase {
  static async createLog(entry: CreateAuditLogInput): Promise<AuditLogRecord> {
    const safeCategory = resolveCategory(entry.category)
    const shortId = generateShortId()

    const sanitizedMetadata =
      entry.metadata && typeof entry.metadata === 'object'
        ? pruneUndefined(entry.metadata)
        : {}

    const payload: any = {
      action: entry.action,
      category: safeCategory,
      status: entry.status || 'info',
      context: entry.context || '',
      actorId: entry.actorId || '',
      actorName: entry.actorName || 'Unknown user',
      actorEmail: entry.actorEmail || '',
      actorRole: entry.actorRole || 'registrar',
      source: entry.source || 'registrar-dashboard',
      shortId,
      metadata: sanitizedMetadata,
      createdAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, COLLECTION), payload)

    return {
      id: shortId,
      docId: docRef.id,
      action: payload.action,
      category: payload.category,
      status: payload.status,
      context: payload.context,
      actorId: payload.actorId,
      actorName: payload.actorName,
      actorEmail: payload.actorEmail,
      actorRole: payload.actorRole,
      source: payload.source,
      metadata: payload.metadata,
      createdAt: new Date().toISOString(),
    }
  }

  static async getRecentLogs(limit = 50): Promise<AuditLogRecord[]> {
    const boundedLimit = Math.min(Math.max(limit, 1), 200)
    const logsQuery = query(
      collection(db, COLLECTION),
      orderBy('createdAt', 'desc'),
      limitDocs(boundedLimit)
    )

    const snapshot = await getDocs(logsQuery)

    return snapshot.docs.map((doc) => {
      const data: any = doc.data()
      const createdAt = normalizeTimestamp(data.createdAt)

      return {
        id: data.shortId || data.id || doc.id,
        docId: doc.id,
        action: data.action || 'Unknown action',
        category: resolveCategory(data.category || CATEGORY_FALLBACK),
        status: (data.status as AuditStatus) || 'info',
        context: data.context || '',
        actorId: data.actorId || '',
        actorName: data.actorName || 'Unknown user',
        actorEmail: data.actorEmail || '',
        actorRole: data.actorRole || 'registrar',
        source: data.source || 'registrar-dashboard',
        metadata: data.metadata || {},
        createdAt,
      }
    })
  }
}
