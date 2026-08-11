---
# ═══════════════════════════════════════════════════════════════════════════
#  CASE STUDY TEMPLATE
#
#  HOW TO USE
#  1. Copy this file to  src/content/projects/<slug>.md
#  2. ⚠️ THE FILENAME IS THE WEB ADDRESS.  spiritfarer.md → leviacore.com/project/spiritfarer
#     Lowercase, hyphens, no spaces, no .html. Once live, NEVER rename it —
#     that breaks every existing link from Google, emails and press.
#  3. Replace everything below. Delete these comment lines when you're done.
#  4. Put images in  src/assets/images/projects/
#
#  If a required field is missing or malformed the build FAILS and names this
#  file and the problem. Nothing broken can reach the live site.
#
#  Field-by-field guidance, with the real ranges from the existing five case
#  studies, is in docs/adding-a-case-study.md.
# ═══════════════════════════════════════════════════════════════════════════

# REQUIRED. The game or campaign name. Renders as the page's main heading.
# Existing range: 10–21 characters.
title: "Game Title"

# REQUIRED. The client company, exactly as they write it.
client: "Client Name"

# REQUIRED. Campaign year, four digits, no quotes.
year: 2026

# REQUIRED. Free text, however the team describes it. Existing: "2 Months",
# "8 Weeks", "16 Weeks".
timeline: "8 Weeks"

# REQUIRED. 1–4 service tags, rendered inline on one row.
# Use only these four, spelled this way: Campaigns, Consulting, Finance, Legal
services: ["Campaigns", "Consulting", "Finance", "Legal"]

# OPTIONAL. The game or campaign's own site. Delete both lines if there isn't one.
website: "https://example.com"
# The clickable text. Free text — the existing five all differ
# ("Spiritfarer Website", "warframe.com", "Return to Aeternum Event").
websiteLabel: "Game Title Website"

# REQUIRED. The summary under the title, and the text Google shows in results.
# Aim for 150–160 characters so search engines don't cut it off.
description: "One or two sentences on what the campaign achieved. This is the first thing a prospect reads and the first thing Google shows."

# REQUIRED. Key art. 16:9, at least 1000×562. Also used as the card image on
# /projects and the homepage.
heroImage: "../../assets/images/projects/<slug>-hero.jpg"
# REQUIRED, cannot be empty. Describe what the image SHOWS, for screen readers
# and search. Not "hero image" — say what is in it.
heroImageAlt: "Key art for Game Title showing [describe the scene]"

# REQUIRED. Exactly three headline stats, in the order they should read.
# `value` is the number — keep it short (2–12 characters).
# `label` is what it measures (7–35 characters). Do not repeat the number here.
# ⚠️ These MUST match the numbers in the stats graphic below.
metrics:
  - value: "196,000"
    label: "Peak Viewership on Twitch"
  - value: "1.9 Billion"
    label: "Minutes Watched on Twitch"
  - value: "96,900"
    label: "Total Hours Streamed"

# OPTIONAL. Images in the right-hand column. The hero repeats as the first item;
# the second is normally the stats graphic. Delete the block if there is none.
gallery:
  - src: "../../assets/images/projects/<slug>-hero.jpg"
    alt: "Key art for Game Title showing [describe the scene]"
  - src: "../../assets/images/projects/<slug>-stats.png"
    alt: "Results graphic: [state the actual numbers shown in the image]"

# OPTIONAL. Lower numbers sort first on /projects. Existing use 1–5.
order: 6

# Set to true to keep it off the live site while you work. Set false to publish.
draft: true
---

## Challenge

What the client needed and why it was hard. Set up the problem — do not solve it
here. One or two short paragraphs; the existing five run 176–562 characters.

## Solution

What we actually did, and what happened as a result. This is the substance of the
page: three to four paragraphs, 600–2,000 characters.

Lead with the approach, then the execution, then the outcome. Put the headline
number in the final paragraph — it echoes the three stats above rather than
introducing them.

Use **bold** for a figure worth emphasising mid-sentence. Blank line between
paragraphs. Do not add any headings beyond the two above — `## Challenge` and
`## Solution` are what the layout expects.
