import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // three y drei casi no cambian entre versiones del sitio: en su propio
        // archivo, el visitante que vuelve no los baja de nuevo.
        manualChunks: { tres: ['three', '@react-three/fiber', '@react-three/drei'] },
      },
    },
  },
})
