import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  assetsInclude: ['**/*.glb'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    proxy: {
      // 프론트엔드에서 '/api'로 시작하는 요청을 백엔드로 전달
      '/api': {
        target: 'http://43.200.52.62:8080', // 백엔드 기본 주소 (도메인만)
        changeOrigin: true,
        secure: false,
      },
    },
  },
})