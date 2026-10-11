// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';

import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  integrations: [svelte(), icon()],
  vite: {
    server: {
      proxy: {
        '/api': {
          // When running via npm use http://localhost:3001
          target: 'http://backend:3000', // for docker
          changeOrigin: true,
        },
      }
    }
  }
});