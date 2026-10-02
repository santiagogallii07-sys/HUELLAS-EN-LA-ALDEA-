// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://huellasenlaaldea.com.ar',
  build: { inlineStylesheets: 'auto' },
  image: { layout: 'constrained' },
});
