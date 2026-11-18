import { copyFile } from "node:fs/promises";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  splitting: true,
  sourcemap: true,
  target: "es2022",
  external: ["react", "react-dom", "motion"],
  // Every chunk touches hooks or the DOM, so all of it is client code.
  banner: { js: '"use client";' },
  onSuccess: async () => {
    await copyFile("src/styles.css", "dist/styles.css");
  },
});
