import { json, jsonNoStore, requireAuth } from '../../_utils.js';

function favKey(user) {
  const tg = user?.telegram_id || user?.id || 'unknown';
  return `favorites:${tg}`;
}

export async function onRequestDelete({ request, env, params }) {
  const session = await requireAuth(request, env);
  if (!session?.u || !session?.u?.verified) {
    return json({ error: 'UNAUTHORIZED' }, 401);
    }

  const id = (params?.id || '').toString().trim();
  if (!id) return json({ error: 'MISSING_ID' }, 400);

  try {
    const key = favKey(session.u);
    const raw = await env.DATABASE.get(key);
    let list = [];
    if (raw) {
      try { list = JSON.parse(raw) || []; } catch { list = []; }
    }
    if (!Array.isArray(list)) list = [];

    const before = list.length;
    list = list.filter(f => f && f.id !== id);

    if (list.length !== before) {
      await env.DATABASE.put(key, JSON.stringify(list));
    }

    // For simplicity, return 204 No Content on success
    return new Response(null, { status: 204 });
  } catch (e) {
    return json({ error: 'SERVER_ERROR' }, 500);
  }
}
