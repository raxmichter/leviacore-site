# Editing content

How to change what's on leviacore.com. Written for someone who is not a developer.

Everything on the site — case studies, the team roster, legal pages — lives in this repository as plain text files. Editing one and saving it publishes the change. There is no CMS to log into.

## Two ways to edit

**Ask Claude.** Describe the change in plain language. It edits the file and commits it.

**Edit the file yourself on GitHub.** Open the file in the browser, click the pencil icon, make the change, click *Commit changes*. No software to install.

Either way the same safety net applies: **if you make a mistake that would break the site, the build fails and tells you which file and which line.** Nothing broken reaches the live site.

---

## Adding or editing a case study

One file per case study, in `src/content/projects/`.

> ⚠️ **The filename is the web address.** `spiritfarer.md` is what makes the page live at `leviacore.com/project/spiritfarer`. **Renaming a file changes its URL and breaks every existing link to it** — from Google, from emails, from anywhere. Don't rename these.

Each file starts with a block between `---` lines. That is the structured data:

```yaml
---
title: "Spiritfarer"
client: "Thunder Lotus"
year: 2020
timeline: "8 Weeks"
services: ["Campaigns", "Finance", "Consulting", "Legal"]
website: "https://thunderlotusgames.com/spiritfarer/"
heroImage: "../../assets/images/projects/spiritfarer-hero.png"
heroImageAlt: "Description of what the image shows"
metrics:
  - value: "26"
    label: "Influencers Activated"
description: "The summary shown in Google results and on social shares."
order: 4
draft: false
---
```

Below that block is the page copy, written in Markdown — `## Challenge` and `## Solution` create the section headings.

**To add a new case study:** copy **[case-study-template.md](case-study-template.md)** to `src/content/projects/<slug>.md` and fill it in. Put its images in `src/assets/images/projects/`.

**Gathering the material?** **[adding-a-case-study.md](adding-a-case-study.md)** is a checklist for whoever collects the copy, images and numbers — image sizes, character limits, and the three headline stats. It is written to be handed to someone who never touches the repo.

**`draft: true`** hides a case study from the live site while you work on it.

**Every image needs `alt` text** — a short description of what the image shows, for people using screen readers and for Google. The build refuses to publish an image without it. This is deliberate: the old site had none anywhere.

---

## Editing the team page

One file: `src/data/team.yaml`. One block per person.

```yaml
- name: Jordi Chapdelaine
  role: Director of Operations
  image: JordiChapdelanie-FINAL.jpg
  alt: Jordi Chapdelaine, Director of Operations
```

**To add someone:** copy a block, change the details, and put their headshot in `src/assets/images/`. Order in the file is the order on the page.

**The "We're Hiring" card** is the last entry, marked `hiring: true`. Edit its role text to change what the opening says, or delete the block to remove it.

> Note: the image file `JordiChapdelanie-FINAL.jpg` misspells the surname. The filename is left alone deliberately — renaming it gains nothing and risks breaking the link. The *displayed* name is spelled correctly.

---

## Editing legal pages

`src/content/legal/` — `privacy-policy.md`, `ccpa.md`, `notice-at-collection.md`. Plain Markdown.

**When you change a policy, update its `lastUpdated` date** in the block at the top. That date is what visitors see. It is deliberately *not* automatic: an automatic date would claim the policy was reviewed every time anyone touched the file, which would be untrue and is exactly the wrong thing to be untrue about.

Section headings use `##`. Each one automatically becomes a link target, so cross-references inside the document keep working.

---

## Enabling the blog

The blog is fully built and deliberately switched off.

**Follow [docs/enable-blog.md](enable-blog.md).** Do not simply change the `false` to `true` — one flag controls six separate things, and getting it partly right can publish half-finished pages to Google while the site still looks blog-free to you.

---

## What happens after you save

Every change runs four automatic checks before it can go live:

1. **Content check** — required information present and correctly formatted
2. **Structure check** — headings, image descriptions, page metadata
3. **Link check** — no broken links anywhere on the site
4. **Accessibility check** — the site remains usable with a screen reader

If any fails, the change does not publish and the failure message names the file and the problem.

---

## Things to avoid

| Don't | Why |
|---|---|
| Rename a case study file | Changes its web address and breaks existing links |
| Delete the `---` lines | They mark the structured data block; the file won't load without them |
| Add an image without `alt` text | The build will reject it |
| Flip the blog flag directly | Use `docs/enable-blog.md` |
| Change a legal page's date without changing the policy | The date is a claim about when it was actually reviewed |

---

## If something goes wrong

Every change is recorded and reversible — previous versions of every file are kept permanently, and any change can be undone. If the site looks wrong after an edit, say so; it can be put back exactly as it was.
