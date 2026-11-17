/**
 * Enrichment seed — EMTPIED as of the F1 absorption migration.
 *
 * Every app-layer field authored content did not carry (hotspot color/function, didYouKnow,
 * conditions, scientificName, tagline, compareCandidate/compareReason) was absorbed into
 * content/subjects/** via scripts/codegen/migrate-physiology-fields.ts. Content is now the
 * single source of truth with no app-side placemark.
 *
 * This module stays (with an empty map) so scripts/codegen/generate.ts keeps one code path for
 * all branches. If a future branch again needs app-only fields without authoring them, entries
 * may be added here TEMPORARILY — but the direction is: delete seed entries as content grows.
 */
export const ENRICHMENT: Record<
  string,
  {
    scientificName?: string
    tagline?: string
    didYouKnow?: string
    conditions?: string[]
    compareCandidate?: string
    compareReason?: string
    hotspots?: Record<string, { color?: string; function?: string }>
  }
> = {}
