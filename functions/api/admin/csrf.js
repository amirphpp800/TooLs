import { jsonNoStore, cookiePlain, generateCsrfToken } from '../../_utils.js';

export async function onRequestGet({ request }) {
  // Issue a CSRF token and set it as a non-HttpOnly cookie so client can echo it in a header
  const token = await generateCsrfToken();
  return jsonNoStore({ token }, 200, { 'Set-Cookie': cookiePlain('CSRF', token, { maxAge: 60 * 60 * 8 }) });
}
