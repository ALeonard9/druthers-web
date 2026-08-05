import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      // Pixel-by-pixel canvas drawing is verified through the share preview
      // and export flows; importing its UI should not add 500 visual-only
      // lines to the unit-coverage denominator.
      exclude: ['src/lib/shareCardRender.ts'],
      thresholds: {
        lines: 60,
      },
    },
  },
});
