import type { ImageMetadata } from 'astro'
import { getImage } from 'astro:assets'

// Content stores optimised images as repo paths (/src/assets/images/hero.png).
// The glob turns those strings into ImageMetadata at build time.
const images = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/**/*.{jpeg,jpg,png,gif,webp,avif,JPEG,JPG,PNG,GIF,WEBP,AVIF}',
  { eager: true },
)

/** The imported image for a stored path, or the path itself (public file or external URL). */
export function resolveImage(path?: string | null): ImageMetadata | string | undefined {
  if (!path) return undefined
  return images[path]?.default ?? path
}

type Transform = { width?: number; height?: number; quality?: number; fit?: 'cover' | 'contain' }

/** URL of an optimised copy of a stored path, for <source>, plain <img> and CSS backgrounds. */
export async function imageUrl(path?: string | null, transform: Transform = {}): Promise<string | undefined> {
  const src = resolveImage(path)
  if (!src || typeof src === 'string') return src
  const width = transform.width ? Math.min(transform.width, src.width) : undefined
  const height =
    transform.width && transform.height && width
      ? Math.round((transform.height * width) / transform.width)
      : transform.height
  const image = await getImage({ ...transform, src, width, height })
  // In CloudCannon's Visual Editor `getImage` is a stand-in that hands back the source image.
  const url: unknown = image.src
  return typeof url === 'string' ? url : (url as ImageMetadata | undefined)?.src
}
