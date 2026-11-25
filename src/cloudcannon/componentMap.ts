import AdvisersSection from '@/components/blocks/AdvisersSection.astro'
import BannerCta from '@/components/blocks/BannerCta.astro'
import BannerSplit from '@/components/blocks/BannerSplit.astro'
import FeaturesSection from '@/components/blocks/FeaturesSection.astro'
import Hero from '@/components/blocks/Hero.astro'
import ReportsList from '@/components/blocks/ReportsList.astro'
import ReportsSection from '@/components/blocks/ReportsSection.astro'
import StatsSection from '@/components/blocks/StatsSection.astro'
import TeamSection from '@/components/blocks/TeamSection.astro'
import TestimonialsSection from '@/components/blocks/TestimonialsSection.astro'

// Maps each block's `_type` in `content_blocks` to the component that renders it.
// Keys must match the `_type` values in src/components/blocks/*.cloudcannon.structure-value.yml.
export const componentMap: Record<string, any> = {
  advisers_section: AdvisersSection,
  banner_cta: BannerCta,
  banner_split: BannerSplit,
  features_section: FeaturesSection,
  hero: Hero,
  reports_list: ReportsList,
  reports_section: ReportsSection,
  stats_section: StatsSection,
  team_section: TeamSection,
  testimonials_section: TestimonialsSection,
}
