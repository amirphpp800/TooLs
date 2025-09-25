import { json, handleOptions } from '../_utils.js';

export async function onRequestOptions() { 
  return handleOptions(); 
}

export async function onRequestGet({ env }) {
  try {
    // Simple health check
    const timestamp = new Date().toISOString();
    
    // Test KV connection if available
    let kvStatus = 'unknown';
    try {
      if (env.DATABASE) {
        await env.DATABASE.put('health_check', timestamp, { expirationTtl: 60 });
        const testValue = await env.DATABASE.get('health_check');
        kvStatus = testValue ? 'ok' : 'error';
      }
    } catch (e) {
      kvStatus = 'error';
    }
    
    return json({
      status: 'ok',
      timestamp,
      version: '1.0.0',
      services: {
        kv: kvStatus
      }
    });
  } catch (error) {
    return json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500);
  }
}
