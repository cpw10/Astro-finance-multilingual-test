# Multilingual — Spanish with Rosey and the Rosey CloudCannon Connector

Branch `cloudcannon-migration`. This step brought Spanish back at `/es/` with Rosey, added the Rosey CloudCannon Connector (RCC) so translators work in the Visual Editor, restored the language switcher, and filled the Spanish locale file from the original demo. Nothing was committed, pushed or created on CloudCannon.

Local toolchain: Node v25.5.0, npm 11.8.0. Rosey 2.3.10, rosey-cloudcannon-connector 2.0.1.

## Result

| Check | Result |
| --- | --- |
| `npm ci` from no `node_modules` | exit 0 |
| `npm run build`, then `.cloudcannon/postbuild` sourced the way CloudCannon does, from no `dist` | both exit 0; 7 English pages + 7 Spanish pages |
| `npx @cloudcannon/cli validate` | exit 0 |
| Spanish text against the original demo, all 7 pages | 0 wrong strings, 0 demo strings missing |
| English pages | Visible text equals the demo, apart from the differences earlier phases recorded (report cards newest first). `rosey build` changes nothing on them except the added `hreflang` and `content-language` tags |
| Editable regions on `/` | Unchanged: 153 `data-editable` + 2 `<editable-component>` on the home page, 59 + 2, 49 + 2, 38 + 3 on the others — the Phase 5 totals |
| Rosey keys | 108. 81 translated from the demo, 8 kept on purpose (figures), 19 left in English because the demo left them in English |
| Checklist assertions (`rosey/base.json`, locale file, output) | 14 of 14 pass — see § Verification |

## How it works

Pages are written once, in English. Rosey works on the built HTML:

1. Templates mark every translatable text with a `data-rosey` key.
2. After `astro build`, `rosey generate` collects the keys into `rosey/base.json`.
3. `write-locales` keeps `rosey/locales/es.json` in step with it: new keys are added with the English text, removed keys are dropped, translations are kept.
4. `rosey build` writes the site again: English unchanged at `/`, and a Spanish copy of every page at `/es/` with the translations put in, `<html lang="es">`, internal links prefixed with `/es`, and `hreflang` links on both versions.

A key with no translation shows the English text on the Spanish page. There is no Spanish content folder and no `/es/` route in `src/pages`.

## What was set up

| Area | Change |
| --- | --- |
| Packages | `rosey` and `rosey-cloudcannon-connector` in `dependencies`; `package-lock.json` updated |
| Key helpers | `src/lib/rosey.ts` (new): locale list, key from a `data-prop`, key from a label's text, attribute-key JSON |
| Tagging | `data-rosey`, `data-rosey-ns`, `data-rosey-root` in the layout, both routes, 10 blocks, 5 item components, `Button`, `Heading`, `PartnersSection`, `ReportCard`, `ReportHero`, `Header`, `Footer` |
| Head | `<title>` and the description, Open Graph and Twitter text metas carry keys; `og:locale` is a key too, translated to `es` |
| Language switcher | `src/components/LanguageSwitcher.astro` (restored, rewritten), rendered by `Header.astro` |
| Pipeline | `.cloudcannon/postbuild` (new); `build:translated` script in `package.json`; `_untranslated_site/` in `.gitignore` |
| CloudCannon | `data_config.locales_es`, a `locales` collection in a new "Translations" sidebar group, `CLOUDCANNON_SYNC_PATHS=/rosey/` in `initial-site-settings.json`, a "Translations" section in the editor README |
| RCC | Loaded in `Layout.astro` inside the editor only; `<div data-rcc>` wraps header, page and footer |
| Translations | `rosey/base.json`, `rosey/base.urls.json`, `rosey/locales/es.json`, `rosey/translate-site-keep.json` (all new, all to be committed) |

## Rosey key scheme

Keys are namespace segments joined with `:`. No key contains a `.`.

| Text | Key | Example |
| --- | --- | --- |
| Field of a page-builder block | `<page file name>:<block _uuid>:<field>` | `index:53e0dc1d-…:headline` |
| Field of a list item inside a block | `<page>:<block _uuid>:<item _uuid>:<field>` | `index:2dbda80e-…:d3cc8009-…:title` |
| Nested field | dots become underscores | `button.label` → `button_label`, `heading.title` → `heading_title`, `partners.title` → `partners_title` |
| Report title (report page and every card showing it) | `report/<file name>:title` | `report/clarity-over-complexity:title` |
| Report body, one key for the whole text | `report/<file name>:body` | |
| Fixed labels on report pages | `report_labels:<field>` | `report_labels:back_label` |
| Navigation links (header, mobile menu, footer) | `nav:<label as a slug>` | `nav:platform` |
| Header button | `nav:cta_label` | |
| Footer fields | `footer:<field>` | `footer:copyright` |
| Legal links | `footer:legal:<label as a slug>` | `footer:legal:privacy-policy` |
| Page `<title>` and metas | `<page>:page_title`, `:page_description`, `:og_title`, `:og_description`, `:twitter_title`, `:twitter_description` | `report:page_title` |
| `og:locale` | `site:og_locale` | value `es` |
| Language button's `aria-label` | `nav:select_language` | |

Where the namespaces come from:

- **Page**: `data-rosey-root` on `<main>` (pages, value = the entry id: `index`, `report`, `spain-campaign`) and on `<article>` (reports, `report/<id>`). It comes from the file name, not the URL.
- **Block**: `data-rosey-ns={_uuid}` on the block component's own `<section>`.
- **List item**: `data-rosey-ns={_uuid}` inside the item component (`src/components/items/`), never on the loop in the parent.
- **Shared text inside a page** (report cards, report labels) uses `data-rosey-root`, which replaces the page namespace, so one translation serves every page.
- **Header and footer** sit outside the page root and use `data-rosey-ns` (`nav`, `footer`). The footer's navigation list uses `data-rosey-root="nav"` to share the header's keys.

Not keyed, on purpose: people's names (team, advisers, testimonial author, report author), partner names, phone number, email address, the report date, image `alt` text (every `alt` is empty today), and the mobile menu button's `aria-label` ("Toggle Navigation", set inside the UI kit component).

## Pipeline and build commands

CloudCannon settings are unchanged: install `npm ci`, build `npm run build`, output `dist`. CloudCannon then runs `.cloudcannon/postbuild` by itself:

```bash
npx rosey generate --source dist
npx rosey-cloudcannon-connector write-locales --source rosey --dest dist --locales es
rm -rf ./_untranslated_site
mv ./dist ./_untranslated_site
npx rosey build --source _untranslated_site --dest dist --default-language en --default-language-at-root --exclusions "\.(html?)$"
```

- Locally, `npm run build` gives the English pages only. `npm run build:translated` runs the build and then the same file.
- The file has no `set -e` or other shell options, because CloudCannon sources it into its own shell.
- `write-locales` also writes `dist/_rcc/locales.json`, the language list the RCC reads.
- The build updates `rosey/base.json` and `rosey/locales/es.json`. `CLOUDCANNON_SYNC_PATHS=/rosey/` makes CloudCannon commit those changes back, so new keys reach the repository and the editor. It is set in `.cloudcannon/initial-site-settings.json`, which only applies when the site is created; on an existing site, add the variable in the site's settings.
- Run on unchanged content, the pipeline leaves `rosey/base.json`, `rosey/locales/es.json` and `rosey/translate-site-keep.json` byte-for-byte the same (checksums compared before and after a clean build).

To add a language later: add its code to `--locales` in the postbuild, a `locales_<code>` entry in `data_config`, and an entry in `locales` in `src/lib/rosey.ts` plus a flag in `LanguageSwitcher.astro`.

## Language switcher

`LanguageSwitcher.astro` uses the `ui/dropdown-menu` component with the original flag icons, in the header's right-hand group, visible on desktop and mobile as before.

- Links are built from the page's path: `/x/` for English, `/es/x/` for Spanish. Each has `data-rosey-ignore` (without it Rosey would prefix them again on the Spanish copy), `hreflang` and `lang`.
- The Spanish page is a copy of the English HTML, so the current language cannot be decided at build time. The flag on the button is chosen by CSS from `<html lang>`; a small script sets `aria-current` on the current item.
- Inside CloudCannon's Visual Editor the switcher hides itself (`window.inEditorMode`), because the RCC adds its own. `Header.astro` also leaves it out when the editor re-renders the header: the path comes from `Layout.astro` as a prop, since `Astro.url` does not exist in the editor's re-render.

## Spanish coverage

Source: the scraped `/es/` pages of the original demo and `src/locales/es.json` from git `HEAD`. Each key was matched to the demo by the position of its text on the page (the English and Spanish demo pages have the same text nodes in the same order), not by guessing from the English wording. The eight used strings of `es.json` all landed on a key; `readMore` was unused in the original too.

Keys per page (a shared key is counted on every page that shows it):

| Page | Keys | From the demo | Kept (figures) | Left in English |
| --- | --- | --- | --- | --- |
| `/es/` | 68 | 56 | 4 | 8 |
| `/es/spain-campaign/` | 29 | 22 | 4 | 3 |
| `/es/report/` | 23 | 19 | 0 | 4 |
| `/es/report/clarity-over-complexity/` | 19 | 15 | 0 | 4 |
| `/es/report/from-chaos-to-control/` | 19 | 15 | 0 | 4 |
| `/es/report/from-chaos-to-more-control/` | 19 | 15 | 0 | 4 |
| `/es/report/the-hidden-cost-of-manual-financial-tracking/` | 19 | 15 | 0 | 4 |
| **Unique keys** | **108** | **81** | **8** | **19** |

Built page against demo page, visible text nodes (language switcher excluded):

| Page | Text nodes | Spanish, same as the demo | Same in both languages on the demo | Wrong or missing |
| --- | --- | --- | --- | --- |
| `/es/` | 81 | 64 | 17: 9 names, 6 figures and symbols, footer description, email | 0 |
| `/es/spain-campaign/` | 38 | 30 | 8: 6 figures and symbols, footer description, email | 0 |
| `/es/report/` | 31 | 27 | 4: phone, separator, footer description, email | 0 |
| `/es/report/clarity-over-complexity/` | 46 | 40 | 6: date, phone, separator, "Bejamas", footer description, email | 0 |
| The other three reports | 48 each | 42 each | 6 each, as above | 0 |

No string is in English because a match was not found. Every English string on a Spanish page is English on the demo's Spanish page as well. `/es/report/` has the same strings as the demo in a different order, because report cards are newest first since Phase 3.

### Keys left in English, and why

| Key | English value | Why |
| --- | --- | --- |
| `footer:company_description` | We build intuitive financial tools… | English on every Spanish demo page |
| `index:page_title` | Global Finance Starter | Same title on the Spanish demo page |
| `index:page_description` | A high-performance website starter template… | Same on the Spanish demo page |
| `index:og_title`, `index:twitter_title` | Company Name | Same on the Spanish demo page |
| `index:og_description`, `index:twitter_description` | This is the meta description info… | Same on the Spanish demo page |
| `report:page_title`, `report:page_description` | Reports \| Global Finance Starter; This is the report page and it's awesome. | The Spanish demo page had an empty title and no description |
| `spain-campaign:page_title` | Spain Campaign | Empty title on both demo pages; the page name is the fallback since Phase 3 |
| `report/<slug>:page_title` × 4 | The report's English SEO title | Same English title on the Spanish demo page |
| `report/<slug>:page_description` × 4 | The report's English SEO description | Same on the Spanish demo page |
| `nav:select_language` | Select language | An `aria-label`; English on the demo |

Kept on purpose, recorded in `rosey/translate-site-keep.json` so they are not offered for translation again: the eight stat figures (`50+`, `150+`, `$500m`, `25`, `1200+`, `€50M`, `5+`, `95%`), which the demo shows unchanged.

### Demo wording taken as it is

The demo's Spanish was used verbatim, including where it reads oddly:

- `report_labels:label`: "Report" → "Informar" (from `es.json`; "Informe" would be the noun).
- `report/clarity-over-complexity:body`, second paragraph: the demo replaces the note about Bejamas with "También es importante revisar. Bejamas Sitio web sin razón." and drops the second link. The other three bodies keep the note ("Hola, nosotros en Bejamas He creado esta plantilla…¡Claro!").
- Headings in the Spanish bodies keep the English `id` (for example `start-with-the-big-picture`), so anchors are the same in both languages.

## Translating in CloudCannon

1. Open a page or report in the Visual Editor. The RCC adds a floating language button to the preview.
2. Choose Español. The page shows the Spanish text; every keyed text becomes an inline editor that saves to `rosey/locales/es.json`. Choose the source language to return to normal editing.
3. When an English text changes after it was translated, the next build updates `_base_original` and the RCC outlines the Spanish text in dashed amber until it is updated or marked as reviewed.
4. Text that is not on the page — the SEO title and description, `og:locale`, the language button's label — is edited in **Translations → es** in the sidebar. Entries are named by their key.
5. A new block, list item or navigation link gets its key at the next build; translate it after that build has synced.

The editor README (`.cloudcannon/README.md`) has a "Translations" section in plain language.

Filling many keys at once is the `translate-site` workflow: `prepare-translation.mjs --locale es`, fill the task file, `merge-translation.mjs --locale es`.

## Verification

Scripts are in the session scratchpad `tools/` folder, not in the repo.

1. **Clean build.** `rm -rf node_modules dist _untranslated_site .astro`, `npm ci` (exit 0), `npm run build` (exit 0, 7 pages), then `source .cloudcannon/postbuild` in the same shell (exit 0). Output: 14 `index.html` files, `dist/_rcc/locales.json` = `{"locales":["es"]}`, no `dist/en`, no `dist/es/es`.
2. **Spanish against the demo** (`es_parity.py`): the tables above; `<html lang="es">` and `og:locale` `es` on all 7; `hreflang` pairs `en` → `/x/`, `es` → `/es/x/` on both versions of every page; every internal link on a Spanish page stays inside `/es/` and resolves to a built file, except `/es/terms/` and `/es/policies/` (no such pages in either language, as on the demo).
3. **English unchanged** (`parity.py` against the English demo, and a token-by-token comparison of `_untranslated_site` with `dist`): same text as before; Rosey only adds `hreflang` and `content-language` tags.
4. **Checklist assertions** (`rosey_checks.py`), all pass:
   - no key contains `.`; no `undefined`, no empty namespace segment; no `data-rosey-ns="undefined"` in the output
   - all 34 UUID segments are `_uuid` values present in content (45 exist)
   - no original contains `<svg`, a comment or component markup
   - `base.json` and `es.json` hold the same 108 keys; no stale entry; the 8 kept entries still equal their original
   - no colliding key: every key has one text across all pages
   - no orphan: the keys in the built HTML and in `base.json` are the same set
   - the same number of `<svg` and of `&lt;` on `/` and `/es/` pages (no doubled icon, no decoded entities)
5. **Language switcher in a browser** (`smoke/switcher.mjs`, headless Chrome, 1280 px and 390 px, four start pages): the button shows the flag of the page's language, the menu opens with both links visible, the current one has `aria-current`, and clicking the other language lands on the matching page in that language. No console errors. A screenshot was checked at both widths.
6. **Editor smoke test** (`smoke/test_rosey.mjs`, the Phase 4 test with a mock of CloudCannon's editor API, extended to compare the Rosey attributes): all 19 components register; 154 / 60 / 50 / 40 regions mount with no error cards; every block, item, header, footer and report hero re-renders with the same `data-rosey`, `data-rosey-ns` and `data-rosey-root` attributes as the build; the RCC loads from the bundle and adds its language button; the visitor switcher is gone after the header re-renders.

## Changes to earlier-phase decisions

| Earlier decision | Now | Why |
| --- | --- | --- |
| No `.cloudcannon/postbuild` hook file (configuration.md, from the configuration docs) | `.cloudcannon/postbuild` added | The multilingual docs prescribe the Rosey pipeline in that file. `npm run build:translated` gives the same result locally |
| Build steps must not write to files in the repository (configuration docs) | The pipeline rewrites `rosey/base.json` and `rosey/locales/es.json` | That is how Rosey and the RCC work; `CLOUDCANNON_SYNC_PATHS` commits the result |
| English only; `<html lang="en">` hardcoded (audit decision 12) | Two languages; `lang` still `en` in the source, set to `es` by Rosey | The purpose of this step |
| Navigation and legal links left without per-item keys (Phase 4, open question 5) | Keyed by label text, no item components added | Settled here, as the multilingual docs prescribe for navigation |
| `_uuid` never reaches the DOM (configuration.md) | `_uuid` is the value of `data-rosey-ns` on blocks and items | What it was added for |
| Mobile menu labels were bare text | Each is wrapped in a `<span>` | A key must sit on an element holding only the text |

## Decisions and why

1. **English at `/`, Spanish at `/es/`** (`--default-language-at-root`), as decided. Existing URLs and CloudCannon collection URLs stay as they are.
2. **Manual setup, not `rosey-cloudcannon-connector init`.** The wizard rewrites `cloudcannon.config.yml`; editing by hand kept that file's diff to the three additions.
3. **RCC imported by package name in the layout's bundled script, and no `install-client` step.** The Astro docs allow this because Astro bundles the script. Confirmed: the connector is a chunk in `dist/_astro/`, and it runs in the smoke test. `dist/_rcc/client.mjs` therefore does not exist, on purpose.
4. **Report body is one key on the `@content` region.** The docs put the key on the region element, because CloudCannon cannot keep attributes inside a rich text region. One key also lets the Spanish body differ in structure from the English one, which the demo's does.
5. **Report labels and report card titles use `data-rosey-root`.** They render inside a page, where a plain namespace would give one key per page.
6. **Navigation and legal links are keyed by their text.** The three copies of the navigation share one translation. The cost: renaming a link in English creates a new, untranslated key instead of flagging the old translation.
7. **Names, phone and email are not keyed.** The docs say identity values are not translated.
8. **Stat figures are keyed and kept.** A figure may need a different format in another language (`2,5M`), so translators can change it; today each equals its original.
9. **All head text metas are keyed, not only the title and description.** Rosey copies the head unchanged, so an unkeyed `og:title` could never be translated.
10. **`og:locale` is a key (`site:og_locale` = `es`).** Rosey does not change that tag; the original site set it per language.
11. **No canonical / `og:url` fix script.** The docs require `fix-rosey-pages.mjs` when the layout emits a canonical or `og:url`. This layout emits neither (the original did not either), so the script was not added.
12. **`hreflang` links are root-relative.** Rosey makes them absolute only with `--base-url`, and the production URL is not known (see Open question 1).
13. **The flag on the language button is chosen by CSS from `<html lang>`.** No flash of the wrong flag, and nothing to compute on a page Astro never renders.
14. **Item components with several root elements carry the namespace on each one that holds text** (`TestimonialItem`, `TeamMemberItem`), instead of a new wrapper element. No layout change.
15. **Spanish headings keep the English `id`s.** In-page anchors stay valid across languages.
16. **`rosey` and the connector are in `dependencies`.** The connector is bundled into the site; both are needed by the build.
17. **No split-by-directory content (docs Phase 8), no RTL setup (Phase 7).** Four short reports fit one key each, and Spanish is left-to-right.

## Open questions

Non-blocking; each lists the default taken.

1. **Production URL.** `site` is not set in `astro.config.mjs`. Default: `hreflang` links are root-relative and there is no canonical. When the URL is known: set `site`, add `--base-url <url>` to `rosey build`, and if a canonical or `og:url` is added to the layout, add the docs' `fix-rosey-pages.mjs` after `rosey build`.
2. **The 19 keys the demo left in English** (table above). Default: left in English. Say if they should be translated; the SEO titles of the four reports are the most visible, since the browser tab shows English above a Spanish heading.
3. **Odd Spanish in the demo** ("Informar" for "Report", the rewritten Bejamas note). Default: verbatim. Each is one entry in `rosey/locales/es.json`.
4. **Hook file or build script.** Default: `.cloudcannon/postbuild`, as the multilingual docs prescribe. The alternative that matches the configuration docs is to make `npm run build` run the Rosey steps and delete the hook file; do not do both, or the steps run twice.
5. **Report bodies as one key each.** Default: yes. If reports become long or numerous, the docs' alternative is a Spanish copy of each report file.
6. **Image `alt` text is not translatable.** Default: not keyed, because every `alt` is empty. If alt text is written, it needs keys.
7. **"Toggle Navigation"** (mobile menu button label for screen readers) stays English in Spanish. Default: left, because it is set inside the UI kit component.
8. **No sitemap and no 404 page exist**, so nothing was added for Spanish. If a sitemap is added, Rosey will not list `/es/` pages in it; if a 404 page is added, CloudCannon serves the English one for missing `/es/` URLs.
9. **`llms.txt` and `llms-full.txt` are English only.** Default: left; Rosey translates HTML only.
10. **Dates on reports** use `YYYY-MM-DD HH:mm` in both languages, as the demo did. Default: left.

## Not verified

- **Nothing was tested inside CloudCannon.** Only there can these be checked: the hosted build running `.cloudcannon/postbuild`; `CLOUDCANNON_SYNC_PATHS` committing `rosey/` back; the RCC's language button in the real editor; inline translation editing and saving to `rosey/locales/es.json`; that a saved translation survives a reload; stale marking after an English edit; the Translations collection's form; translating a block added in the editor after the next build.
- The smoke test uses a mock of the editor API. It shows the RCC loads and the regions and keys survive a re-render, not how the RCC behaves with CloudCannon's real data API.
- **Node 22.** Everything ran on Node 25.5.0; the first CloudCannon build is the first run on 22.23.4, and the first run of Rosey's Linux binary (`@roseyapp/linux-x64`, an optional dependency that is in `package-lock.json`; only the macOS binary ran here).
- `astro dev` shows English only (Rosey runs after the build); it was not run in this step.
- The footer's navigation list has a blank template for links added in the editor. A link added there has no translation key until the next build; this was not exercised.

## Handoff

### Before CloudCannon

Commit everything, including the new `rosey/` folder. `rosey/base.json` is the baseline: after any later build, `git diff rosey/base.json` should show only keys you can explain.

### In CloudCannon

1. Build settings stay as in Phase 5 (`npm ci`, `npm run build`, `dist`). Check that the environment variable `CLOUDCANNON_SYNC_PATHS` = `/rosey/` exists; add it by hand if the site was created before this change.
2. In the build log, after the Astro build, look for two `Rosey: Finished` lines and `RCC: Wrote rosey/locales/es.json — 108 keys (0 added, 0 removed…)`.

### What to test

1. **Spanish site.** Open `/es/`, `/es/spain-campaign/`, `/es/report/` and one report on the built site. Text is Spanish, links stay in `/es/`.
2. **Language switcher.** On a page and on a report, switch to Español and back; you should land on the same page in the other language, and the flag should match.
3. **Translator's switcher.** Open the home page in the Visual Editor. The site's own flag button should be hidden and the RCC's floating language button should be there.
4. **Translate in place.** Switch to Español in the editor, change the hero headline, save. Reload the editor and confirm the change is still there. The commit should change one `value` in `rosey/locales/es.json` and nothing else.
5. **Nested key.** Do the same for a button label and for a feature card title. These keys come from nested fields and list items, where a save that silently disappears would show up.
6. **Header and footer.** In Español, edit a navigation label. After the build, the header, the mobile menu and the footer should all show it.
7. **Report body.** Open a report, switch to Español, edit a sentence in the body, save, and check the diff changes only that entry.
8. **Stale marking.** Edit an English headline that has a translation, save, wait for the build. In Español that text should have a dashed amber outline, and marking it as reviewed should clear it.
9. **New content.** Add a stat to the home page's stats section, save, wait for the build and the sync. `rosey/locales/es.json` should gain two keys (`…:number`, `…:label`), and the new stat should be translatable.
10. **Translations list.** Open Translations → es, find `index:page_title`, type a Spanish title, save. After the build the `/es/` tab title should change.
11. **Synced files.** After a build with no content change, there should be no new commit touching `rosey/`.

### What to send back

For anything that fails: the page URL and what was clicked, a screenshot, the browser console text if the language button is missing, the git diff if a save changed more than one entry, and the build log from the first `Rosey:` line to the end if the build failed.
