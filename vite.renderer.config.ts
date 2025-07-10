import react from '@vitejs/plugin-react';
import path from 'path';
import type { UserConfig } from 'vite';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { pluginExposeRenderer } from './vite.base.config';

// https://vitejs.dev/config
export default defineConfig((env) => {
  const forgeEnv = env as any;
  const { root, mode, forgeConfigSelf } = forgeEnv;
  const name = forgeConfigSelf.name ?? '';

  return {
    root,
    mode,
    base: process.env.NODE_ENV === 'production' ? '/optimal-adhd-react/' : '/',
    build: {
      outDir: process.env.NODE_ENV === 'production' ? 'dist' : `.vite/renderer/${name}`,
    },
    plugins: [
      pluginExposeRenderer(name),
      react(),
      viteStaticCopy({
        targets: [
          {
            src: path.resolve(
              __dirname,
              'node_modules/@excalidraw/excalidraw/dist/excalidraw-assets-dev/**/*',
            ),
            dest: 'excalidraw-assets-dev',
          },
        ],
      }),
    ],
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
