import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { fileUrl, fileName, documentId } = await request.json();

    if (!fileUrl) {
      return NextResponse.json({ error: 'File URL is required' }, { status: 400 });
    }

    // Fetch the file from Firebase Storage
    const response = await fetch(fileUrl, {
      method: 'GET',
    });

    if (!response.ok) {
      console.error('Failed to fetch file from Firebase Storage:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to fetch file from storage' }, { status: 500 });
    }

    // Get the file blob
    const blob = await response.blob();

    // Set appropriate headers for download
    const headers = new Headers();
    headers.set('Content-Type', blob.type || 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${fileName || 'document'}"`);
    headers.set('Content-Length', blob.size.toString());

    // Return the file blob as response
    return new NextResponse(blob, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Download API error:', error);
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
}
