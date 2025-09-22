import { json, jsonNoStore, requireAuth, cookie, setSession } from '../../_utils.js';

export async function onRequestPost({ request, env }) {
  // Require auth
  const session = await requireAuth(request, env);
  if (!session?.u || !session?.u?.verified) {
    return json({ error: 'UNAUTHORIZED' }, 401);
  }

  if (!request.headers.get('content-type')?.includes('application/json')) {
    return json({ error: 'INVALID_CONTENT_TYPE' }, 400);
  }

  const body = await request.json().catch(() => null);
  const code = (body?.code || '').toString().trim();
  if (!code) return json({ error: 'MISSING_CODE' }, 400);

  const GOLD = env.GOLD || '';
  if (!GOLD) return json({ error: 'GOLD_NOT_CONFIGURED' }, 500);

  if (code !== GOLD) {
    return jsonNoStore({ error: 'INVALID_CODE' }, 400);
  }

  try {
    // Load current user from KV
    const userKey = `user:${session.u.telegram_id}`;
    const raw = await env.DATABASE.get(userKey);
    let user = session.u;
    if (raw) {
      try { user = JSON.parse(raw); } catch {}
    }

    // Update plan to gold
    user.plan = 'gold';
    user.plan_updated_at = Date.now();

    await env.DATABASE.put(userKey, JSON.stringify(user));

    // Refresh session cookie with updated user
    const token = await setSession(user, env.SECRET || '');
    const headers = {};
    if (token) {
      headers['Set-Cookie'] = cookie('SESSION', token, { path: '/', maxAge: 60 * 60 * 24 * 30 });
    }

    return jsonNoStore({ status: 'UPGRADED', user }, 200, headers);
  } catch (e) {
    return json({ error: 'SERVER_ERROR' }, 500);
  }
}
