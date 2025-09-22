export async function onRequestGet({ request, env }) {
  const { json, requireAuth } = await import('../../_utils.js');
  const auth = await requireAuth(request, env);
  if (!auth) return json({ error: 'UNAUTHORIZED' }, 401);

  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (!key) return new Response('BAD_REQUEST', { status: 400 });

  const val = await env.DATABASE.get(key);
  if (val == null) return new Response('', { status: 404 });
  const isJSON = (val.trim().startsWith('{') || val.trim().startsWith('['));
  return new Response(val, { status: 200, headers: { 'content-type': isJSON ? 'application/json' : 'text/plain; charset=utf-8' } });
}
