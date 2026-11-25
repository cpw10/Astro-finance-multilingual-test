// Registers components so CloudCannon's Visual Editor can re-render them in the
// browser when their data changes. Loaded only inside the editor (see Layout.astro).
import { registerAstroComponent } from '@cloudcannon/editable-regions/astro'
import { componentMap } from './componentMap'
import AdviserItem from '@/components/items/AdviserItem.astro'
import FeatureItem from '@/components/items/FeatureItem.astro'
import PartnerItem from '@/components/items/PartnerItem.astro'
import StatItem from '@/components/items/StatItem.astro'
import TeamMemberItem from '@/components/items/TeamMemberItem.astro'
import TestimonialItem from '@/components/items/TestimonialItem.astro'
import Footer from '@/components/Footer.astro'
import Header from '@/components/Header.astro'
import ReportHero from '@/components/ReportHero.astro'

// Page-builder blocks: the key is the block's `_type`.
for (const [key, component] of Object.entries(componentMap)) {
  registerAstroComponent(key, component)
}

// Items of the lists inside blocks. Each key is the `data-component` on the list and its items.
registerAstroComponent('adviser_item', AdviserItem)
registerAstroComponent('feature_item', FeatureItem)
registerAstroComponent('partner_item', PartnerItem)
registerAstroComponent('stat_item', StatItem)
registerAstroComponent('team_member_item', TeamMemberItem)
registerAstroComponent('testimonial_item', TestimonialItem)

// Standalone sections wrapped in <editable-component> where they are used.
registerAstroComponent('header', Header)
registerAstroComponent('footer', Footer)
registerAstroComponent('report_hero', ReportHero)

// An image region changes `src` only, so a leftover `srcset` would keep showing the old image.
const dropSrcset = () => {
  document.querySelectorAll('img[data-editable="image"]').forEach((img) => {
    img.removeAttribute('srcset')
    img.removeAttribute('sizes')
  })
}
dropSrcset()
document.addEventListener('DOMContentLoaded', dropSrcset)
