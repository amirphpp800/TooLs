import { json, requireAuth } from '../../_utils.js';

// Allocate a server address for the authenticated user
// POST { country?: string }
// Rules:
//  - Each address can be allocated to up to 2 users
//  - If user already has this address, return it (idempotent)
//  - If user has an allocation in the requested country, return the same address
export async function onRequestPost({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth?.u?.verified) return json({ error: 'UNAUTHORIZED' }, 401);

  const userId = String(auth.u.telegram_id);
  let country = '';
  try {
    if (request.headers.get('content-type')?.includes('application/json')) {
      const body = await request.json();
      country = String(body?.country || '').trim().toLowerCase();
    }
  } catch {}

  // Load source list
  const raw = await env.DATABASE.get('scanner/servers.json');
  let list = [];
  try { list = JSON.parse(raw || '[]'); } catch { list = []; }
  if (!Array.isArray(list)) list = [];

  // Normalize and filter by country if provided
  const items = list.map(it => ({
    address: String(it.address || it.ip || '').trim(),
    country: String(it.country || it.name || 'unknown').trim(),
    code: String(it.code || it.cc || '').trim().toLowerCase(),
  })).filter(it => it.address);

  const byCountry = (codeOrName) => items.filter(it => {
    if (!codeOrName) return true;
    const key = codeOrName.toLowerCase();
    return it.code.toLowerCase() === key || it.country.toLowerCase() === key;
  });

  // Helper: load allocation list for an address
  async function loadAlloc(addr) {
    try {
      const r = await env.DATABASE.get(`scanner/alloc/${addr}`);
      const arr = r ? JSON.parse(r) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }

  // Helper: save allocation
  async function saveAlloc(addr, arr) {
    await env.DATABASE.put(`scanner/alloc/${addr}`, JSON.stringify(arr));
  }

  // 1) If user already has an allocation in the requested country, return it
  const pool = byCountry(country);
  for (const it of pool) {
    const alloc = await loadAlloc(it.address);
    if (alloc.includes(userId)) {
      return json({ address: it.address, country: it.country, code: it.code, reused: true });
    }
  }

  // 2) Try to allocate a new address with < 2 users
  for (const it of pool) {
    const alloc = await loadAlloc(it.address);
    if (alloc.length < 2) {
      alloc.push(userId);
      await saveAlloc(it.address, alloc);
      return json({ address: it.address, country: it.country, code: it.code, reused: false });
    }
  }

  return json({ error: 'NO_AVAILABLE_SERVER' }, 404);
}
