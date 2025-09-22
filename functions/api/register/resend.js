import { json, jsonNoStore, rateLimit, getClientIP } from '../../_utils.js';

function isValidTelegramId(id) {
  return /^[0-9]{5,15}$/.test(String(id || ''));
}

async function sendTelegram(env, chatId, text) {
  const token = env.BOT_TOKEN;
  if (!token) return { ok: false, error: 'NO_BOT_TOKEN' };
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true })
    });
    const data = await res.json();
    return data;
  } catch (e) {
    return { ok: false, error: 'NETWORK_ERROR' };
  }
}

export async function onRequestPost({ request, env }) {
  const ip = getClientIP(request);
  const allowed = await rateLimit(env, `register:resend:${ip}`, 5, 60);
  if (!allowed) return json({ error: 'RATE_LIMITED' }, 429);

  if (!request.headers.get('content-type')?.includes('application/json')) {
    return json({ error: 'INVALID_CONTENT_TYPE' }, 400);
  }

  const body = await request.json().catch(() => null);
  const telegram_id = body?.telegram_id;
  if (!isValidTelegramId(telegram_id)) return json({ error: 'INVALID_TELEGRAM_ID' }, 400);

  // Reuse existing code if available, otherwise generate new
  const pendingRaw = await env.DATABASE.get(`verify:${telegram_id}`);
  let code = null;
  if (pendingRaw) {
    try { code = JSON.parse(pendingRaw)?.code || null; } catch { code = null; }
  }
  if (!code) code = String(Math.floor(1000 + Math.random() * 9000));

  const text = `کد تایید شما:\n<b>${code}</b>`;
  const sendResult = await sendTelegram(env, telegram_id, text);

  // Refresh TTL
  await env.DATABASE.put(`verify:${telegram_id}`, JSON.stringify({ code, ts: Date.now() }), { expirationTtl: 600 });

  return jsonNoStore({ status: 'RESENT', sent: Boolean(sendResult?.ok) });
}
