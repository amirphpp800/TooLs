// Shared utilities for Cloudflare Pages Functions

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

export function jsonNoStore(data, status = 200, headers = {}) {
  return json(data, status, { 'Cache-Control': 'no-store', ...headers });
}

export async function hashHMAC(message, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export function parseCookies(header) {
  const out = {}; if (!header) return out;
  header.split(';').forEach(part => {
    const [k, ...rest] = part.trim().split('=');
    out[k] = decodeURIComponent(rest.join('='));
  });
  return out;
}

export async function setSession(user, secret) {
  const payload = JSON.stringify({ u: user, iat: Date.now() });
  const sig = await hashHMAC(payload, secret);
  const token = btoa(payload) + '.' + sig;
  return token;
}

export async function verifySession(token, secret) {
  if (!token || !token.includes('.')) return null;
  const [b64, sig] = token.split('.');
  let payload;
  try { payload = atob(b64); } catch { return null; }
  const expected = await hashHMAC(payload, secret);
  if (sig !== expected) return null;
  try { return JSON.parse(payload); } catch { return null; }
}

export function cookie(name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`);
  parts.push(`Path=${opts.path || '/'}`);
  parts.push('HttpOnly');
  parts.push('SameSite=Lax');
  parts.push('Secure');
  return parts.join('; ');
}

export function cookiePlain(name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`);
  parts.push(`Path=${opts.path || '/'}`);
  parts.push('SameSite=Lax');
  parts.push('Secure');
  return parts.join('; ');
}

export async function requireAuth(request, env) {
  const cookies = parseCookies(request.headers.get('Cookie'));
  const token = cookies['SESSION'];
  const data = await verifySession(token, env.SECRET);
  if (!data) return null;
  return data;
}

export function getClientIP(request) {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || '0.0.0.0';
}

export async function generateCsrfToken() {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return btoa(String.fromCharCode(...buf));
}

export function requireCsrf(request) {
  const cookies = parseCookies(request.headers.get('Cookie'));
  const cookieToken = cookies['CSRF'];
  const headerToken = request.headers.get('X-CSRF-Token');
  return cookieToken && headerToken && cookieToken === headerToken;
}

export function sameOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return true; // Non-CORS (e.g., curl) — treat cautiously; endpoints also require CSRF/auth
  try {
    const u = new URL(request.url);
    return origin === `${u.protocol}//${u.host}`;
  } catch {
    return false;
  }
}

export async function rateLimit(env, key, limit = 50, ttlSeconds = 60) {
  try {
    const fullKey = `ratelimit:${key}`;
    const raw = await env.DATABASE.get(fullKey);
    const count = raw ? parseInt(raw, 10) || 0 : 0;
    if (count >= limit) return false;
    await env.DATABASE.put(fullKey, String(count + 1), { expirationTtl: ttlSeconds });
    return true;
  } catch {
    return true; // fail-open to avoid breaking site if KV hiccups
  }
}
