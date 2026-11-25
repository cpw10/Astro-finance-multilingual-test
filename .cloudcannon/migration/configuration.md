# Phase 2 — Configuration

Branch `cloudcannon-migration`. This phase wrote the CloudCannon configuration only. No content files, routes or components were created or changed — the content shape below is the **contract Phase 3 writes content and Zod schemas to match**.

## What was done

- Downloaded both JSON schemas to `.cloudcannon/migration/*.schema.json` (git-ignored).
- Generated the baseline with `npx @cloudcannon/cli configure generate --auto --initial-site-settings --ssg astro`, then replaced it: the CLI's collections (`pages` at the repo root, `locales`, `storyblok`) were all false positives, its `timezone` was the machine's (`Europe/Oslo`), uploads pointed at `public/uploads`, install was `npm i`.
- Validated with `npx @cloudcannon/cli validate` after each round: **15 files valid, exit 0** (see § Validation).

### Files created / changed

| File | Purpose |
| --- | --- |
| `cloudcannon.config.yml` | Collections, data config, file config, shared structures, editables, markdown, paths |
| `.cloudcannon/initial-site-settings.json` | `ssg: astro`; `npm ci`, `npm run build`, `dist`, `node_version: "file"` |
| `.cloudcannon/schemas/page.md`, `.cloudcannon/schemas/report.md` | Schemas for new pages and reports |
| `.cloudcannon/inputs/optimized-image.cloudcannon.inputs.yml` | Shared inputs for `image: { src, alt }` objects (uploads to `src/assets/images`) |
| `.cloudcannon/inputs/background-image.cloudcannon.inputs.yml` | Shared input for string `image` fields used as CSS backgrounds |
| `.cloudcannon/inputs/seo.cloudcannon.inputs.yml` | Shared inputs for the `metatags` object |
| `src/components/blocks/<_type>.cloudcannon.structure-value.yml` × 10 | One structure value per page-builder block |
| `.cloudcannon/README.md` | Editor-facing dashboard README |
| `.nvmrc` | `22` (audit open question 6 default) |
| `.gitignore` | Added `.cloudcannon/migration/*.schema.json` |

Not added, on purpose: `.cloudcannon/prebuild` / `preinstall` / `postbuild` (the docs forbid hook files; the build has no extra steps), `.cloudcannon/routing.json` (no headers or redirects to carry over), `_snippets` (no MDX or inline components), `source` (must not be set), locales.

## Collections

| Collection | Path | URL | Editors | Add | Notes |
| --- | --- | --- | --- | --- | --- |
| `pages` | `src/content/pages` (`*.md`, flat) | `/[slug]/` | visual, data | Page (`default` schema), previews at `/` | Page builder. `disable_add_folder`, `create.path` = `{title\|slugify}.md` |
| `reports` | `src/content/reports` (`*.md`, flat) | `/report/[slug]/` | visual, content, data | Report (`default` schema), previews at `/report/clarity-over-complexity/` | Sorted `published_date` descending. Same `disable_add_folder` / `create.path` |
| `data` | `src/data` (`*.json`) | `disable_url` | data | disabled (add, folders, file actions) | `site.json`, `navigation.json`, `footer.json`, each also in `data_config` |

Sidebar groups: **Content** (pages, reports), **Site settings** (data).

### Planned URL check (Phase 3 re-runs this against `dist/`)

| Planned file | Computed URL | Live route |
| --- | --- | --- |
| `src/content/pages/index.md` | `/` | `/` |
| `src/content/pages/spain-campaign.md` | `/spain-campaign/` | `/spain-campaign/` |
| `src/content/pages/report.md` | `/report/` | `/report/` |
| `src/content/reports/clarity-over-complexity.md` | `/report/clarity-over-complexity/` | same |
| `src/content/reports/the-hidden-cost-of-manual-financial-tracking.md` | `/report/the-hidden-cost-of-manual-financial-tracking/` | same |
| `src/content/reports/from-chaos-to-control.md` | `/report/from-chaos-to-control/` | same |
| `src/content/reports/from-chaos-to-more-control.md` | `/report/from-chaos-to-more-control/` | same |

Requires Astro's default `build.format: 'directory'` (trailing slashes). `pages/report.md` and the `reports` collection do not collide: `report.md` builds `/report/index.html`, reports build `/report/<slug>/index.html`. A page must not be named so that it shadows a report route.

## Content-shape contract for Phase 3

General rules for every file:

- **Every key listed must be present in every file/item**, even when empty (bare YAML key = `null`; JSON `null` or `""`). Do not add keys that are not listed. Follow the key order shown (CloudCannon keeps key order).
- **Zod: every optional field `.nullish()`**, never `.optional()` — CloudCannon writes `null` when an editor clears a field, and the first edit writes every schema key. Components guard on values (`button?.label &&`, `image?.src &&`, `x?.length > 0 &&`), and resolve defaults in the body, never in destructuring.
- **No comments** in content or data files (CloudCannon drops them on save).
- **No `_schema` key** in any file: each collection has one schema under the key `default`.
- **`_uuid`**: every block and every object array item carries a unique UUIDv4 string in `_uuid` (generate with `crypto.randomUUID()`; all unique site-wide). CloudCannon fills it for new items (`instance_value: UUID`). Nothing renders it yet — it is the stable key the later Rosey journey needs. Destructure it out in components so it never reaches the DOM as an attribute.
- **Links are plain URL strings.** Internal links are root-relative with a trailing slash (`/report/`, `/report/clarity-over-complexity/`); `#` where the demo had no target.
- **Quote numeric-looking strings** (`number: "500"`): `stat.number` is a text input.

### Image path conventions

| Kind | Location on disk | Value stored | Used by |
| --- | --- | --- | --- |
| Raster photos rendered through `astro:assets` (`<Image>`, `<picture>`/`getImage()`, CSS backgrounds via `getImage()`) | `src/assets/images/<file>` (subfolders allowed) | Repo-root path with leading slash: `/src/assets/images/hero-test.png` | every `image.src`, and the string `image` of `reports_list` / `banner_cta` |
| Static files served as-is (SVG logos, SVG icons, SEO share images) | `public/images/<file>` (subfolders allowed, e.g. `public/images/partners/`) | Public URL path: `/images/partners/stripe.svg` | `site.logo.src`, `partners[].logo`, `heading.icon`, `metatags.og_image`, `metatags.twitter_image`, images inserted in report body text |

Resolve `/src/assets/images/...` values with `import.meta.glob('/src/assets/images/**/*', { eager: true })`. `og:image` / `twitter:image` need an absolute URL in production; with `site` unset (audit Q8) emit the root-relative path.

Two image shapes exist, chosen by how the template renders the field:

- **Object `{ src, alt }`** — rendered as an `<img>`: `hero.image`, `banner_split.image`, `features[].image`, `testimonials_section.image`, `members[].image`, `advisers[].image`, report `image`, `site.logo`.
- **Plain string path** — no alt is ever rendered: `reports_list.image`, `banner_cta.image` (CSS backgrounds), `partners[].logo` (alt comes from `name`), `heading.icon` (decorative, `alt=""`).

### `pages` — `src/content/pages/<slug>.md`

Files: `index.md` (home), `spain-campaign.md`, `report.md`. Empty markdown body.

```yaml
---
title: Home                 # string, required. Page name (CMS list + new-file slug); <title> fallback when metatags.title is empty
metatags:                   # object, always present
  title:                    # string | null
  description:              # string | null
  og_title:                 # string | null
  og_description:           # string | null
  og_image:                 # string | null  (/images/...)
  twitter_title:            # string | null
  twitter_description:      # string | null
  twitter_image:            # string | null  (/images/...)
content_blocks: []          # array of blocks, discriminated on _type
---
```

(The `#` comments above are documentation for this note only — do not copy them into files.)

### Blocks (`content_blocks[]`)

Discriminator key `_type`; values are the Storyblok component names, unchanged. Structure-value files live in `src/components/blocks/` — **Phase 3 moves the 10 block components from `src/storyblok/` into that folder** (`Hero.astro`, `BannerSplit.astro`, …) so each sits beside its structure file. The dispatcher's component map and (Phase 4) `registerAstroComponent` keys must equal these `_type` values.

Field types: `text` = one-line string, `textarea` = multi-line plain string (templates escape everything; there is no rich text in blocks), `url` = string.

| `_type` | Keys, in order | Types |
| --- | --- | --- |
| `hero` | `_type`, `_uuid`, `image{src,alt}`, `headline`, `lead`, `button`, `partners` | `headline` text; `lead` textarea, optional; `button` = Button object or `null`; `partners` = Partners object or `null` |
| `banner_split` | `_type`, `_uuid`, `heading`, `headline`, `lead`, `image{src,alt}`, `button` | `heading` = Heading object or `null`; `lead` optional; `button` object or `null` |
| `features_section` | `_type`, `_uuid`, `title`, `features[]` | `features[]` item: `_uuid`, `title` text, `image{src,alt}`, `description` textarea |
| `stats_section` | `_type`, `_uuid`, `title`, `lead`, `stats[]` | `stats[]` item: `_uuid`, `number` text (quoted string), `label` text, `primary` boolean |
| `reports_section` | `_type`, `_uuid`, `title`, `reports[]`, `button` | `reports` = array of report ids (file names without extension), e.g. `clarity-over-complexity`; `button` object or `null` |
| `reports_list` | `_type`, `_uuid`, `image`, `title`, `lead` | `image` = string path (`/src/assets/images/...`); lists every report itself, `published_date` descending |
| `testimonials_section` | `_type`, `_uuid`, `image{src,alt}`, `heading`, `testimonials[]`, `headline`, `button` | `testimonials[]` item: `_uuid`, `quote` textarea, `author_name` text, `author_title` text; `headline` optional (empty on the demo → render nothing); `button` `null` on the demo |
| `team_section` | `_type`, `_uuid`, `title`, `members[]` | `members[]` item: `_uuid`, `image{src,alt}`, `name`, `role`, `link` url |
| `advisers_section` | `_type`, `_uuid`, `title`, `advisers[]` | `advisers[]` item: `_uuid`, `image{src,alt}`, `name`, `role`, `description` textarea, `link` url |
| `banner_cta` | `_type`, `_uuid`, `image`, `heading`, `headline`, `button` | `image` = string path (`/src/assets/images/...`) |

Nested single objects (no `_type`, no `_uuid`; the key is always present, the value is the object or `null`):

| Object | Used as | Keys, in order | Notes |
| --- | --- | --- | --- |
| Button | `button` in hero, banner_split, reports_section, testimonials_section, banner_cta | `label` text, `style` (`primary` \| `secondary`), `url` url | Write explicit values (no code fallback): label `Become a Member` and style `primary` where Storyblok left them empty. Hero passes `classes="cta-button"` in the template, not in content |
| Heading | `heading` in banner_split, testimonials_section, banner_cta | `title` text, `icon` string path (`/images/...svg`) or `null`, `style` (`default` \| `glass`) | Explicit values; drop the dead inline-SVG fallback |
| Partners (`partners_section`) | `partners` in hero | `title` text, `partners[]` | `partners[]` item: `_uuid`, `name` text, `logo` string path (`/images/...svg`), `link` url (`#` when none). Note the path `partners.partners` |

Example (home hero):

```yaml
content_blocks:
  - _type: hero
    _uuid: 3f43d721-9c23-4a2e-8a57-0d6f3c1b2a10
    image:
      src: /src/assets/images/hero-test.png
      alt:
    headline: …
    lead: …
    button:
      label: Become a Member
      style: primary
      url: "#"
    partners:
      title: …
      partners:
        - _uuid: 7b1e…
          name: Stripe
          logo: /images/partners/stripe.svg
          link: "#"
```

Spain-campaign hero: `partners:` (null).

### `reports` — `src/content/reports/<slug>.md`

Markdown body = the report text (`p`, `h2`, `a`, `em`). Entry id = file name = URL slug.

```yaml
---
title: …                    # string, required
author: …                   # string
published_date: 2025-05-08T18:20:00Z   # ISO 8601 datetime, UTC, unquoted; required. z.coerce.date()
image:
  src: /src/assets/images/report1.png
  alt:
metatags:                   # same 8 keys as pages
  title:
  description:
  og_title:
  og_description:
  og_image:
  twitter_title:
  twitter_description:
  twitter_image:
---
```

The template formats `published_date` as `YYYY-MM-DD HH:mm` **in UTC** to reproduce the demo output (config `timezone: Etc/UTC`).

### Data files — `src/data/*.json`

Imported directly by components; bound in Phase 4 as `@data[site]`, `@data[navigation]`, `@data[footer]`.

`src/data/site.json`

```json
{
  "logo": { "src": "/images/global-finance-starter.svg", "alt": "" },
  "primary_color": "#193EAF",
  "report": {
    "label": "Report",
    "author_label": "Author",
    "back_label": "Return to all reports"
  }
}
```

`src/data/navigation.json`

```json
{
  "items": [{ "_uuid": "<uuid>", "label": "…", "url": "/…/" }],
  "cta": { "label": "Become a Member", "url": "#" }
}
```

`src/data/footer.json`

```json
{
  "company_heading": "Company Details",
  "company_description": "…",
  "phone": "…",
  "email": "…",
  "copyright": "All Rights Reserved",
  "legal_links": [
    { "_uuid": "<uuid>", "label": "Terms & Conditions", "url": "/terms/" },
    { "_uuid": "<uuid>", "label": "Privacy Policy", "url": "/policies/" }
  ]
}
```

- `navigation.items` feeds the header, the mobile menu and the footer nav (as today). Values come from the demo header.
- `navigation.cta` replaces `translate.becomeMember` and the empty header link.
- `footer.legal_links` replaces the two hardcoded links; the template renders the `•` separator between items. `footer.phone` / `footer.email` render as `tel:` / `mailto:` links (audit Q12).
- `site.primary_color` → `<body style="--primary: …">`; `site.report.*` replace `translate.report`, `translate.author`, `translate.returnReports`. The back button's href is the fixed `/report/`.
- `src/locales/` is deleted in Phase 3 (the unused `readMore` string is dropped).

### What Phase 3 must also do because of this config

1. Create `package-lock.json` (and delete `bun.lock`) and set `packageManager` in `package.json` to the local npm version — `install_command` is `npm ci`, which fails without a lockfile.
2. Keep `build.format` at the Astro default, and keep `src/content/pages` / `src/content/reports` flat (the globs are `*.md`).
3. Content config: `pages` and `reports` with `glob({ pattern: '*.md', base: … })`; `content_blocks` as `z.discriminatedUnion('_type', […])`.
4. Sort reports by `published_date` descending wherever they are listed.
5. Keep the report `/report/clarity-over-complexity/` — it is the preview target for new reports.
6. Re-run the URL check and the "`_inputs` key names a real field" diff on the real files; re-run `npx @cloudcannon/cli validate`.

## Checklist status

Shared + Astro verification checklists, as far as they can be checked before content exists:

- [x] Structures: four rules — every array/object input linked by full `_structures.<name>` path (plain `{src, alt}` image objects and settings objects are fixed shapes with `type: object` + preview icon, no structure); every structure value has `preview` + `picker_preview`; nested objects have preview icons. Field completeness is a Phase 3 obligation (contract above)
- [x] `npx @cloudcannon/cli validate` passes
- [x] Build settings nested under `build`; `ssg: astro`; `node_version: "file"` with `.nvmrc`
- [x] `.cloudcannon/README.md` written
- [x] Every audit collection in `collections_config`; no defunct keys; no single-file collection; groups set; every collection has `url` or `disable_url`
- [x] Planned URLs checked for all 7 planned files (table above)
- [x] Explicit inputs for every field; every select has inline values (`button.style`, `heading.style`); `reports` multiselect uses `values: collections.reports` + `value_key: filename_without_ext`
- [x] `heading.icon` is an uploaded SVG rendered with `<img>`, so it is an `image` input, not a named-icon select
- [x] `_type`, `_schema`, `_uuid` hidden; `file_config` in array form; no YAML anchors; no `type: markdown` inputs (the only rich text is the report body, toolbar in `_editables.content`)
- [x] Global uploads → `public/images`; optimized inputs override to `/src/assets/images` with `static: ""`
- [x] `_enabled_editors` order; data collection is `[data]`
- [x] `add_options` per collection; `new_preview_url` on both creatable schemas
- [x] MDX gate: no MDX
- [ ] Deferred to Phase 3 (needs files/build): build command produces complete output; computed URL = built path for real files; schema keys = file keys; switch/enum fields keep their conditional render (`stat.primary`, `button.style`, `heading.style` already have one); template fallbacks removed in favour of content values

## Decisions and why

1. **Block array key `content_blocks`, discriminator `_type`** — the skill convention; `_type` is CloudCannon's default `id_key`, so no `id_key` config. `_type` values keep the Storyblok component names so the audit's inventory maps 1:1.
2. **Nested single blocks are objects, not arrays-of-one, and are nullable** (`button`, `heading`, hero `partners`). Each object input is linked to a named structure (`_structures.button`, `.heading`, `.partners_section`) so editors can remove it (writes `null`) and add it back with defaults. Follows audit decision 4; one consistent rule across all blocks.
3. **Split co-located structures** (`src/components/blocks/*.cloudcannon.structure-value.yml`, loaded by `values_from_glob`) because there are 10 block types (docs: 5+ → split). Shared item structures and the three object structures stay in `cloudcannon.config.yml`. This fixes the block components' folder as `src/components/blocks/`.
4. **`image` is `{ src, alt }` where an `<img>` is rendered, a plain string where it is only a CSS background or the alt comes from elsewhere.** `src`/`alt` rather than Storyblok's `filename`/`alt`: every image line is rewritten in Phase 3 anyway (image-service suffixes), and `alt` on a background would be an input that does nothing.
5. **Image locations per audit decision 11**: raster → `src/assets/images` (repo-relative value, per-input `paths` override with `static: ""`); SVG and SEO images → `public/images` (global `paths.uploads`). SEO images are static because meta tags need a stable URL, not a hashed `_astro` asset.
6. **Three data files, one `data` collection** (`site.json`, `navigation.json`, `footer.json`) rather than one settings file: matches the shared-UI table (`navigation` with `items[]`, `footer`), keeps each form short, and `file_config` gives each its own inputs and icon. JSON because Astro imports it with no extra setup.
7. **Legal links are an array** so editors can remove or repoint the two links that 404 on the demo (audit Q2) without a developer.
8. **Page-level `title` added to `pages`** (not in Storyblok's `page` fields; it replaces the story name). Needed for the CMS list, for `create.path` (`{title|slugify}`), and as the `<title>` fallback for audit Q11 (refines that default: page name instead of first headline).
9. **One schema per collection, keyed `default`, no `_schema` in files.** No markdown-body page schema: the layout has no generic prose page and the user chose not to invent legal pages.
10. **`_uuid` added now** to every block and object array item (hidden, `instance_value: UUID`), as the multilingual docs prescribe for Rosey namespaces. Cheap now; avoids a seeding pass over content later.
11. **`cascade: false` on every `title` input inside a structure, and on the inner `partners.partners` array**, so the page-level `title` (label "Page name", required) and the hero's `partners` object config do not merge into them. `metatags.title` sets `required: false` explicitly for the same reason.
12. **`timezone: Etc/UTC`**, dates stored as UTC ISO datetimes. The demo shows naive `YYYY-MM-DD HH:mm` strings with no zone; UTC reproduces them exactly.
13. **`new_preview_url`**: pages → `/` (same layout as the home page); reports → `/report/clarity-over-complexity/` (reports use their own layout; documented in the editor README).
14. **Flat collections** (`*.md`, `disable_add_folder`, slug-from-title `create.path`): both routes are single-segment; a file in a subfolder would not match the URL template.
15. **Markdown**: CommonMark with GFM, tables and strikethrough on (Astro's renderer reads both). Report toolbar: paragraph/h2–h4, bold, italic, strike, link, lists, blockquote, image. No table button.
16. **Build**: `npm ci` / `npm run build` / `dist` / Node from `.nvmrc` (`22`). No hook files.
17. **Input types from how templates render**: every block string is escaped → `text`/`textarea`; no `html`/`markdown` inputs in blocks.

## Open questions

Non-blocking; each lists the default taken.

1. **Timezone.** The site states none. Default: `Etc/UTC`, so stored dates equal the demo's displayed times. Say if editors should enter dates in a local zone (e.g. `Europe/Warsaw`); the report template would then format in that zone.
2. **Site settings layout.** Default: three files (Site, Navigation, Footer). Alternative: one combined settings file.
3. **Legal links as an editable list.** Default: yes, seeded with the demo's two links (`/terms/`, `/policies/`, both still 404 — audit Q2). Alternative: two fixed fields.
4. **Report-body images.** Default: allowed in the toolbar, uploaded un-optimised to `public/images`. Alternative: remove the image button so reports stay text-only as on the demo.
5. **Preview target for new reports** is `/report/clarity-over-complexity/`. Default: keep that report; if it is ever removed, change `new_preview_url` to another report.
6. **`_uuid` on every block and list item now.** Default: yes, ahead of the Rosey journey. It adds a hidden key to content; say if it should wait.
7. **Editors can create pages and reports.** Default: yes for both (slug from the title). Pages named like an existing report route segment are not guarded against.
8. **`.nvmrc` = `22`.** Default per audit Q6; README asks for a specific 22.x minimum — raise to `24` if preferred.
