import { json, cookie } from '../../_utils.js';

export async function onRequestPost() {
  // Invalidate session cookie
  return json({ ok: true }, 200, { 'Set-Cookie': cookie('SESSION', '', { maxAge: 0 }) });
}
