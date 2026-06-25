import { defineConfig } from "astro/config";

// `BASE_PATH` is set by the GitHub Pages workflow to `/<repo>/`; defaults to `/`
// for local development and previews.
export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  // The datasets live in the repository's `src/data`, one level above this site.
  vite: { server: { fs: { allow: [".."] } } },
});
