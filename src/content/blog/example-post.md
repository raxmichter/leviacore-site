---
title: "Example Post — Template Verification Only"
description: "This entry exists only to prove the blog schema validates and the article template renders correctly. It is not a real Leviathan Core article and must not be treated as one."
publishDate: 2026-08-10
author: "Template System (not a real author)"
heroImage: ../../assets/images/LC-Head.png
heroImageAlt: "Leviathan Core logomark, used here only as a placeholder hero image while the blog is disabled and this post stays a draft."
tags: ["example", "do-not-publish"]
draft: true
---

## What this post is

This is a placeholder entry in the `blog` content collection. It exists for exactly
one reason: to prove, before any real content is written, that the schema in
`src/content.config.ts` validates correctly and that the article template at
`src/pages/blog/[slug].astro` renders every field it expects — heading, lead text,
publish date, tags, reading time, a hero image with real alt text, and a body with
mixed Markdown elements.

**It is not real Leviathan Core content.** Nothing below should be read as a claim
about the company, its clients, or its work. See `docs/enable-blog.md` for how to
replace this file with an actual first post.

## Why it stays a draft

This post ships with `draft: true`, so it is excluded from the build even if the
`features.blog` flag in `src/config.ts` is ever turned on. Two independent switches
have to agree before an audience ever sees a post:

1. `features.blog` — the site-wide switch. Disabled today.
2. This file's own `draft` flag — the per-post switch. Also disabled today.

That is deliberate, not redundant: the flag controls whether the *section* exists at
all, and `draft` controls whether an *individual post* is ready. A future real post
uses the same two-gate model — write it with `draft: true`, review it, then flip
just that one field to `false` when it is ready to publish.

## A quick tour of the rendered elements

A short unordered list, to confirm list styling:

- Publish date formatting
- Tag rendering
- Reading-time calculation (computed from this file's own word count)

A short ordered list:

1. First
2. Second
3. Third

> A blockquote, to confirm `.text-rich-text blockquote` styling carries through from
> the legal pages' prose rules into the article template.

And a [link back to the homepage](/) to confirm in-body link styling (color +
underline, restored globally for `.text-rich-text` content) still applies here.

## Cleanup note for whoever enables the blog for real

Once a real first post exists, this file should be deleted rather than edited into
something real — it was never meant to be dressed up as content.
