/**
 * 生成站点图标与分享图。
 *
 *   public/favicon.svg          矢量图标（现代浏览器）
 *   public/favicon.ico          真正的 .ico，内含 16/32/48 三个尺寸
 *   public/apple-touch-icon.png iOS 添加到主屏用的 180×180
 *   public/images/hero/og.png   社交平台分享图，从 og.svg 渲染
 *
 * 为什么要 PNG：微信 / 微博 / Twitter 等平台**不渲染 SVG**，
 * 之前 og 图是 .svg，所以分享出去没有图。
 *
 * 图标画的是「笑笑经典蛋黄酥」的俯视图：金黄酥皮 + 黑芝麻。
 * 注意：图标尺寸很小，芝麻要画得比真实比例大得多，
 * 否则缩到 16px 就完全看不见了。
 *
 * 跑法：npm run icons
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = resolve(root, 'public');

/* ------------------------------------------------------------------
   一、图标图形（512×512，俯视的一整颗蛋黄酥）
------------------------------------------------------------------ */

/** 黑芝麻：位置写死，保证每次生成都一样，也避免缩小时挤成一团 */
const SESAME = [
  [196, 178, -24],
  [318, 196, 34],
  [232, 300, 12],
  [332, 296, -18],
  [214, 386, 26],
  [300, 392, -30],
];

function iconSvg() {
  const seeds = SESAME.map(
    ([x, y, deg]) =>
      `<ellipse cx="${x}" cy="${y}" rx="20" ry="12" transform="rotate(${deg} ${x} ${y})" fill="#3A3128"/>`,
  ).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-label="笑笑的蛋黄酥">
  <title>笑笑的蛋黄酥</title>
  <defs>
    <!-- 刷过蛋液、烤成金棕色的顶面 -->
    <radialGradient id="wash" cx="36%" cy="28%" r="82%">
      <stop offset="0" stop-color="#F0C377"/>
      <stop offset="0.62" stop-color="#DDA349"/>
      <stop offset="1" stop-color="#D0903A"/>
    </radialGradient>
  </defs>

  <!-- 米色圆角底，浅色和深色标签栏里都看得清 -->
  <rect width="512" height="512" rx="104" fill="#FBF3E4"/>

  <!-- 落在台面上的投影 -->
  <ellipse cx="256" cy="392" rx="150" ry="26" fill="#B79B73" opacity="0.16"/>

  <!-- 酥皮 -->
  <circle cx="256" cy="266" r="168" fill="#F2E1BE" stroke="#DFC9A2" stroke-width="10"/>

  <!-- 刷了蛋液的顶面，稍微偏左上 -->
  <circle cx="244" cy="250" r="120" fill="url(#wash)"/>

  <!-- 顶面的油亮高光 -->
  <ellipse cx="192" cy="192" rx="42" ry="26" transform="rotate(-24 192 192)" fill="#F7DFAE" opacity="0.5"/>

  <!-- 黑芝麻 -->
  ${seeds}
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

// 3) iOS 主屏图标：不要透明，所以保持米色底
const apple = await png(180);
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
