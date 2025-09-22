import { jsonNoStore, requireAuth, requireCsrf, sameOrigin } from '../../_utils.js';

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return jsonNoStore({ error: 'ORIGIN' }, 403);
  if (!requireCsrf(request)) return jsonNoStore({ error: 'CSRF' }, 403);
  const auth = await requireAuth(request, env);
  if (!auth) return jsonNoStore({ error: 'UNAUTHORIZED' }, 401);

  const { key } = await request.json().catch(()=>({}));
  if (!key) return jsonNoStore({ error: 'BAD_REQUEST' }, 400);

  await env.DATABASE.delete(key);
  return jsonNoStore({ ok: true });
}
