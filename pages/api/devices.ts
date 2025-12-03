// pages/api/devices.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const API_BASE =
  process.env.NEXT_PUBLIC_GUARDCLOUD_API_BASE ??
  'https://yarmotek-guardcloud-api.myarbanga.workers.dev';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      ok: false,
      error: 'METHOD_NOT_ALLOWED',
    });
  }

  try {
    const resp = await fetch(`${API_BASE}/devices`, {
      method: 'GET',
      // on évite le cache pour la carte temps réel
      headers: { 'Cache-Control': 'no-store' },
    });

    const data = await resp.json();
    return res.status(resp.status).json(data);
  } catch (e: any) {
    console.error('Error in /api/devices:', e);
    return res.status(500).json({
      ok: false,
      error: 'FETCH_DEVICES_FAILED',
      message: e?.message ?? 'Unknown error',
    });
  }
}
