# 笑笑的蛋黄酥

妈妈退休后的手作小铺 —— 一个个人手作食品品牌的静态网站（MVP）。

- 技术栈：Astro 7 + TypeScript + Tailwind CSS 4
- 全静态生成，无后端、无数据库、无第三方依赖服务
- 内容放在 Markdown 里，加产品 / 加记录 = 加一个文件
- 可以直接部署到 GitHub Pages

---

## 一、快速开始

```bash
npm install
npm run dev      # 本地开发，默认 http://localhost:4321
npm run build    # 生成静态站点到 dist/
npm run preview  # 预览构建结果
npm run check    # TypeScript / Astro 类型检查
```

> 如果 `npm install` 报 `EPERM ... ~/.npm/_cacache` 之类的错误，是本机 npm 缓存目录权限问题，执行一次
> `sudo chown -R $(id -u):$(id -g) ~/.npm` 即可，或者用 `npm install --cache /tmp/npm-cache` 绕过。

---

## 二、项目结构

```
笑笑的蛋黄酥/
├── astro.config.mjs          # 站点配置（site / base 在这里改）
├── .github/workflows/deploy.yml  # GitHub Pages 自动部署
├── public/
│   ├── favicon.svg
│   └── images/               # 所有图片（占位图也在里面）
│       ├── hero/             # 首页大图 + 分享图 og.svg
│       ├── products/         # 产品图
│       ├── story/            # 关于笑笑 / 制作过程
│       └── journal/          # 手作记录配图
├── scripts/
│   └── generate-placeholders.mjs  # 生成占位图（npm run placeholders）
└── src/
    ├── consts.ts             # 站点信息、联系方式、导航、状态文案
    ├── content.config.ts     # 内容集合的字段定义（zod schema）
    ├── content/
    │   ├── products/         # 每个产品一个 .md
    │   └── journal/          # 每篇手作记录一个 .md
    ├── lib/
    │   ├── content.ts        # 读取内容的唯一入口（排序、slug）
    │   ├── format.ts         # 价格 / 日期格式
    │   └── url.ts            # withBase()：适配 GitHub Pages 子路径
    ├── styles/global.css     # 设计变量 + 少量公共类（按钮、卡片、图片框）
    ├── layouts/BaseLayout.astro
    ├── components/
    │   ├── BaseHead.astro    # title / description / OG / favicon
    │   ├── Header.astro      # 顶部导航（含移动端菜单）
    │   ├── Hero.astro
    │   ├── ProductCard.astro / ProductGrid.astro / StatusBadge.astro
    │   ├── AboutSection.astro
    │   ├── JournalCard.astro
    │   ├── ContactSection.astro
    │   ├── Footer.astro
    │   └── Photo.astro       # 统一图片容器（固定比例 + alt 必填）
    └── pages/
        ├── index.astro       # 首页（Hero / 今日手作 / 关于 / 记录 / 联系）
        ├── journal/[slug].astro  # 手作记录详情页
        ├── 404.astro
        ├── robots.txt.ts
        └── sitemap.xml.ts    # 自动生成的 sitemap
```

原则：**内容与 UI 分离**。页面组件不直接读 Markdown，全部通过 `src/lib/content.ts`；
以后要换成 CMS、数据库或真正的订单系统，只需要改这一层。

---

## 三、怎么改内容

### 1. 替换产品图片

1. 把真实照片（建议先压缩到宽 1200px 左右，`jpg` / `webp`）放进 `public/images/products/`。
   例如 `public/images/products/original.jpg`。
2. 打开 `src/content/products/original.md`，把 `image` 改成新路径：

   ```yaml
   image: /images/products/original.jpg
   imageAlt: 刚出炉的原味蛋黄酥，放在竹垫上
   ```

3. 删掉不再使用的占位图 `.svg` 即可。

- 图片路径一律以 `/images/...` 开头（不要写 `public/`，也不要用外链图床）。
- `imageAlt` 是必填字段，会渲染成 `<img alt>`，方便无障碍与 SEO。
- 不用手动裁图：卡片和详情的图片框比例是固定的（`src/components/Photo.astro` 的 `aspect`），
  CSS 会按比例裁切，所以换图不会让页面跳动。
- 想调整比例，改组件里的 `aspect="aspect-[4/3]"` 之类的类名即可。

### 1.5 现在的占位图是怎么画出来的

占位图不是找来的图库照片，而是 `scripts/generate-placeholders.mjs` 用代码画的 SVG
（跑 `npm run placeholders` 重新生成，改颜色 / 尺寸 / 构图都在这个文件里）：

- **产品图**：一颗蛋黄酥切开、切面朝向镜头的剖面。层次从外到内——
  酥皮（`#EFDCB6`，最外一圈约 10%）→ **肉松**（`#C08A4E`，夹在豆沙和酥皮之间的一整圈，
  再顺着圆周方向撒 46 根深浅纤维）→ 豆沙 / 莲蓉（每个口味一种颜色，见 `FILLINGS`）
  → 整颗咸蛋黄（橙色径向渐变，半径占切面的 40%）。
  酥皮表面还有 **3 颗黑芝麻**（`#3A3128`），剖面里只看得到顶部那几颗被切开的。
  某个产品没有肉松的话，在它的 preset 里加 `floss: false` 即可。
- **切面不是正圆**：真实的蛋黄酥放在烤盘上烤，底部是压平的。所以轮廓由 `cutFacePath()`
  生成——底圆按 `FLAT = 0.62` 从底部切掉一段，再连成平底，成品高 1.62R、宽 2R，
  接近真实的 57mm × 70mm。各层是同一个轮廓的缩放（`SCALE`），底边再各上移一点（`LIFT`），
  这样平底那一侧也能看到一层层的厚度。轮廓上再用 `<mask>` 随机啃掉 8 个小口子。
- **俯视的一整颗**（首页大图 / 记录配图里的配角）：外轮廓不是正圆，而是把圆周采样点
  用正弦扰动、再让底部稍微摊开一点（`spread`，因为它坐在烤盘上），
  最后用二次贝塞尔平滑连接的闭合曲线；表面盖一层蛋液烤出来的金黄色（`url(#wash)`），
  酥皮层次用一条深一点的虚线圈（`#D9BE8E`）暗示，**黑芝麻**按伪随机撒 9 颗。
- **可复现**：所有随机数走 `makeRandom(seed)`，所以每次生成的结果完全一样，不会变来变去。
- **跑完会自检**：脚本会检查输出里有没有 `NaN`，我另外用 `sharp` 和 Chrome 各渲染了一遍确认能正常解码，
  并按像素采样验证了层次顺序（酥皮 → 黑芝麻 → 肉松 → 豆沙 → 咸蛋黄）。

这仍然是「占位」的性质：图片底部写着「照片待补」。真实照片就位后，按上面第 1 步替换即可。

首页大图：`public/images/hero/hero.svg`，改 `src/components/Hero.astro` 里的 `src`。
关于笑笑：`public/images/story/xiaoxiao.svg`，改 `src/components/AboutSection.astro` 里的 `src`。
社交分享图：`public/images/hero/og.svg`。**建议换成 1200×630 的 jpg/png**（微信 / Facebook 等不认 SVG），
换完后把 `src/consts.ts` 里的 `SITE.ogImage` 一起改掉。

### 2. 增加产品

在 `src/content/products/` 新建一个 `.md` 文件（文件名就是它的编号，随便取，英文更好）：

```markdown
---
name: 绿豆糕
description: 去皮绿豆自己磨的，清清爽爽，夏天吃正好。
price: 42
unit: 6枚
status: limited
image: /images/products/mung-bean.svg
imageAlt: 绿豆糕的照片
note: 只有夏天做，做完就停。
order: 5
---
```

字段说明：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `name` | ✅ | 产品名 |
| `description` | ✅ | 一到两句描述 |
| `price` | ✅ | 数字，单位元 |
| `unit` | ✅ | 规格，例如 `6枚` |
| `status` | ✅ | `available`（今日可订）/ `limited`（少量制作）/ `soldout`（暂时售罄） |
| `image` | ✅ | `/images/...` 路径 |
| `imageAlt` | ✅ | 图片描述 |
| `note` | | 卡片上的一句小备注 |
| `order` | | 排序，数字小的排前面，默认 99 |
| `draft` | | 填 `true` 就不显示（想暂时下架又不想删文件时用） |

加完文件重新 `npm run build` 就会出现在「今日手作」里，不用改任何组件。
新产品的占位图：在 `scripts/generate-placeholders.mjs` 的 `PRESETS` 里补一条，跑 `npm run placeholders`。

### 3. 增加手作记录

在 `src/content/journal/` 新建 `日期-slug.md`，例如 `2026-10-08-mung-bean.md`：

```markdown
---
title: 试了绿豆糕
date: 2026-10-08
summary: 第一锅有点散，第二锅找到了手感。
image: /images/journal/mung-bean.svg
imageAlt: 刚脱模的绿豆糕
---

这里开始写正文，用普通 Markdown 就行。

可以分几段，也可以写列表：

- 第一次：太湿
- 第二次：好一些
```

- 网址会自动生成：`2026-10-08-mung-bean.md` → `/journal/mung-bean/`（自动去掉日期前缀）。
- 列表按 `date` 从新到旧排；首页只显示最新 3 条。
- `image` 可省略，省略后卡片就只有文字，不留空框。

---

## 四、改成自己的信息

打开 `src/consts.ts`：

```ts
export const SITE = {
  name: '笑笑的蛋黄酥',
  ownerName: '笑笑',
  tagline: '妈妈退休后的手作小铺',
  url: 'https://jeremythierrychan.github.io',
  base: '/Mom-s-Pastry',
  ...
};

export const CONTACT = {
  wechat: 'YOUR_WECHAT',   // ← 换成真实微信号
  phone: 'YOUR_PHONE',     // ← 换成真实手机号
  ...
};
```

**当前网站上的微信 / 电话都是占位符 `YOUR_WECHAT` / `YOUR_PHONE`，请务必替换成真实信息后再对外发布。**

---

## 五、部署到 GitHub Pages

仓库：<https://github.com/JeremyThierryChan/Mom-s-Pastry>，分支 `main`。

1. 推送代码：`git push -u origin main`
2. 仓库 Settings → Pages → Build and deployment → Source 选 **GitHub Actions**
3. 之后每次推送到 `main`，`.github/workflows/deploy.yml` 会自动构建并发布
4. 等 Actions 跑完，访问 <https://jeremythierrychan.github.io/Mom-s-Pastry/>

**当前配置**（`src/consts.ts`）：仓库名不是 `<用户名>.github.io`，所以属于「项目主页」，
网址带子路径，配置是

```ts
url: 'https://jeremythierrychan.github.io',
base: '/Mom-s-Pastry',
```

两种地址的区别：

- 用户主页 `https://用户名.github.io`（仓库必须叫 `<用户名>.github.io`）：`base: '/'`
- 项目主页 `https://用户名.github.io/仓库名`：`base: '/仓库名'` ← **本项目**

站内所有链接和图片路径都经过 `src/lib/url.ts` 的 `withBase()`，
所以改 `base` 之后不需要手动改页面里的任何链接。

本地想按真实部署路径预览：`npm run build && npm run preview`，然后开
<http://localhost:4321/Mom-s-Pastry/>（注意根路径 `/` 会是 404，这是正常的）。

---

## 六、这一版做了什么 / 没做什么

已经做了：

- 首页：Hero、今日手作（4 个产品，含三种状态）、关于笑笑、手作记录（3 条 + 详情页）、联系 / 预订
- 手作记录详情页 `/journal/<slug>/`、404 页、`sitemap.xml`、`robots.txt`
- 移动端优先的响应式布局（375 / 390 / 768 / 1440 都验证过，无横向滚动）
- title / meta description / Open Graph / favicon / 语义化 HTML / 图片 alt
- 内容与 UI 分离，产品与记录都是 Markdown 文件

这一版**故意没有做**（给下一阶段留位置）：

用户系统、登录、在线支付、购物车、订单、库存、优惠券、CMS、后台管理、第三方电商 API。
数据结构（`src/content/products/*.md` + `src/lib/content.ts`）已经为这些留了扩展位置：
以后接入订单时，把 `src/lib/content.ts` 换成真实的 API 调用，页面组件基本不用动。
