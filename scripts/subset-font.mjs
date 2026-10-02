/**
 * 把中文衬线字体子集化，只保留站上真正会出现的字，然后放进 public/fonts/。
 *
 * 为什么要这么做：
 *   网站在打包字体之前完全依赖设备自带字体。iPhone / Android 上
 *   系统没有「宋体」这类中文衬线，衬线那套字体栈只能退回无衬线，
 *   于是标题和产品名在手机上变成黑体 —— 和电脑上看到的不一样。
 *   把字体打包进网站，所有设备就都一致了。
 *
 * 为什么必须子集化：
 *   完整的中文衬线字体一个字重就要 1.5 MB（思源宋体整包更大），
 *   而这些字里 99% 都用不到。只保留用到的几百个字，
 *   一个字重能压到几十 KB。
 *
 * 字符集从哪来：
 *   网站内容.md（你编辑的内容）+ 所有 .astro 模板里的文字。
 *   模板会先剥掉 frontmatter / <script> / <style> / HTML 标签 / 注释，
 *   但保留 {表达式} 里的文字 —— 像「有 / 没有」这种写在表达式里的文案也要算进去。
 *
 * 注意：这个脚本会在 npm run dev / npm run build 前自动跑，
 *   所以你往 网站内容.md 里加了新字，下次构建会自动带上，不用手动处理。
 *   万一漏了某个字也不会显示成方块 —— 字体栈后面还有系统字体兜底。
 *
 * 跑法：npm run fonts（一般不用手动跑）
 */
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = resolve(root, 'node_modules/@fontsource/noto-serif-sc/files');
const OUT_DIR = resolve(root, 'public/fonts');

/** 站上用到的字重：400 正文里的衬线、600 标题 */
const WEIGHTS = [400, 600];

/** 兜底字符：数字、字母、常用标点、货币和数学符号 */
const BASELINE =
  ' 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' +
  '¥￥.,:;!?()[]{}<>/\\|-_+=*&^%$#@~`\'"' +
  '、。，；：！？（）【】《》〈〉「」『』“”‘’…—－·×÷°％＋－＝／＼';

/** 递归收集目录下所有文件的路径 */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** 剥掉模板里不是给人看的部分，只留文字 */
function templateText(src) {
  return src
    .replace(/^---[\s\S]*?\n---/m, ' ') // frontmatter
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' '); // 标签（连同 class 等属性）一起去掉
}

function collectCharacters() {
  let text = BASELINE;

  // 1) 内容文件：产品名、描述、须知、关于、联系……全在这里
  text += readFileSync(resolve(root, '网站内容.md'), 'utf8');

  // 2) 组件模板里的固定文案（导航、按钮、空状态提示等）
  for (const file of walk(resolve(root, 'src'))) {
    if (file.endsWith('.astro')) text += templateText(readFileSync(file, 'utf8'));
  }

  return [...new Set(text)].sort().join('');
}

const chars = collectCharacters();

mkdirSync(OUT_DIR, { recursive: true });
console.log(`收集到 ${chars.length} 个不同字符，开始子集化…`);

let total = 0;
for (const weight of WEIGHTS) {
  const srcFile = resolve(SRC_DIR, `noto-serif-sc-chinese-simplified-${weight}-normal.woff2`);
  const out = await subsetFont(readFileSync(srcFile), chars, { targetFormat: 'woff2' });
  const outFile = resolve(OUT_DIR, `noto-serif-sc-${weight}.woff2`);
  writeFileSync(outFile, out);
  total += out.length;
  console.log(
    `✓ public/fonts/noto-serif-sc-${weight}.woff2  ` +
      `(${(out.length / 1024).toFixed(1)} KB，源文件 ${(statSync(srcFile).size / 1024).toFixed(0)} KB)`,
  );
}

console.log(`字体合计 ${(total / 1024).toFixed(1)} KB`);
