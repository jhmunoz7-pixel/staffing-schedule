// api/schedule.js — Vercel Serverless Function
// Reads/writes the shared schedule to Vercel KV

const KV_KEY = 'staffing_schedule_v1';

async function kvGet() {
  const url = `${process.env.KV_REST_API_URL}/get/${KV_KEY}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` }
  });
  const json = await res.json();
  return json.result ? JSON.parse(json.result) : null;
}

async function kvSet(data) {
  const url = `${process.env.KV_REST_API_URL}/set/${KV_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(JSON.stringify(data))
  });
  return res.ok;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const data = await kvGet();
      return res.status(200).json({ ok: true, data });
    }

    if (req.method === 'POST') {
      const { days, editedBy, editedAt } = req.body;
      if (!days) return res.status(400).json({ ok: false, error: 'Missing days data' });
      await kvSet({ days, editedBy, editedAt, updatedAt: new Date().toISOString() });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('KV error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
