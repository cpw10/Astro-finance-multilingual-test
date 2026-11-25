// Helpers for the Rosey translation keys (`data-rosey`) the templates emit.
// Rosey reads the built HTML, so these only shape attribute values. Keys are joined to
// their namespaces with ":"; they must never contain "." (CloudCannon's Visual Editor
// treats a dot as a path separator and would drop the translator's edit).

/** Languages the site is published in. `en` is the source language, served at `/`. */
export const defaultLocale = 'en'
export const locales = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
]

/** Key for a field, from its editable-region path: `button.label` -> `button_label`. */
export const roseyKeyFromProp = (prop: unknown) =>
  typeof prop === 'string' && prop.trim() ? prop.replace(/\./g, '_') : undefined

/**
 * `data-rosey` attribute for a text host. An explicit key wins, `false` opts out,
 * otherwise the key is derived from the element's `data-prop`.
 */
export const resolveRosey = (explicit: unknown, dataProp?: unknown) => {
  if (explicit === false) return {}
  const key = typeof explicit === 'string' && explicit ? explicit : roseyKeyFromProp(dataProp)
  return key ? { 'data-rosey': key } : {}
}

/**
 * Key made from the text itself, for short labels that repeat (navigation and legal links):
 * "Terms & Conditions" -> `terms-conditions`. Every copy of a label shares one translation.
 */
export const roseyTextKey = (text: unknown) => {
  if (typeof text !== 'string') return undefined
  const key = text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return key || undefined
}

/** `data-rosey-attrs-explicit` value: translates attributes, one key each. */
export const roseyAttrs = (map: Record<string, string>) => JSON.stringify(map)
