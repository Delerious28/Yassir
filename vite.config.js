import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        // Enable minification
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true, // Remove console.logs in production
                drop_debugger: true,
            },
        },
        // Optimize chunk splitting
        rollupOptions: {
            output: {
                manualChunks: {
                    // Separate vendor chunks for better caching
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    'ui-vendor': ['lucide-react', 'classnames'],
                    'utils-vendor': ['zustand', 'date-fns', 'papaparse'],
                },
            },
        },
        // Source maps for debugging (disable for faster builds)
        sourcemap: false,
        // Chunk size warnings
        chunkSizeWarningLimit: 500,
    },
    // Optimize dependencies
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom', 'zustand'],
    },
});
