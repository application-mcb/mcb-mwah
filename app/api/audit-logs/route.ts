import { NextRequest, NextResponse } from 'next/server'
import {
  AuditLogDatabase,
  AuditCategory,
  AuditStatus,
} from '@/lib/audit-log-database'
import { AuthServer } from '@/lib/auth-server'

const parseLimit = (value: string | null): number => {
  if (!value) return 50
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed)) return 50
  return Math.min(Math.max(parsed, 1), 200)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseLimit(searchParams.get('limit'))

    const logs = await AuditLogDatabase.getRecentLogs(limit)

    return NextResponse.json({ logs })
  } catch (error: any) {
    console.error('Failed to fetch audit logs', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      action,
      category,
      status,
      context,
      actorId,
      actorName,
      actorEmail,
      actorRole,
      source,
      metadata,
    } = body || {}

    if (!action || !category) {
      return NextResponse.json(
        { error: 'action and category are required' },
        { status: 400 }
      )
    }

    const authUser = await AuthServer.verifyToken(request)
    const resolvedActorId = actorId || authUser?.uid || ''
    const resolvedActorName =
      actorName || authUser?.displayName || authUser?.email || 'Unknown user'
    const resolvedActorEmail = actorEmail || authUser?.email || ''
    const resolvedActorRole = actorRole || authUser?.role || 'registrar'

    const log = await AuditLogDatabase.createLog({
      action,
      category: category as AuditCategory,
      status: (status as AuditStatus) || 'info',
      context,
      actorId: resolvedActorId,
      actorName: resolvedActorName,
      actorEmail: resolvedActorEmail,
      actorRole: resolvedActorRole,
      source: source || 'registrar-dashboard',
      metadata: metadata || {},
    })

    return NextResponse.json({ success: true, log })
  } catch (error: any) {
    console.error('Failed to create audit log', error)
    return NextResponse.json(
      { error: 'Failed to create audit log' },
      { status: 500 }
    )
  }
}
