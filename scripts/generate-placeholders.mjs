/**
 * 生成占位图（SVG）。
 *
 * 现在还没有正式的产品照片，所以用一套统一的、暖色的手绘感占位图顶上：
 * 它们看起来是有意为之的空位，而不是随手找来的图库照片。
 *
 * 画法（细节见 README「现在的占位图是怎么画出来的」）：
 * - 产品图用「切开的蛋黄酥」剖面，切面朝向镜头。层次从外到内：
 *   酥皮 → 肉松 → 豆沙（或莲蓉）→ 整颗咸蛋黄，酥皮表面撒黑芝麻。
 *   切面不是正圆：底部在烤盘上压过，是平的（见 FLAT 参数）。
 * - 其余场景用俯视的一整颗：外轮廓是不规则的，表面有蛋液烤出来的金黄色，
 *   酥皮层次用虚线圈暗示，黑芝麻随手撒。
 *
 * 用法：npm run placeholders
 * 加了新产品之后，在 PRESETS 里补一条（或改 FILLINGS 里的颜色）再跑一次即可。
 * 真实照片就位后，直接删掉对应的 .svg 并改内容文件里的 image 字段。
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const OUT_DIR = resolve(process.cwd(), 'public/images');

const SANS = "'PingFang SC','Hiragino Sans GB','Microsoft YaHei','Noto Sans SC',sans-serif";
const SERIF = "'Songti SC','Source Han Serif SC','Noto Serif SC',Georgia,serif";

/** 各口味的内馅颜色：[主色, 描边/深色, 馅料颗粒] */
const FILLINGS = {
  redbean: ['#8F4C36', '#7A3E2B', '#A8634A'], // 红豆沙（更深）
  lotus: ['#D9B96E', '#C2A055', '#E6CE96'], // 莲蓉（比酥皮深一档，层次才看得出来）
  original: ['#A96A50', '#8E563E', '#BC8067'], // 原味（豆沙，比红豆沙浅一点）
  seasonal: ['#C08A57', '#A67244', '#D0A272'], // 当季限定
};

const PRESETS = [
  { file: 'hero/hero.svg', w: 1600, h: 1100, kind: 'hero', title: '刚出炉的蛋黄酥' },
  { file: 'hero/og.svg', w: 1200, h: 630, kind: 'og' },
  {
    file: 'products/original.svg',
    w: 1200,
    h: 900,
    kind: 'product',
    title: '原味蛋黄酥',
    filling: 'original',
  },
  {
    file: 'products/red-bean.svg',
    w: 1200,
    h: 900,
    kind: 'product',
    title: '红豆沙蛋黄酥',
    filling: 'redbean',
  },
  {
    file: 'products/lotus.svg',
    w: 1200,
    h: 900,
    kind: 'product',
    title: '莲蓉蛋黄酥',
    filling: 'lotus',
  },
  {
    file: 'products/seasonal.svg',
    w: 1200,
    h: 900,
    kind: 'product',
    title: '当季限定',
    filling: 'seasonal',
  },
  { file: 'story/xiaoxiao.svg', w: 1200, h: 1200, kind: 'story', title: '笑笑在厨房做糕点' },
  { file: 'journal/first-batch.svg', w: 1600, h: 1000, kind: 'journal', title: '第一炉蛋黄酥' },
  { file: 'journal/lotus.svg', w: 1600, h: 1000, kind: 'journal', title: '炒莲蓉' },
  { file: 'journal/start.svg', w: 1600, h: 1000, kind: 'journal', title: '厨房窗台' },
];

const r1 = (n) => {
  if (!Number.isFinite(n)) throw new Error(`坐标算出了 ${n}`);
  return Number(n.toFixed(1));
};

/** 伪随机，保证每次生成的图都一样 */
function makeRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/* ------------------------------------------------------------------
   切面的形状：一个圆，底部被烤盘压平
   FLAT = 从底圆圆心往下切掉多少（相对半径）。
   0.62 → 形状高 1.62R、宽 2R，接近真实蛋黄酥的 57mm × 70mm
------------------------------------------------------------------ */
const FLAT = 0.62;
const FLAT_DEG = (Math.asin(FLAT) * 180) / Math.PI; // ≈ 38.3°

/**
 * 切面轮廓路径。
 * @param {number} baseY 平底所在的 y
 * @param {number} R 半宽
 * @param {number} s 缩放（1 = 最外层酥皮）
 * @param {number} lift 底边上移量，用来露出下面那一层
 */
function cutFacePath(cx, baseY, R, s = 1, lift = 0) {
  const r = R * s;
  const bottom = baseY - lift;
  const cy = bottom - FLAT * r; // 底圆圆心
  const from = 180 - FLAT_DEG;
  const to = 360 + FLAT_DEG;
  const steps = 46;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const phi = ((from + ((to - from) * i) / steps) * Math.PI) / 180;
    pts.push([cx + Math.cos(phi) * r, cy + Math.sin(phi) * r]);
  }
  const head = pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${r1(x)} ${r1(y)}`).join(' ');
  // Z 会把首尾连起来 —— 那一段就是烤盘压出来的平底
  return `${head} Z`;
}

/* ------------------------------------------------------------------
   一、切开的一颗（剖面）
------------------------------------------------------------------ */

/** 各层相对半宽的缩放：决定每层有多少厚 */
const SCALE = {
  layer: 0.955, // 酥皮层次的那条弧线
  floss: 0.9, // 肉松外沿（正好贴在酥皮内侧）
  paste: 0.76, // 豆沙 / 莲蓉
  yolk: 0.4, // 咸蛋黄半径
};
/** 各层底边上移量（相对半宽），用来在平底那一侧露出外层的厚度 */
const LIFT = { layer: 0.02, floss: 0.02, paste: 0.05 };

/**
 * 肉松：夹在豆沙和酥皮之间的一层，整圈都铺。
 * 真实做法是拿肉松把豆沙球裹一圈再包酥皮，所以切开是完整的一环。
 * 先铺一层底色，再顺着圆周切线方向撒一把深浅纤维，看起来才像「松」而不是一块土。
 */
function flossRing(cx, baseY, R, seed) {
  const rand = makeRandom(seed + 91);
  const cy = baseY - LIFT.floss * R - FLAT * R * SCALE.floss;

  const fibers = Array.from({ length: 46 }, () => {
    const phi = rand() * Math.PI * 2;
    const rr = R * (0.775 + rand() * 0.115);
    const x = cx + Math.cos(phi) * rr;
    const y = cy + Math.sin(phi) * rr;
    // 圆周的切线方向 = 屏幕角度 phi + 90°
    const rot = phi + Math.PI / 2 + (rand() - 0.5) * 0.9;
    const half = (R * (0.045 + rand() * 0.06)) / 2;
    const dx = Math.cos(rot) * half;
    const dy = Math.sin(rot) * half;
    const tone = rand() > 0.45 ? '#DDAF74' : '#A9713A';
    return `<line x1="${r1(x - dx)}" y1="${r1(y - dy)}" x2="${r1(x + dx)}" y2="${r1(y + dy)}" stroke="${tone}" stroke-width="${r1(R * 0.012)}" stroke-linecap="round" opacity="0.8"/>`;
  }).join('');

  const clipId = `floss-${Math.round(cx)}-${Math.round(baseY)}-${Math.round(R)}`;
  const outline = cutFacePath(cx, baseY, R, SCALE.floss, LIFT.floss * R);

  return `<clipPath id="${clipId}"><path d="${outline}"/></clipPath>
    <path d="${outline}" fill="#C08A4E"/>
    <path d="${outline}" fill="none" stroke="#AC7638" stroke-width="${r1(R * 0.01)}" opacity="0.65"/>
    <g clip-path="url(#${clipId})">${fibers}</g>`;
}

/** 黑芝麻：撒在酥皮表面，剖面里只看得到顶部那几颗被切开的 */
function blackSesame(cx, baseY, R) {
  const r = R * 0.95;
  const cy = baseY - FLAT * r;
  return [56, 90, 124]
    .map((deg) => {
      const a = (deg * Math.PI) / 180;
      const x = cx + Math.cos(a) * r;
      const y = cy - Math.sin(a) * r;
      return `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(R * 0.04)}" ry="${r1(R * 0.024)}" transform="rotate(${r1(deg - 90)} ${r1(x)} ${r1(y)})" fill="#3A3128"/>`;
    })
    .join('');
}

/**
 * 一颗切开的蛋黄酥。
 * @param {number} baseY 平底（放在盘子 / 烤盘上那一条）的 y
 * @param {number} R 半宽
 * @param {[string,string,string]} filling 馅料配色
 */
function cutaway(cx, baseY, R, filling, { floss: withFloss = true, seed = 1 } = {}) {
  const [paste, pasteDark, pasteLight] = filling;
  const maskId = `nib-${Math.round(cx)}-${Math.round(baseY)}-${Math.round(R)}`;
  const cyBase = baseY - FLAT * R;

  // 轮廓缺口：手切出来的边不会是光滑的。只在侧面和顶部啃，别啃到平底
  const rand = makeRandom(Math.round(cx * 7 + baseY * 3 + R));
  const notches = Array.from({ length: 8 }, () => {
    const phi = ((-172 + rand() * 202) * Math.PI) / 180;
    const rr = R * (0.97 + rand() * 0.03);
    return `<circle cx="${r1(cx + Math.cos(phi) * rr)}" cy="${r1(cyBase + Math.sin(phi) * rr)}" r="${r1(R * (0.028 + rand() * 0.045))}" fill="#000"/>`;
  }).join('');

  const yolkR = R * SCALE.yolk;
  const yolkCy = cyBase - R * 0.06;

  // 豆沙里的小颗粒，让色块不那么死板（只撒在蛋黄外侧那一圈）
  const crumbs = Array.from({ length: 18 }, () => {
    const a = rand() * Math.PI * 2;
    const rr = R * (0.46 + rand() * 0.26);
    return `<circle cx="${r1(cx + Math.cos(a) * rr)}" cy="${r1(cyBase + Math.sin(a) * rr)}" r="${r1(R * (0.01 + rand() * 0.014))}" fill="${pasteLight}" opacity="0.5"/>`;
  }).join('');

  return `<g>
      <defs>
        <mask id="${maskId}" maskUnits="userSpaceOnUse" x="${r1(cx - R * 1.4)}" y="${r1(baseY - R * 2.1)}" width="${r1(R * 2.8)}" height="${r1(R * 2.8)}">
          <rect x="${r1(cx - R * 1.4)}" y="${r1(baseY - R * 2.1)}" width="${r1(R * 2.8)}" height="${r1(R * 2.8)}" fill="#fff"/>
          ${notches}
        </mask>
      </defs>
      <ellipse cx="${r1(cx)}" cy="${r1(baseY + R * 0.045)}" rx="${r1(R * 1.02)}" ry="${r1(R * 0.085)}" fill="#B79B73" opacity="0.16"/>
      <g mask="url(#${maskId})">
        <path d="${cutFacePath(cx, baseY, R, 1, R * 0.022)}" fill="#D8C09A"/>
        <path d="${cutFacePath(cx, baseY, R)}" fill="#EFDCB6" stroke="#DCC69E" stroke-width="${r1(R * 0.018)}"/>
        <path d="${cutFacePath(cx, baseY, R, SCALE.layer, LIFT.layer * R)}" fill="none" stroke="#E4D0A8" stroke-width="${r1(R * 0.013)}"/>
        ${withFloss ? flossRing(cx, baseY, R, seed) : ''}
        <path d="${cutFacePath(cx, baseY, R, SCALE.paste, LIFT.paste * R)}" fill="${paste}" stroke="${pasteDark}" stroke-width="${r1(R * 0.012)}"/>
        ${crumbs}
        <circle cx="${r1(cx)}" cy="${r1(yolkCy)}" r="${r1(yolkR)}" fill="url(#yolk)" stroke="#CE9520" stroke-width="${r1(R * 0.012)}"/>
        <circle cx="${r1(cx)}" cy="${r1(yolkCy)}" r="${r1(yolkR * 0.7)}" fill="none" stroke="#E7B843" stroke-width="${r1(R * 0.01)}" opacity="0.45"/>
        <ellipse cx="${r1(cx - yolkR * 0.3)}" cy="${r1(yolkCy - yolkR * 0.34)}" rx="${r1(yolkR * 0.3)}" ry="${r1(yolkR * 0.2)}" fill="#F8DA8E" opacity="0.6"/>
        ${blackSesame(cx, baseY, R)}
      </g>
    </g>`;
}

/* ------------------------------------------------------------------
   二、俯视的一整颗
------------------------------------------------------------------ */

/**
 * 不规则闭合曲线：圆周采样 + 正弦扰动，再用二次贝塞尔平滑连接。
 * @param {number} flat 底部削平到原来的多少（0.97 = 底部那一小块是平的）
 * @param {number} spread 底部摊开的比例（放着烤，底盘会稍微摊大一点）
 */
function blobPath(cx, cy, r, { wobble = 0.045, seed = 3, squash = 0.96, steps = 22, flat = 0.97, spread = 0.055 } = {}) {
  const pts = Array.from({ length: steps }, (_, i) => {
    const a = (i / steps) * Math.PI * 2;
    const k = 1 + wobble * Math.sin(3 * a + seed) + wobble * 0.6 * Math.sin(5 * a + seed * 2);
    // 底部（坐在烤盘上的那一侧）稍微摊开一点，所以轮廓不是正圆
    const lower = Math.max(0, Math.sin(a));
    const k2 = k * (1 + spread * lower * lower);
    return [cx + Math.cos(a) * r * k2, cy + Math.sin(a) * r * squash * k2];
  });
  // 放在烤盘上压出来的平底：把最低的那一小段削平
  if (flat > 0) {
    const maxY = cy + r * squash * flat;
    for (const p of pts) if (p[1] > maxY) p[1] = maxY;
  }
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const start = mid(pts[pts.length - 1], pts[0]);
  let d = `M ${r1(start[0])} ${r1(start[1])}`;
  for (let i = 0; i < pts.length; i++) {
    const cur = pts[i];
    const next = pts[(i + 1) % pts.length];
    const m = mid(cur, next);
    d += ` Q ${r1(cur[0])} ${r1(cur[1])} ${r1(m[0])} ${r1(m[1])}`;
  }
  return `${d} Z`;
}

/**
 * 一整颗蛋黄酥（俯视）。
 * @param {number} r 半径
 * @param {number} seed 换个数字，形状和芝麻位置就不同
 */
function whole(cx, cy, r, seed = 5) {
  const rand = makeRandom(seed * 977);
  // 黑芝麻：深色小颗粒，比白芝麻小一点
  const seeds = Array.from({ length: 9 }, () => {
    const a = rand() * Math.PI * 2;
    const rr = r * (0.24 + rand() * 0.44);
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr * 0.96;
    const deg = Math.round(rand() * 180);
    return `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(r * 0.042)}" ry="${r1(r * 0.024)}" transform="rotate(${deg} ${r1(x)} ${r1(y)})" fill="#3A3128"/>`;
  }).join('');

  return `<g>
      <ellipse cx="${r1(cx)}" cy="${r1(cy + r * 0.95)}" rx="${r1(r * 1.02)}" ry="${r1(r * 0.15)}" fill="#B79B73" opacity="0.17"/>
      <path d="${blobPath(cx, cy, r, { seed })}" fill="#F2E1BE" stroke="#DFC9A2" stroke-width="${r1(r * 0.022)}"/>
      <circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r * 0.86)}" fill="none" stroke="#D9BE8E" stroke-width="${r1(r * 0.035)}" stroke-dasharray="${r1(r * 0.17)} ${r1(r * 0.11)}" opacity="0.9"/>
      <path d="${blobPath(cx - r * 0.03, cy - r * 0.05, r * 0.68, { seed: seed + 2, wobble: 0.06, flat: 0.98 })}" fill="url(#wash)"/>
      <ellipse cx="${r1(cx - r * 0.24)}" cy="${r1(cy - r * 0.3)}" rx="${r1(r * 0.2)}" ry="${r1(r * 0.13)}" fill="#F3D49A" opacity="0.45"/>
      ${seeds}
    </g>`;
}

/* ------------------------------------------------------------------
   三、小道具与背景
------------------------------------------------------------------ */

/** 一只茶杯 */
function cup(cx, cy, size) {
  return `<g transform="translate(${cx} ${cy})">
      <ellipse cy="${r1(size * 0.62)}" rx="${r1(size * 0.62)}" ry="${r1(size * 0.14)}" fill="#B79B73" opacity="0.14"/>
      <path d="M${r1(size * 0.66)} ${r1(-size * 0.05)} q ${r1(size * 0.42)} ${r1(size * 0.04)} ${r1(size * 0.06)} ${r1(size * 0.42)}"
        fill="none" stroke="#E4D6BE" stroke-width="${r1(size * 0.07)}" stroke-linecap="round"/>
      <path d="M${r1(-size * 0.5)} ${r1(-size * 0.42)} h ${r1(size)} l ${r1(-size * 0.12)} ${r1(size * 0.94)} q ${r1(-size * 0.38)} ${r1(size * 0.16)} ${r1(-size * 0.76)} 0 z"
        fill="#FFFDF8" stroke="#E4D6BE" stroke-width="${r1(size * 0.03)}"/>
      <ellipse cy="${r1(-size * 0.42)}" rx="${r1(size * 0.5)}" ry="${r1(size * 0.17)}" fill="#F4E8D2" stroke="#E4D6BE" stroke-width="${r1(size * 0.028)}"/>
      <ellipse cy="${r1(-size * 0.42)}" rx="${r1(size * 0.36)}" ry="${r1(size * 0.11)}" fill="#E9D9BC" opacity="0.8"/>
    </g>`;
}

/** 背景上散落的小点，给大面积留白一点手作感 */
function speckles(w, h, count, seed = 7) {
  const rand = makeRandom(seed);
  return Array.from({ length: count }, () => {
    const x = r1(rand() * w);
    const y = r1(rand() * h);
    return `<circle cx="${x}" cy="${y}" r="${r1(1.6 + rand() * 3.4)}" fill="#C9B48F" opacity="0.16"/>`;
  }).join('');
}

function caption(cx, y, text, size, fill = '#9C8B74') {
  return `<text x="${r1(cx)}" y="${r1(y)}" text-anchor="middle" font-family="${SERIF}" font-size="${r1(size)}" fill="${fill}">${text}</text>`;
}

function hint(cx, y, text, size) {
  return `<text x="${r1(cx)}" y="${r1(y)}" text-anchor="middle" font-family="${SANS}" font-size="${r1(size)}" letter-spacing="${r1(size * 0.3)}" fill="#BBAA90">${text}</text>`;
}

function defs() {
  return `<defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#FCF8F0"/>
        <stop offset="1" stop-color="#F3E9D8"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="42%" r="62%">
        <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.85"/>
        <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="yolk" cx="36%" cy="32%" r="72%">
        <stop offset="0" stop-color="#F7CE68"/>
        <stop offset="1" stop-color="#DE9F1E"/>
      </radialGradient>
      <radialGradient id="wash" cx="40%" cy="34%" r="70%">
        <stop offset="0" stop-color="#E9BE84" stop-opacity="0.95"/>
        <stop offset="1" stop-color="#D9A75E" stop-opacity="0.75"/>
      </radialGradient>
    </defs>`;
}

function body(preset) {
  const { w, h, kind, title = '' } = preset;
  const m = Math.min(w, h);
  const filling = FILLINGS[preset.filling ?? 'original'];
  // 肉松默认有一层；某个产品没有肉松，就在它的 preset 里写 floss: false
  const cutOpts = { floss: preset.floss !== false, seed: w + h };

  const bg = `<rect width="${w}" height="${h}" fill="url(#bg)"/>
    <ellipse cx="${w / 2}" cy="${h * 0.42}" rx="${w * 0.55}" ry="${h * 0.5}" fill="url(#glow)"/>
    ${speckles(w, h, 26, w + h)}`;

  if (kind === 'og') {
    return `${bg}
      <g>
        ${cutaway(w * 0.78, h * 0.86, m * 0.32, filling, cutOpts)}
        <text x="${w * 0.08}" y="${h * 0.44}" font-family="${SERIF}" font-size="${m * 0.13}" fill="#3B3229">笑笑的蛋黄酥</text>
        <text x="${w * 0.08}" y="${h * 0.6}" font-family="${SANS}" font-size="${m * 0.052}" letter-spacing="${m * 0.012}" fill="#8A7B68">妈妈退休后的手作小铺</text>
        <text x="${w * 0.08}" y="${h * 0.78}" font-family="${SANS}" font-size="${m * 0.04}" fill="#A8927A">从一颗蛋黄酥开始，慢慢做，认真做。</text>
      </g>`;
  }

  // 一个大剖面 + 一颗完整的 + 一杯茶
  // 注意：这两张（hero / story）不放底部文字。
  // 页面里图片框是 object-fit: cover —— 首页大图在桌面端是 16/9 的框，
  // 会把 1600×1100 上下各裁掉约 100px，story 在手机端 4/3 的框里也会裁，
  // 底部那行「照片待补」正好被切一半。画面本身已经说明是占位图了。
  if (kind === 'hero') {
    return `${bg}
      <g>
        ${cup(w * 0.84, h * 0.79, m * 0.13)}
        ${whole(w * 0.78, h * 0.4, m * 0.155, 11)}
        ${cutaway(w * 0.36, h * 0.82, m * 0.29, filling, cutOpts)}
      </g>`;
  }

  if (kind === 'story') {
    return `${bg}
      <g>
        ${whole(w * 0.81, h * 0.29, m * 0.15, 3)}
        ${whole(w * 0.79, h * 0.67, m * 0.125, 8)}
        ${cutaway(w * 0.42, h * 0.63, m * 0.23, filling, cutOpts)}
        ${cup(w * 0.19, h * 0.8, m * 0.125)}
      </g>`;
  }

  if (kind === 'journal') {
    return `${bg}
      <g>
        ${cup(w * 0.26, h * 0.62, m * 0.21)}
        ${cutaway(w * 0.68, h * 0.82, m * 0.28, filling, cutOpts)}
      </g>
      ${caption(w / 2, h * 0.915, title, m * 0.04)}
      ${hint(w / 2, h * 0.915 + m * 0.05, '照片待补', m * 0.026)}`;
  }

  // 产品图：切面尽量占满画布。
  // 产品图在卡片里只有 250px 宽、在对比表里只有 120px 宽，
  // 之前画面只占 50%，小尺寸下几乎看不清；
  // 底部那两行小字在这个尺寸下也完全读不出来，所以不放文字了
  //（卡片和对比表下面本来就写着产品名）。
  const R = m * 0.46;
  const shapeHeight = (1 + FLAT) * R;
  const baseY = (h + shapeHeight) / 2; // 上下边距一样
  return `${bg}
    <g>${cutaway(w * 0.5, baseY, R, filling, cutOpts)}</g>`;
}

function render(preset) {
  const { file, w, h } = preset;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!-- 占位图，可直接替换：public/images/${file} -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${preset.title ?? '占位图'}">
  ${defs()}
  ${body(preset)}
</svg>
`;
  if (svg.includes('NaN') || svg.includes('undefined')) {
    throw new Error(`${file} 里出现了 NaN 或 undefined`);
  }
  return svg;
}

for (const preset of PRESETS) {
  const target = resolve(OUT_DIR, preset.file);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, render(preset), 'utf8');
  console.log(`✓ public/images/${preset.file}`);
}
