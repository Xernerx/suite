<!-- @format -->

# `apps/blog` — Agent Guidelines (`AGENTS.md`)

## 🧭 Overview

`apps/blog` (`blog.xernerx.com`, dev port `4012`) is the official Xernerx Newsroom & Engineering Blog, publishing platform announcements, security & trust deep-dives, product updates, developer engineering articles, and community highlights.

## 🏗️ Key Routes & Architecture

- **`/` (`src/app/page.tsx` & `src/components/BlogHomeClient.tsx`):** Streamlined editorial landing page with featured hero story, live search (`Ctrl + K`), audience filter (`all`, `end-user`, `developer`), and category pills (`announcements`, `security`, `product`, `engineering`, `community`).
- **`/[slug]` (`src/app/[slug]/page.tsx` & `src/components/BlogArticleClient.tsx`):** Policy-style article reading view with a top scroll progress bar, centered glass header with author personalisation & reading telemetry (`readingTimeMinutes`, `views`, `publishedAt`), sticky left **On This Page** Table of Contents + **Quick Links** (`Security & Trust Center`, `Release Changelog`, `RSS Feed`), `border-l-2 border-(--accent)` section cards rendered via `<Markdown />` from `@xernerx/ui`, and authenticated Discord community emoji reactions.
- **`/rss.xml` (`src/app/rss.xml/route.ts`):** Public RSS 2.0 feed of `public` articles.
- **`/api/{auth/[...nextauth],changelog,version}`:** Standard 3 local Next.js routes. All blog data and reaction mutations live in `apps/api` (`/core/blog` and `/secure/blog`).

## ⚠️ Important Rules & Gotchas

1. **Universal 3-Tier Privacy (`public` | `limited` | `private`):**
    - `public` articles appear in the Newsroom directory, `/rss.xml`, and `sitemap.ts`.
    - `limited` articles are unlisted from feeds/search/sitemap but accessible via direct `/[slug]` link.
    - `private` articles are strictly accessible only to staff/authors.
2. **Use `@xernerx/ui` `<Markdown />`:** Never build custom Markdown parsers—`BlogMarkdownRenderer.tsx` delegates rendering of each section to `<Markdown />` from `@xernerx/ui`.
3. **Localization (`DictionaryProvider` & `t`):** All UI copy uses `useDictionary()` under the `blog.*` namespace in `packages/lib/src/dictionaries/en-GB.json`.
