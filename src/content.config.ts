import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

// Every optional field is `.nullish()`: an empty key in front matter parses as null.

const text = z.string().nullish()

const metatags = z
  .object({
    title: text,
    description: text,
    og_title: text,
    og_description: text,
    og_image: text,
    twitter_title: text,
    twitter_description: text,
    twitter_image: text,
  })
  .nullish()

// Rendered as an <img>. `src` is a repo path: /src/assets/images/...
const image = z.object({ src: text, alt: text }).nullish()

const button = z.object({ label: text, style: text, url: text }).nullish()

const heading = z.object({ title: text, icon: text, style: text }).nullish()

const partners = z
  .object({
    title: text,
    partners: z
      .array(z.object({ _uuid: text, name: text, logo: text, link: text }))
      .nullish(),
  })
  .nullish()

const contentBlock = z.discriminatedUnion('_type', [
  z.object({
    _type: z.literal('hero'),
    _uuid: text,
    image,
    headline: text,
    lead: text,
    button,
    partners,
  }),
  z.object({
    _type: z.literal('banner_split'),
    _uuid: text,
    heading,
    headline: text,
    lead: text,
    image,
    button,
  }),
  z.object({
    _type: z.literal('features_section'),
    _uuid: text,
    title: text,
    features: z
      .array(z.object({ _uuid: text, title: text, image, description: text }))
      .nullish(),
  }),
  z.object({
    _type: z.literal('stats_section'),
    _uuid: text,
    title: text,
    lead: text,
    stats: z
      .array(
        z.object({
          _uuid: text,
          number: z.coerce.string().nullish(),
          label: text,
          primary: z.boolean().nullish(),
        }),
      )
      .nullish(),
  }),
  z.object({
    _type: z.literal('reports_section'),
    _uuid: text,
    title: text,
    reports: z.array(z.string()).nullish(),
    button,
  }),
  z.object({
    _type: z.literal('reports_list'),
    _uuid: text,
    image: text,
    title: text,
    lead: text,
  }),
  z.object({
    _type: z.literal('testimonials_section'),
    _uuid: text,
    image,
    heading,
    testimonials: z
      .array(
        z.object({
          _uuid: text,
          quote: text,
          author_name: text,
          author_title: text,
        }),
      )
      .nullish(),
    headline: text,
    button,
  }),
  z.object({
    _type: z.literal('team_section'),
    _uuid: text,
    title: text,
    members: z
      .array(z.object({ _uuid: text, image, name: text, role: text, link: text }))
      .nullish(),
  }),
  z.object({
    _type: z.literal('advisers_section'),
    _uuid: text,
    title: text,
    advisers: z
      .array(
        z.object({
          _uuid: text,
          image,
          name: text,
          role: text,
          description: text,
          link: text,
        }),
      )
      .nullish(),
  }),
  z.object({
    _type: z.literal('banner_cta'),
    _uuid: text,
    image: text,
    heading,
    headline: text,
    button,
  }),
])

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    metatags,
    content_blocks: z.array(contentBlock).nullish(),
  }),
})

const reports = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/reports' }),
  schema: z.object({
    title: z.string(),
    author: text,
    published_date: z.coerce.date(),
    image,
    metatags,
  }),
})

export const collections = { pages, reports }
