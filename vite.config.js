import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/football': {
        target: 'https://v3.football.api-sports.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/football/, ''),
        headers: {
          'x-apisports-key': process.env.VITE_FOOTBALL_API_KEY,
        },
      },
      '/api/odds': {
        target: 'https://api.the-odds-api.com/v4',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/odds/, ''),
      },
    },
  },
})