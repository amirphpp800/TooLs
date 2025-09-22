import { jsonNoStore, requireAuth } from '../../_utils.js';

export async function onRequestGet({ request, env }) {
  const session = await requireAuth(request, env);
  if (!session?.u || !session?.u?.verified) {
    return jsonNoStore({ authenticated: false });
  }
  return jsonNoStore({ authenticated: true, user: session.u });
}
