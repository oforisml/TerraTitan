import { defineConfig } from "vitest/config";

export const baseConfig = defineConfig({
  test: {
    passWithNoTests: true,
    clearMocks: true,
    isolate: false,
    coverage: {
      provider: "istanbul",
      reporter: [
        [
          "json",
          {
            file: `../coverage.json`,
          },
        ],
      ],
      enabled: true,
    },
  },
});
