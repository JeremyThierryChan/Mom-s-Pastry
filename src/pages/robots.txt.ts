import type { APIRoute } from 'astro';
import { absoluteUrl } from '../lib/url';

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('http://localhost:4321');
  const body = `User-agent: *
Allow: /

Sitemap: ${absoluteUrl('/sitemap.xml', origin)}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
