import { json, requireAuth } from '../../_utils.js';

export async function onRequestGet({ request, env }) {
  const data = await requireAuth(request, env);
  if (!data) return json({ authenticated: false }, 401);
  return json({ authenticated: true, user: data.u });
}
