// @ts-check
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  // Required for canonical URLs, sitemap generation, and absolute OG image URLs.
  site: 'https://www.leviacore.com',

  // Static output. There is no server, no database, and no admin login by design —
  // most of the attack surface simply does not exist. See build-context/DECISIONS.md.
  output: 'static',

  // Clean URLs with no trailing slash, matching the existing site exactly.
  // URL parity is the one non-negotiable SEO rule of this migration:
  // /project/warframe must remain /project/warframe.
  trailingSlash: 'never',

  build: {
    format: 'directory',
    // Inline only genuinely tiny stylesheets; anything larger stays a cacheable file.
    inlineStylesheets: 'auto',
  },

  image: {
    // sharp ships with Astro. Phase F targets AVIF/WebP with responsive srcset.
    responsiveStyles: true,
  },

  devToolbar: {
    enabled: false,
  },
})
