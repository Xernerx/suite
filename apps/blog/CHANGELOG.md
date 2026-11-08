<!-- @format -->

# blog

## 1.1.4

### Patch Changes

- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @xernerx/components@0.15.4
  - @xernerx/lib@1.22.1
  - @xernerx/providers@0.22.3
  - @xernerx/feedback@0.5.5
  - @xernerx/ui@0.8.4

## 1.1.3

### Patch Changes

- ## Newsroom Layout & Ad Placement Support

    Enabled shared layout ad placement support across the Xernerx Blog newsroom shell.

    ### Changed
    - **Root Layout Shell**: Enabled `enableAds` on the shared `AppLayout` wrapper for consistent suite-wide newsroom banner rendering.

- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
    - @xernerx/components@0.15.3
    - @xernerx/lib@1.22.0
    - @xernerx/providers@0.22.2
    - @xernerx/ui@0.8.3
    - @xernerx/feedback@0.5.4

## 1.1.2

### Patch Changes

- Updated dependencies
- Updated dependencies
    - @xernerx/components@0.15.2
    - @xernerx/lib@1.21.1
    - @xernerx/providers@0.22.1
    - @xernerx/feedback@0.5.3
    - @xernerx/ui@0.8.2

## 1.1.1

### Patch Changes

- ## Article Reader Navigation & OpenGraph Enhancements

    Refined the article reader layout and OpenGraph social card rendering on `blog.xernerx.com`.

    ### Added
    - **ESLint Workspace Configuration**: Added a dedicated `eslint.config.mjs` configuration for the `blog` workspace.

    ### Changed
    - **Article Page & OpenGraph Rendering**: Updated article reader layout spacing, table-of-contents quick links, and dynamic OpenGraph image generation on `blog.xernerx.com/[slug]`.

- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
    - @xernerx/components@0.15.1
    - @xernerx/feedback@0.5.2
    - @xernerx/lib@1.21.0
    - @xernerx/providers@0.22.0
    - @xernerx/styles@0.4.1
    - @xernerx/ui@0.8.1

## 1.1.0

### Minor Changes

- ## Official Launch of the Xernerx Newsroom & Engineering Blog (`blog.xernerx.com`)

    Launched the dedicated Xernerx Newsroom & Engineering Blog featuring a streamlined editorial landing page, policy-style article reading view with sticky Table of Contents and Quick Links, interactive community reactions, and RSS 2.0 syndication.

    ### Added
    - **Editorial Newsroom Landing Page (`BlogHomeClient` & `BlogPostCard`)**: Added a streamlined landing page with a featured hero story showcase, live search (`Ctrl + K`), audience switcher (`All Readers`, `Community & Users`, `Developers & Engineers`), and category filter pills (`Announcements`, `Security & Trust`, `Product Updates`, `Developer & Engineering`, `Community`).
    - **Policy-Style Article Reader (`BlogArticleClient` & `BlogMarkdownRenderer`)**: Built the article reading page with a top scroll progress bar, centered glass header with author avatar/role personalisation and reading statistics (`readingTimeMinutes`, `views`, publication date), sticky left **On This Page** Table of Contents, contextual **Quick Links** (`Security & Trust Center`, `Release Changelog`, `RSS Feed`), and `border-l-2 border-(--accent)` section cards.
    - **Syntax-Highlighted Code, Media & Community Reactions**: Added `<CodeBlock />` syntax highlighting with 1-click copy buttons, inline image and video rendering, authenticated Discord community emoji reactions (`🔥`, `🚀`, `💜`, `🛡️`, `🎉`), 1-click URL sharing, and related article cards.
    - **RSS 2.0 Feed, Dynamic OpenGraph & Sitemap (`/rss.xml`, `opengraph-image`, `sitemap`)**: Added an RSS 2.0 feed at `/rss.xml` for newsreaders and Discord webhook subscriptions, dynamic OpenGraph social preview generation, and automatic XML sitemap indexing for public articles.

### Patch Changes

- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
    - @xernerx/components@0.15.0
    - @xernerx/lib@1.20.0
    - @xernerx/providers@0.21.0
    - @xernerx/styles@0.4.0
    - @xernerx/ui@0.8.0
    - @xernerx/feedback@0.5.1

## 1.0.0

### Major Changes

- Launched `blog.xernerx.com` with product announcements, security advisories, engineering deep-dives, interactive Table of Contents, RSS 2.0 syndication (`/rss.xml`), and community reactions.
