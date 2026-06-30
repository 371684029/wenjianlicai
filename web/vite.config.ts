import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// 开发时把 /api 代理到后端，避免跨域
export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
