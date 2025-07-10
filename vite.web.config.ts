import react from '@vitejs/plugin-react';
import { webcrypto as nodeCrypto } from 'crypto';
import path from 'path';
import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';
if (!(globalThis as any).crypto) {
  (globalThis as any).crypto = nodeCrypto;
}

// https://vitejs.dev/config
export default defineConfig((env) => {
  const { mode } = env;

  return {
    mode,
    base: process.env.NODE_ENV === 'production' ? './' : '/',
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.web.html'),
        },
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
            ],
          },
        },
      },
    },
    plugins: [react()],
    resolve: {
      preserveSymlinks: true,
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      'process.env': {},
      // Define Excalidraw asset path for local serving (root to prevent duplicated segments)
      'window.EXCALIDRAW_ASSET_PATH': '"/"',
      // Disable Electron-specific features for web
      'process.type': '"renderer"',
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
      },
    },
    // Serve static assets from the root-level public directory so Excalidraw assets resolve
    publicDir: path.resolve(__dirname, 'public'),
    // Configure static file serving
    server: {
      fs: {
        // Allow serving files from node_modules and assets
        allow: ['..', './src/assets', path.resolve(__dirname, 'public')],
      },
    },
    clearScreen: false,
  } as UserConfig;
});
