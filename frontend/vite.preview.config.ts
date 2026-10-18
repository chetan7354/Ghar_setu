// Builds the static UI preview (sample data, no backend) as one bundle: VITE_DEMO=1 vite build -c vite.preview.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  build: { outDir: 'dist-preview', rollupOptions: { output: { inlineDynamicImports: true } } },
})
