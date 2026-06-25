import { defineConfig } from "astro/config";

// `BASE_PATH` is set by the GitHub Pages workflow from `configure-pages` to
// `/<repo>` (no trailing slash); defaults to `/` for local development and
// previews. Link-building code normalises the trailing slash, so either form
// works — see `src/layouts/Base.astro`.
export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  // The datasets live in the repository's `src/data`, one level above this site.
  vite: { server: { fs: { allow: [".."] } } },
});
