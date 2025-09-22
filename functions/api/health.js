import { json } from '../_utils.js';

export async function onRequestGet({ env }) {
  const result = { kv: false, adminEnv: false, secret: false };
  try {
    // Check KV binding exists and is accessible
    if (env.DATABASE && typeof env.DATABASE.list === 'function') {
      // light operation: list 1 key
      await env.DATABASE.list({ limit: 1 });
      result.kv = true;
    }
  } catch (e) {
    result.kv = false;
  }

  try {
    result.adminEnv = Boolean(env.ADMIN_USER && env.ADMIN_PASS);
    result.secret = Boolean(env.SECRET && String(env.SECRET).length >= 16);
  } catch (e) {
    // ignore
  }

  return json(result);
}
