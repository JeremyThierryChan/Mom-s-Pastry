/**
 * 路径工具。
 * 站点要能部署在 GitHub Pages 的项目子路径下（例如 /xiaoxiao-pastry/），
 * 所以站内链接和图片路径都统一走 withBase()，不要手写以 '/' 开头的绝对路径。
 */
const RAW_BASE = import.meta.env.BASE_URL ?? '/';

/** 去掉结尾斜杠的 base，根路径时为 '' */
export const base = RAW_BASE.endsWith('/') ? RAW_BASE.slice(0, -1) : RAW_BASE;

/** 站内路径补上 base 前缀；外链与 data: 原样返回 */
export function withBase(path: string): string {
  if (/^([a-z]+:)?\/\//i.test(path) || path.startsWith('data:') || path.startsWith('#')) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized === '/') return `${base}/`;
  return `${base}${normalized}`;
}

/** 拼成绝对地址，用于 canonical / og:url / sitemap */
export function absoluteUrl(path: string, site: string): string {
  return new URL(withBase(path), site).href;
}
