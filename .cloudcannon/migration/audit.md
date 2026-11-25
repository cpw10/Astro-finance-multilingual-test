# Phase 1 — Audit

Site: `astro-storyblok-finance-starter` (fork of bejamas/astro-storyblok-finance-starter), branch `cloudcannon-migration`.
Audit is read-only: the only file created is this note. Nothing was built — the unchanged site cannot build without a Storyblok token (see § 5).

Sources used: the repo, `npx @cloudcannon/cli configure detect-ssg` (→ `astro`, score 50), `scripts/audit-astro.sh`, and the public live demo `https://astro-storyblok-finance-starter.netlify.app/` (HTML saved in the session scratchpad `demo/` folder; treated as data).

## Headline findings

1. **Headless Storyblok site, zero content in the repo.** No `src/content/`, no content config, no data files. Every page, the header/footer settings, the primary colour and the language list are fetched from the Storyblok API at build time. The migration is an *API-driven content → local files* conversion (`content.md § API-driven content → local files`), not a restructure.
2. **The existing architecture is already a page builder.** One catch-all route + a block dispatcher (`StoryblokBlock`) + 14 block components. The block components map 1:1 to CloudCannon page-builder blocks; only the data source and the dispatcher change.
3. **No Storyblok token** → content is recreated from the public demo (decision already taken by the user). The demo's static HTML exposes all text and most asset URLs, but **not** the original URLs of images that went through `astro:assets` (13 images; only optimised `.webp` derivatives are public).
4. **Small site**: 7 English pages (14 with Spanish). Sizing thresholds not tripped — no `plan.md`.
5. **Astro 7.4.8**, no framework islands (no React/Vue/Svelte/Solid), Tailwind 4, no MDX, no Bookshop.

## 1. Astro version and dependencies

| Item | Finding |
| --- | --- |
| Astro | `7.4.8` (pinned exactly). No Astro 4 upgrade question. Content collections must use the Astro 5+ style `src/content.config.ts` with `glob()` loaders (`entry.id` = filename without extension). |
| Framework integrations | None. All components are `.astro`. Client behaviour comes from `<script>` tags in three components (see § 6 Load-time behaviour). |
| Bookshop | No markers. |
| CSS | Tailwind `^4.3.5` via `@tailwindcss/vite`, `@tailwindcss/typography` (`prose` on report body), `tw-animate-css`, `bejamas/tailwind.css`. Tokens in `src/styles/global.css`. |
| UI kit | bejamas/ui components copied into `src/components/ui/` (avatar, badge, button, card, dropdown-menu, hamburger-menu) + `@data-slot/collapsible`, `@data-slot/dropdown-menu`, `class-variance-authority`, `clsx`, `tailwind-merge`. `@lucide/astro` is a dependency but not imported anywhere in `src/`. |
| Markdown | No remark/rehype plugins, no MDX. Rich text is Storyblok rich-text JSON rendered by `StoryblokRichText`. |
| Icons | No `astro-icon`. Icons are inline SVG or Storyblok-hosted `.svg` assets in `<img>`. |
| Package manager | `bun.lock` only; no `packageManager` field; README says `bun install`. **bun is not installed on this machine** and is not in the CloudCannon install-command table (npm / pnpm / Yarn only). See Decisions. |
| Node | No `.nvmrc`, `.node-version` or `engines`. README: "Node.js 22.23.4 or newer". Local: node v25. `@cloudcannon/editable-regions` needs ≥ 20.19. |
| Other deps to drop | See § 7 Storyblok removal inventory. |

## 2. Content collections

**None exist.** `audit-astro.sh`: "No content config found", no data files. (The CLI's suggested `locales` / `storyblok` "collections" are false positives from folder names — ignore.)

Non-collection data in the repo:

| File | Shape | Used by |
| --- | --- | --- |
| `src/locales/en.json`, `src/locales/es.json` | 9 flat UI strings: `author`, `readMore` (unused), `report`, `returnReports`, `becomeMember`, `companyDetails`, `allRightsReserved`, `termsAndConditions`, `privacyPolicy` | `[...slug].astro` picks `locales[language]` and passes it down as the `translate` prop to Layout → Header/Footer and to the `report` block |
| `src/locales/index.js` | re-exports `en`, `es` | `[...slug].astro` |

### Implied content model (from Storyblok block components)

This is what Phase 2/3 turn into collections, schemas and structures. Field names are the Storyblok keys the templates read; keep them (naming convention: match existing prop names).

Storyblok field types seen: **asset** = `{ filename, alt }`; **link** = `{ linktype: 'story' | 'url', cached_url, url }` (resolved by `src/utils/getHref.js`, though several blocks read `link.cached_url` directly); **blocks** = array of nested blocks, always read as `[0]` (max one); **richtext** = Storyblok rich-text JSON.

#### Content types (story roots)

| Storyblok component | File | Fields read | Notes |
| --- | --- | --- | --- |
| `page` | `src/storyblok/Page.astro` | `body[]` (blocks), `metatags` (read by `Layout.astro` via `blok.metatags`) | Renders `<main>` and loops `body`. `main` gets vertical spacing only when it has ≥3 children (`has-[>*:nth-child(3)]`). |
| `report` | `src/storyblok/Report.astro` | `title`, `author` (plain text), `published_date` (string, rendered raw e.g. `2025-05-08 18:20`), `image` (asset, used as CSS background, un-resized), `content` (richtext), `metatags` | Renders `<article>` (no `<main>`). Also needs the entry slug (`report.slug`, attached by the list/section blocks) for card links. Uses `translate.report`, `translate.author`, `translate.returnReports` and `getTransLink(language, '/report')`. |
| site settings (`settings/site-settings` story) | consumed by `Header.astro`, `Footer.astro` (`src/storyblok/siteSettings.astro` is an **empty file**) | `logo` (asset: `filename`, `alt`), `navigation[]` → `{ label, url (link) }`, `company_description`, `phone`, `email` | Excluded from routes by `generateStaticPaths`. |
| `colors` datasource | `Layout.astro` → `getDatasource('colors')` | `primary` → `<body style="--primary: …">` | Demo value `#193EAF`, identical to the `:root --primary` default already in `global.css`. |

`metatags` (Storyblok SEO plugin object) fields read in `Layout.astro`: `title`, `description`, `og_title`, `og_description`, `og_image`, `twitter_title`, `twitter_description`, `twitter_image` (URL strings). `twitter:card` is computed from `twitter_image`. `og:site_name` is hardcoded empty.

#### Page-builder blocks (members of `page.body[]`)

| Block (`component`) | File | Fields | Nested blocks | Images |
| --- | --- | --- | --- | --- |
| `hero` | `Hero.astro` | `image` (asset), `headline`, `lead` (optional) | `button[0]` (`button`, passed `classes="cta-button"`), `partners[0]` (`partners_section`) | `<picture>` with 3 `<source>` crops via Storyblok image service (`/m/640x685/`, `/m/1024x685/`, `/m/1440x685/`) + plain `<img>`. Has a leftover `data-posthog` attribute. |
| `partners_section` (only used nested in hero) | `PartnersSection.astro` | `title`, `partners[]` → `{ name, logo (asset), link (link) }` | — | Plain `<img>` (SVG logos). Fallback `/assets/partner-placeholder.svg` **does not exist** in `public/`. |
| `banner_split` | `BannerSplit.astro` | `headline`, `lead` (optional), `image` (asset) | `heading[0]` (`heading`), `button[0]` (`button`) | `<Image>` from `astro:assets`, remote, `/m/906x0` |
| `features_section` | `FeaturesSection.astro` | `title`, `features[]` → `{ title, image (asset), description }` | — | `<Image>`, `/m/700x0` |
| `stats_section` | `StatsSection.astro` | `title`, `lead`, `stats[]` → `{ number (string), label, primary (boolean) }` | — | — |
| `reports_section` | `ReportsSection.astro` | `title`, `reports[]` — **relation** to report stories (resolved by `resolve_relations: 'reports_section.reports'`; each item is a full story: `.slug`, `.content.{title,image}`) | `button[0]` (`button`) | via `ReportCard` |
| `reports_list` | `ReportsList.astro` | `image` (asset, CSS background `/m/2560x0`), `title`, `lead` | — | Fetches **all** reports itself (`getReportList(language)`: stories under `report/`, excluding the folder start page) and renders `ReportCard`s. Computed listing, not a field. |
| `testimonials_section` | `TestimonialsSection.astro` | `image` (asset), `testimonials[]` → `{ quote, author_name, author_title }`, `headline` | `heading[0]` (`heading`), `button[0]` (`button`) | `<Image>`, `/m/858x0`. On the demo `headline` and `button` are empty, so an empty white `<h2>` is rendered below the card. |
| `team_section` | `TeamSection.astro` | `title`, `members[]` → `{ image (asset), name, role, link (link → `.cached_url`) }` | — | `<Image>`, `/m/1078x0` |
| `advisers_section` | `AdvisersSection.astro` | `title`, `advisers[]` → `{ image (asset), name, role, description, link (link → `.cached_url`) }` | — | `<Image>`, `/m/128x0` in an `Avatar` |
| `banner_cta` | `BannerCta.astro` | `image` (asset, CSS background `/m/1440x0/filters:quality(90)`), `headline` | `heading[0]` (`heading`), `button[0]` (`button`) | CSS `background-image` |

#### Nested-only blocks

| Block | File | Fields | Notes |
| --- | --- | --- | --- |
| `button` | `src/storyblok/Button.astro` → `src/components/Button.astro` | `label` (default `'Become a Member'`), `style` (`primary` \| `secondary`, default `primary`), `url` (link) | Code-level defaults must become explicit values in content. |
| `heading` | `src/storyblok/Heading.astro` → `src/components/Heading.astro` | `title` (default `'Membership'`), `icon` (asset; rendered as `<img src>`), `style` (`default` \| `glass`) | Latent bug: the inline-SVG fallback for a missing `icon` is a string, then `.filename` is read from it → `undefined`, so the fallback never renders. |

Shared (non-Storyblok) components: `components/Header.astro`, `Footer.astro`, `LanguageSwitcher.astro`, `ReportCard.astro` (reads `report.image`, `report.title`, `report.slug`), `ArrowLink.astro`, `Button.astro`, `Heading.astro`, plus `components/ui/*`.

## 3. Pages and routing

### Route files

| Route file | How it gets data | After migration |
| --- | --- | --- |
| `src/pages/[...slug].astro` | `getStaticPaths()` → `generateStaticPaths()` → Storyblok links API × languages. Fetches story + site settings per page, renders `StoryblokBlock` for the root. In preview mode switches to SSR + `parseUrl` + `getPayload`/`StoryblokPreview`. Route param comes from the Storyblok `link.slug` (`home` → `undefined`). | Becomes the `pages` catch-all reading the local collection (`page.id === 'index'` → `undefined`). Reports need their own route (`src/pages/report/[slug].astro`) or a branch in the catch-all. |
| `src/pages/llms.txt.js` | `getAllStories()` → plain-text index; hardcodes the demo domain | Replace or remove (see Decisions) |
| `src/pages/llms-full.txt.js` | `getAllStories()` + `html2md` over each story's rich text; hardcodes the demo domain | Replace or remove |

No pagination, no taxonomy routes, no redirects in `astro.config.mjs`. No 404 page in the repo (the demo's 404 is the host default).

### Live-demo routes (English) — all HTTP 200 unless noted

| URL | Story type | Blocks, in order |
| --- | --- | --- |
| `/` | `page` (`home`) | `hero` (+ `button`, + `partners_section` with 5 partners) → `banner_split` (+ `heading`, `button`) → `features_section` (3) → `stats_section` (4, first is `primary`) → `reports_section` (3 related reports + `button`) → `testimonials_section` (+ `heading`, 1 testimonial) → `team_section` (4) → `advisers_section` (4) → `banner_cta` (+ `heading`, `button`) |
| `/spain-campaign/` | `page` | `hero` (+ `button`, no partners) → `stats_section` (4, first is `primary`) → `banner_cta` (+ `heading`, `button`). No metatags at all (empty `<title>`). |
| `/report/` | `page` (folder start page) | `reports_list` (lists all 4 reports) → `banner_cta` (+ `heading`, `button`) |
| `/report/clarity-over-complexity/` | `report` | title, author Thom Krupa, `2025-05-08 18:20`, image `report1.png`, rich text |
| `/report/the-hidden-cost-of-manual-financial-tracking/` | `report` | author Tamara Bolsewicz, `2025-08-09 10:52`, image `report3.png` |
| `/report/from-chaos-to-control/` | `report` | author Mojtaba Seyedi, `2024-09-04 18:20`, image `report2.png` |
| `/report/from-chaos-to-more-control/` | `report` | Duplicate of the previous one (same title, author, date, image, body); linked only from `/report/` |
| `/llms.txt`, `/llms-full.txt` | endpoints | generated text |
| `/terms`, `/policies` | — | **404.** Linked from every page's footer, but no such stories exist. |
| `/es/…` | Spanish equivalents of all 7 pages, all 200 (`/es/terms`, `/es/policies` 404) | same blocks |

Rich text in the four report bodies uses only `p`, `h2`, `a`, `em` — converts cleanly to plain markdown; no snippets needed. No footnotes/math/alerts/citations (nothing to grep — there are no content files).

Report order: `/report/` lists chaos-to-control, chaos-to-more-control, hidden-cost, clarity (Storyblok default order, not date order). Home's `reports_section` picks clarity, chaos-to-control, hidden-cost.

URL format: Astro defaults (`build.format: 'directory'`, `trailingSlash: 'ignore'`); the host 301s to the trailing-slash form. Internal links are inconsistent (`/report/`, `/report`, `/report/clarity-over-complexity`).

### Census table (mandatory)

No page is a hardcoded `.astro` page; every row is a Storyblok story that becomes a local content file. Rows are named by live route since the only page file is `src/pages/[...slug].astro`.

| Page (route → proposed file) | Distinct content sections | Layout repeated on other pages? | Editor will add similar pages? | Recommended pattern | Needs editable region? |
| --- | --- | --- | --- | --- | --- |
| `/` → `src/content/pages/index.md` | hero (+partners), banner split, features, stats, related reports, testimonials, team, advisers, CTA banner (9) | Blocks reused on other pages | Yes (landing pages) | Page builder, `pages` collection | Yes — block array + every block |
| `/spain-campaign/` → `src/content/pages/spain-campaign.md` | hero, stats, CTA banner (3) | Yes (same blocks as home) | Yes — it is a campaign landing page | Page builder, `pages` collection | Yes — block array + every block |
| `/report/` → `src/content/pages/report.md` | reports list header (title, lead, bg image) + auto list, CTA banner (2) | Blocks reused | Unlikely | Page builder, `pages` collection (same schema) | Yes — block array + blocks; the report cards inside `reports_list` are a computed listing (edited via each report, not in place) |
| `/report/<slug>/` ×4 → `src/content/reports/<slug>.md` | hero (title, author, date, image) + long rich-text body | Yes — 4 identical | Yes | Fixed-schema collection `reports`, markdown body | Yes — title, author, date, image, and body (`@content`) |
| Header + footer (every page) → site data file | logo, nav items, CTA label, company description, phone, email, footer legal links, footer strings | Yes — layout | n/a | Shared UI → data file (+ component) | Yes — via data-file bindings (`@data[…]`) / data panel |
| `/llms.txt`, `/llms-full.txt` | generated text | — | No | Generated endpoint (no editor value) | No |

Page-builder justification (`page-building.md § When to reach for a page builder`): every page has 2+ sections, sections are shared blocks, editors create more pages like them — and the site already *is* a block-based page builder in Storyblok. Source editables do not apply anywhere.

### Primitive-vs-computed census

`src/pages/[...slug].astro` has no direct content interpolations (it delegates everything to the root block), so the census is taken on the templates that will be editable. Target after Phase 3/4: zero computed values in route files; the items below live in components and need handling there.

| Where | Interpolation | Kind | Action |
| --- | --- | --- | --- |
| all blocks | `{block.title}`, `{block.headline}`, `{block.lead}`, `{feature.title}`, `{stat.number}`, `{member.name}` … | primitive text | keep — primitive editable OK |
| `Report.astro` | `{translate.report}`, `{translate.author}:`, `translate.returnReports` | computed (shared data / i18n lookup) | move to shared data (`@data[…]`) or static text; see Decisions |
| `Report.astro` | `getTransLink(language, '/report')` | computed (helper) | becomes a plain `/report/` href once i18n routing is removed |
| `Report.astro`, `BannerCta.astro`, `ReportsList.astro` | `style="background… url(${block.image.filename}…)"` | computed (string-built style) | image editable can't bind to a CSS background directly — keep inside the registered block component so it re-renders on change |
| `Hero.astro` | 4 × `` `${block.image.filename}/m/…` `` | computed (Storyblok image-service URL) | replace with local image + `astro:assets`/plain `src` |
| `BannerSplit`, `FeaturesSection`, `TestimonialsSection`, `TeamSection`, `AdvisersSection`, `ReportCard` | `` src={`${x.image.filename}/m/WxH`} `` | computed (image-service URL) | same |
| `StatsSection.astro` | `stat.primary === true && 'bg-primary …'` | computed (conditional class) | fine inside a registered component (re-renders) |
| `storyblok/Button.astro` | `block.label \|\| 'Become a Member'`, `block.style \|\| 'primary'`, `getHref(block.url)` | computed (fallback / helper) | write explicit values into content; link becomes a plain URL string |
| `storyblok/Heading.astro` | `block.title \|\| 'Membership'`, `block.icon \|\| '<svg…>'`, `block.style \|\| 'default'` | computed (fallback) | explicit values in content; drop the broken icon fallback |
| `PartnersSection.astro` | `partner.link?.cached_url \|\| partner.link?.url \|\| '#'`, `partner.logo.filename \|\| '/assets/partner-placeholder.svg'`, `partner.name \|\| 'Partner'` | computed (fallback) | explicit values in content |
| `ReportsSection.astro` | `block.reports.map(report => report.content…)` | computed (relation lookup) | store report slugs; look up with `getEntry`/`getCollection` inside the component |
| `ReportsList.astro` | `await getReportList(language)` | computed (collection listing) | `getCollection('reports')` |
| `Header.astro`, `Footer.astro` | `siteSettings.*`, `translate.*`, `getHref(navItem.url)`, `getTransLink(language, …)` | computed (shared data) | data file + `@data[…]` bindings |
| `Layout.astro` | `seo?.title` etc., `seo?.twitter_image ? … : …`, `--primary: ${primaryColor}` | computed (SEO / shared data) | front matter SEO fields in the data panel; colour → data file or CSS token |

### Frontmatter co-location census

No `src/cloudcannon/componentMap.ts` / `registerComponents.ts` exists yet. The components that will be registered are the 11 page-builder blocks + 2 nested blocks. All of them already take **one `block` prop holding all their fields** (Storyblok's convention), i.e. fields are co-located under one array item — no scattered-field refactor needed.

| Component file | Used from page template? | Fields nested under one key? | Action |
| --- | --- | --- | --- |
| `Hero`, `BannerSplit`, `FeaturesSection`, `StatsSection`, `ReportsSection`, `ReportsList`, `TestimonialsSection`, `TeamSection`, `AdvisersSection`, `BannerCta` | Via dispatcher only | Yes (one block object) | Rename/move out of `src/storyblok/`, swap `{...editable}` spread and extra `language`/`translate` props |
| `PartnersSection`, `Button`, `Heading` (nested) | Inside parent blocks | Yes | Parent passes `block.button[0]` etc.; decide array-of-one vs object (Decisions) |
| `Report` | Root of report pages | Yes (whole entry) + needs `translate`, `language` | Becomes the report page template/layout; drop the extra props |
| `Header`, `Footer` | Layout | One `siteSettings` object + `translate` + `language` + `langSwitch` | Read one site data file; drop i18n props |

## 4. Layouts and components

- **Base layout** `src/layouts/Layout.astro`: `<head>` (SEO from `blok.metatags`), `Header`, default slot, `Footer`. Fetches the `colors` datasource itself. Props: `siteSettings`, `language`, `langSwitch`, `translate`, `blok`. No canonical link, no sitemap, no robots.txt, no analytics script (PostHog only survives as a `data-posthog` attribute on `Hero` and `PUBLIC_POSTHOG_TOKEN` in `.env.example`).
- **Page-level layouts**: none. `Page.astro` (`<main>` + block loop) and `Report.astro` (`<article>`) act as such.
- **Dispatcher**: `StoryblokBlock` / `StoryblokRichText` from `defineStoryblokBlocks` in `src/storyblok/index.js`. Blocks receive `block`, `editable` (Storyblok editing attributes spread onto the root element), plus pass-through props (`language`, `translate`, `classes`).
- **Interactive islands**: none (`client:*` unused). Vanilla `<script>`s: `ui/hamburger-menu/HamburgerMenu.astro`, `ui/dropdown-menu/DropdownMenu.astro`, `LanguageSwitcher.astro`. No hydration → the "existing hydration errors" check does not apply.
- **Visual-editing candidates**: all 11 page-builder blocks (text, images, arrays: features, stats, partners, testimonials, members, advisers), report title/author/date/image/body. **Data-panel candidates**: SEO `metatags`, navigation, logo, contact details, primary colour, button `style`, heading `style`/`icon`, stat `primary`, links.
- **Image handling** (all remote today):
  - `<Image>` from `astro:assets` with remote `a.storyblok.com` URLs: `BannerSplit`, `FeaturesSection`, `TestimonialsSection`, `TeamSection`, `AdvisersSection`, `ReportCard`.
  - Plain `<img>` / `<picture>`: `Hero` (photo), `PartnersSection` (SVG logos), `components/Heading.astro` (SVG icon), `Header`/`Footer` (SVG logo).
  - CSS `background-image` from inline `style`: `BannerCta`, `ReportsList`, `Report`.
  - Storyblok image-service suffixes (`/m/WxH`, `/filters:quality(90)`) are appended in 10 places and must all go.
- **Presentational wrappers inside editable content**: `Card`/`CardHeader`/`CardTitle`/`CardContent`, `Avatar`, `Badge`, `ui/Button`, `ArrowLink` wrap editable text inside blocks. They are inside components that will be registered (re-rendered), not inside source editables, so they can stay; text editables must be placed on the inner plain elements (`h3`, `p`, `span`), not on the wrapper components.
- **Hardcoded text in templates**: `aria-label="Select language"`, `triggerLabel="Toggle Navigation"` (a11y only), language names/flags in `utils/i18n.js`, `•` separator, the typographic quote marks around testimonials, and the 8 used locale strings. No hardcoded marketing copy in `.astro` files.
- **Fonts**: `public/fonts/*.woff2`. `global.css` references Inter as `url('../fonts/…')` (no such `src/fonts/` folder) and Adamina as `url('/fonts/…')`. The relative form survives un-rewritten into `/_astro/*.css` and happens to resolve to `/fonts/` — works on the demo, would break with a `base` path. Not migration-blocking.

## 5. Build pipeline

- Scripts: `build` = `astro build`. No pre-build steps or code generation.
- `astro.config.mjs`: `output` and `adapter` are computed from `STORYBLOK_*` env vars (`server` in dev; `static` for local builds; in the cloud `server` + `@astrojs/netlify` only when `STORYBLOK_IS_PREVIEW=yes`, else `static`). `image.remotePatterns` allows `**.storyblok.com`. Vite plugins: `mkcert()` + `server.https: true` (only needed for the Storyblok Visual Editor iframe), `tailwindcss()`. No `site`, `base`, `trailingSlash` or `build.format` set. No integrations array.
- Env vars: `STORYBLOK_TOKEN`, `STORYBLOK_IS_PREVIEW`, `STORYBLOK_ENVIRONMENT`, `STORYBLOK_DEFAULT_LANG`, `PUBLIC_POSTHOG_TOKEN` (unused in `src/`). No `.env` present → **the site cannot currently build or run** (top-level `await getLinks()` in `generateStaticPaths.js` fails without a token). There is therefore no local parity baseline; the live demo HTML is the baseline.
- CLI build suggestions: install `npm i`, build `npm run build`, output `dist`.
- Hosting: demo is on Netlify; no `netlify.toml`, `_headers`, `_redirects` or `vercel.json` in the repo → no headers/redirects to carry over. Site is at the repo root (single site). No forms anywhere.

## 6. Flags and special patterns

- **Astro 7 + new-style collections**: use `src/content.config.ts` with `glob()`; `entry.id` has no extension.
- **String-keyed relation**: `reports_section.reports` → store report slugs (ids) and resolve in the component; in CloudCannon a multiselect over the `reports` collection.
- **Computed listing**: `reports_list` renders all reports; no pagination.
- **`set:html`**: only in `LanguageSwitcher.astro` (flag SVGs from `utils/i18n.js`) — goes away with the switcher/Rosey work; not content.
- **Styled HTML in content fields**: none found on the demo (all block text is plain; report bodies are simple rich text).
- **Inline HTML in markdown**: n/a today; report bodies need none.
- **Load-time behaviour** (for Phase 4):
  - `src/components/ArrowLink.astro` with `reveal`: `opacity-0 scale-75 pointer-events-none` until the parent `.group` is hovered (CSS only, no script) — used in `TeamSection` and `ReportCard`. The link is unclickable/invisible until hover; relevant if the link should be editable in place.
  - `ui/hamburger-menu/HamburgerMenu.astro` (`createCollapsible`, mobile panel off-canvas via `data-[starting-style]:translate-x-full`), `ui/dropdown-menu/DropdownMenu.astro` (`createDropdownMenu`, popup hidden until opened), `LanguageSwitcher.astro` script — header-only; scripts bind on load, so header re-renders in the editor would lose bindings.
  - `global.css`: `@view-transition { navigation: auto; }`, `scroll-behavior: smooth`, `body:has(#header [data-state="open"]) { overflow: hidden }`.
  - No `IntersectionObserver`, `setInterval`, carousels, count-ups or scroll-reveal classes. `opacity-65` usages are static styling.
- **Header overlaps content**: `<header class="absolute …">` sits over the first block (every first block is dark/hero-like). A new page whose first block is light will have an unreadable header — worth an editor note, not a migration change.
- **Existing quirks to preserve or fix deliberately** (parity): empty `<h2>` in `testimonials_section`; `Heading` icon fallback bug; missing `/assets/partner-placeholder.svg`; phone/email links with `href=""`; header "Become a Member" link with empty `href` (`getTransLink(language, '')`); footer links to non-existent `/terms` and `/policies`; duplicate report `from-chaos-to-more-control`; `spain-campaign` has an empty `<title>`.
- **Editor-visible strings in `src/locales/en.json`** are hardcoded from an editor's point of view → must become editable (shared data).

### i18n machinery inventory (for the later `make-site-multilingual` journey; the 5 phases target English only)

| Piece | Where | What it does |
| --- | --- | --- |
| Language list | `utils/api.js#getLanguagesCode` (Storyblok space `language_codes`) + `utils/i18n.js#getLanguages` (prepends `STORYBLOK_DEFAULT_LANG`) | `['en', 'es']` on the demo |
| Path-prefix routing | `utils/generateStaticPaths.js` | Every story × every language; default language unprefixed, others `/<lang>/<slug>` |
| `langSwitch` map | `generateStaticPaths.js`, duplicated in `utils/parseUrl.js` (preview/SSR) | `{ en: '/slug', es: '/es/slug' }` per page, passed Layout → Header → LanguageSwitcher |
| Field-level translation | `language` query param on every Storyblok fetch (`getStory`, `getSiteSettings`, `getReportList`) | Storyblok returns translated field values |
| UI strings | `src/locales/{en,es}.json`, `src/locales/index.js` → `translate` prop | 9 keys (`readMore` unused) |
| Link localisation | `utils/i18n.js#getTransLink` used in `Header`, `Footer`, `Report`, `ReportCard` | Prefixes `/<lang>` for non-default languages. Storyblok `cached_url` links are *not* localised consistently (es hero buttons on `/es/spain-campaign/` point to `/`). |
| Switcher UI | `components/LanguageSwitcher.astro` + `ui/dropdown-menu/*`, labels and flag SVGs in `utils/i18n.js` | Dropdown of languages linking to `langSwitch[lang]` |
| `<html lang>`, `og:locale` | `Layout.astro` | From `language` |

Spanish content that exists on the demo (source for later Rosey translations; saved under `demo/xes_*.out`): all 7 pages are translated — block text on home, spain-campaign and report index; report titles and bodies; nav labels; locale strings. **Not translated on the demo**: footer `company_description`, phone/email, partner names, person names, SEO titles/descriptions (English or empty on `/es/` pages), report author/date. The Spanish report bodies differ slightly in structure from English (e.g. the italic Bejamas note is rewritten as plain paragraphs), so translations map by passage, not 1:1 markup. Asset URLs are shared between languages.

## 7. Storyblok removal inventory (everything to remove or replace)

| Item | Location | Action |
| --- | --- | --- |
| `@storyblok/astro`, `@storyblok/api-client`, `@storyblok/richtext` | `package.json` devDependencies | Remove |
| `axios` | devDependencies | Not imported anywhere in `src/` — remove |
| `@astrojs/netlify`, `@netlify/dev`, `@netlify/vite-plugin` | devDependencies; adapter in `astro.config.mjs` (preview SSR only) | Remove — site becomes plain `output: 'static'` |
| `vite-plugin-mkcert` + `vite.server.https` | `astro.config.mjs` | Remove (only for the Storyblok editor iframe) |
| Env-driven `output`/`adapter` switching, `loadEnv('STORYBLOK')` | `astro.config.mjs` | Replace with static config |
| `image.remotePatterns` `**.storyblok.com` | `astro.config.mjs` | Remove once images are local |
| Preview middleware | `src/middleware.js` (`storyblokPreviewMiddleware`) | Delete file |
| `getPayload`, `<StoryblokPreview …>`, `isPreview()`/`parseUrl` branch | `src/pages/[...slug].astro` | Rewrite route on local collections |
| API client and all fetchers | `src/utils/api.js` (`getStory`, `getAllStories`, `getLinks`, `getSiteSettings`, `getDatasource`, `getReportList`, `getLanguagesCode`) | Delete; replace callers with `getCollection`/`getEntry`/data-file imports |
| Preview helpers | `src/utils/isPreview.js`, `src/utils/parseUrl.js` | Delete |
| Path generation | `src/utils/generateStaticPaths.js` | Delete (replaced by collection-based `getStaticPaths`) |
| Link resolver | `src/utils/getHref.js` (Storyblok link objects) | Delete; links become plain URL strings |
| Rich text → markdown | `src/utils/html2md.js`, `src/utils/extractStoryMeta.js` | Delete (bodies are markdown already) |
| Block registry | `src/storyblok/index.js` (`defineStoryblokBlocks`), `StoryblokBlock`/`StoryblokRichText` usages in 8 block files | Replace with a local block dispatcher + component map; `StoryblokRichText` → rendered markdown `<Content />` |
| `{...editable}` spread, `editable` prop | every block root element | Replace with CloudCannon editable-region attributes in Phase 4 |
| `src/storyblok/siteSettings.astro` | empty file | Delete |
| `colors` datasource | `Layout.astro` (`getDatasource('colors')` → `--primary`) | Replace (see Decisions) |
| Site settings story | `[...slug].astro` → Layout → Header/Footer | Local data file |
| Language list from space | `utils/i18n.js` | Removed with i18n (English-only for the 5 phases) |
| `llms.txt` / `llms-full.txt` endpoints | `src/pages/llms*.js` (Storyblok fetch + hardcoded demo domain) | Rewrite on local collections or remove (Decisions) |
| Storyblok image-service URL suffixes | 10 places across blocks + `ReportCard` | Replace with local images |
| `data-posthog` attribute, `PUBLIC_POSTHOG_TOKEN` | `Hero.astro`, `.env.example` | Dead remnants — remove |
| `.env.example`, README setup section, README screenshots on `a.storyblok.com` | repo root | Update for the new setup |
| `.netlify` entry in `.gitignore` | `.gitignore` | Harmless; leave |

## 8. Remote images to download into the repo

All content images are hosted on `a.storyblok.com/f/286134095425736/…`. Public originals respond 200 without auth.

**Original URL known from the demo HTML (18)** — download the originals:

| Asset | Used by |
| --- | --- |
| `150x25/eb2ba21444/global-finance-starter.svg` | site logo (header + footer) |
| `2880x1370/d152b4d19c/hero-test.png` | home `hero.image` |
| `59x24/a9abbe4036/stripe.svg`, `75x24/b2c3e73baa/canva.svg`, `83x24/10fcbc18dd/logos_hubspot.svg`, `75x20/e633577add/logos_github.svg`, `113x24/69b1702801/vector.svg` (Microsoft) | home `partners_section.partners[].logo` |
| `25x25/8f62061bab/user.svg` | `heading.icon` in home `banner_split` |
| `25x25/dac6398e94/quote.svg` | `heading.icon` in home `testimonials_section` |
| `25x25/2e6ab08681/direction-sign.svg` | `heading.icon` in every `banner_cta` |
| `2880x1304/298f16eff3/cta-banner.png` | `banner_cta.image` on home and `/report/` |
| `2880x1370/b5768d6305/hero.png` | `banner_cta.image` on spain-campaign |
| `2400x2013/f25705db4b/alexander-awerin-i8ijlvjezxw-unsplash.jpg` | spain-campaign `hero.image` |
| `2880x840/b0ce8f12a9/report-hero.png` | `/report/` `reports_list.image` |
| `727x727/12c2de5707/report1.png`, `727x727/dff3a76169/report2.png`, `728x727/3ab8ac0fa3/report3.png` | report `image` (hero background + cards) |
| `732x508/21a6d07394/feature1.png` | home `metatags.og_image` / `twitter_image` (probably also the first feature image) |

**Original URL not exposed (13)** — rendered through `astro:assets`, so the demo only serves optimised `/_astro/*.webp` derivatives (publicly fetchable): home `banner_split.image` (1, `906x0_*`), `features_section` images (3, `700x0_*`, 350×242 slots), `testimonials_section.image` (1, `858x0_*`), `team_section` member photos (4, `1078x0_*`), `advisers_section` avatars (4, `128x0_*`). See Open questions for the default.

All image `alt` values on the demo are empty except partner logos (which use `partner.name`).

## 9. Sectioning recommendation (sizing)

| Signal | Count | Threshold | Result |
| --- | --- | --- | --- |
| Total pages (content-file-backed; English) | 7 (home, spain-campaign, report index, 4 reports); 14 if Spanish counted | > 30 | ok |
| Template → YAML/markdown conversions (census rows → page-builder or fixed-schema collection) | 7 entries (3 page-builder, 4 reports) across 4 census rows | > 15 | ok |
| Distinct collections | 2 (`pages`, `reports`) + 1 site data file | > 5 | ok |

**Tripped: 0/3 → no `plan.md`.** Phases run unsectioned, one subagent each.

## Decisions and why

1. **Two collections: `pages` (page builder) and `reports` (fixed schema, markdown body).** Mirrors the two Storyblok content types; one `pages` collection holds home, spain-campaign and the report index with a single block-array schema — no collection-of-one.
2. **Home page file is `src/content/pages/index.md`**; the report index is `src/content/pages/report.md` → `/report/`; reports are flat files `src/content/reports/<slug>.md` → `/report/[slug]/`. Why: slug collapses to `/` for `index`; flat files match CloudCannon's `[slug]`; filenames reuse the live slugs so URLs do not change. Note the collection is `reports` but the URL segment stays `report`.
3. **Keep the existing block field names and the `component`-style discriminator concept; keep one object per block.** Why: components already read `block.<field>`; front matter keys pass straight through. The block array key (Storyblok `body`) and the type key name are Phase 2's call (`content_blocks` + `_type` is the skill convention) — whichever is chosen, set once.
4. **Nested single blocks (`button`, `heading`, `partners`) become single objects rather than arrays-of-one**, optional where the template guards them. Why: Storyblok's `[0]`-of-an-array is an artefact of its "blocks" field type; an object is simpler to edit and bind. Phase 2 may keep arrays if a structure picker is wanted, but must be consistent across all blocks.
5. **Storyblok link objects become plain URL strings; asset objects become an image path + `alt` field.** Why: no link/asset resolver needed without Storyblok; `getHref` goes away. Write explicit values where code currently supplies fallbacks (`button.label`, `button.style`, `heading.title`, `heading.style`, partner link `#`).
6. **`reports_section.reports` stores report slugs** (ids of `reports` entries), resolved in the component; `reports_list` uses `getCollection('reports')`. Why: one canonical owner for report data; no duplicated titles/images in page front matter.
7. **Report body = markdown body of the file** (converted from the rendered rich text: `p`, `h2`, `a`, `em` only). `published_date` becomes an ISO 8601 datetime; the template formats it to reproduce the current `YYYY-MM-DD HH:mm` output.
8. **SEO (`metatags`) stays a nested object in front matter on pages and reports** with the 8 keys `Layout.astro` reads; image fields become local paths. Edited in the data panel.
9. **Site settings → one data file** (logo, navigation, company description, phone, email) plus the editor-visible UI strings currently in `src/locales/en.json` (header CTA label, footer headings, legal link labels and URLs, report labels). Why: shared-UI rule — header/footer are data-file + component; "if an editor can see it, they can edit it". `src/locales/` is then deleted in the English-only site; Rosey takes over translation later. Exact file layout (one `site` file vs `navigation` + `footer`) is Phase 2's call.
10. **Primary colour**: drop the datasource fetch; keep `--primary: #193EAF` from `global.css` (identical to the demo value) and expose it as a colour field in the site data file that `Layout.astro` writes to `<body style>` as today. Why: preserves the "editors can rebrand" feature with no API.
11. **Images**: download all content images into the repo. Raster images rendered with `<Image>` go to `src/assets/images/` with repo-relative paths in front matter resolved via `import.meta.glob`; SVG logos/icons rendered with plain `<img>` go to `public/`. Images used as CSS backgrounds (`banner_cta`, `reports_list`, report hero) and the hero `<picture>` are converted in Phase 3 to whichever of the two the chosen rendering needs (default: `src/assets` + `getImage()` so they stay optimised). Why: skill image convention; one upload path per kind.
12. **English-only for the five phases.** Remove the `/es/` routing, `langSwitch`, `getTransLink`, `LanguageSwitcher`, `src/locales/` and the `language`/`translate` props; `<html lang="en">`. The i18n inventory in § 6 and the saved `/es/` demo pages are the hand-off to `make-site-multilingual` (Rosey + RCC).
13. **Static output, no adapter.** `astro.config.mjs` reduces to `tailwindcss()`; remove Netlify adapter, mkcert, HTTPS dev server, remote image patterns, middleware. Why: CloudCannon serves static output; the adapter existed only for Storyblok preview SSR.
14. **Package manager → npm.** Delete `bun.lock`, generate and commit `package-lock.json`, set `packageManager` to the local npm version, CloudCannon install command `npm ci`. Why: bun is not installed locally and is not in CloudCannon's supported install table; a lockfile must be held.
15. **`llms.txt` / `llms-full.txt`: keep, rewritten on local collections**, with the hardcoded demo domain replaced by Astro's `site`. Why: they are a feature of the template and cheap to keep; they are generated, so not editable.
16. **Parity quirks**: preserve rendering as on the demo, except fix things that are plainly broken and invisible to parity — drop the dead `Heading` icon fallback, the missing partner-placeholder path, the `data-posthog` attribute. The empty `<h2>` in `testimonials_section` stays guarded by a conditional (renders nothing when `headline` is empty).
17. **Source editables are not used anywhere.** Every page is block-built or a fixed-schema entry.
18. **No sectioning** — 0/3 sizing thresholds tripped.

## Open questions

Non-blocking; each lists the default taken.

1. **Images whose originals are not public (13: banner-split, 3 features, testimonial, 4 team, 4 advisers).** Default: download the largest optimised `/_astro/*.webp` derivative of each from the demo and use it as the source image. If you have access to the original Storyblok space (or the bejamas asset pack), the originals can be swapped in later.
2. **Footer links to `/terms` and `/policies` are 404 on the demo and there is no content for them.** Default: keep both links, made editable in the site data file, and do not invent legal pages. Alternative: add two placeholder long-form pages (`default` schema in `pages`).
3. **Duplicate report `from-chaos-to-more-control`.** Default: recreate it for parity with the demo (4 reports). Say if it should be dropped.
4. **Order of reports on `/report/`.** The demo shows Storyblok's internal order (chaos, more-chaos, hidden-cost, clarity). Default: sort by `published_date`, newest first (hidden-cost, clarity, chaos, more-chaos) — predictable for editors, but differs from the demo.
5. **Package manager.** Default: switch to npm (`package-lock.json`, `npm ci`). Say if you would rather keep bun and install it locally/in the CloudCannon build.
6. **Node version.** No `.nvmrc`; README asks for Node ≥ 22.23.4, CloudCannon's default is Node 22. Default: add `.nvmrc` with `22` and set `build.node_version: "file"` in Phase 2. Confirm if a newer line (24) is preferred.
7. **Production hosting.** The demo is on Netlify; nothing in the repo says where this fork will be hosted. Default: assume CloudCannon hosts (no adapter, no `netlify.toml`); there are no headers, redirects or forms to carry over either way.
8. **Production URL / `site`.** `astro.config.mjs` has no `site`; `llms*.txt` hardcode the demo domain. Default: leave `site` unset until the real domain is known and build `llms*.txt` links as root-relative paths.
9. **`llms.txt` endpoints.** Default: keep, rebuilt from local content. Say if they should be removed instead.
10. **Primary colour editing.** Default: keep it editable via a colour field in the site data file (replacing the Storyblok `colors` datasource). Alternative: hardcode in CSS only.
11. **Missing SEO on `/spain-campaign/` (empty `<title>`) and sparse SEO elsewhere.** Default: recreate as on the demo but add a `<title>` fallback to the page's first headline/site name so no page ships with an empty title.
12. **Empty contact links** (`href=""` on phone/email, empty header CTA link). Default: render `tel:`/`mailto:` from the values and make the header CTA URL an editable field defaulting to `#`.
13. **Trailing slashes.** Internal links are inconsistent today. Default: keep Astro defaults (`directory` format) and write internal links with trailing slashes.
14. **Astro 7 compatibility of `@cloudcannon/editable-regions`.** The skill docs name Astro 5+ as the requirement and do not mention 7. Default: proceed and verify at Phase 4 install; fall back to attribute-only editing if the integration rejects Astro 7.
15. **Spanish gaps for the later Rosey journey.** Footer description, SEO text and names are untranslated on the demo. Default: leave those passages untranslated (English fallback) when Spanish is imported.
