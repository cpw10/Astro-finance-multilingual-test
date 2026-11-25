import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import editableRegions from '@cloudcannon/editable-regions/astro-integration'

export default defineConfig({
  output: 'static',

  // Lets CloudCannon's Visual Editor re-render registered components in the browser.
  integrations: [editableRegions()],

  vite: {
    plugins: [tailwindcss()],
  },
})
