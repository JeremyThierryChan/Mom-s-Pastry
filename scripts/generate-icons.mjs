/**
 * 生成站点图标与分享图。
 *
 *   public/favicon.svg               矢量图标（现代浏览器）
 *   public/favicon.ico               真正的 .ico，内含 16/32/48 三个尺寸
 *   public/apple-touch-icon.png      iOS 添加到主屏用的 180×180
 *   public/images/hero/og-square.png 方形分享图 1200×1200，卡片分享用
 *   public/images/hero/og.png        横版分享图 1200×630（保留）
 *
 * 图标和方形分享图都取自产品卡里那张「笑笑经典蛋黄酥」剖面图
 * （public/images/products/classic.svg），所以产品图改了它们会跟着变。
 *
 * 为什么要 PNG：微信 / 微博 / Twitter 等平台**不渲染 SVG**。
 * 为什么另外出一张方的：卡片分享时平台会把图裁成方形，
 * 拿 1200×630 的横图去裁，主体会被切掉。
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
   一、素材：产品卡里的那张剖面图
------------------------------------------------------------------ */

/** 剖面在 1200×900 产品图里的范围（含底部投影） */
const ART_BOX = { x0: 186, y0: 115, x1: 1014, y1: 840 };

/**
 * 取出产品图的内部内容。
 * 去掉它自带的那块整幅背景 —— 图标和分享图都用自己的底色，
 * 留着方形背景会把圆角盖掉、也会和四周留白对不齐。
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
 * 把剖面图放进一个正方形画布，居中、四周留一圈底色。
 *
 * @param size    画布边长
 * @param cover   剖面占边长的比例。留边很重要 —— 铺满的话缩到 16px 会糊成一团，
 *                而且卡片分享时平台还会再裁掉一点边
 * @param rounded 是否切圆角（标签页图标要；iOS 主屏图标不要，见下面说明）
 * @param label   无障碍名称
 */
function squareSvg(size, cover, { rounded = false, label = '笑笑经典蛋黄酥的切面' } = {}) {
  const artW = ART_BOX.x1 - ART_BOX.x0;
  const artH = ART_BOX.y1 - ART_BOX.y0;
  const scale = (size * cover) / Math.max(artW, artH);
  const tx = size / 2 - ((ART_BOX.x0 + ART_BOX.x1) / 2) * scale;
  const ty = size / 2 - ((ART_BOX.y0 + ART_BOX.y1) / 2) * scale;
  const radius = Math.round(size * 0.203); // 与 512 图标上的 104 一致

  const clip = rounded
    ? `  <clipPath id="icon-round">
    <rect width="${size}" height="${size}" rx="${radius}"/>
  </clipPath>

`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${label}">
  <title>${label}</title>
${clip}  <g${rounded ? ' clip-path="url(#icon-round)"' : ''}>
    <!-- 米色底：用产品图自己那套渐变，颜色才一致 -->
    <rect width="${size}" height="${size}" fill="url(#bg)"/>
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

/** 渲染成指定边长的 PNG */
async function png(size, source) {
  return sharp(source, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

mkdirSync(pub, { recursive: true });
mkdirSync(resolve(pub, 'images/hero'), { recursive: true });

// 1) 矢量图标：圆角底
const svg = squareSvg(512, 0.78, { rounded: true, label: '笑笑的蛋黄酥' });
writeFileSync(resolve(pub, 'favicon.svg'), svg, 'utf8');
console.log('✓ public/favicon.svg');

// 2) .ico：16 / 32 / 48
const icoEntries = [];
for (const size of [16, 32, 48]) {
  icoEntries.push({ size, data: await png(size, Buffer.from(svg)) });
}
const ico = buildIco(icoEntries);
writeFileSync(resolve(pub, 'favicon.ico'), ico);
console.log(`✓ public/favicon.ico  (16/32/48，${(ico.length / 1024).toFixed(1)} KB)`);

// 3) iOS 主屏图标：不能有透明像素，否则 iOS 会把圆角外填成黑色、
//    主屏上出现四个黑角。所以用不透明方形版，圆角交给 iOS 自己加。
const apple = await png(
  180,
  Buffer.from(squareSvg(512, 0.78, { rounded: false, label: '笑笑的蛋黄酥' })),
);
writeFileSync(resolve(pub, 'apple-touch-icon.png'), apple);
console.log(`✓ public/apple-touch-icon.png  (180×180，${(apple.length / 1024).toFixed(1)} KB)`);

// 4) 方形分享图：卡片分享时平台会把图裁成方形，用横图会被切掉主体。
//    留边比图标多一点（0.74），免得平台再裁边时切到酥皮。
const square = await png(1200, Buffer.from(squareSvg(1200, 0.74)));
writeFileSync(resolve(pub, 'images/hero/og-square.png'), square);
console.log(
  `✓ public/images/hero/og-square.png  (1200×1200，${(square.length / 1024).toFixed(1)} KB)`,
);

// 5) 横版分享图：从 og.svg 渲染（保留，有些平台偏爱 1.91:1 的大图卡片）
const og = await sharp(resolve(pub, 'images/hero/og.svg'), { density: 288 })
  .resize(1200, 630, { fit: 'fill' })
  .png({ compressionLevel: 9 })
  .toBuffer();
writeFileSync(resolve(pub, 'images/hero/og.png'), og);
console.log(`✓ public/images/hero/og.png  (1200×630，${(og.length / 1024).toFixed(1)} KB)`);
