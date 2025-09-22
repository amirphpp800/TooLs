import { json, requireAuth, requireCsrf, sameOrigin } from '../../_utils.js';

export async function onRequestGet({ request, env }) {
  const authData = await requireAuth(request, env);
  if (!authData) return json({ error: 'UNAUTHORIZED' }, 401);

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'all'; // articles, pages, news, configs, downloads, all
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const offset = parseInt(url.searchParams.get('offset')) || 0;

    let prefixes = [];
    switch (type) {
      case 'articles':
        prefixes = ['articles/'];
        break;
      case 'pages':
        prefixes = ['pages/'];
        break;
      case 'news':
        prefixes = ['news/'];
        break;
      case 'configs':
        prefixes = ['configs/'];
        break;
      case 'downloads':
        prefixes = ['downloads/'];
        break;
      case 'all':
      default:
        prefixes = ['articles/', 'pages/', 'news/', 'configs/', 'downloads/'];
        break;
    }

    const allContent = [];

    for (const prefix of prefixes) {
      const result = await env.DATABASE.list({ prefix });
      
      for (const key of result.keys) {
        try {
          const content = await env.DATABASE.get(key.name);
          let parsedContent = null;
          let contentType = 'unknown';

          // Determine content type from key
          if (key.name.startsWith('articles/')) contentType = 'article';
          else if (key.name.startsWith('pages/')) contentType = 'page';
          else if (key.name.startsWith('news/')) contentType = 'news';
          else if (key.name.startsWith('configs/')) contentType = 'config';
          else if (key.name.startsWith('downloads/')) contentType = 'download';

          // Try to parse JSON content
          if (key.name.endsWith('.json')) {
            try {
              parsedContent = JSON.parse(content);
            } catch {
              parsedContent = { raw: content };
            }
          } else {
            parsedContent = { raw: content };
          }

          allContent.push({
            key: key.name,
            type: contentType,
            title: parsedContent?.title || parsedContent?.name || key.name.split('/').pop(),
            summary: parsedContent?.summary || parsedContent?.description || '',
            publishedAt: parsedContent?.publishedAt || parsedContent?.createdAt || null,
            tags: parsedContent?.tags || [],
            status: parsedContent?.status || 'published',
            lastModified: key.metadata?.lastModified || null,
            size: content?.length || 0
          });
        } catch (e) {
          // Skip items that can't be processed
          continue;
        }
      }
    }

    // Sort by publishedAt or lastModified (newest first)
    allContent.sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.lastModified || 0);
      const dateB = new Date(b.publishedAt || b.lastModified || 0);
      return dateB - dateA;
    });

    // Apply pagination
    const paginatedContent = allContent.slice(offset, offset + limit);

    return json({
      content: paginatedContent,
      total: allContent.length,
      offset,
      limit,
      hasMore: offset + limit < allContent.length
    });

  } catch (e) {
    return json({ error: 'Failed to fetch content', details: e.message }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: 'CORS' }, 403);
  if (!requireCsrf(request)) return json({ error: 'CSRF' }, 403);
  
  const authData = await requireAuth(request, env);
  if (!authData) return json({ error: 'UNAUTHORIZED' }, 401);

  try {
    const body = await request.json();
    const { action, key, content, metadata } = body;

    switch (action) {
      case 'create':
      case 'update':
        if (!key || !content) {
          return json({ error: 'Key and content required' }, 400);
        }

        // Add metadata
        const now = new Date().toISOString();
        let finalContent = content;

        if (key.endsWith('.json')) {
          try {
            const parsed = JSON.parse(content);
            if (action === 'create') {
              parsed.createdAt = now;
            }
            parsed.updatedAt = now;
            if (metadata) {
              Object.assign(parsed, metadata);
            }
            finalContent = JSON.stringify(parsed, null, 2);
          } catch {
            // If not valid JSON, keep as is
          }
        }

        await env.DATABASE.put(key, finalContent);
        return json({ success: true, key, action });

      case 'delete':
        if (!key) {
          return json({ error: 'Key required' }, 400);
        }
        await env.DATABASE.delete(key);
        return json({ success: true, key, action: 'deleted' });

      case 'publish':
      case 'unpublish':
        if (!key) {
          return json({ error: 'Key required' }, 400);
        }

        const existingContent = await env.DATABASE.get(key);
        if (!existingContent) {
          return json({ error: 'Content not found' }, 404);
        }

        if (key.endsWith('.json')) {
          try {
            const parsed = JSON.parse(existingContent);
            parsed.status = action === 'publish' ? 'published' : 'draft';
            parsed.updatedAt = new Date().toISOString();
            if (action === 'publish' && !parsed.publishedAt) {
              parsed.publishedAt = new Date().toISOString();
            }
            await env.DATABASE.put(key, JSON.stringify(parsed, null, 2));
            return json({ success: true, key, status: parsed.status });
          } catch {
            return json({ error: 'Invalid JSON content' }, 400);
          }
        } else {
          return json({ error: 'Cannot change status of non-JSON content' }, 400);
        }

      default:
        return json({ error: 'Invalid action' }, 400);
    }

  } catch (e) {
    return json({ error: 'Operation failed', details: e.message }, 500);
  }
}
