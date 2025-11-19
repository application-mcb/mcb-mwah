import { NextResponse } from 'next/server'
import { erdSchema, relationships } from '@/lib/erd-schema'

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      collections: erdSchema,
      relationships,
    })
  } catch (error) {
    console.error('Error fetching ERD schema:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

