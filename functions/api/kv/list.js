import { json, requireAuth } from '../../_utils.js';

export async function onRequestGet({ request, env }) {
  const auth = await requireAuth(request, env);
  if (!auth) return json({ error: 'UNAUTHORIZED' }, 401);

  const url = new URL(request.url);
  const prefix = url.searchParams.get('prefix') || '';
  const list = await env.DATABASE.list({ prefix, limit: 1000 });
  return json({ keys: list.keys.map(k => k.name) });
}
