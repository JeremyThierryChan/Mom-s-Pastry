/**
 * 生成站点图标与分享图。
 *
 *   public/favicon.svg          矢量图标（现代浏览器）
 *   public/favicon.ico          真正的 .ico，内含 16/32/48 三个尺寸
 *   public/apple-touch-icon.png iOS 添加到主屏用的 180×180
 *   public/images/hero/og.png   社交平台分享图，从 og.svg 渲染
 *
 * 图标直接用产品卡里那张「笑笑经典蛋黄酥」的剖面图
 * （public/images/products/classic.svg），所以产品图改了图标也会跟着变。
 *
 * 为什么要 PNG：微信 / 微博 / Twitter 等平台**不渲染 SVG**，
 * 之前 og 图是 .svg，所以分享出去没有图。
 *
 * 跑法：npm run icons（要先有产品图，即 npm run placeholders）
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = resolve(root, 'public');

/* ------------------------------------------------------------------
   一、图标图形
------------------------------------------------------------------ */

const ICON = 512;

/** 产品图是 1200×900，剖面本身（含底部投影）大致落在下面这个范围里 */
const ART_BOX = { x0: 186, y0: 115, x1: 1014, y1: 840 };

/** 剖面占图标边长的比例。留一圈米色边，小尺寸下才像个「图标」而不是糊满 */
const COVER = 0.78;

/**
 * 取出产品图的内部内容。
 * 去掉它自带的那块整幅背景 —— 图标用的是圆角底，
 * 留着方形的背景会把圆角盖掉。
 */
function cutawayContent() {
  const file = resolve(pub, 'images/products/classic.svg');
  let raw;
  try {
    raw = readFileSync(file, 'utf8');
  } catch {
    console.error('✗ 找不到产品图 public/images/products/classic.svg');
    console.error('  先跑 npm run placeholders 生成产品图，再跑 npm run icons');
    process.exit(1);
  }

  return raw
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/\s*<rect width="1200" height="900" fill="url\(#bg\)"\/>/, '');
}

/**
 * @param rounded 是否切圆角。
 *   浏览器标签页图标要圆角（网页背景上好看）；
 *   iOS 主屏图标**不能**要 —— 圆角外是透明的，iOS 会把透明区填成黑色，
 *   主屏上就出现四个黑角。所以那边用不透明的方形，圆角交给 iOS 自己加。
 */
function iconSvg({ rounded = true } = {}) {
  // 把剖面按比例缩到方框里并居中
  const artW = ART_BOX.x1 - ART_BOX.x0;
  const artH = ART_BOX.y1 - ART_BOX.y0;
  const scale = (ICON * COVER) / Math.max(artW, artH);
  const tx = ICON / 2 - ((ART_BOX.x0 + ART_BOX.x1) / 2) * scale;
  const ty = ICON / 2 - ((ART_BOX.y0 + ART_BOX.y1) / 2) * scale;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ICON} ${ICON}" width="${ICON}" height="${ICON}" role="img" aria-label="笑笑的蛋黄酥">
  <title>笑笑的蛋黄酥</title>

  ${
    rounded
      ? `<clipPath id="icon-round">
    <rect width="${ICON}" height="${ICON}" rx="104"/>
  </clipPath>`
      : ''
  }

  <g${rounded ? ' clip-path="url(#icon-round)"' : ''}>
    <!-- 米色底：用产品图自己那套渐变，颜色才一致 -->
    <rect width="${ICON}" height="${ICON}" fill="url(#bg)"/>
    <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(5)})">
${cutawayContent()}
    </g>
  </g>
</svg>
`;
}

/* ------------------------------------------------------------------
   二、ICO 容器
------------------------------------------------------------------ */

/**
 * 拼一个 .ico 文件。
 * ICO 允许直接内嵌 PNG 数据（Vista 之后都支持），所以不用额外依赖。
 */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = 图标
  header.writeUInt16LE(entries.length, 4);

  let offset = 6 + entries.length * 16;
  const dir = [];
  for (const { size, data } of entries) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // 宽（0 表示 256）
    e.writeUInt8(size >= 256 ? 0 : size, 1); // 高
    e.writeUInt8(0, 2); // 调色板数
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // 色彩平面
    e.writeUInt16LE(32, 6); // 位深
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    dir.push(e);
  }

  return Buffer.concat([header, ...dir, ...entries.map((e) => e.data)]);
}

/* ------------------------------------------------------------------
   三、生成
------------------------------------------------------------------ */

const svg = iconSvg();
const svgSquare = iconSvg({ rounded: false });

/** 渲染成指定边长的 PNG */
async function png(size, source = Buffer.from(svg)) {
  return sharp(source, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

mkdirSync(pub, { recursive: true });
mkdirSync(resolve(pub, 'images/hero'), { recursive: true });

// 1) 矢量图标
writeFileSync(resolve(pub, 'favicon.svg'), svg, 'utf8');
console.log('✓ public/favicon.svg');

// 2) .ico：16 / 32 / 48
const icoEntries = [];
for (const size of [16, 32, 48]) {
  icoEntries.push({ size, data: await png(size) });
}
const ico = buildIco(icoEntries);
writeFileSync(resolve(pub, 'favicon.ico'), ico);
console.log(`✓ public/favicon.ico  (16/32/48，${(ico.length / 1024).toFixed(1)} KB)`);

// 3) iOS 主屏图标：方形不透明，圆角交给 iOS
const apple = await png(180, Buffer.from(svgSquare));
writeFileSync(resolve(pub, 'apple-touch-icon.png'), apple);
console.log(`✓ public/apple-touch-icon.png  (180×180，${(apple.length / 1024).toFixed(1)} KB)`);

// 4) 分享图：从 og.svg 渲染成 PNG（社交平台不认 SVG）
const ogSvg = resolve(pub, 'images/hero/og.svg');
const og = await sharp(ogSvg, { density: 288 })
  .resize(1200, 630, { fit: 'fill' })
  .png({ compressionLevel: 9 })
  .toBuffer();
const meta = await sharp(og).metadata();
writeFileSync(resolve(pub, 'images/hero/og.png'), og);
console.log(
  `✓ public/images/hero/og.png  (${meta.width}×${meta.height}，${(og.length / 1024).toFixed(1)} KB)`,
);
