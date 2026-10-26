import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base 使用相对路径，打包产物可直接放在任意静态目录下打开
export default defineConfig({
  base: './',
  plugins: [vue()],
  server: {
    port: 5175,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true
      }
    }
  }
})
