# 笑笑的蛋黄酥

妈妈退休后的手作小铺 —— 一个个人手作食品品牌的静态网站（MVP）。

- 技术栈：Astro 7 + TypeScript + Tailwind CSS 4
- 全静态生成，无后端、无数据库、无第三方依赖服务
- **网站上的所有文字、产品、记录都在一个文件里：根目录的 [`网站内容.md`](网站内容.md)**
- 可以直接部署到 GitHub Pages

🌐 线上地址：<https://jeremythierrychan.github.io/Mom-s-Pastry/>

---

## 一、改内容：只需要动一个文件

打开根目录的 **`网站内容.md`**，改完保存、推送，网站大约 30 秒后自动更新。

改的时候不需要懂代码，也不用管任何 `.astro` / `.ts` 文件。

```bash
# 本地边改边看（推荐）：改 md 保存后浏览器自动刷新，不用重启
npm run dev
#   → http://localhost:4321/Mom-s-Pastry/

# 改完发布
git add -A
git commit -m "更新了产品"
git push
```

### 这个文件长什么样

```md
## 今日手作                    ← 区块（## 开头）

小标签：今日手作               ← 字段：「名字：内容」，改冒号后面
标题：今天出炉的，都在这里
说明：每天做的量不多，当天现做。

### 原味蛋黄酥                  ← 条目（### 开头）= 一个产品

一句话描述：咸蛋黄与自制豆沙，搭配一层层手工擀出来的酥皮。
价格：48
规格：6枚
状态：今日可订
图片：/images/products/original.svg
图片描述：原味蛋黄酥的照片
小备注：最经典的一味，也是笑笑做得最多的一味。
```

规则只有四条：

1. `## 区块` 和 `### 条目` 这两行的**名字不要改**（导航栏、网址、字段归属都靠它们认路）
2. 字段行写 `名字：内容`，冒号用中文的 `：`
3. 其余的都是正文，支持 Markdown：空行分段、`**加粗**`、`- 列表`、`[链接](https://…)`
4. 顺序就是显示顺序（产品按文件里的顺序排，记录按日期从新到旧排）

### 常见操作

| 想做的事 | 怎么做 |
| --- | --- |
| **加一个产品** | 复制一整个 `### …` 小节（含下面的字段行），粘在最后一个产品后面，改内容 |
| **加一篇记录** | 同样复制一个 `### …` 小节，**最新的放最前面**。至少要写 `日期：2026-10-01` |
| **产品暂时不卖** | 把它的 `状态：` 改成 `暂时售罄`，或者整段删掉 |
| **暂时隐藏某个区块** | 在该区块里加一行 `显示：否`。内容原样留着，只是网站上不出现（首页没有、导航里没有、也不会生成页面）。改回 `是` 就恢复 |
| **换图片** | 照片放进 `public/images/` 对应文件夹，然后把 `图片：` 改成新路径 |
| **改联系方式** | `## 联系` 区块里的 `微信：` / `电话：` |
| **改导航文字** | 改各区块的 `小标签：`，导航栏跟着变 |
| **换副标题/标题** | `## 首页` 区块里的 `主标题：` / `副标题：` |

### 几个会自动处理的细节

- **状态颜色**：`状态：` 是自由文字。写「暂时售罄 / 卖完 / 没了」显示灰色，「少量 / 剩 / 限量」显示橙色，其他显示黄色。措辞随便改。
- **网址**：记录默认用日期当网址（`/journal/2026-10-01/`）。想自定义就加一行 `链接：first-batch`（用英文字母），网址变成 `/journal/first-batch/`。
- **首页显示几条记录**：`## 手作记录` 里的 `首页显示条数：3`。
- **数字写法很宽松**：`48`、`48元`、`¥48`、`1,280元` 都认。
- **图片比例**：不用手动裁图，页面会按固定比例自动裁切，所以换图不会撑破排版。

### 当前开着 / 关着

`## 手作记录` 现在是 `显示：否`（隐藏）—— 三篇记录和照片都还在文件里，
想恢复就把那一行改成 `显示：是`，或者把整行删掉（不写就是显示）。

### 改坏了怎么办

改错了不要紧，终端会直接告诉你缺什么，比如：

```
[WARN] 网站内容.md：「名字：」不是能识别的字段名（在「品牌」里），这一行被忽略了。检查一下是不是打错字了？
[InvalidContentEntryDataError] brand.name: 「品牌 › 名称」不能为空 —— 请打开 网站内容.md 补上这一行
```

想整个还原回上一次提交的样子：

```bash
git checkout 网站内容.md
```

---

## 二、快速开始

```bash
npm install
npm run dev      # 本地开发
npm run build    # 生成静态站点到 dist/
npm run preview  # 预览构建结果
npm run check    # TypeScript / Astro 类型检查
npm run placeholders   # 重新生成占位图（换了配色/构图才需要）
```

> 如果 `npm install` 报 `EPERM ... ~/.npm/_cacache`，是本机 npm 缓存目录权限问题：
> `sudo chown -R $(id -u):$(id -g) ~/.npm`，或者用 `npm install --cache /tmp/npm-cache` 绕过。

> 本地预览要带子路径：<http://localhost:4321/Mom-s-Pastry/>（根路径 `/` 会是 404，这是正常的）。
> 因为仓库名不是 `<用户名>.github.io`，线上就是部署在 `/Mom-s-Pastry/` 这个子路径下。

---

## 三、项目结构

```
笑笑的蛋黄酥/
├── 网站内容.md                   ★ 网站的全部内容都在这里，只改这一个文件
├── astro.config.mjs              # 部署配置（site / base）
├── .github/workflows/deploy.yml  # GitHub Pages 自动部署
├── public/
│   ├── favicon.svg
│   └── images/                   # 所有图片
│       ├── hero/                 # 首页大图 + 分享图 og.svg
│       ├── products/             # 产品图
│       ├── story/                # 关于笑笑 / 制作过程
│       └── journal/              # 手作记录配图
├── scripts/
│   └── generate-placeholders.mjs # 代码生成占位图
└── src/
    ├── loaders/site-content.ts   # 解析 网站内容.md → 两个内容集合
    ├── content.config.ts         # 字段校验（写错字段会给出人话提示）
    ├── lib/
    │   ├── content.ts            # 内容访问层（页面只从这里拿数据）
    │   ├── format.ts             # 价格 / 日期格式
    │   └── url.ts                # withBase()：适配 GitHub Pages 子路径
    ├── styles/global.css         # 设计变量 + 少量公共类
    ├── layouts/BaseLayout.astro
    ├── components/               # Header Hero ProductCard ProductGrid StatusBadge
    │                             # AboutSection JournalCard ContactSection Footer
    │                             # Photo BaseHead SectionHeading
    └── pages/                    # index.astro、journal/[slug].astro、404.astro
                                  # robots.txt.ts、sitemap.xml.ts
```

设计原则：**内容与 UI 完全分离**。

- `网站内容.md` 是唯一的内容来源，由 `src/loaders/site-content.ts` 解析成两个集合：
  `site`（一份站点文案）和 `journal`（一篇记录一个条目，正文用 Astro 的 `renderMarkdown` 渲染）。
- 页面组件不直接读 md，统一通过 `src/lib/content.ts`。
  以后要换成 CMS、数据库或真正的订单系统，只需要改这一层。
- 所有站内链接和图片路径都过 `withBase()`，所以部署到子路径不用改任何链接。

---

## 四、图片

图片放在 `public/images/` 下，在 `网站内容.md` 里用 `/images/...` 引用。目录分四类：

```
public/images/
├── hero/      首页大图 hero.svg、社交分享图 og.svg
├── products/  产品图
├── story/     关于笑笑 / 制作过程
└── journal/   手作记录配图
```

- 换真实照片：压到宽 1200px 左右（jpg / webp），放进对应文件夹，改 `网站内容.md` 里的 `图片：` 和 `图片描述：`。
- 不用手动裁图：比例由 `src/components/Photo.astro` 的 `aspect` 控制，换图不会让页面跳动。
- 社交分享图（`分享图：`）**建议换成 1200×630 的 jpg/png** —— 微信 / Facebook 不认 SVG。

### 现在的占位图是怎么画出来的

还没有正式照片，所以用 `scripts/generate-placeholders.mjs` 代码生成了 SVG 占位图
（跑 `npm run placeholders` 重新生成，改颜色 / 尺寸 / 构图都在这个文件里）：

- **产品图**：一颗蛋黄酥切开、切面朝向镜头的剖面。层次从外到内——
  酥皮（`#EFDCB6`）→ 肉松（`#C08A4E`，夹在豆沙和酥皮之间的一整圈）→ 豆沙 / 莲蓉
  → 整颗咸蛋黄。酥皮表面还有 3 颗黑芝麻（`#3A3128`）。
- **切面不是正圆**：真实的蛋黄酥放在烤盘上烤，底部是压平的。所以轮廓由 `cutFacePath()`
  生成——底圆按 `FLAT = 0.62` 从底部切掉一段再连成平底，成品高 1.62R、宽 2R，
  接近真实的 57mm × 70mm。各层是同一轮廓的缩放，底边再各上移一点，这样平底那一侧也能看到层厚。
- **俯视的一整颗**：外轮廓用正弦扰动 + 二次贝塞尔平滑，底部稍微摊开（放在烤盘上），
  表面是蛋液烤出来的金黄色，酥皮层次用虚线圈，黑芝麻伪随机撒 9 颗。
- **可复现**：所有随机数走 `makeRandom(seed)`，每次生成结果完全一样。
- 图片底部写着「照片待补」，真实照片就位后按上面替换即可。

---

## 五、部署到 GitHub Pages

仓库：<https://github.com/JeremyThierryChan/Mom-s-Pastry>，分支 `main`。

1. 推送代码：`git push`
2. 仓库 Settings → Pages → Build and deployment → Source 选 **GitHub Actions**
3. 之后每次推送到 `main`，`.github/workflows/deploy.yml` 都会自动构建 + 发布
4. 等 Actions 跑完（约 30 秒），访问 <https://jeremythierrychan.github.io/Mom-s-Pastry/>

**部署配置**（`astro.config.mjs`）：仓库名不是 `<用户名>.github.io`，属于「项目主页」，
网址带子路径，所以是

```js
site: 'https://jeremythierrychan.github.io',
base: '/Mom-s-Pastry',
```

换成别的仓库时，`base` 要改成 `/<新仓库名>`，否则会出现「本地好看、上线样式全丢」。

---

## 六、这一版做了什么 / 没做什么

已经做了：

- 首页：Hero、今日手作、关于笑笑、手作记录、联系 / 预订
- 手作记录详情页、404 页、`sitemap.xml`、`robots.txt`
- 移动端优先的响应式布局（375 / 390 / 768 / 1440 实测无横向滚动）
- title / meta description / Open Graph / favicon / 语义化 HTML / 图片 alt
- 内容全部收敛到一个 Markdown 文件，改内容不碰代码；写错字段有中文提示
- 开发模式下改 md 立刻生效

这一版**故意没有做**（给下一阶段留位置）：

用户系统、登录、在线支付、购物车、订单、库存、优惠券、CMS、后台管理、第三方电商 API。
数据结构（`网站内容.md` + `src/lib/content.ts`）已经为这些留了扩展位置：
以后接入订单时，把 `src/lib/content.ts` 换成真实的 API 调用，页面组件基本不用动。
