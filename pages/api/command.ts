// pages/api/command.ts
import type { NextApiRequest, NextApiResponse } from 'next';

const API_BASE =
  process.env.NEXT_PUBLIC_GUARDCLOUD_API_BASE ??
  'https://yarmotek-guardcloud-api.myarbanga.workers.dev';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      ok: false,
      error: 'METHOD_NOT_ALLOWED',
    });
  }

  try {
    const body = req.body; // déjà parsé par Next

    const resp = await fetch(`${API_BASE}/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await resp.json();
    return res.status(resp.status).json(data);
  } catch (e: any) {
    console.error('Error in /api/command:', e);
    return res.status(500).json({
      ok: false,
      error: 'SEND_COMMAND_FAILED',
      message: e?.message ?? 'Unknown error',
    });
  }
}
