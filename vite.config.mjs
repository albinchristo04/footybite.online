import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [react()],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/client.jsx'),
            name: 'FootybiteClient',
            fileName: 'client',
            formats: ['iife']
        },
        outDir: 'dist/assets',
        emptyOutDir: false
    }
});
