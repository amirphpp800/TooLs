import { json } from '../../_utils.js';

const ALLOWED_KEYS = new Set([
  'settings/contacts.json',
  'settings/sponsors.json'
]);

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key') || '';
  if (!ALLOWED_KEYS.has(key)) return json({ error: 'NOT_ALLOWED' }, 400);
  const val = await env.DATABASE.get(key);
  if (!val) return json({ error: 'NOT_FOUND' }, 404);
  try {
    const data = JSON.parse(val);
    return json(data, 200, { 'Cache-Control': 'public, max-age=60' });
  } catch {
    return json({ error: 'INVALID_JSON' }, 500);
  }
}
