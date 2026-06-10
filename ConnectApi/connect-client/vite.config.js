import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [plugin()],
    build: {
        outDir: '../wwwroot',
        emptyOutDir: true,
    },
    server: {
        port: 57414,
        proxy: {
            '/api': {
                target: 'http://localhost:5130',
                changeOrigin: true,
            },
        },
    }
})
