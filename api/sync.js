// api/sync.js — Vercel Serverless Function (ES Module)
// Upserts a single POS data collection into the Turso pos_data table.
// Stateless — no credentials stored. Called automatically on every data change.

import { createClient } from '@libsql/client/web';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { url, token, key, value } = req.body || {};

  if (!url || !token || !key || value === undefined) {
    return res.status(400).json({
      ok: false,
      error: 'Fields url, token, key, and value are all required.',
    });
  }

  let client;
  try {
    const httpUrl = url.trim().replace(/^libsql:\/\//, 'https://');
    client = createClient({ url: httpUrl, authToken: token.trim() });

    // Create the table if it doesn't exist yet (safe to run every time)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS pos_data (
        key        TEXT PRIMARY KEY,
        value      TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Upsert the row for this collection key
    await client.execute({
      sql: `
        INSERT INTO pos_data (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE
          SET value      = excluded.value,
              updated_at = excluded.updated_at
      `,
      args: [key.trim(), String(value), new Date().toISOString()],
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(200).json({
      ok: false,
      error: err?.message || 'Sync failed.',
    });
  } finally {
    try { client?.close(); } catch (_) {}
  }
}
