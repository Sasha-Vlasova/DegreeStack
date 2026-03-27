import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,     // allows external redirects like Google OAuth
    port: 5173      // ensures Vite runs on the expected port
  }
})
