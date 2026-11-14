// POST /api/plan — which plan (free / plus / pro) a license key or signed-in user has.
import { handlePlanRequest } from '../server/plans.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
    const { status, json } = await handlePlanRequest(body);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(status).json(json);
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
