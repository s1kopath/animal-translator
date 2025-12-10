import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/hf-inference': {
        target: 'https://api-inference.huggingface.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/hf-inference/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Forward the authorization header from the original request
            const authHeader = req.headers['x-hf-token']
            if (authHeader) {
              proxyReq.setHeader('Authorization', `Bearer ${authHeader}`)
            }
            // Ensure binary data is handled correctly
            if (req.headers['content-type'] === 'application/octet-stream') {
              proxyReq.setHeader('Content-Type', 'application/octet-stream')
            }
          })
        },
      },
    },
  },
})

