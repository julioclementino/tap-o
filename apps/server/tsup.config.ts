import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  noExternal: ['@tap-o/core'],
  sourcemap: true,
});
