import type { APIRoute } from 'astro';
import { SITE } from '../consts';
import { absoluteUrl } from '../lib/url';

export const GET: APIRoute = () => {
  const body = `User-agent: *
Allow: /

Sitemap: ${absoluteUrl('/sitemap.xml', SITE.url)}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
