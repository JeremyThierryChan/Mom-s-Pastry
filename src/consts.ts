/**
 * 站点级别的配置与文案。
 * 页面组件只从这里取站点信息，方便以后统一修改（比如换成真实域名、真实联系方式）。
 */

export const SITE = {
  /** 品牌名 */
  name: '笑笑的蛋黄酥',
  /** 做点心的人 */
  ownerName: '笑笑',
  /** 副标题 */
  tagline: '妈妈退休后的手作小铺',
  /** 浏览器标题 */
  title: '笑笑的蛋黄酥｜妈妈退休后的手作小铺',
  /** meta description / og:description */
  description:
    '笑笑的蛋黄酥，一个退休妈妈的小小手作糕点铺。从蛋黄酥开始，认真做好每一份手作。',
  /** 部署后的正式地址，同时用于 canonical 与 sitemap */
  url: 'https://jeremythierrychan.github.io',
  /** GitHub Pages 项目主页需要写成 '/仓库名'；用户主页（<用户名>.github.io）才是 '/' */
  base: '/Mom-s-Pastry',
  /** Open Graph 分享图，建议替换为 1200×630 的 jpg/png */
  ogImage: '/images/hero/og.svg',
  /** 分享图上的替代文本 */
  ogImageAlt: '笑笑的蛋黄酥 — 妈妈退休后的手作小铺',
  /** 页面主题色（浏览器地址栏） */
  themeColor: '#FDFAF4',
  lang: 'zh-CN',
} as const;

/**
 * 联系方式占位符。
 * TODO: 上线前替换成笑笑真实的微信号与手机号，不要在这里编造真实信息。
 */
export const CONTACT = {
  wechat: 'YOUR_WECHAT',
  phone: 'YOUR_PHONE',
  /** 可预订的时段说明，纯文案 */
  hours: '一般上午出炉，提前一天说一声就好',
  /** 取货 / 配送说明 */
  delivery: '同城可以自取，也可以约时间送过去',
} as const;

/** 顶部导航；href 用 hash 锚点，桌面端与移动端共用 */
export const NAV_LINKS = [
  { label: '首页', href: '/', hash: '' },
  { label: '今日手作', href: '/#today', hash: '#today' },
  { label: '关于笑笑', href: '/#about', hash: '#about' },
  { label: '手作记录', href: '/#journal', hash: '#journal' },
  { label: '联系', href: '/#contact', hash: '#contact' },
] as const;

/** 产品状态 → 界面上的中文标签与配色 */
export const PRODUCT_STATUS = {
  available: { label: '今日可订', tone: 'available' },
  limited: { label: '少量制作', tone: 'limited' },
  soldout: { label: '暂时售罄', tone: 'soldout' },
} as const;

export type ProductStatusKey = keyof typeof PRODUCT_STATUS;
