import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { fileURLToPath } from 'node:url';

const shim = fileURLToPath(new URL('./src/demo/api.demo.js', import.meta.url));

// Same app as the real build, with every import of api.js pointed at the in-browser backend.
export default defineConfig({
  plugins: [
    { name: 'demo-api', enforce: 'pre', resolveId(source, importer) {
      if (importer && !importer.includes('/src/demo/') && /(^|\/)api\.js$/.test(source)) return shim;
    } },
    preact(),
  ],
  build: { target: ['es2019', 'safari13'] },
});
