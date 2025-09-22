import { json, requireAuth } from '../../_utils.js';

export async function onRequestPost({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return json({ error: 'UNAUTHORIZED' }, 401);

  const { key } = await request.json().catch(()=>({}));
  if (!key) return json({ error: 'BAD_REQUEST' }, 400);

  await env.DATABASE.delete(key);
  return json({ ok: true });
}
