import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * 内容访问层。
 * 页面只调用这里的函数，不直接碰集合细节：
 * 以后要换成 CMS、数据库或真的订单系统，只需要改这一层。
 */

export type Product = CollectionEntry<'products'>;
export type JournalEntry = CollectionEntry<'journal'>;

/** 今日手作：按 order 排序 */
export async function getProducts(): Promise<Product[]> {
  const products = await getCollection('products', ({ data }) => !data.draft);
  return products.sort(
    (a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name, 'zh-Hans-CN'),
  );
}

/** 手作记录：按日期从新到旧 */
export async function getJournal(): Promise<JournalEntry[]> {
  const entries = await getCollection('journal', ({ data }) => !data.draft);
  return entries.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** 文件名 2026-10-01-first-batch → 网址里的 first-batch */
export function journalSlug(id: string): string {
  return id.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

/** 手作记录的详情页地址 */
export function journalHref(id: string): string {
  return `/journal/${journalSlug(id)}/`;
}
