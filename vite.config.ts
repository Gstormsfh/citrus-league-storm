import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunk splitting for better caching
          if (id.includes('node_modules')) {
            // Extract package name from path
            const match = id.match(/node_modules[\/\\](@[^\/\\]+[\/\\][^\/\\]+|[^\/\\]+)/);
            if (match) {
              const pkgName = match[1];
              
              // React core
              if (pkgName === 'react' || pkgName === 'react-dom' || pkgName.startsWith('react-router')) {
                return 'vendor-react';
              }
              // Radix UI components
              if (pkgName.startsWith('@radix-ui/')) {
                return 'vendor-ui';
              }
              // Charting library
              if (pkgName === 'recharts') {
                return 'vendor-charts';
              }
              // Drag and drop
              if (pkgName.startsWith('@dnd-kit/')) {
                return 'vendor-dnd';
              }
              // Utility libraries
              if (pkgName === 'date-fns' || pkgName === 'zod' || pkgName === 'clsx' || pkgName === 'tailwind-merge') {
                return 'vendor-utils';
              }
              // React Query
              if (pkgName === '@tanstack/react-query') {
                return 'vendor-query';
              }
              // Supabase
              if (pkgName.startsWith('@supabase/')) {
                return 'vendor-supabase';
              }
            }
            // Other node_modules - group remaining packages
            return 'vendor-other';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
      treeshake: {
        moduleSideEffects: false,
      },
    },
  },
}));
