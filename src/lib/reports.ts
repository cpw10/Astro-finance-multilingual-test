import { getCollection } from 'astro:content'

// Dates arrive as Date objects in the build and may arrive as strings when
// CloudCannon's Visual Editor re-renders a component, so both are accepted.
const time = (date: unknown) => {
  const value = new Date(date as string | Date).valueOf()
  return Number.isNaN(value) ? 0 : value
}

/** Entry id without a file extension (the Visual Editor's ids keep `.md`). */
export const reportSlug = (id: string) => id.replace(/\.(md|mdx|mdoc)$/, '')

/** Every report, newest first. Reports with the same date keep file-name order. */
export async function getReports() {
  const reports = await getCollection('reports')
  return reports.sort(
    (a, b) =>
      time(b.data.published_date) - time(a.data.published_date) ||
      a.id.localeCompare(b.id),
  )
}

export const reportHref = (id: string) => `/report/${reportSlug(id)}/`

/**
 * Rosey namespace of a report (`report/<slug>`). The report page and every card that
 * shows the report use it, so the title is translated once.
 */
export const reportRoseyRoot = (id: string) => `report/${reportSlug(id)}`

/** Repository path of a report, for `@file[...]` editable regions. */
export const reportFile = (id: string) => `/src/content/reports/${reportSlug(id)}.md`

/** `YYYY-MM-DD HH:mm` in UTC, the format reports have always shown. */
export const formatReportDate = (date: Date | string) => {
  const value = new Date(date)
  return Number.isNaN(value.valueOf()) ? '' : value.toISOString().slice(0, 16).replace('T', ' ')
}
