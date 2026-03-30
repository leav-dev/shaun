import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  server: {
    port: 8080,
    host: true
  },
  integrations: [tailwind()]
});
