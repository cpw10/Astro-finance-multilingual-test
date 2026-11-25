# Financial Starter: Website Template

A high-performance website starter template built for financial teams to launch new brands, products, or campaigns quickly and efficiently.

This is a fork of [bejamas/astro-storyblok-finance-starter](https://github.com/bejamas/astro-storyblok-finance-starter). The original fetched its content from Storyblok; this fork keeps all content in the repository as Markdown and JSON, builds to static HTML, and is set up for editing in [CloudCannon](https://cloudcannon.com).

## Tech Stack
- Astro v7 (static output)
- CloudCannon (Git-based CMS)
- Tailwind v4
- [bejamas/ui](https://ui.bejamas.com) components with [@data-slot](https://data-slot.com) primitives

## Features
- Modular content model: hero, features, stats, testimonials, and more, assembled per page
- Financial reports: a report content type plus a report list page
- SEO fields on every page and report
- Static output with build-time image optimisation

The site is published in English (at `/`) and Spanish (at `/es/`). Pages are written once, in English. [Rosey](https://rosey.app) builds the Spanish pages after the Astro build from the translations in `rosey/locales/es.json`; see `.cloudcannon/migration/multilingual.md`.

## Content

| What | Where |
| --- | --- |
| Pages (home, campaign pages, reports index) | `src/content/pages/*.md` — front matter only; sections live in `content_blocks` |
| Reports | `src/content/reports/*.md` — front matter plus a Markdown body |
| Logo, brand colour, report labels | `src/data/site.json` |
| Header navigation and button | `src/data/navigation.json` |
| Footer | `src/data/footer.json` |
| Photos (optimised at build time) | `src/assets/images/` |
| Logos, icons, share images (served as-is) | `public/images/` |

Each section type has a component in `src/components/blocks/` next to its CloudCannon structure file. `src/cloudcannon/componentMap.ts` maps a section's `_type` to its component, and `src/content.config.ts` holds the content schemas.

## Local Setup

### Prerequisites
- Node.js 22.23.4 or newer
- npm

### Getting Started
```bash
npm install
```

No environment variables are needed.

## Available Scripts
```bash
# Run development server
npm run dev

# Build the English pages only
npm run build

# Build for production: English, then the Spanish pages (what CloudCannon runs)
npm run build:translated

# Preview production build
npm run preview
```

## UI Components
The UI is built on [bejamas/ui](https://ui.bejamas.com): Astro components copied into `src/components/ui`, with interactive behavior (mobile navigation, language switcher) provided by [@data-slot](https://data-slot.com) primitives.

```bash
# Add another component
npx bejamas@latest add accordion
```

- Design tokens (`--primary`, `--background`, …) live in `src/styles/global.css`. The brand colour in `src/data/site.json` overrides `--primary`.
- `bejamas add` re-inserts a global `* { border-border outline-ring/50 }` rule into `global.css`. This template scopes that rule to `[data-slot]`, so remove the re-inserted copy after adding a component.
- Blocks reset the component defaults they don't use through the shared classes in `src/lib/ui.ts`.

## Contributing
Contributions are welcome!
