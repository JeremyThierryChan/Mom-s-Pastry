// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import { SITE } from './src/consts.ts';

// GitHub Pages 部署说明：
// 1) 用户/组织主页（仓库名必须是 <用户名>.github.io）→ site 填 https://<用户名>.github.io，base 保持 '/'
// 2) 项目主页（仓库名是别的，比如 xiaoxiao-pastry）→ site 填 https://<用户名>.github.io，base 填 '/xiaoxiao-pastry'
//    注意 base 必须以 '/' 开头、结尾不要带 '/'。
// 站内链接与图片路径都经过 src/lib/url.ts 的 withBase() 处理，改这里就够了。
export default defineConfig({
  site: SITE.url,
  base: SITE.base,
  trailingSlash: 'ignore',
  build: {
    // 静态生成，产物在 dist/，可直接扔到任意静态托管
    format: 'directory',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
