import type { APIRoute } from 'astro'
import { getLlmsEntries, link, siteName, siteTagline } from '@/lib/llms'

export const GET: APIRoute = async ({ site }) => {
  const { pages, reports } = await getLlmsEntries()

  const item = (entry: { title: string; href: string; summary: string }) =>
    `- [${entry.title}](${link(entry.href, site)})${entry.summary ? `: ${entry.summary}` : ''}`

  const body = `# ${siteName}

> ${siteTagline}

This file contains a list of all pages and resources on this website.

***

## Main Pages

${pages.map(item).join('\n')}

## Report

${reports.map(item).join('\n')}
`

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
