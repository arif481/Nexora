import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Quick Capture API endpoint.
 * Receives a URL + title from a bookmarklet and stores it as a quick task/note.
 *
 * GET /api/quickcapture?url=...&title=...&type=task|note|recipe
 *
 * This route renders a simple HTML page that:
 * 1. Shows confirmation of what was captured
 * 2. Provides a link back to the full app
 *
 * The actual storage happens client-side in the full app,
 * so this route redirects to the app with query params.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url') || '';
  const title = searchParams.get('title') || 'Untitled';
  const type = searchParams.get('type') || 'task';

  // Redirect to the app with pre-filled data
  const appUrl = new URL('/', req.url);

  // Add parameters for the app to pick up and create the item
  appUrl.searchParams.set('quickcapture', '1');
  appUrl.searchParams.set('qc_type', type);
  appUrl.searchParams.set('qc_title', title);
  appUrl.searchParams.set('qc_url', url);

  // Return a simple HTML page that auto-redirects
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Nexora Quick Capture</title>
  <meta http-equiv="refresh" content="2;url=${appUrl.pathname}${appUrl.search}">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      background: #0a0a14; color: #fff; 
      display: flex; align-items: center; justify-content: center; 
      min-height: 100vh; margin: 0; 
    }
    .card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px; padding: 32px; max-width: 400px;
      text-align: center;
    }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h2 { margin: 0 0 8px; font-size: 20px; }
    p { color: rgba(255,255,255,0.6); font-size: 14px; margin: 4px 0; }
    .title { color: #00e5ff; }
    a { color: #00e5ff; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✅</div>
    <h2>Captured!</h2>
    <p class="title">${escapeHtml(title)}</p>
    <p>as ${escapeHtml(type)}</p>
    <p style="margin-top: 16px;">Redirecting to Nexora...</p>
    <p><a href="${appUrl.pathname}${appUrl.search}">Click here</a> if not redirected</p>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
