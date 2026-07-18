import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "next/navigation": path.resolve(
        __dirname,
        "test/mocks/next-navigation.ts",
      ),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    css: true,
    globals: false,
    server: {
      deps: {
        inline: ["next-intl"],
      },
    },
  },
});
