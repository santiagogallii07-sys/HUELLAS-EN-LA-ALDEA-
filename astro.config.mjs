// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  build: { inlineStylesheets: 'auto' },
  image: { layout: 'constrained' },
});
