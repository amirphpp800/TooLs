import { json, requireAuth, requireCsrf, sameOrigin } from '../../_utils.js';

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: 'CORS' }, 403);
  if (!requireCsrf(request)) return json({ error: 'CSRF' }, 403);
  
  const authData = await requireAuth(request, env);
  if (!authData) return json({ error: 'UNAUTHORIZED' }, 401);

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return json({ error: 'No file provided' }, 400);
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return json({ error: 'File too large (max 10MB)' }, 400);
    }

    // Validate file type
    const allowedTypes = [
      'text/plain',
      'text/html',
      'text/css',
      'text/javascript',
      'application/json',
      'application/javascript',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ];

    if (!allowedTypes.includes(file.type)) {
      return json({ error: 'File type not allowed' }, 400);
    }

    // Generate unique filename
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9\u0600-\u06FF\-_]/g, '-');
    
    const fileName = `${baseName}-${timestamp}.${extension}`;
    const key = `uploads/${year}/${month}/${fileName}`;

    // Read file content
    let content;
    if (file.type.startsWith('text/') || file.type === 'application/json' || file.type === 'application/javascript') {
      content = await file.text();
    } else {
      // For binary files, convert to base64
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      content = btoa(String.fromCharCode.apply(null, uint8Array));
    }

    // Store in KV
    await env.DATABASE.put(key, content);

    return json({
      success: true,
      key,
      fileName,
      originalName: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: now.toISOString()
    });

  } catch (e) {
    return json({ error: 'Upload failed', details: e.message }, 500);
  }
}

export async function onRequestGet({ request, env }) {
  const authData = await requireAuth(request, env);
  if (!authData) return json({ error: 'UNAUTHORIZED' }, 401);

  try {
    const url = new URL(request.url);
    const prefix = url.searchParams.get('prefix') || 'uploads/';
    
    const result = await env.DATABASE.list({ prefix });
    const files = [];

    for (const key of result.keys) {
      // Extract file info from key
      const parts = key.name.split('/');
      const fileName = parts[parts.length - 1];
      const [baseName, timestamp, extension] = fileName.split(/[-.](?=[^-.]*$)/);
      
      files.push({
        key: key.name,
        fileName,
        baseName,
        extension,
        uploadedAt: timestamp ? new Date(parseInt(timestamp)).toISOString() : null,
        size: key.metadata?.size || 0
      });
    }

    // Sort by upload date (newest first)
    files.sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0));

    return json({ files });

  } catch (e) {
    return json({ error: 'Failed to list files', details: e.message }, 500);
  }
}
