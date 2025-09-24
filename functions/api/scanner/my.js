import { json, requireAuth } from '../../_utils.js';

// Return the authenticated user's allocated servers with country/location info
// GET /api/scanner/my
export async function onRequestGet({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth?.u?.verified) return json({ error: 'UNAUTHORIZED' }, 401);

  const userId = String(auth.u.telegram_id);

  // Load servers from admin-managed KV structure first, fallback to legacy list
  let items = [];
  try {
    const rawCountries = await env.DATABASE.get('scanner/countries.json');
    if (rawCountries) {
      const data = JSON.parse(rawCountries || '{}');
      const countries = Array.isArray(data?.countries) ? data.countries : [];
      items = countries
        .flatMap(c => {
          const code = String(c?.code || '').trim();
          const name = String(c?.name || code || 'unknown').trim();
          const servers = Array.isArray(c?.servers) ? c.servers : [];
          return servers.map(s => ({
            address: String(s?.ip || s?.address || s || '').trim(),
            country: name,
            code: code.toLowerCase(),
          }));
        })
        .filter(x => x.address);
    }
  } catch {}

  if (!items.length) {
    // Fallback: legacy flat servers list
    try {
      const rawLegacy = await env.DATABASE.get('scanner/servers.json');
      let list = [];
      try { list = JSON.parse(rawLegacy || '[]'); } catch { list = []; }
      if (!Array.isArray(list)) list = [];
      items = list.map(it => ({
        address: String(it.address || it.ip || '').trim(),
        country: String(it.country || it.name || 'unknown').trim(),
        code: String(it.code || it.cc || '').trim().toLowerCase(),
      })).filter(it => it.address);
    } catch {}
  }

  async function loadAlloc(addr) {
    try {
      const safeKey = `scanner/alloc/${encodeURIComponent(addr)}`;
      const r = await env.DATABASE.get(safeKey);
      const arr = r ? JSON.parse(r) : [];
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }

  const my = [];
  for (const it of items) {
    const alloc = await loadAlloc(it.address);
    if (alloc.includes(userId)) {
      my.push({ address: it.address, country: it.country, code: it.code });
    }
  }

  return json({ servers: my }, 200, { 'Cache-Control': 'no-store' });
}
