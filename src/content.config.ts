import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { journalContentLoader, siteContentLoader } from './loaders/site-content';

/**
 * 内容全部来自仓库根目录的「网站内容.md」，由 src/loaders/site-content.ts 解析。
 * 这里只负责校验：字段写漏了、写错了，会在 npm run dev / npm run build 的时候
 * 直接报出来，报错信息尽量说人话，告诉你缺的是哪一行。
 */

/** 必填的文本字段 */
const need = (label: string) =>
  z.string().min(1, `「${label}」不能为空 —— 请打开 网站内容.md 补上这一行`);

/**
 * 数字字段，但写宽一点：48、48元、¥48、48 块、48.5 都能认。
 * 中文语境下「价格：12元」是最自然的写法，不该因此报错。
 */
const looseNumber = (label: string) =>
  z.preprocess(
    (value) => {
      if (typeof value !== 'string') return value;
      const matched = value.replace(/[,，\s]/g, '').match(/-?\d+(\.\d+)?/);
      return matched ? Number(matched[0]) : value;
    },
    z.number({ error: `「${label}」要写数字，例如 48（写「48元」也可以）` }),
  );

const site = defineCollection({
  loader: siteContentLoader(),
  schema: z.object({
    brand: z.object({
      name: need('品牌 › 名称'),
      intro: need('品牌 › 一句话介绍'),
      pageTitle: need('品牌 › 网页标题'),
      pageDescription: need('品牌 › 网页描述'),
      ogImage: need('品牌 › 分享图'),
      ogImageAlt: need('品牌 › 分享图说明'),
    }),
    hero: z.object({
      eyebrow: need('首页 › 小标签'),
      title: need('首页 › 主标题'),
      subtitle: need('首页 › 副标题'),
      intro: need('首页 › 介绍'),
      ctaLabel: need('首页 › 按钮'),
      ctaSecondaryLabel: need('首页 › 按钮二'),
      image: need('首页 › 图片'),
      imageAlt: need('首页 › 图片描述'),
    }),
    products: z.object({
      eyebrow: need('今日手作 › 小标签'),
      title: need('今日手作 › 标题'),
      note: need('今日手作 › 说明'),
      // 允许一个产品都没有（比如放假了），页面会显示一句友好的提示
      items: z.array(
        z.object({
          name: z.string(),
          description: need('一句话描述'),
          /** 配料，用「、」分开；对比表按这个自动判断有没有某一项 */
          ingredients: z.string().optional(),
          /** 价格可以是数字也可以是文字（如「详讯」），拼文案交给 formatPrice */
          price: need('价格'),
          unit: need('规格'),
          status: need('状态'),
          image: need('图片'),
          imageAlt: need('图片描述'),
          note: z.string().optional(),
          /** 「对比：否」时不参与对比表 —— 定制类没有固定配料，列进去没意义 */
          inCompare: z.boolean(),
          /** 这一条的所有字段（中文名 → 值），对比表按行名取 */
          fields: z.record(z.string(), z.string()),
        }),
      ),
    }),
    compare: z.object({
      eyebrow: need('对比 › 小标签'),
      title: need('对比 › 标题'),
      note: need('对比 › 说明'),
      /** 表格里显示哪几行，名字对应产品里的字段名（如「内馅」「价格」） */
      rows: z.array(z.string()),
      visible: z.boolean(),
    }),
    booking: z.object({
      eyebrow: need('预订须知 › 小标签'),
      title: need('预订须知 › 标题'),
      html: z.string(),
      /** 「显示：否」时为 false */
      visible: z.boolean(),
    }),
    about: z.object({
      eyebrow: need('关于笑笑 › 小标签'),
      title: need('关于笑笑 › 标题'),
      image: need('关于笑笑 › 图片'),
      imageAlt: need('关于笑笑 › 图片描述'),
      html: z.string(),
    }),
    journal: z.object({
      eyebrow: need('手作记录 › 小标签'),
      title: need('手作记录 › 标题'),
      note: need('手作记录 › 说明'),
      limit: looseNumber('首页显示条数').pipe(z.number().int().positive()),
      /** 「显示：否」时为 false：内容留着但不显示 */
      visible: z.boolean(),
    }),
    contact: z.object({
      eyebrow: need('联系 › 小标签'),
      title: need('联系 › 标题'),
      intro: need('联系 › 说明'),
      hours: need('联系 › 营业说明'),
      wechat: need('联系 › 微信'),
      phone: need('联系 › 电话'),
      ctaLabel: need('联系 › 按钮'),
      ctaSecondaryLabel: need('联系 › 按钮二'),
      note: need('联系 › 补充说明'),
    }),
    footer: z.object({
      copyright: need('页脚 › 版权'),
      note: need('页脚 › 说明'),
    }),
  }),
});

const journal = defineCollection({
  loader: journalContentLoader(),
  schema: z.object({
    title: z.string(),
    /** 网址片段，来自「链接：」，没写就用日期 */
    slug: z.string(),
    date: z.coerce.date({ error: '「日期」要写成 2026-10-01 这样' }),
    summary: need('摘要'),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
  }),
});

export const collections = { site, journal };
