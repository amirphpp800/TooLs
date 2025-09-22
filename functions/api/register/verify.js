import { json, jsonNoStore, rateLimit, getClientIP, setSession, cookie } from '../../_utils.js';

function isValidTelegramId(id) {
  return /^[0-9]{5,15}$/.test(String(id || ''));
}

export async function onRequestPost({ request, env }) {
  const ip = getClientIP(request);
  const allowed = await rateLimit(env, `register:verify:${ip}`, 15, 60);
  if (!allowed) return json({ error: 'RATE_LIMITED' }, 429);

  if (!request.headers.get('content-type')?.includes('application/json')) {
    return json({ error: 'INVALID_CONTENT_TYPE' }, 400);
  }

  const body = await request.json().catch(() => null);
  const telegram_id = body?.telegram_id;
  const code = (body?.code || '').toString().trim();

  if (!isValidTelegramId(telegram_id)) return json({ error: 'INVALID_TELEGRAM_ID' }, 400);
  if (!/^\d{4}$/.test(code)) return json({ error: 'INVALID_CODE' }, 400);

  const pendingRaw = await env.DATABASE.get(`verify:${telegram_id}`);
  if (!pendingRaw) return json({ error: 'NO_PENDING_CODE' }, 400);

  let savedCode = null;
  try { savedCode = JSON.parse(pendingRaw)?.code || null; } catch { savedCode = null; }
  if (!savedCode) return json({ error: 'NO_PENDING_CODE' }, 400);

  if (savedCode !== code) return json({ error: 'CODE_MISMATCH' }, 400);

  // Mark user as verified and store basic profile
  const userKey = `user:${telegram_id}`;
  const userPayload = { telegram_id: String(telegram_id), verified: true, created_at: Date.now() };
  await env.DATABASE.put(userKey, JSON.stringify(userPayload));

  // Cleanup the verification code to prevent reuse
  await env.DATABASE.delete(`verify:${telegram_id}`);

  // Create session cookie
  const token = await setSession(userPayload, env.SECRET || '');
  const headers = {};
  if (token) {
    headers['Set-Cookie'] = cookie('SESSION', token, { path: '/', maxAge: 60 * 60 * 24 * 30 }); // 30 days
  }

  return jsonNoStore({ status: 'VERIFIED', user: userPayload }, 200, headers);
}
