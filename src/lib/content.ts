/**
 * 内容访问层。
 *
 * 页面组件只调用这里的函数，不直接碰集合细节 ——
 * 以后要换成 CMS、数据库或真的订单系统，只需要改这一层。
 *
 * 实际内容来自仓库根目录的「网站内容.md」，
 * 由 src/loaders/site-content.ts 解析、src/content.config.ts 校验。
 */
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

/** 站点文案（品牌、首页、各区块、联系方式、页脚） */
export type SiteContent = CollectionEntry<'site'>['data'];
/** 一个产品 */
export type Product = SiteContent['products']['items'][number];
/** 一篇手作记录 */
export type JournalEntry = CollectionEntry<'journal'>;

/** 顶部导航的一条 */
export interface NavLink {
  label: string;
  href: string;
  hash: string;
}

/**
 * 站点文案只会被读一次，之后走缓存。
 * 读不到就直接报错 —— 这时候整站没有任何内容可渲染，早点报错比默默空白好。
 */
let cached: Promise<SiteContent> | undefined;

export function getSite(): Promise<SiteContent> {
  cached ??= (async () => {
    const entry = await getEntry('site', 'index');
    if (!entry) {
      // 走到这里几乎都是「某个字段没通过校验」，而不是文件不存在
      // （文件真的不存在时，loader 早就抛出读取错误了）
      throw new Error(
        '读不到站点内容。最常见的原因是「网站内容.md」里有字段写错了：请看终端里 ' +
          '[InvalidContentEntryDataError] 那几行，它会指出是哪个产品、哪个字段。' +
          '改好保存后会自动恢复，不用重启。',
      );
    }
    return entry.data;
  })();
  return cached;
}

/**
 * 手作记录：按日期从新到旧。
 * 如果 网站内容.md 里写了「显示：否」，这里返回空数组 ——
 * 内容还在文件里，只是首页不显示、详情页也不生成。
 */
export async function getJournal(): Promise<JournalEntry[]> {
  const site = await getSite();
  if (!site.journal.visible) return [];

  const entries = await getCollection('journal');
  return entries.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** 手作记录的详情页地址 */
export function journalHref(entry: JournalEntry): string {
  return `/journal/${entry.data.slug}/`;
}

/**
 * 导航栏跟着各区块的「小标签」走：
 * 在 网站内容.md 里把小标签改成别的，导航上的字也会跟着变。
 * 被隐藏的区块不会出现在导航里（否则会跳到不存在的锚点）。
 */
export function navLinks(site: SiteContent): NavLink[] {
  // 顺序跟着首页的区块顺序走：今日手作 → 预订须知 → 关于笑笑 →（记录）→ 联系。
  // 每一项的文字取自那个区块的「小标签：」，所以改内容文件里的标签，
  // 导航栏跟着变，不用回来改代码。
  //
  // 「对比」故意不列进来：它紧跟在产品卡片下面，滚动时自然会看到，
  // 导航里再放一个入口反而多余。
  const links: NavLink[] = [
    { label: '首页', href: '/', hash: '' },
    { label: site.products.eyebrow, href: '/#today', hash: '#today' },
    { label: site.booking.eyebrow, href: '/#booking', hash: '#booking' },
    { label: site.about.eyebrow, href: '/#about', hash: '#about' },
  ];

  if (site.journal.visible) {
    links.push({ label: site.journal.eyebrow, href: '/#journal', hash: '#journal' });
  }

  links.push({ label: site.contact.eyebrow, href: '/#contact', hash: '#contact' });
  return links;
}

export type StatusTone = 'available' | 'limited' | 'soldout';

/**
 * 状态文字 → 徽章配色。
 * 状态是自由文本（「今日可订」「少量制作」…），颜色按关键词猜，
 * 这样改了措辞也不至于要回来改代码。
 */
export function statusTone(status: string): StatusTone {
  if (/售罄|卖完|没了|暂停|停做/.test(status)) return 'soldout';
  if (/少量|剩|不多|限量/.test(status)) return 'limited';
  return 'available';
}
