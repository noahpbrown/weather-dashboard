// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/weather-dashboard/', // ⚠️ Replace with your actual repo name
  plugins: [react()],
})
