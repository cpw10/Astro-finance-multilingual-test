# Phase 4 — Visual editing

Branch `cloudcannon-migration`. This phase installed `@cloudcannon/editable-regions`, registered every component that renders inside an editable section, and added editable regions to the page builder, the report pages and the shared header and footer. Nothing was committed.

## Result

| Check | Result |
| --- | --- |
| `@cloudcannon/editable-regions` | `0.0.22` (latest), in `dependencies`. No peer dependency on Astro; the package itself is developed against Astro 7.3.8 |
| Astro 7.4.8 compatibility | **Works.** Integration loads, `npm run build` exits 0, the client bundle `dist/_astro/registerComponents.*.js` (208 kB) is emitted, and all 19 registered components render in a real browser (see § Verification) |
| `npm run build` | exit 0, 7 pages |
| `npx @cloudcannon/cli validate` | exit 0 |
| Rendered output vs the Phase 3 build | Title, visible text, links, images and backgrounds identical on all 7 pages. Only intended markup was added (see § Verification) |
| Audit census rows needing a region | 5 of 5 wired. Individual fields left to the sidebar are listed with their reason in § Fields not edited in place |

## Census: audit rows → wiring

| Audit census row | Needs region? | Wired as |
| --- | --- | --- |
| `/` → `src/content/pages/index.md` | Yes | Block array + all 9 blocks (table below) |
| `/spain-campaign/` → `pages/spain-campaign.md` | Yes | Block array + `hero`, `stats_section`, `banner_cta` |
| `/report/` → `pages/report.md` | Yes | Block array + `reports_list`, `banner_cta`. Report cards are edited in place through `@file[...]` and save to the report itself |
| `/report/<slug>/` ×4 → `src/content/reports/<slug>.md` | Yes | `report_hero` component (title, author, date, image) + `@content` body |
| Header + footer → `src/data/{navigation,footer,site}.json` | Yes | `header` and `footer` components bound to `@data[navigation]` and `@data[footer]`; logo and report labels bound to `@data[site]` |
| `/llms.txt`, `/llms-full.txt` | No | Not wired — generated text with no editor value (audit decision 15) |

### Section census

All paths inside a block are relative to the block (`content_blocks.N`). Paths inside a list item are relative to the item.

| Page | Section | Treatment | Binding |
| --- | --- | --- | --- |
| pages | Block array | array + component per item | `<main data-editable="array" data-prop="content_blocks" data-component-key="_type">`; each block inside `<div data-editable="array-item" data-component={_type}>` (`src/pages/[...slug].astro`) |
| pages | `hero` | component + text + image + sub-array | text `headline`, `lead`, `button.label`, `partners.title`; image `image` on the `<img>` in the `<picture>`; array `partners.partners` → `partner_item` (image `logo`, alt `name`) |
| pages | `banner_split` | component + text + image | text `heading.title`, `headline`, `lead`, `button.label`; image `heading.icon`, `image` |
| pages | `features_section` | component + text + sub-array | text `title`; array `features` → `feature_item` (text `title`, `description`; image `image`) |
| pages | `stats_section` | component + text + sub-array | text `title`, `lead`; array `stats` → `stat_item` (text `number`, `label`; `primary` re-renders the card) |
| pages | `reports_section` | component + text + select → component | text `title`, `button.label`; the `reports` multiselect is resolved with `getEntry` inside the block, so changing it re-renders the cards; card title and image `@file[/src/content/reports/<id>.md].title` / `.image` |
| pages | `reports_list` | component + text | text `title`, `lead`; all reports listed with `getCollection` inside the block; card title and image through `@file[...]` |
| pages | `testimonials_section` | component + text + image + sub-array | image `image`, `heading.icon`; text `heading.title`, `headline`, `button.label`; array `testimonials` → `testimonial_item` (text `quote`, `author_name`, `author_title`) |
| pages | `team_section` | component + text + sub-array | text `title`; array `members` → `team_member_item` (image `image`; text `name`, `role`) |
| pages | `advisers_section` | component + text + sub-array | text `title`; array `advisers` → `adviser_item` (image `image`; text `name`, `role`, `description`) |
| pages | `banner_cta` | component + text + image | text `heading.title`, `headline`, `button.label`; image `heading.icon` |
| reports | Hero | component + text + data-file text | `<editable-component data-component="report_hero" data-prop-title="title" data-prop-author="author" data-prop-published_date="published_date" data-prop-image="image">`; text `title`, `author`; labels `@data[site].report.label`, `.author_label`, `.back_label` |
| reports | Body | text | `data-editable="text" data-prop="@content"` on the existing prose `<div>` |
| every page | Header | data-file + component + array | `<editable-component data-component="header" data-prop="@data[navigation]">`; array `items` (text `label`), text `cta.label`, image `@data[site].logo` |
| every page | Footer | data-file + component + arrays | `<editable-component data-component="footer" data-prop="@data[footer]">`; text `company_heading`, `company_description`, `phone`, `email`, `copyright`; array `legal_links` (text `label`); array `@data[navigation].items` (text `label`, with a `<template>` blueprint); image `@data[site].logo` |

### Fields not edited in place

Each of these is edited in the sidebar. "Live" means the page updates while editing because a registered component re-renders.

| Field | Why not in place | Live? |
| --- | --- | --- |
| Background images: `banner_cta.image`, `reports_list.image`, report `image` | CSS `background-image` — there is no `<img>` to put an image region on | Yes |
| Every link URL (`button.url`, `partners[].link`, `members[].link`, `advisers[].link`, nav and legal `url`, `cta.url`) | Not visible text; URL inputs belong in the sidebar | Yes |
| `button.style`, `heading.style`, `stats[].primary` | Select and switch inputs | Yes |
| `reports_section.reports` | A multiselect over the `reports` collection; the list is not an array region because its items are references, not content | Yes |
| Report `published_date` | Dates must not be text regions; datetime picker | Yes |
| Mobile menu links and button (second copy of `navigation.items` and `cta`) | Duplicate of the desktop navigation, hidden off-canvas until the menu opens, and the menu closes on any link click. Editable through the desktop navigation, the footer navigation, or the header's edit button | Yes |
| `site.primary_color` | Theme setting on `<body style>`, outside any component | No — the input comment says the preview updates after saving |
| `metatags.*`, page `title` (page name) | SEO metadata, not visible on the page | No (head only) |
| Image `alt` text | Edited in the image region's panel, together with the file | Yes |

### Shared-UI table walk-through

| Row | Status |
| --- | --- |
| Header / navigation | `src/data/navigation.json`, in `data_config` + `file_config`; `Header.astro` takes the file's keys as props; `header` component region |
| Footer link columns | The footer has no link columns. Its navigation list reuses `navigation.items` (array region), its legal links are `footer.legal_links` (array region) |
| Footer tip / credits | `footer.copyright`, `company_heading`, `company_description`, `phone`, `email` — text regions |
| CTA rendered by a layout or on several pages | Does not apply: the CTA banner is a `banner_cta` block with its own content on each page |
| CTA section of one page | `banner_cta` block |
| Share block | Does not apply: the site has none |
| Author card | Does not apply: a report's author is a plain text field with no author data file |
| Cookie banner / announcement bar | Does not apply: the site has none |

## Registered components

Registered in `src/cloudcannon/registerComponents.ts`, which `Layout.astro` imports only when `window.inEditorMode` is set.

| Key | Component | Used as |
| --- | --- | --- |
| `hero`, `banner_split`, `features_section`, `stats_section`, `reports_section`, `reports_list`, `testimonials_section`, `team_section`, `advisers_section`, `banner_cta` | `src/components/blocks/*.astro`, through `componentMap.ts` | Page-builder blocks; key = `_type` |
| `partner_item`, `feature_item`, `stat_item`, `testimonial_item`, `team_member_item`, `adviser_item` | `src/components/items/*.astro` (new) | One item of a list inside a block |
| `header` | `src/components/Header.astro` | `@data[navigation]` |
| `footer` | `src/components/Footer.astro` | `@data[footer]` |
| `report_hero` | `src/components/ReportHero.astro` | Report page hero |

Components rendered inside these (`Button`, `Heading`, `PartnersSection`, `ReportCard`, `ArrowLink`, `ui/*`) are bundled with them. None reads an `Astro.*` global other than `props` and `slots`, and none imports an `.svg` as a component.

## Files changed

| File | Change |
| --- | --- |
| `package.json`, `package-lock.json` | Added `@cloudcannon/editable-regions` |
| `astro.config.mjs` | `integrations: [editableRegions()]` |
| `src/cloudcannon/registerComponents.ts` | New. Registers the 19 components; removes `srcset`/`sizes` from image-region `<img>`s in the editor |
| `src/layouts/Layout.astro` | Wraps header and footer in `<editable-component>`, passes the data files as props, adds the gated `registerComponents` import |
| `src/pages/[...slug].astro` | Block array region and one `array-item` wrapper per block |
| `src/pages/report/[slug].astro` | `report_hero` component region; `@content` on the prose wrapper |
| `src/components/blocks/*.astro` (10) | Text and image regions; list sections delegate each item to an item component |
| `src/components/items/*.astro` (6) | New item components, markup moved unchanged from the blocks |
| `src/components/Button.astro`, `Heading.astro`, `PartnersSection.astro`, `ReportCard.astro`, `ReportHero.astro`, `Header.astro`, `Footer.astro` | Regions; `Header` and `Footer` take their data file's keys as props |
| `src/lib/images.ts`, `src/lib/reports.ts` | Made safe for the editor's re-render (see Decisions 8 and 9) |
| `src/styles/global.css` | One editor-only rule (`.cms-editor-active`) so an emptied list keeps room for its "Add item" button |
| `cloudcannon.config.yml` | One input comment extended (`primary_color`). No other configuration was needed: `pages` and `reports` already have `visual` in `_enabled_editors`, and every bound field already has an input |

## Checklists

- Infrastructure: package in `dependencies`; integration inside the `integrations` array; `registerComponents.ts` exists; base layout imports it under `inEditorMode`; no framework renderers needed (no React/Vue/Svelte); no `astro-icon`; `Astro.*` and `.svg` greps clean; build passes.
- Universal: editor enablement, census coverage, array containers and items, nested text and image regions in every item, relative paths inside items, array container purity (the legal-link separator moved inside its item; the footer blueprint is a `<template>`), image regions, shared partials on data files, data-file completeness, cross-collection select inside a registered component, `_inputs` and schema-seed audits, `@content`, conditional guards (`image?.src &&`, `button?.label?.trim() &&`, `heading?.title &&`, `partners &&`), inline text only (every bound input is `text` or `textarea`, so no `data-type`), prop contract (spread props), cross-collection guard (`ReportCard` only carries regions when given `file`), blueprints.
- Page builder: `data-component-key="_type"`, `array-item` + `data-component` on every block, nested regions in every block, sub-arrays wired, component keys equal `_type`, all 10 block types registered, attributes present in `dist/`.
- Astro: `componentMap.ts` shared by `BlockRenderer.astro` and `registerComponents.ts`; registered components take spread props; `@content` wraps `<Content />`; no editable slot content.
- Source editables: none (audit decision 17).
- Pre-handoff sweep: census walked against the repo; shared-UI table walked (above); build grep done (below).

## Verification

Throwaway scripts are in the session scratchpad `tools/` folder, not in the repo.

1. **Build and validate.** `npm run build` exit 0 (7 pages); `npx @cloudcannon/cli validate` exit 0.
2. **Attributes in `dist/`** (`phase4_attrs.py`). Home page: 155 region elements — 10 arrays, 40 array items, 2 component wrappers, 27 images, 76 texts (one of them inside the footer blueprint). Spain campaign 61, reports index 51, report page 41 (including `report_hero` and `@content`). Every page links the loader script `Layout.astro_astro_type_script_*.js`, which imports `registerComponents.*.js` only inside the editor.
3. **Output unchanged** (`phase4_compare.py`, Phase 3 build vs this build, all 7 pages). Title, visible text, links, images (src, srcset, alt, size) and CSS backgrounds are identical. Differences, all intended: 9 + 3 + 2 block wrapper `<div>`s, the `<span>` text hosts, `<editable-component>` wrappers, the legal-link item `<span>`, one new `<script>` per page, and a new CSS file hash (the editor-only rule). The hamburger menu's random id differs on every build.
4. **Browser smoke test** (`smoke/test.mjs`, headless Chrome). Each of four built pages was loaded with `window.inEditorMode` set, a mock of CloudCannon's Visual Editor API fed from the real content and data files, and the package's own region runtime. Result on every page, with dates passed both as strings and as `Date` objects:
   - all 19 components register;
   - every region mounts (154 / 60 / 50 / 40) with **no error cards**;
   - every text region receives the value its element already shows (75 / 32 / 25 / 22 editors, 0 mismatches), which confirms each `data-prop` path;
   - every block, item, header, footer and report hero re-renders in the browser, and the re-rendered DOM is identical to the built DOM (tags, classes, links, sizes, inline styles) with the same visible text;
   - every re-rendered image and background URL exists in `dist/`.

## Decisions and why

1. **Installed the integration on Astro 7.4.8; no fallback needed.** The package has no Astro peer range and is itself tested against Astro 7. The build passes and the client render works in a browser.
2. **Each block is wrapped in a plain `<div data-editable="array-item">`.** The docs require the array-item host outside the component. `<main>` spaces its children with `space-y-*` and `has-[>*:nth-child(3)]`; a block-level `<div>` per block keeps the count and the spacing. No stylesheet rule targets `main > section` or sibling blocks.
3. **List items inside blocks are their own registered components** (`*_item`), with `data-component` on the list and on each item. This follows the binding decision for the later multilingual journey, which needs each item to re-render on its own. `_uuid` is still passed to every item and block and is never put on the DOM.
4. **Navigation and legal links are not per-item components.** Each is one link, the navigation is rendered three different ways (desktop, mobile, footer), and the header and footer re-render as a whole. The multilingual journey can add item components if it namespaces these links.
5. **Text hosts are `<span data-editable="text">`, not `<editable-text>`.** The editor's stylesheet makes `<editable-text>` `inline-block`, which would pull a long quote or label out of its line in the editor. A `<span>` stays inline.
6. **`<editable-component>` wrappers carry `class="block"`** so they are block-level on the live site too, as they are in the editor.
7. **Report hero is a component fed by `data-prop-*`**, not inline primitives only. Its date format and background image are computed, so they need a re-render. The four fields are top-level front matter with lowercase snake_case names, so `data-prop-*` passes them unchanged and the front matter did not need nesting under a `hero` key.
8. **`imageUrl()` accepts the editor's stand-in `getImage`.** In the editor `getImage` returns the source image object instead of a URL string; without the unwrap, CSS backgrounds would re-render as `url([object Object])`.
9. **`src/lib/reports.ts` accepts string dates and ids with `.md`.** The editor's `astro:content` stand-in returns raw front matter and file-name ids. Sorting, links and the date format now work with both, and the build output is unchanged.
10. **Header and Footer take their data file's keys as props.** A component region passes the data file's keys straight through, so the build and the editor now call them the same way. The logo and the footer's navigation list come from other files and are bound with their own absolute `@data[...]` paths.
11. **Legal-link separator moved inside each item** (rendered from the second item on). An array region may only contain its items. The footer re-renders on any change, which keeps the separators right after a reorder.
12. **Footer navigation has a `<template>` blueprint, placed first.** It is the one list that no re-rendering component owns (the footer is bound to `footer.json`, the list to `navigation.json`). First position keeps the last link `:last-child` for `space-y-6`.
13. **Report cards are editable in place through `@file[...]`.** The docs prescribe this for cross-collection items shown on another page. An edit saves to the report file. This goes one step further than the audit, which left the cards to the report pages.
14. **Mobile menu copies are not editable in place** (reason in § Fields not edited in place). They stay in step through the header re-render.
15. **`data-direction="row"` on grid lists** (partners, features, stats, team), as the docs require for grids, so move controls read left/right.
16. **`srcset` and `sizes` are removed from image-region images in the editor only.** An image region changes `src` alone, so a leftover `srcset` would keep showing the old picture.
17. **Original images now ship in `dist/_astro/`** (about 16 MB more; `dist/` is 18 MB). The editor's client bundle references the source images so re-rendered sections and CSS backgrounds show a real file. No page loads them; page weight is unchanged.
18. **`data-id-key` left at its default** (`_type`), as documented for page builders. `_uuid` is not used as the array identity.

## Open questions

Non-blocking; each lists the default taken.

1. **Report cards editable from the home page and the reports index.** Default: yes — clicking a card's title or image edits that report. Say if cards should only be edited on the report's own page.
2. **Deployed output is about 16 MB larger** because original images are published for the editor. Default: keep. The alternative is images that go blank in the editor until the next build.
3. **Mobile menu is not editable in place.** Default: edit navigation on the desktop layout, in the footer, or in the sidebar. Making it editable needs a change to the menu script so it stays open while editing.
4. **Brand colour does not update while editing.** Default: it updates after saving. A live update would need an editor-only script.
5. **Navigation and legal links are not separate item components.** Default: leave until the multilingual journey decides how it keys them.
6. **Grid lists use left/right move controls**, including on phone widths where they stack. Default: keep `row`.
7. **Report front matter stays flat.** Default: keep `title`, `author`, `published_date`, `image` at the top level. Nesting them under one key would give the hero a single sidebar panel but changes every report file.

## Not verified

- **Nothing was tested inside CloudCannon.** The smoke test uses a mock of the editor API, so it proves that regions mount, paths resolve and components re-render in a browser — not how CloudCannon's own editor behaves. Still to check there: inline text editing and saving, the image picker and preview URLs for `/src/assets/images/...` paths, add / remove / reorder of blocks and list items, adding a block to an empty page, `@file[...]` edits on report cards, `@data[...]` edits from a page, and that array structures forward every block field on re-render.
- The value type CloudCannon passes for `published_date` is unknown; both strings and `Date` objects were tested.
- No visual (pixel) check of the pages or of the editor's outlines and controls. The header wrapper has no height of its own (the header is absolutely positioned), so the position of its edit button was not seen.
- The hamburger menu's script state after a header re-render was not exercised.
- `astro dev` was not run; only `astro build`.
