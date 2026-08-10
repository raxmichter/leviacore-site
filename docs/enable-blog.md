# Enabling the blog

**Read this whole document before touching anything.** It is written for someone —
human or AI agent — who has never seen this repository before and has no memory of
how the blog was built.

## The one-sentence version

The blog (`/blog` index + `/blog/<slug>` articles) is fully built but **shipped
disabled**. One flag, `features.blog` in `src/config.ts`, currently `false`, gates
six separate things. Flipping the flag without verifying all six is how you
accidentally publish crawlable, indexable pages while the site still *looks*
blog-free to a human visitor — which is worse than not having built the blog at
all, because nobody notices until a search engine already has.

Do not flip the flag as a "quick toggle." Follow this document.

## Background — why this exists

See `build-context/DECISIONS.md`, the entry titled **"Blog is built and
DELIBERATELY DISABLED."** Short version: the article template is the case-study
layout minus its metadata block, and the index is the Projects card grid — both
were cheap to build now, while those patterns were already extracted, and
expensive to build cold later. But there was no real content ready, so the section
ships structurally complete and switched off, by direction (George).

## The six gates, and how each one is actually implemented

| # | Gate | Mechanism | File |
|---|---|---|---|
| 1 | Nav link (desktop + mobile) | `...(features.blog ? [{ href: '/blog', label: 'Blog' }] : [])` spread into the nav-links array | `src/components/SiteHeader.astro`, `src/components/MobileMenu.astro` |
| 2 | Footer "Pages" column link | Same conditional-spread pattern | `src/components/SiteFooter.astro` |
| 3 | `/blog` index route | `getStaticPaths()` returns `[]` when the flag is off — see the filename note below, this is **not** a plain `index.astro` | `src/pages/blog/[...page].astro` |
| 4 | `/blog/<slug>` article routes | `getStaticPaths()` returns `[]` when the flag is off, so zero article paths are enumerated | `src/pages/blog/[slug].astro` |
| 5 | Sitemap entries | No sitemap integration exists yet (Phase F adds it) — see "Sitemap and RSS" below for how to keep it that way | — |
| 6 | RSS feed | Not built yet at all | — |

Gates 1–2 are cosmetic. **Gates 3–4 are the ones that actually matter**, and they
are the reason this document exists: a flag that only hides the nav link but still
emits real HTML files at `/blog/*` is a worse outcome than never having built the
blog, because the pages are still live, linkable, and crawlable — they're just not
*advertised* on the site itself. Search engines and anyone with a guessed or
shared URL will still find them.

### ⚠️ Why the index file is not named `index.astro`

The build brief originally specified `src/pages/blog/index.astro`. It is instead
`src/pages/blog/[...page].astro`. This was not a stylistic choice — it was forced
by an Astro behavior discovered and verified empirically during the build (repeated
trials, caches cleared, fresh files, not a one-off fluke):

**`getStaticPaths()` returning `[]` has no effect on a non-dynamic page file** (a
filename with no `[param]` in it, like a plain `index.astro`). Astro treats a
non-dynamic route as having exactly one implicit path and renders it
unconditionally — the exported `getStaticPaths` function is never even called. A
plain `blog/index.astro` guarded by `if (!features.blog) return []` was built and
tested: `dist/blog/index.html` was emitted anyway, every single time, regardless of
the flag. That is gate 3 failing silently — the exact failure mode this whole
document exists to prevent.

`getStaticPaths()` **does** reliably gate genuinely dynamic (bracketed) routes —
proven by this same file once renamed, by `blog/[slug].astro`, and independently by
the case-study system's `project/[slug].astro`. So the index page uses a rest
parameter (`[...page]`) to become a dynamic route that can still resolve to the
exact bare URL `/blog`, while `getStaticPaths()` genuinely controls whether it
exists. Full technical detail, including why an *optional single* segment
(`[[page]]`) was tried first and rejected, is in the comment at the top of
`src/pages/blog/[...page].astro` — read it before changing this file's routing
shape.

**If you are updating this codebase's Astro version:** re-verify this behavior
before assuming it still applies. If a future Astro version honors
`getStaticPaths()` on non-dynamic pages, the file could in principle be renamed
back to `index.astro` — but confirm with an actual build (flag off, check
`dist/blog/` is absent) before making that change, using the same method as the
"Verification checklist" below.

### Sitemap and RSS — keeping gates 5 and 6 closed when they're eventually built

No sitemap or RSS integration exists in this repo yet (Phase F's job). When one is
added, it must not be able to leak blog routes even by accident. Two safe designs:

- **Derive URLs from the build, not from a hand-maintained page list.** If the
  sitemap is built by walking `dist/` after `astro build` (or via
  `@astrojs/sitemap`, which does the equivalent internally), blog URLs are
  automatically absent whenever `features.blog` is `false`, for the same reason
  `dist/blog/` doesn't exist — there is nothing to find. **This is why gates 3–4
  being real route suppression, not just hidden links, matters for gate 5 too:** a
  sitemap generator built the correct way inherits the disabled state for free.
- **Never hardcode `/blog` or `/blog/<slug>` into sitemap or redirect
  configuration.** If Phase F's sitemap needs a static list of top-level sections
  for any reason, gate any blog entry behind `features.blog` explicitly, the same
  way `SiteHeader.astro` does.

If an RSS feed is added later (e.g. an `astro-rss`/`@astrojs/rss`-based
`src/pages/rss.xml.ts` or similar), **the same non-dynamic-route limitation
documented above applies to endpoint files too** — a plain `rss.xml.ts` has no
`getStaticPaths` gating available to it any more than `index.astro` did. The
simplest correct fix: don't create the RSS endpoint file in the repository at all
until the blog is genuinely ready to launch. If it must exist ahead of launch,
verify with an actual build (flag off, confirm no `rss.xml` in `dist/`) before
trusting it, and read the routing note above for why a bracketed/dynamic filename
may be required.

## Step-by-step: enabling the blog for real

### 1. Write and review real content first

Do not flip the flag with only `src/content/blog/example-post.md` in the
collection — see "Adding a first real post" below. That file is explicitly an
example (`draft: true`, and its own body says so); it must not be the first thing
a visitor sees.

### 2. Flip the flag

Edit **`src/config.ts`**, line 22:

```ts
blog: false,
```

to:

```ts
blog: true,
```

Do not change anything else in that file. Its file-level comment already points
back to this document.

### 3. Build and check for zero unexpected regressions

```sh
npm run build:verify
```

This must pass with zero failures (warnings about the placeholder contact-form
endpoint are pre-existing and unrelated — see `build-context/OPEN.md` item 2).

### 4. Run the six-gate verification checklist

All six, every time, even if you're confident. This is the entire point of this
document.

- [ ] **Gate 1 — Nav link.** Open `dist/index.html` (or any page) and confirm a
      `<a href="/blog">Blog</a>`-shaped link exists in both the desktop nav
      (`.navbar-menu-item-link`) and the mobile menu
      (`.mobile-menu-nav-link`). Quick check:
      `grep -c 'href="/blog"' dist/index.html` should be `2`.
- [ ] **Gate 2 — Footer link.** Same file, confirm a `Blog` entry appears in the
      footer's "Pages" column (`.footer-nav-item-link`).
- [ ] **Gate 3 — `/blog` index route exists.** `dist/blog/index.html` exists and
      renders real content (check the `<title>` is `Blog | Leviathan Core`, not an
      error page).
- [ ] **Gate 4 — Article routes exist.** `dist/blog/<slug>/index.html` exists for
      every non-draft post in `src/content/blog/`.
- [ ] **Gate 5 — Sitemap.** If a sitemap exists at this point (Phase F or later),
      confirm `/blog` and every article URL appear in it.
- [ ] **Gate 6 — RSS.** If an RSS feed exists at this point, confirm it lists the
      same non-draft posts and only those.
- [ ] Run `npm run build:verify` one more time after all the above — it should
      still report zero failures with the flag on.

### 5. If you decide not to ship it yet

Revert **both** the flag (`src/config.ts` back to `blog: false`) and re-run
`npm run build:verify`, then re-check gates 3 and 4 the other direction:

- [ ] `dist/blog/` does not exist as a directory at all.
- [ ] `grep -rl "blog" dist --include="*.html"` returns nothing.
- [ ] `grep -rn 'href="/blog' dist --include="*.html"` returns nothing.

This is not optional busywork — it is the same check gate 3/4 needed in the
enabled direction, run backwards, and it is what proves the disabled state you're
about to leave the repository in is actually disabled.

## Adding a first real post

The schema in `src/content.config.ts` (the `blog` collection) **is the
specification.** Read it directly rather than trusting a paraphrase — it has field-
by-field comments. Summary:

```yaml
---
title: "Post title"              # required
description: "One or two sentences for SEO + the index card." # required
publishDate: 2026-01-15           # required, YAML date (unquoted, ISO format)
author: "Full Name"               # required
heroImage: ./some-image.jpg       # optional — but see note below
heroImageAlt: "Meaningful alt text describing the image." # required IF heroImage is set
tags: ["gaming", "influencer-marketing"] # optional, defaults to []
draft: true                       # defaults to true — see the two-gate model below
---

Markdown body here. Standard elements (headings, lists, blockquotes, links,
**bold**, *italic*) all render — see `src/pages/blog/[slug].astro`'s prose styles
if something looks unstyled.
```

**`heroImage` is optional in the schema but effectively required for the post to
appear on the index.** `src/pages/blog/[...page].astro` reuses `ProjectCard.astro`
for the index grid, and that component requires an image — a post without
`heroImage` is silently filtered out of `/blog` (it will still build its own
article page at `/blog/<slug>` if not a draft, just with no link pointing to it
from the index). Always include one.

**`heroImage` paths are relative to the post's own file**, per Astro's content-
collection `image()` helper — e.g. from `src/content/blog/my-post.md`, an image
living in `src/assets/images/` is referenced as `../../assets/images/whatever.jpg`.

### The two-gate model for individual posts

Every post has its own `draft` field, independent of the site-wide `features.blog`
flag:

1. `features.blog` (site-wide) — controls whether the *section* exists at all.
2. Each post's own `draft` (per-post) — controls whether *that post* is ready.

Both must be satisfied for a post to appear. Write new posts with `draft: true`,
review them, then flip only that post's `draft` to `false` when it's ready. This
lets you accumulate drafts without any of them going live prematurely, independent
of the master switch.

### Removing the example post

`src/content/blog/example-post.md` exists only to prove the schema validates and
the templates render — its own body says so explicitly. Delete it once a real post
exists; don't edit it into looking like real content.

## What NOT to do

- Don't flip `features.blog` and skip the checklist "because it obviously works."
  The entire reason this document is long is that the naive version of this
  feature (a flag that only hides the nav link) silently fails gates 3–4, and
  those are the two that actually stop search engines from indexing the section.
- Don't rename `src/pages/blog/[...page].astro` back to `index.astro` without
  re-verifying the Astro behavior documented above against a real build.
- Don't add a hardcoded `/blog` entry to any future sitemap or redirects config —
  gate it behind `features.blog` exactly like `SiteHeader.astro` does, or derive it
  from the actual build output so it disappears on its own.
