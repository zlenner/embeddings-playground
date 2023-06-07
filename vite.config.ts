import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import tailwindcss from 'tailwindcss'
import autoprefixer from "autoprefixer"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact()],
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer
      ],
    },
  },
})
