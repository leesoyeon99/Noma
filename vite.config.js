import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages 등 서브패스 배포 시 정적 자산 경로를 상대경로로 사용
  base: './',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
})
