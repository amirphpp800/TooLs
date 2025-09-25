import { json, handleOptions, isAdmin, unauthorized } from '../../_utils';

export async function onRequestOptions() { return handleOptions(); }

// Step 1: Admin submits Basic Auth + admin Telegram ID; server sends 5-digit OTP via BOT_TOKEN
export async function onRequestPost({ request, env }) {
  const ok = isAdmin(request, env);
  if (!ok) return unauthorized();
  const { BOT_TOKEN, DATABASE } = env;
  if (!BOT_TOKEN) return json({ error: 'bot token not configured' }, 500);
  const body = await request.json();
  const admin_id = String(body?.admin_id || '').trim();
  if (!admin_id) return json({ error: 'admin_id required' }, 400);
  const code = gen5();
  await DATABASE.put(`admin:otp:${admin_id}`, code, { expirationTtl: 300 });
  const tgUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const text = `کد ورود ادمین: ${code}`;
  const resTG = await fetch(tgUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: Number(admin_id), text }) });
  if (!resTG.ok) return json({ error: 'failed to send code' }, 502);
  return json({ ok: true });
}

function gen5(){ return String(Math.floor(10000 + Math.random()*90000)); }
