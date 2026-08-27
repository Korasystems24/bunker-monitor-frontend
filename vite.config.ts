import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const DEFAULT_API_BASE_URL = 'http://localhost:8000/api/v1'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const apiBaseUrl = env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
  const apiUrlParts = apiBaseUrl.match(/^(https?:\/\/[^/]+)(\/.*)?$/)
  if (!apiUrlParts) throw new Error(`Invalid VITE_API_BASE_URL: ${apiBaseUrl}`)
  const proxyTarget = env.VITE_API_PROXY_TARGET || apiUrlParts[1]
  const apiPath = (apiUrlParts[2] || '/').replace(/\/+$/, '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        [apiPath]: {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
    },
  }
})
