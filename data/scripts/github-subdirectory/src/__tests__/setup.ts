import { afterEach, beforeEach, vi } from 'vitest';

// Global setup
beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

// Ensure Bun global exists
if (typeof global.Bun === 'undefined') {
  global.Bun = {
    write: vi.fn(),
    argv: ['bun', 'script.ts'],
    main: false
  } as any;
}
