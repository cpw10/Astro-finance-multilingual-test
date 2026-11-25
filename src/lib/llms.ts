import { getCollection } from 'astro:content'
import { getReports, reportHref } from './reports'

export const siteName = 'Global Finance Starter'
export const siteTagline = 'Financial clarity tools for modern businesses'

export const pageHref = (id: string) => (id === 'index' ? '/' : `/${id}/`)

/** Absolute when `site` is set in astro.config.mjs, root-relative otherwise. */
export const link = (path: string, site?: URL) => (site ? new URL(path, site).href : path)

/** Pages and reports as `{ title, href, summary, body }`, for the llms.txt endpoints. */
export async function getLlmsEntries() {
  const pages = (await getCollection('pages'))
    .sort((a, b) => pageHref(a.id).localeCompare(pageHref(b.id)))
    .map((page) => ({
      title: page.data.title,
      href: pageHref(page.id),
      summary: page.data.metatags?.description ?? '',
      body: page.body ?? '',
    }))
  const reports = (await getReports()).map((report) => ({
    title: report.data.title,
    href: reportHref(report.id),
    summary: report.data.metatags?.description ?? '',
    body: report.body ?? '',
  }))
  return { pages, reports }
}
