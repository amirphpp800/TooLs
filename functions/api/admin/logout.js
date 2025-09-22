import { jsonNoStore, cookie, requireCsrf, sameOrigin } from '../../_utils.js';

export async function onRequestPost({ request }) {
  // Enforce same-origin and CSRF for logout action
  if (!sameOrigin(request)) return jsonNoStore({ error: 'ORIGIN' }, 403);
  if (!requireCsrf(request)) return jsonNoStore({ error: 'CSRF' }, 403);
  // Invalidate session cookie
  return jsonNoStore({ ok: true }, 200, { 'Set-Cookie': cookie('SESSION', '', { maxAge: 0 }) });
}
