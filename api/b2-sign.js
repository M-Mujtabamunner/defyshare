// POST /api/b2-sign — presigned upload/download URLs and hard deletes for B2.
// Room-based sharing is anonymous by design, so this endpoint is public.
import { handleSignRequest } from '../server/b2.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
    const { status, json } = await handleSignRequest(body);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(status).json(json);
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
