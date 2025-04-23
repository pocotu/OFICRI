import { fileURLToPath } from 'node:url'
import { defineConfig, configDefaults } from 'vitest/config'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, 'e2e/**'],
    root: fileURLToPath(new URL('./', import.meta.url)),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'shell/src'),
      '@shell': resolve(__dirname, 'shell/src'),
      '@auth': resolve(__dirname, 'auth/src'),
      '@documents': resolve(__dirname, 'documents/src'),
      '@mesa-partes': resolve(__dirname, 'mesa-partes/src'),
      '@users': resolve(__dirname, 'users/src'),
      '@dashboard': resolve(__dirname, 'dashboard/src'),
      '@areas': resolve(__dirname, 'areas/src'),
      '@security': resolve(__dirname, 'security/src'),
      '@shared': resolve(__dirname, 'shared'),
      '@/shared': resolve(__dirname, 'shared')
    }
  }
})
