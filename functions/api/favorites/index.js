import { json, jsonNoStore, requireAuth } from '../../_utils.js';

// Key helper for per-user favorites list in KV
function favKey(user) {
  const tg = user?.telegram_id || user?.id || 'unknown';
  return `favorites:${tg}`;
}

export async function onRequestGet({ request, env }) {
  const session = await requireAuth(request, env);
  if (!session?.u || !session?.u?.verified) {
    return json({ error: 'UNAUTHORIZED' }, 401);
  }
  try {
    const raw = await env.DATABASE.get(favKey(session.u));
    let list = [];
    if (raw) {
      try { list = JSON.parse(raw) || []; } catch { list = []; }
    }
    // Always return an array
    return jsonNoStore(Array.isArray(list) ? list : []);
  } catch (e) {
    return json({ error: 'SERVER_ERROR' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  const session = await requireAuth(request, env);
  if (!session?.u || !session?.u?.verified) {
    return json({ error: 'UNAUTHORIZED' }, 401);
  }

  if (!request.headers.get('content-type')?.includes('application/json')) {
    return json({ error: 'INVALID_CONTENT_TYPE' }, 400);
  }

  const body = await request.json().catch(() => null);
  const id = (body?.id || '').toString().trim();
  const title = (body?.title || '').toString().trim();
  const type = (body?.type || '').toString().trim();
  const url = (body?.url || '').toString().trim();

  if (!id || !title || !type) {
    return json({ error: 'MISSING_FIELDS' }, 400);
  }

  // Basic input size limits to avoid abuse
  if (id.length > 200 || title.length > 300 || type.length > 50 || url.length > 500) {
    return json({ error: 'FIELD_TOO_LONG' }, 400);
  }

  try {
    const key = favKey(session.u);
    const raw = await env.DATABASE.get(key);
    let list = [];
    if (raw) {
      try { list = JSON.parse(raw) || []; } catch { list = []; }
    }

    if (!Array.isArray(list)) list = [];

    // Avoid duplicates by id
    if (list.some(f => f && f.id === id)) {
      // Return existing one as success to keep idempotent UX
      const existing = list.find(f => f && f.id === id);
      return jsonNoStore(existing || { id, title, type, url, created_at: Date.now() }, 201);
    }

    const item = { id, title, type, url, created_at: Date.now() };

    // Optional: limit max favorites per user
    const MAX_FAVORITES = 500;
    if (list.length >= MAX_FAVORITES) {
      // Remove oldest
      list.sort((a, b) => (a?.created_at || 0) - (b?.created_at || 0));
      list = list.slice(Math.max(0, list.length - (MAX_FAVORITES - 1)));
    }

    list.push(item);
    await env.DATABASE.put(key, JSON.stringify(list));

    // Frontend expects JSON of the newly created favorite
    return jsonNoStore(item, 201);
  } catch (e) {
    return json({ error: 'SERVER_ERROR' }, 500);
  }
}
