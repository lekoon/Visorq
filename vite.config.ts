import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
    base: command === 'build' ? '/Visorq/' : '/', // 本地开发用根路径，生产部署用子路径
    plugins: [react()],
}))
