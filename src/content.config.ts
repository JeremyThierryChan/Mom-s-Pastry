import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * 产品集合。
 * 以后加新品 = 在 src/content/products/ 里新增一个 .md 文件，不需要改任何组件。
 */
const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    /** 价格，单位：元 */
    price: z.number().nonnegative(),
    /** 规格，例如「6枚」 */
    unit: z.string(),
    status: z.enum(['available', 'limited', 'soldout']),
    /** public/ 下的图片路径，例如 /images/products/original.svg */
    image: z.string(),
    imageAlt: z.string(),
    /** 卡片上的一句小备注，可选 */
    note: z.string().optional(),
    /** 排序，数字越小越靠前 */
    order: z.number().default(99),
    /** 以后做商详页时可以直接用；现在先留着 */
    draft: z.boolean().default(false),
  }),
});

/**
 * 手作记录集合。
 * 文件名建议用 日期-slug.md，路由里会自动去掉日期前缀，
 * 例如 2026-10-01-first-batch.md → /journal/first-batch/
 */
const journal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/journal' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { products, journal };
