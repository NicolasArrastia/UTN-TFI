import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Sin VITE_API_URL el bundle apunta a /api y el login falla fuera del proxy
  // de desarrollo. Se avisa en el build en lugar de fallar en el navegador.
  if (mode === 'production' && !process.env.VITE_API_URL) {
    console.warn(
      '[vite] VITE_API_URL no está definida: el build apuntará a /api y el login fallará fuera del proxy de desarrollo.',
    )
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  }
})
