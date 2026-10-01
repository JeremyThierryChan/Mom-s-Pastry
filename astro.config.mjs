// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// 部署配置（跟页面内容无关，页面内容全在根目录的「网站内容.md」里）。
//
// GitHub Pages 两种地址：
// 1) 用户 / 组织主页（仓库名必须是 <用户名>.github.io）→ site: 'https://<用户名>.github.io'，base: '/'
// 2) 项目主页（仓库名是别的，比如 Mom-s-Pastry）      → site: 'https://<用户名>.github.io'，base: '/仓库名'
//    base 必须以 '/' 开头，结尾不要带 '/'（← 本项目就是这种）
//
// 站内链接与图片路径都经过 src/lib/url.ts 的 withBase() 处理，改这里就够了。
export default defineConfig({
  site: 'https://jeremythierrychan.github.io',
  base: '/Mom-s-Pastry',
  trailingSlash: 'ignore',
  build: {
    // 静态生成，产物在 dist/，可以直接扔到任意静态托管
    format: 'directory',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
