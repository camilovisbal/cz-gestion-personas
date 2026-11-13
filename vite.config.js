import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Rutas relativas para que funcione en GitHub Pages (/cz-gestion-personas/).
  base: './',
  plugins: [react()],
  server: { port: 5180 },
})
