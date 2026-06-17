// api/connect.js — Vercel Serverless Function (ES Module)
// Tests a Turso (libSQL) connection using the Turso HTTP API.
// No credentials are stored. Stateless per-request.

export default async function handler(req, res) {
  // Allow CORS for same-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { url, token } = req.body || {};

  if (!url || typeof url !== 'string' || !token || typeof token !== 'string') {
    return res.status(400).json({ ok: false, error: 'Both "url" and "token" fields are required.' });
  }

  try {
    // Turso uses libsql:// scheme — convert to https:// for the HTTP pipeline API
    const httpUrl = url.trim().replace(/^libsql:\/\//, 'https://');

    const response = await fetch(`${httpUrl}/v2/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          { type: 'execute', stmt: { sql: 'SELECT 1' } },
          { type: 'close' },
        ],
      }),
    });

    if (response.ok) {
      return res.status(200).json({ ok: true });
    }

    let errorDetail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      errorDetail = body?.message || body?.error || errorDetail;
    } catch (_) {
      // ignore parse errors
    }

    return res.status(200).json({ ok: false, error: errorDetail });
  } catch (err) {
    return res.status(200).json({
      ok: false,
      error: err.message || 'Network error — could not reach the database.',
    });
  }
}
