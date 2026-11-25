# Phase 5 — Build and test

Branch `cloudcannon-migration`. This phase ran the build verification checklists from a clean state, pinned the Node version, removed one unused dependency and drafted the handoff. Nothing was committed, pushed or created on CloudCannon.

Local toolchain: Node v25.5.0, npm 11.8.0 (matches `packageManager`). **Not tested under Node 22** — see § Not verified.

## Result

| Check | Result |
| --- | --- |
| Clean install (`npm ci`, no `node_modules`, empty npm cache) | exit 0, 541 packages |
| `npm run build` with an empty environment | exit 0, **7 pages** + `llms.txt` + `llms-full.txt`, output in `dist/` |
| `npx @cloudcannon/cli validate` | exit 0, 15 files valid |
| Computed URL = built file, all 7 content files | 7 of 7, and no built page without a content file |
| Field completeness (content vs structures vs Zod) | 0 problems |
| `npm run dev` | starts on plain http; `/`, `/report/`, `/spain-campaign/`, a report page and `/llms.txt` return 200 |

## Checklist results

Every command was run from the repo root after `rm -rf node_modules dist .astro` (Astro's other cache, `node_modules/.astro`, goes with `node_modules`). Install and build ran under `env -i PATH=… HOME=…` so no stray environment variable could help; `initial-site-settings.json` defines no `build.environment_variables`.

### Shared checklist (`build.md`)

| Item | Result | Evidence |
| --- | --- | --- |
| Full build | Pass | `npm ci` then `npm run build` (the exact `install_command` and `build_command`): both exit 0. `[build] 7 page(s) built`. `build` is `astro build`; there are no generators or post-build steps. `output_path` is `dist`, which is where Astro wrote (`astro.config.mjs` sets no `outDir`) |
| Frozen install | Pass | `npm ci --cache <new empty folder>` with no `node_modules`: `added 541 packages`, exit 0. npm 11.8.0 = `packageManager`. `package-lock.json` unchanged by the install |
| Regions are in the output | Pass | `data-editable` attributes / `<editable-component>` per page: home 153 / 2 (10 array, 40 array-item, 27 image, 76 text), spain-campaign 59 / 2, reports index 49 / 2, each report 38 / 3 (includes `@content` and `report_hero`). Same totals as Phase 4 |
| Config validates | Pass | `npx @cloudcannon/cli validate`: 15 files valid, exit 0 |
| Collection URLs match the build | Pass | Script over every file in `pages` and `reports`: see table below |
| Schema keys resolve | Pass | No content file has `_schema`; both collections have one schema keyed `default`, and each `add_options[].schema` is `default` |
| Search index | Does not apply | The site has no search |
| Schema round-trip | Pass | No file is missing a schema key (`fields.cjs`: front matter keys and key order equal the schema file for all 7 files), so no fill-and-compare was needed. Went further: see § Extra checks |
| No hydration errors | Does not apply | No framework islands, no `client:*` (audit § 4) |
| Hand off | Drafted | § Handoff |

### Astro checklist (`astro/build.md`)

| Item | Result | Evidence |
| --- | --- | --- |
| Clean the cache first | Done | `rm -rf .astro dist` (and `node_modules`) before every build in this phase |
| `registerComponents` is bundled | Pass | `dist/_astro/registerComponents.CvWMXLF0.js` (208 kB) contains the editable-regions code; every page loads `Layout.astro_astro_type_script_*.js` (1.9 kB), which imports it only when `window.inEditorMode` is set |
| `prose` typography | Pass | One use (`src/pages/report/[slug].astro`). `@tailwindcss/typography` is in `devDependencies`; `@plugin "@tailwindcss/typography";` is in `src/styles/global.css` (line 6, after the three `@import`s and the `@custom-variant`); `.prose :where(h2)…` rules are in the built CSS |
| Peer dependency conflicts | None | `npm ci` reported none; `--legacy-peer-deps` is not used |

### `build-commands.md` checks

| Item | Result |
| --- | --- |
| `npm run build` alone produces the complete output | Pass |
| `build_command` is `npm run build`; install is `npm ci` | Pass |
| Nothing needs to run before install | Pass — no private registry, no `.npmrc` |
| `install_command` completes from nothing with the pinned version | Pass |
| No `.cloudcannon/preinstall`, `prebuild` or `postbuild` | Pass — none exist |
| Node version rule | Fixed in this phase — § Node version |

### Collection URLs

| File | Computed URL | Built file |
| --- | --- | --- |
| `src/content/pages/index.md` | `/` | `dist/index.html` |
| `src/content/pages/report.md` | `/report/` | `dist/report/index.html` |
| `src/content/pages/spain-campaign.md` | `/spain-campaign/` | `dist/spain-campaign/index.html` |
| `src/content/reports/clarity-over-complexity.md` | `/report/clarity-over-complexity/` | `dist/report/clarity-over-complexity/index.html` |
| `src/content/reports/from-chaos-to-control.md` | `/report/from-chaos-to-control/` | `dist/report/from-chaos-to-control/index.html` |
| `src/content/reports/from-chaos-to-more-control.md` | `/report/from-chaos-to-more-control/` | `dist/report/from-chaos-to-more-control/index.html` |
| `src/content/reports/the-hidden-cost-of-manual-financial-tracking.md` | `/report/the-hidden-cost-of-manual-financial-tracking/` | `dist/report/the-hidden-cost-of-manual-financial-tracking/index.html` |

7 files, 7 built HTML files, every one matched.

### Extra checks

Scripts are in the session scratchpad `tools/` folder (`fields.cjs` from Phase 3, `zodkeys.cjs` new), not in the repo.

1. **Content vs structures** (`fields.cjs`): 58 blocks, list items and nested objects match their structure value key for key and in order; 45 unique `_uuid`; every `file_config` `_inputs` key names a real field. 0 problems.
2. **Zod vs CloudCannon** (`zodkeys.cjs`): the Zod schemas in `src/content.config.ts` were compared with both schema files and all 10 block structure values, with every nested structure expanded (button, heading, partners, and each list's item). 79 nodes, 0 problems. The Zod union, the structure files and `componentMap.ts` name the same 10 `_type` values.
3. **What an editor can create builds.** Five temporary files were generated from the CloudCannon defaults and built, then deleted: a page with every block and one default item in every list; a page with every block, empty lists and every optional object removed; a page with no blocks; a page with `content_blocks` and `metatags` empty; a report with only a title and date. Build exit 0, all five pages rendered, the block array region was present on the empty pages, and no `undefined`, `null`, `[object Object]`, empty `src` or empty `href` reached the HTML. The new report appeared on the reports index.
4. **Dev server.** `npm run dev -- --port 4391 --host 127.0.0.1`: started on `http://`; `/` 200 (155 regions), `/report/` 200, `/spain-campaign/` 200, `/report/clarity-over-complexity/` 200, `/llms.txt` 200, unknown path 404; no errors in `astro dev logs`. Stopped with `astro dev stop`. An `https://` request to the same port fails, and `mkcert` / `https` appear nowhere in `astro.config.mjs`, `package.json` or `package-lock.json` — the forced-HTTPS setup is gone.
5. **Type check.** Not run. The build docs do not call for `astro check`, the project has no `check` script and `@astrojs/check` is not installed.

## Fixes made

| File | Change | Why |
| --- | --- | --- |
| `.nvmrc` | `22` → `22.23.4` | A bare `22` lets the build pick any 22.x; Astro 7.4.8 refuses to run below 22.23.4 |
| `package.json` | Added `"engines": { "node": ">=22.23.4" }` | States the floor where npm and developers read it. Same floor as `node_modules/astro/package.json` and the README |
| `package.json`, `package-lock.json` | Removed `postcss-import` (`npm uninstall`) | Unused: no PostCSS config exists and Tailwind 4 runs through its Vite plugin. The lockfile lost only that package and the 6 packages only it needed; no other version moved |

No content, component, route or CloudCannon configuration file was changed.

## Node version

- CloudCannon reads the Node version from `.nvmrc` because `build.node_version` is `"file"` — the value the docs prescribe when the file exists. That setting is unchanged.
- `node_modules/astro/package.json` → `engines.node: ">=22.23.4"`. `@cloudcannon/editable-regions` needs ≥ 20.19.0; npm 11.8.0 needs ^20.17.0 or ≥ 22.9.0. The highest floor is Astro's.
- `.nvmrc` holds one version, not a range, so it is now the exact floor `22.23.4` (released 2026-10-20; 22.23.5 is the newest 22.x today). `engines` carries the range.

## Dist size (18 MB)

`dist/` is 18 MB, of which 15 MB is the 9 original PNG/JPG files from `src/assets/images/` copied to `dist/_astro/`. They are referenced only by `registerComponents.*.js`; no HTML or CSS file links them, so page weight is unaffected.

Finding: this is the documented approach, not something to gate. The docs prescribe storing optimised images in `src/assets/` and resolving them with an eager `import.meta.glob`, and say the glob works in the editor's client bundle — which is what makes Vite emit the originals. The docs' editor-only build flag (`PUBLIC_EDITOR_BUILD`) is for server features on sites whose production runs elsewhere; nothing ties it to images. No change made.

## Leftovers

| Item | Used? | Action |
| --- | --- | --- |
| `postcss-import` | No reference in `src/`, config files or any PostCSS config | Removed |
| `@lucide/astro` | Not imported in `src/`. `components.json` sets `"iconLibrary": "lucide"`, so components added with the bejamas UI CLI import it | Kept |
| `@data-slot/dropdown-menu`, `src/components/ui/dropdown-menu/` | Only used by each other | Kept on instruction: the multilingual journey's language switcher needs them |
| `bejamas`, `@data-slot/collapsible`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`, `@tailwindcss/typography` | All imported | Kept |

### What would be committed

- `.gitignore` covers `dist/`, `.astro/`, `node_modules/`, `.env`, and `.cloudcannon/migration/*.schema.json` (`git check-ignore` confirms each, including both downloaded schema files).
- No `.env`, key, log or `.DS_Store` among the changed and new files. The only matches for "token" are the variable name in `audit.md` and the deleted `.env.example`.
- New files total 16 MB. Files over 1 MB, all intended content images in `src/assets/images/`: `hero-test.png` 5.1 MB, `hero.png` 2.8 MB, `report-hero.png` 2.7 MB, `cta-banner.png` 1.8 MB, `alexander-awerin-i8ijlvjezxw-unsplash.jpg` 1.1 MB.
- The four migration notes in `.cloudcannon/migration/` are not ignored and would be committed with the rest.

### Noted, not changed

- `npm audit` reports 8 advisories (5 moderate, 3 high), all in packages pulled in by the `bejamas` UI CLI (`shadcn` → `minimatch`, `zod`) and `postcss-selector-parser`. They are development tooling and none ships in `dist/`. Most have no fix available.
- Astro 7.4.13 is available; the site stays on the pinned 7.4.8.

## Decisions and why

1. **`.nvmrc` is the exact version `22.23.4`, with `engines.node` `>=22.23.4`.** The file cannot hold a range, and the lowest version Astro accepts is the one value that is certainly valid; it is also what the README already asks for. `build.node_version` stays `"file"` as the docs prescribe.
2. **Stayed on Node 22 rather than moving to 24.** 22 is CloudCannon's default line and the audit's choice; changing the major is the owner's call.
3. **Removed `postcss-import` only.** It is the one leftover with no use and no tooling that expects it.
4. **Kept `@lucide/astro`.** Nothing imports it today, but `components.json` names it as the UI kit's icon library, so the next component added with the kit's CLI would need it back. Not provably unused.
5. **Original images stay in `dist/`.** It follows from the documented image pattern, costs no page weight, and the docs give no reason to gate it.
6. **No `astro check`.** The docs do not ask for it and it would add a dependency for one run.
7. **Dev server was run once, as instructed, and stopped.** Astro 7 starts it in the background when there is no terminal; `astro dev stop` ends it.
8. **Temporary test content was generated from the CloudCannon defaults instead of the docs' fill-and-compare round-trip**, because no file is missing a key. It tests the same risk (a template that mishandles a written default) for content editors have not created yet.

## Open questions

Non-blocking; each lists the default taken.

1. **Node pin.** Default: `.nvmrc` `22.23.4`. Alternatives: the newest 22.x (`22.23.5` today) for the latest security fixes, or `24`. Either needs only the one line changed.
2. **npm version on CloudCannon.** `packageManager` pins npm 11.8.0, but Node 22.23.4 ships npm 10.9.9 and it is unknown which one CloudCannon's build runs. Default: leave as is — the lockfile is version 3, which both read. If the hosted install fails, send the build log.
3. **Published output is 18 MB because original images are included for the editor.** Default: keep (same as Phase 4 question 2).
4. **`@lucide/astro` is installed but unused.** Default: keep for the UI kit. Remove it if no more kit components will be added.
5. **Development-tool advisories from `npm audit`.** Default: leave; they come from the `bejamas` CLI and do not reach the site. Removing `bejamas` is not possible while `global.css` imports `bejamas/tailwind.css`.
6. **The migration notes would be committed.** Default: commit `.cloudcannon/migration/*.md` with the branch as the record of the migration. Say if they should be left out.

## Not verified

- **Node 22.** No `nvm`, `fnm` or `volta` is installed, and running a downloaded Node 22 binary was not permitted in this session. Install, build and dev server ran under Node 25.5.0 only. The first CloudCannon build is the first run on 22.23.4.
- **Nothing was tested inside CloudCannon**: the hosted build, the Visual Editor, saving. Phase 4's list of editor behaviour still to confirm stands; the handoff below covers it.
- **No browser check in this phase.** The dev-server and build checks are on HTML over http, not on rendered pages.
- **Type check** was not run (see Extra checks 5).

## Handoff

Draft for the orchestrator to deliver.

### What changed

The site no longer uses Storyblok. Its content is in the repository (`src/content/pages`, `src/content/reports`, `src/data`), with CloudCannon configuration and visual editing on every page, report, the header and the footer. English only; the Spanish version and the language switcher come back in the multilingual step.

Already checked locally, so no need to repeat: clean `npm ci` and `npm run build` (7 pages), `cloudcannon validate`, every content file's URL against the built files, every field against its CloudCannon structure and the site's own schema, and the dev server. Not checked: a build on Node 22, and anything inside CloudCannon.

### Before CloudCannon

The work is uncommitted on the local branch `cloudcannon-migration`. It has to be committed and pushed to `cpw10/Astro-finance-multilingual-test` before CloudCannon can see it.

### In CloudCannon

1. Create a site from the GitHub repository `cpw10/Astro-finance-multilingual-test`, branch `cloudcannon-migration`.
2. Build settings are read from `.cloudcannon/initial-site-settings.json` when the site is created. Confirm they show:

   | Setting | Value |
   | --- | --- |
   | SSG | Astro |
   | Install command | `npm ci` |
   | Build command | `npm run build` |
   | Output path | `dist` |
   | Node version | from file (`.nvmrc` → `22.23.4`) |
   | Preserved paths | `node_modules/` |
   | Environment variables | none |

3. Let the first build finish. In the build log, check the Node version line reads 22.23.4 or newer and that 7 pages were built.

### What to test

1. **Preview.** Open the home page, `/spain-campaign/`, `/report/` and one report in the Visual Editor. Each should look like the built site, with no error cards in place of a section.
2. **Inline text.** On the home page, click the hero headline and change a word. Do the same for a feature card title and a stat number.
3. **Inline image.** Click the hero photo and a team member photo; each should open the image picker and show the new image. Check a partner logo too (it is stored in `public/images`, the photos in `src/assets/images`).
4. **Blocks.** On the home page: add a section (try a Stats or Call to action banner), move a section up or down, remove one. Then add, reorder and remove an item inside a list (a feature card, a stat, a partner).
5. **Empty page.** Create a new page and add its first section.
6. **Sidebar fields.** Change a button's style or link, and the background image of a Call to action banner; the section should update while you edit.
7. **Report.** Open a report: edit the title in place, edit a sentence in the body, change the published date in the sidebar and check the date shown updates. Then, from the home page or `/report/`, click a report card's title and confirm the edit lands in that report's file.
8. **Header and footer.** On any page, edit a navigation label in the header, reorder two navigation links, and edit the footer's company description and a legal link. Then change the brand colour under Site settings (the preview updates after saving).
9. **Save.** Save and check the commit on GitHub: page edits in `src/content/pages/*.md`, report edits in `src/content/reports/*.md`, header and footer edits in `src/data/navigation.json` / `footer.json`, uploads in `src/assets/images/` or `public/images/`. A one-word edit should produce a one-word diff, with no reordered keys and no reformatted body text.
10. **Rebuild.** After the save, the next build should pass and show the edit.

### What to send back

For anything that fails: the page URL and what was clicked, a screenshot or the text of any error card, the git diff if a save changed more than expected, and the build log if a build failed (the Node and npm version lines, and the last 30 lines).

When those checks are done, reply with any failures or odd behaviour and the next pass will start from there.
