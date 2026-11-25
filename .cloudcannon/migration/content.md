# Phase 3 — Content

Branch `cloudcannon-migration`. This phase recreated the site's content as local files from the public live demo, downloaded every content image, rewrote the templates onto local data and removed Storyblok. Nothing was committed.

No editable regions, `data-editable` attributes or `@cloudcannon/editable-regions` were added — that is Phase 4.

## Result

| Check | Result |
| --- | --- |
| `npm install` | ok, `package-lock.json` created (`npm ci --dry-run` passes) |
| `npm run build` with an empty environment (`env -i`, no `STORYBLOK_*`) | exit 0, **7 pages** + `llms.txt` + `llms-full.txt` |
| `npx @cloudcannon/cli validate` | exit 0, 15 files valid |
| Computed URL = built path, all 7 files | ok (table in `configuration.md` re-checked against `dist/`) |
| Field completeness, every block / list item / nested object against its structure value (keys and key order) | 58 checked, 0 problems |
| `_uuid` | 45, all unique UUIDv4 |
| Every `file_config` `_inputs` key names a real field in its data file | ok |
| Storyblok references left in `src/`, `public/`, config, `dist/` | none (only the package `name` in `package.json`) |
| Contract changes | **none** — `cloudcannon.config.yml`, schemas and structure files are untouched |

## What was done

### Content files

| File | Source |
| --- | --- |
| `src/content/pages/index.md` | demo `/` — 9 blocks |
| `src/content/pages/spain-campaign.md` | demo `/spain-campaign/` — 3 blocks |
| `src/content/pages/report.md` | demo `/report/` — 2 blocks |
| `src/content/reports/clarity-over-complexity.md` | demo report page |
| `src/content/reports/from-chaos-to-control.md` | demo report page |
| `src/content/reports/from-chaos-to-more-control.md` | demo report page (duplicate of the previous one, as on the demo) |
| `src/content/reports/the-hidden-cost-of-manual-financial-tracking.md` | demo report page |
| `src/data/site.json`, `navigation.json`, `footer.json` | demo header/footer + the old `src/locales/en.json` strings |
| `src/content.config.ts` | Zod schemas for `pages` and `reports`; every optional field `.nullish()`; `content_blocks` is a `z.discriminatedUnion('_type', …)` |

- Text is verbatim from the demo, including its quirks (`Flow Compilance`, the double space in the first adviser description, the two "Sofia Lin" team members).
- Page names (`title`) are the Storyblok story names the demo's `llms.txt` exposes: `Home`, `Spain Campaign`, `Reports`.
- Report bodies were converted from the rendered rich text by script (`p`, `h2`, `a`, `em` only). The italic Bejamas note is one emphasised paragraph with plain links inside: `*Hey, we at [Bejamas](…) created … [our other works](…). ;)*`.
- `published_date` is stored as a UTC ISO datetime and rendered as `YYYY-MM-DD HH:mm` in UTC, which reproduces the demo.
- Explicit values replaced every code fallback: button `label`/`style`, heading `title`/`style`, partner `link: "#"`. Styles were read from the demo's markup (hero and split-banner buttons `primary`; "See all reports" and every CTA-banner button `secondary`; CTA-banner headings `glass`, the other two `default`; first stat of each stats block `primary: true`).

### Images (31 files, no remote URLs left)

| Location | Files | Source |
| --- | --- | --- |
| `src/assets/images/` | `hero-test.png`, `hero.png`, `cta-banner.png`, `report-hero.png`, `report1.png`, `report2.png`, `report3.png`, `alexander-awerin-i8ijlvjezxw-unsplash.jpg` | originals from `a.storyblok.com` |
| `src/assets/images/features/flow-compliance.png` | copy of the original `feature1.png` (confirmed by eye to be the first feature image) | original |
| `src/assets/images/banner-split.webp`, `testimonial.webp`, `features/finance-analysis.webp`, `features/real-time-tracking.webp`, `team/*.webp` (4), `advisers/*.webp` (4) | 12 files | largest `/_astro/*.webp` derivative on the demo (originals are not public) |
| `public/images/global-finance-starter.svg`, `partners/*.svg` (5), `icons/*.svg` (3), `feature1.png` | logo, partner logos, heading icons, share image | originals |

Partner logos were renamed to the partner (`logos_hubspot.svg` → `hubspot.svg`, `logos_github.svg` → `github.svg`, `vector.svg` → `microsoft.svg`).

Derivative sizes: banner 906×1086, features 700×486, testimonial 858×1048, team 1078×630–789, **advisers 64×64** (see open question 2).

### Code

| Change | Detail |
| --- | --- |
| Block components | The 10 blocks moved from `src/storyblok/` to `src/components/blocks/` (same file names), beside their structure files. Each now takes its fields as **spread props** (`const { image, headline, lead, button, partners } = Astro.props`) instead of one `block` prop, and no longer takes `editable`, `language` or `translate`. |
| Dispatcher | `src/components/BlockRenderer.astro` (thin, no markup) + `src/cloudcannon/componentMap.ts`, keyed on `_type`. |
| Routes | `src/pages/[...slug].astro` renders every `pages` entry (`index` → `/`); new `src/pages/report/[slug].astro` renders every `reports` entry. |
| Report template | `src/storyblok/Report.astro` became `src/components/ReportHero.astro` (title, author, date, background image, labels from `site.json`). The `<article>` wrapper and the prose `<div>` around `<Content />` live in the route. |
| Nested blocks | `src/storyblok/Button.astro` and `Heading.astro` (fallback wrappers) are gone; parents call `src/components/Button.astro` / `Heading.astro` directly. `PartnersSection.astro` moved to `src/components/`. |
| `ReportCard.astro` | Props are now `title`, `image`, `href`. |
| Images | `src/lib/images.ts`: `resolveImage()` (stored path → `ImageMetadata` via `import.meta.glob`) for `<Image>`, and `imageUrl()` (`getImage()`) for the hero `<picture>` crops and the three CSS backgrounds. All Storyblok image-service suffixes are gone. |
| Reports helpers | `src/lib/reports.ts`: `getReports()` (newest first, ties by file name), `reportHref()`, `formatReportDate()`. |
| Layout / Header / Footer | Read `site.json`, `navigation.json`, `footer.json` directly; no props except Layout's `title` and `metatags`. `<html lang="en">`. |
| `llms.txt`, `llms-full.txt` | Rewritten on the local collections (`src/lib/llms.ts`, `src/pages/llms*.txt.ts`). Links are root-relative until `site` is set. |
| `astro.config.mjs` | `output: 'static'`, Tailwind only. |
| `package.json` | Removed `@storyblok/astro`, `@storyblok/api-client`, `@storyblok/richtext`, `axios`, `@astrojs/netlify`, `@netlify/dev`, `@netlify/vite-plugin`, `vite-plugin-mkcert`. Added `"packageManager": "npm@11.8.0"`. `bun.lock` deleted, `package-lock.json` created. |
| Deleted | `src/storyblok/` (rest), `src/utils/` (all 8 files), `src/middleware.js`, `src/locales/`, `src/components/LanguageSwitcher.astro`, `.env.example`, `src/pages/llms*.txt.js`. |
| README | Setup, stack and feature sections rewritten for the local-content/npm setup; Storyblok-hosted screenshots and the clone button removed. |
| `src/styles/global.css` | One comment updated (the `--primary` override now comes from `site.json`). |

### For Phase 4

- Blocks receive exactly the keys of their structure value as props; `_uuid` is never spread to the DOM. `componentMap.ts` is ready for `registerAstroComponent(_type, Component)`.
- `<main>` in `[...slug].astro` is the natural `content_blocks` array container; blocks are its direct children (the `has-[>*:nth-child(3)]:space-y-*` spacing depends on that — keep any array-item wrapper layout-neutral or move the classes).
- `ReportHero` is a self-contained component (computed date and background) so it can be registered; the prose `<div>` in `report/[slug].astro` is the `@content` region.
- `reports_section` and `reports_list` call `getEntry` / `getCollection` inside the component (audit decision 6). These need attention if they are to re-render client-side.
- Header, Footer and ReportHero import the data files themselves (`@data[site]`, `@data[navigation]`, `@data[footer]`).
- Components resolve defaults in the body (`variants[variant] || variants.primary`, `button.url || '#'`), not in destructuring, and guard nullable objects (`button?.label &&`, `heading?.title &&`, `partners &&`).

## Parity

Baseline: the scraped English demo pages. Compared for all 7 routes with a throwaway script: `<title>`, meta tags, visible text (with its nearest block tag), link `href`s, images (name stem, `alt`, `width`/`height`, `loading`), CSS backgrounds, and the tag + class skeleton of `<body>`.

| Field | Result |
| --- | --- |
| Visible text | identical on 6 routes; `/report/` differs only in card order (intended) |
| Images | identical on all 7 routes (same count, order, alt, dimensions) |
| CSS backgrounds | same image on each section |
| `<title>`, description | identical except the `/spain-campaign/` fallback (intended) |
| Tag + class skeleton | identical apart from the items below |

### Intended differences

1. Language switcher removed from the header (and with it the `/` and `/es/` links).
2. `/report/` lists reports newest first: hidden-cost, clarity, chaos, more-chaos (demo: chaos, more-chaos, hidden-cost, clarity).
3. `/spain-campaign/` has `<title>Spain Campaign</title>` (demo: empty).
4. Footer phone and email link to `tel:+1222333444` and `mailto:contact@company.com` (demo: `href=""`).
5. Header "Become a Member" button links to `#` (demo: no `href`).
6. Internal links have trailing slashes (`/report/<slug>/`, `/report/`, `/terms/`, `/policies/`).
7. The empty `<h2>` and its wrapper below the testimonial card are no longer rendered.
8. Report body: the italic note is `<em>` around the links instead of separate `<em>` runs inside and around them. Same text, same links.
9. `og:image` / `twitter:image` on the home page are the local `/images/feature1.png`.
10. Head clean-up, invisible: meta tags with no value are omitted instead of rendered empty, `og:site_name` (hardcoded empty) is dropped, `data-posthog` and `<storyblok-preview>` are gone.
11. Image files: local, re-optimised by Astro; `srcset` candidates stop at each source image's real width.

### Differences not caused by the migration

- Mobile menu links carry an extra `leading-6` class and feature card titles an extra `leading-normal` class compared with the demo. Both come from `src/components/ui/` (`HamburgerMenuItem.astro`, `CardTitle.astro`), which this phase did not touch: the repository's UI kit is newer than the deployed demo.

### Unintended differences remaining

None found.

## Decisions and why

1. **Blocks take spread props, not a `block` object.** The dispatcher is `<Component {...props} />` as the page-building doc prescribes, and Phase 4's registered components receive the block's fields the same way.
2. **Report page split into route + `ReportHero`.** The hero has two computed values (date format, background URL), so it needs to be a component; the body must stay a plain element so it can become the `@content` region.
3. **One image helper (`src/lib/images.ts`) instead of a glob per component.** Ten components resolve images; one glob keeps the extension list and the fallback (unknown path → used as-is) in one place.
4. **Hero crops via `getImage()` with `fit: 'cover'`** at 640/1024/1440 × 685, replacing Storyblok's three image-service crops. Crop position is centre.
5. **CSS backgrounds via `getImage()`**: CTA banner at 1440 wide, quality 90; reports header at 2560 wide; report hero at the source size — the same sizes the Storyblok URLs asked for. Widths are capped at the source width.
6. **`reports_section.reports` uses plain string ids with `getEntry`, not `reference()`.** A deleted report is skipped instead of failing the build.
7. **Report order ties** (the two "chaos" reports share a date) break by file name, so the order is stable.
8. **Feature 1 uses the original PNG**, features 2 and 3 the demo derivatives. The home page's share image is the same picture, and its original is public.
9. **`ui/dropdown-menu/` and `@data-slot/dropdown-menu` were kept** although nothing uses them now. They are generic UI-kit files, the audit lists them for the later multilingual journey, and decision 12 names only `LanguageSwitcher`.
10. **`@lucide/astro`, `postcss-import`, `bejamas` left in `package.json`.** Not in the removal inventory; removing unused dependencies is not this phase's job.
11. **Empty meta tags are omitted.** An empty `<meta name="description">` helps nobody; nothing visible changes.
12. **`og:image` is emitted as stored** (root-relative) and becomes absolute automatically once `site` is set in `astro.config.mjs`.
13. **`tel:` href keeps digits and `+` only**, so any display formatting of the phone number still dials.
14. **`llms.txt` lists the reports index under "Main Pages"** (the demo listed it under "Report" because it was the Storyblok folder's start page) and uses each report's title as its link text.
15. **README rewritten in place** — it is in the audit's removal inventory; no new documentation files were added.
16. **No in-repo parity baseline folder.** The site could not be built before this phase, so the scraped demo is the only baseline; nothing was added to `.gitignore`.

## Open questions

Non-blocking; each lists the default taken.

1. **Twelve images are demo derivatives, not originals** (split banner, 2 features, testimonial, 4 team, 4 advisers). Default: keep them. Swap in originals if you have the Storyblok space or the asset pack — same file names, any format.
2. **Adviser avatars are only 64×64** (the largest size the demo serves), so they look soft on high-density screens. Default: keep. Replace with larger photos when available.
3. **Hero crop position is centre.** Storyblok may have used a focal point. Default: centre for both heroes; say if a hero should anchor to the top.
4. **`.nvmrc` is `22`, and Astro 7.4.8 needs Node ≥ 22.23.4.** Default: leave `22` (CloudCannon resolves the latest 22.x). Pin `22.23.4` or move to `24` if a build ever picks an older 22.
5. **Unused dependencies and UI files left in place** (`@lucide/astro`, `postcss-import`, `ui/dropdown-menu`, `@data-slot/dropdown-menu`). Default: keep; remove later if the multilingual journey does not reuse the dropdown.
6. **`package.json` `name` is still `astro-storyblok-finance-starter`.** Default: unchanged (renaming a package is the owner's call).
7. **README.** Default: rewritten for the new setup, original demo links and screenshots removed. Say if any should come back.
8. **`llms.txt` link text** is the report title rather than the old Storyblok story name. Default: keep.
9. **UI-kit drift from the demo** (`leading-6`, `leading-normal`, see Parity). Default: leave the repository's newer UI kit as it is.

## Not verified

- No browser check: parity is on built HTML, not on rendered pixels (hero crops, backgrounds and spacing were not viewed in a page; one hero crop file was inspected directly).
- `astro dev` was not run; only `astro build`.
- `npm ci` was checked with `--dry-run` only.
- Nothing was tested inside CloudCannon.
