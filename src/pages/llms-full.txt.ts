import type { APIRoute } from 'astro'
import { getLlmsEntries, link, siteName, siteTagline } from '@/lib/llms'

export const GET: APIRoute = async ({ site }) => {
  // Only reports have body text; pages are built from sections.
  const { reports } = await getLlmsEntries()

  const body = `# ${siteName}

> ${siteTagline}

This file contains the full text content of all pages on this website, optimized for AI language models and search systems.

***

${reports
  .filter((report) => report.body.trim())
  .map(
    (report) => `## ${report.title}

${report.body.trim()}

**URL**: [${report.title}](${link(report.href, site)})

***
`,
  )
  .join('\n')}
${site ? `\n---\n\nFor more information, visit [${site.href}](${site.href})\n` : ''}`

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
