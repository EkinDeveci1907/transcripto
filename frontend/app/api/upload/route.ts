import { NextRequest, NextResponse } from 'next/server';

// Proxy upload requests from the Next.js server to the FastAPI backend
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
  // Prefer IPv4 loopback to avoid environments where 'localhost' resolves to ::1 (IPv6)
  // In Docker Compose, BACKEND_BASE_URL can be set to http://backend:8000
  const backendBase = process.env.BACKEND_BASE_URL || process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';

    // Read incoming multipart form-data
    const incoming = await req.formData();
    const file = incoming.get('file');
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ detail: 'Missing file' }, { status: 400 });
    }

    // Rebuild form data for the backend
    const form = new FormData();
    const filename = (file as any)?.name || 'audio.webm';
    form.append('file', file, filename);

    const resp = await fetch(`${backendBase}/upload`, {
      method: 'POST',
      body: form,
      // Do not set Content-Type; fetch will set proper multipart boundary
    });

    const contentType = resp.headers.get('content-type') || '';
    const xProc = resp.headers.get('x-process-time-ms') || undefined;
    if (!resp.ok) {
      // Try to surface backend error details
      if (contentType.includes('application/json')) {
        const data = await resp.json();
        const res = NextResponse.json(data, { status: resp.status });
        if (xProc) res.headers.set('x-process-time-ms', xProc);
        return res;
      } else {
        const text = await resp.text();
        const res = NextResponse.json({ detail: text || 'Upstream error' }, { status: resp.status });
        if (xProc) res.headers.set('x-process-time-ms', xProc);
        return res;
      }
    }

    // Success path
    if (contentType.includes('application/json')) {
      const data = await resp.json();
      const res = NextResponse.json(data);
      if (xProc) res.headers.set('x-process-time-ms', xProc);
      return res;
    } else {
      const text = await resp.text();
      const res = NextResponse.json({ transcript: text, summary: '' });
      if (xProc) res.headers.set('x-process-time-ms', xProc);
      return res;
    }
  } catch (err: any) {
    const message = err?.message || 'Proxy failed';
    return NextResponse.json({ detail: message }, { status: 502 });
  }
}
