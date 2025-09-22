import { jsonNoStore, setSession, cookie, requireCsrf } from '../../_utils.js';

export async function onRequestPost({ request, env }) {
  try {
    // CSRF protection
    if (!requireCsrf(request)) return jsonNoStore({ error: 'CSRF' }, 403);
    const body = await request.json();
    const { username, password } = body || {};
    if (!username || !password) return jsonNoStore({ error: 'BAD_REQUEST' }, 400);

    if (username !== env.ADMIN_USER || password !== env.ADMIN_PASS) {
      return jsonNoStore({ error: 'UNAUTHORIZED' }, 401);
    }

    const token = await setSession(username, env.SECRET);
    return jsonNoStore(
      { ok: true },
      200,
      { 'Set-Cookie': cookie('SESSION', token, { maxAge: 60 * 60 * 8 }) }
    );
  } catch (e) {
    return jsonNoStore({ error: 'INVALID_JSON' }, 400);
  }
}
