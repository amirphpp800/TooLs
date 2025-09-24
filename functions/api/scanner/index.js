import { json } from '../../_utils.js';

// Public endpoint to list scanner servers grouped by country
// Admin should store raw servers at key: 'scanner/servers.json'
// Format: [{ address: "x.x.x.x", country: "Germany", code: "de" }, ...]
export async function onRequestGet({ env }) {
  try {
    const raw = await env.DATABASE.get('scanner/servers.json');
    if (!raw) return json({ countries: [], serversByCountry: {}, total: 0 });

    let list;
    try { list = JSON.parse(raw); } catch { list = []; }
    if (!Array.isArray(list)) list = [];

    // Normalize items
    const items = list
      .map(it => ({
        address: String(it.address || it.ip || '').trim(),
        country: String(it.country || it.name || 'Unknown').trim(),
        code: String(it.code || it.cc || '').trim().toLowerCase(),
      }))
      .filter(it => it.address);

    // Group by country code (fallback to name)
    const serversByCountry = {};
    const meta = {};

    for (const it of items) {
      const key = it.code || it.country;
      if (!serversByCountry[key]) serversByCountry[key] = [];
      serversByCountry[key].push(it.address);
      meta[key] = meta[key] || { name: it.country, code: it.code || '', total: 0, available: 0 };
      meta[key].total += 1;
    }

    // Compute availability by subtracting current allocations
    // allocation key format: 'scanner/alloc/<address>' => JSON array of userIds
    for (const [key, addrs] of Object.entries(serversByCountry)) {
      let available = 0;
      for (const addr of addrs) {
        try {
          const allocRaw = await env.DATABASE.get(`scanner/alloc/${addr}`);
          let arr = [];
          if (allocRaw) {
            try { arr = JSON.parse(allocRaw) || []; } catch {}
          }
          if (Array.isArray(arr) && arr.length < 2) available += 1;
        } catch {}
      }
      if (meta[key]) meta[key].available = available;
    }

    const countries = Object.entries(meta).map(([k, v]) => ({
      code: v.code || (/[a-z]{2}/i.test(k) ? k : ''),
      name: v.name,
      total: v.total,
      available: v.available,
      flag: (v.code || '').toLowerCase() || '',
    }));

    return json({ countries, serversByCountry, total: items.length }, 200, { 'Cache-Control': 'no-store' });
  } catch (e) {
    return json({ error: 'FAILED', details: e.message }, 500);
  }
}
