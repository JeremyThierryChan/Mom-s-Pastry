/**
 * 把根目录的「网站内容.md」解析成 Astro 的内容集合。
 *
 * 一个文件 → 两个集合：
 *   site     一份站点文案（品牌 / 首页 / 今日手作 / 关于笑笑 / 手作记录 / 联系 / 页脚）
 *   journal  每篇手作记录一条，正文交给 Astro 自带的 renderMarkdown 渲染成 HTML
 *
 * 文件格式（很宽松，怎么写都能读）：
 *   ## 品牌          ← 区块
 *   名称：笑笑的蛋黄酥  ← 字段（认识的字段名才当字段）
 *   ### 原味蛋黄酥    ← 条目（产品 / 一篇记录）
 *   价格：48
 *   （空行之后的所有内容都是正文，按 Markdown 渲染）
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { Loader, LoaderContext } from 'astro/loaders';

/** 唯一的内容文件（仓库根目录） */
export const CONTENT_URL = new URL('../../网站内容.md', import.meta.url);
/** 出错信息里显示的名字 */
export const CONTENT_PATH = '网站内容.md';

/**
 * 认识的字段名。写错名字不会静默失效， loader 会在终端里警告。
 */
const KNOWN_KEYS = new Set([
  // 品牌
  '名称',
  '一句话介绍',
  '网页标题',
  '网页描述',
  '分享图',
  '分享图说明',
  // 首页 / 各区块
  '小标签',
  '主标题',
  '副标题',
  '介绍',
  '按钮',
  '按钮二',
  '标题',
  '说明',
  '图片',
  '图片描述',
  // 产品
  '一句话描述',
  '价格',
  '规格',
  '状态',
  '小备注',
  // 手作记录
  '日期',
  '链接',
  '摘要',
  '首页显示条数',
  // 联系
  '营业说明',
  '微信',
  '电话',
  '补充说明',
  // 页脚
  '版权',
]);

export interface Block {
  /** ## 或 ### 后面那串字 */
  name: string;
  fields: Record<string, string>;
  /** 空行之后的所有内容（Markdown） */
  body: string;
  items: Block[];
}

/** 「键：值」行；键不能含冒号，且不超过 14 个字 */
const FIELD_RE = /^([^：:]{1,14})[：:]\s*(.*)$/;

/** 把整个文件解析成 区块 → 条目 */
function parseContent(
  raw: string,
  warn: (message: string) => void,
  /** 只在这些区块里警告（两个集合都解析同一个文件，避免同一句话警告两遍） */
  warnSections: string[] = [],
): Map<string, Block> {
  const shouldWarn = (sectionName: string) =>
    warnSections.length === 0 || warnSections.includes(sectionName);
  const sections = new Map<string, Block>();
  let section: Block | null = null;
  let item: Block | null = null;
  let bodyLines: string[] = [];
  let bodyStarted = false;

  /** 把攒下来的正文行归给当前条目（没有条目就归给区块） */
  const flushBody = () => {
    const text = bodyLines.join('\n').replace(/^\n+|\n+$/g, '');
    if (item) item.body = text;
    else if (section) section.body = text;
    bodyLines = [];
    bodyStarted = false;
  };

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, '');

    const h2 = /^##\s+(.+)$/.exec(line);
    if (h2) {
      flushBody();
      item = null;
      const name = h2[1].trim();
      if (sections.has(name)) warn(`「${name}」这个区块在文件里出现了两次，只有最后一次有效`);
      section = { name, fields: {}, body: '', items: [] };
      sections.set(name, section);
      continue;
    }

    const h3 = /^###\s+(.+)$/.exec(line);
    if (h3) {
      flushBody();
      if (!section) {
        if (shouldWarn('')) warn(`「${h3[1].trim()}」没有放在任何 ## 区块下面，已忽略`);
        item = null;
        continue;
      }
      item = { name: h3[1].trim(), fields: {}, body: '', items: [] };
      section.items.push(item);
      continue;
    }

    // 文件开头的说明、# 大标题等，在第一个 ## 之前的内容一律忽略
    if (!section) continue;

    const target = item ?? section;

    if (!bodyStarted) {
      if (line.trim() === '') continue; // 字段和正文之间的空行
      const field = FIELD_RE.exec(line);
      if (field) {
        const key = field[1].trim();
        if (KNOWN_KEYS.has(key)) {
          target.fields[key] = field[2].trim();
          continue;
        }
        // 名字写错时只警告、不当成「正文开始」——
        // 否则一个错别字会把它下面的所有字段都吞进正文，报出一堆假错误
        if (shouldWarn(section.name)) {
          warn(
            `${CONTENT_PATH}：「${key}：」不是能识别的字段名（在「${target.name}」里），这一行被忽略了。` +
              `检查一下是不是打错字了？`,
          );
        }
        continue;
      }
      bodyStarted = true; // 第一个不像字段的行 = 正文开始，后面的「键：值」也不再解析
    }

    bodyLines.push(line);
  }

  flushBody();
  return sections;
}

function readSection(sections: Map<string, Block>, name: string): Block {
  const block = sections.get(name);
  if (!block) {
    throw new Error(
      `${CONTENT_PATH} 里找不到「## ${name}」这个区块。` +
        `这个文件是整个网站的内容来源，区块的名字（## 后面那几个字）不能改。`,
    );
  }
  return block;
}

/** 取字段，没有就返回空串 —— 空串会被 schema 拦下来并给出人话提示 */
function f(block: Block, key: string): string {
  return block.fields[key] ?? '';
}

/** 网址片段：转小写、空格换横线、去掉奇怪的符号 */
export function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/* ------------------------------------------------------------------ */

/**
 * 开发模式下监听内容文件，改完保存就能立刻看到效果。
 * Vite 的 watcher 只认字符串路径，而且 macOS 上的中文文件名可能是 NFD 编码，
 * 所以两边都做一次 NFC 归一化再比较。
 */
function watchContentFile(ctx: LoaderContext, reload: () => Promise<void>): void {
  const watcher = ctx.watcher;
  if (!watcher) return;

  const target = fileURLToPath(CONTENT_URL);
  watcher.add(target);

  watcher.on('change', async (changedPath: string) => {
    if (changedPath.normalize('NFC') !== target.normalize('NFC')) return;
    try {
      await reload();
      ctx.logger.info(`${CONTENT_PATH} 有改动，已经重新读取`);
    } catch (error) {
      ctx.logger.error(`重新读取 ${CONTENT_PATH} 失败：${(error as Error).message}`);
    }
  });
}

/** 站点文案集合（只有一个条目，id 是 index） */
export function siteContentLoader(): Loader {
  const name = 'xiaoxiao-site-content';
  return {
    name,
    load: async (ctx) => {
      await run(ctx);
      watchContentFile(ctx, () => run(ctx));
    },
  };

  async function run(ctx: LoaderContext): Promise<void> {
      // 先清空这个集合：内容文件是唯一来源，
      // 如果哪一条被删掉了，必须让它从这里也消失（否则旧条目会一直留在网站上）
      ctx.store.clear();

      const raw = await readFile(CONTENT_URL, 'utf8');
      const sections = parseContent(raw, (message) => ctx.logger.warn(message));

      const brand = readSection(sections, '品牌');
      const hero = readSection(sections, '首页');
      const products = readSection(sections, '今日手作');
      const about = readSection(sections, '关于笑笑');
      const journal = readSection(sections, '手作记录');
      const contact = readSection(sections, '联系');
      const footer = readSection(sections, '页脚');

      const aboutHtml = about.body
        ? (await ctx.renderMarkdown(about.body, { fileURL: CONTENT_URL })).html
        : '';

      const data = await ctx.parseData({
        id: 'index',
        filePath: CONTENT_PATH,
        data: {
          brand: {
            name: f(brand, '名称'),
            intro: f(brand, '一句话介绍'),
            pageTitle: f(brand, '网页标题'),
            pageDescription: f(brand, '网页描述'),
            ogImage: f(brand, '分享图'),
            ogImageAlt: f(brand, '分享图说明'),
          },
          hero: {
            eyebrow: f(hero, '小标签'),
            title: f(hero, '主标题'),
            subtitle: f(hero, '副标题'),
            intro: f(hero, '介绍'),
            ctaLabel: f(hero, '按钮'),
            ctaSecondaryLabel: f(hero, '按钮二'),
            image: f(hero, '图片'),
            imageAlt: f(hero, '图片描述'),
          },
          products: {
            eyebrow: f(products, '小标签'),
            title: f(products, '标题'),
            note: f(products, '说明'),
            items: products.items.map((entry) => ({
              name: entry.name,
              description: f(entry, '一句话描述'),
              price: f(entry, '价格'),
              unit: f(entry, '规格'),
              status: f(entry, '状态'),
              image: f(entry, '图片'),
              imageAlt: f(entry, '图片描述'),
              note: f(entry, '小备注'),
            })),
          },
          about: {
            eyebrow: f(about, '小标签'),
            title: f(about, '标题'),
            image: f(about, '图片'),
            imageAlt: f(about, '图片描述'),
            html: aboutHtml,
          },
          journal: {
            eyebrow: f(journal, '小标签'),
            title: f(journal, '标题'),
            note: f(journal, '说明'),
            limit: f(journal, '首页显示条数') || '3',
          },
          contact: {
            eyebrow: f(contact, '小标签'),
            title: f(contact, '标题'),
            intro: f(contact, '说明'),
            hours: f(contact, '营业说明'),
            wechat: f(contact, '微信'),
            phone: f(contact, '电话'),
            ctaLabel: f(contact, '按钮'),
            ctaSecondaryLabel: f(contact, '按钮二'),
            note: f(contact, '补充说明'),
          },
          footer: {
            copyright: f(footer, '版权'),
            note: f(footer, '说明'),
          },
        },
      });

      ctx.store.set({
        id: 'index',
        data,
        digest: ctx.generateDigest(raw),
        filePath: CONTENT_PATH,
      });

  }
}

/** 手作记录集合：一篇记录一个条目，正文渲染成 HTML */
export function journalContentLoader(): Loader {
  const name = 'xiaoxiao-journal-content';
  return {
    name,
    load: async (ctx) => {
      await run(ctx);
      watchContentFile(ctx, () => run(ctx));
    },
  };

  async function run(ctx: LoaderContext): Promise<void> {
      // 同上：删掉一篇记录之后，它的页面必须跟着消失
      ctx.store.clear();

      const raw = await readFile(CONTENT_URL, 'utf8');
      const sections = parseContent(raw, (message) => ctx.logger.warn(message), ['手作记录']);
      const journal = readSection(sections, '手作记录');
      const seen = new Map<string, string>();

      for (const entry of journal.items) {
        const date = f(entry, '日期');
        const slug = toSlug(f(entry, '链接') || date);

        if (!slug) {
          throw new Error(
            `${CONTENT_PATH}：「${entry.name}」缺少「日期：」或者「链接：」，没法生成网址。` +
              `至少要写一行「日期：2026-10-01」。`,
          );
        }

        const previous = seen.get(slug);
        if (previous) {
          throw new Error(
            `${CONTENT_PATH}：「${entry.name}」和「${previous}」的网址都是 /journal/${slug}/，` +
              `给其中一篇加一行「链接：另一个英文名」。`,
          );
        }
        seen.set(slug, entry.name);

        const data = await ctx.parseData({
          id: slug,
          filePath: CONTENT_PATH,
          data: {
            title: entry.name,
            slug,
            date,
            summary: f(entry, '摘要'),
            image: f(entry, '图片'),
            imageAlt: f(entry, '图片描述'),
          },
        });

        const rendered = entry.body
          ? await ctx.renderMarkdown(entry.body, { fileURL: CONTENT_URL })
          : undefined;

        ctx.store.set({
          id: slug,
          data,
          body: entry.body,
          rendered,
          digest: ctx.generateDigest(`${entry.name}\n${entry.body}`),
          filePath: CONTENT_PATH,
        });
      }

  }
}
