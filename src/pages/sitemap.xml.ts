import type { APIRoute } from 'astro';
import { SITE } from '../consts';
import { getJournal, journalHref } from '../lib/content';
import { absoluteUrl } from '../lib/url';

/** 静态生成的 sitemap.xml，不需要额外依赖 */
export const GET: APIRoute = async () => {
  const journal = await getJournal();
  const paths = ['/', ...journal.map((entry) => journalHref(entry.id))];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths
  .map((path) => {
    const entry = journal.find((item) => journalHref(item.id) === path);
    const lastmod = entry ? `<lastmod>${entry.data.date.toISOString().slice(0, 10)}</lastmod>` : '';
    return `  <url><loc>${absoluteUrl(path, SITE.url)}</loc>${lastmod}</url>`;
  })
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
