import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
    plugins: [react()],
    define: {
        'process.env': {},
        'process.env.NODE_ENV': '"production"',
        global: 'window'
    },
    build: {
        lib: {
            entry: resolve(process.cwd(), 'src/client.jsx'),
            name: 'FootybiteClient',
            fileName: 'client',
            formats: ['iife']
        },
        outDir: 'dist/assets',
        emptyOutDir: false
    }
})
