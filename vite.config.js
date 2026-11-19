import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        pro: fileURLToPath(new URL('./pro/index.html', import.meta.url)),
        world: fileURLToPath(new URL('./world/index.html', import.meta.url)),
      },
    },
  },
});