import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages 仓库页：https://100cm.github.io/tli-xiuxian/
// 本地开发默认 base='/'；CI 设置 GITHUB_PAGES=1 时使用子路径
const base = process.env.GITHUB_PAGES === '1' ? '/tli-xiuxian/' : '/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base,
})
