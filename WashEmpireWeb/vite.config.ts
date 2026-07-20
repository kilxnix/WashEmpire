import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom)[\\/]/,
              priority: 4,
            },
            {
              name: 'three-core',
              test: /node_modules[\\/]three[\\/]/,
              priority: 3,
              maxSize: 440 * 1024,
            },
            {
              name: 'r3f-vendor',
              test: /node_modules[\\/](@react-three|@use-gesture|camera-controls|maath|meshline|stats-gl|suspend-react|troika-three-text|utility-types|zustand)[\\/]/,
              priority: 2,
              maxSize: 440 * 1024,
            },
            {
              name: 'vendor',
              test: /node_modules[\\/]/,
              priority: 1,
              maxSize: 440 * 1024,
            },
          ],
        },
      },
    },
  },
})
