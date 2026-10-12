import { translate, type MessageKey, type SupportedLocale } from '@admin/i18n'
/**
 * Shared system binding sources — `page`, `site`, `route`.
 *
 * The dynamic binding picker lists these alongside post-types and data
 * tables in its left pane. Each entry declares the fields a binding can
 * resolve against; the publisher's render context guarantees the
 * matching frames are populated on every render.
 *
 * Field definitions are intentionally hand-maintained (rather than
 * derived from schemas) because they're small, stable, and we want
 * explicit user-facing labels per field — not auto-camelCase magic.
 *
 * Each field's `format` lines up with `LoopSourceField['format']` so the
 * same compatibility filter the loop picker uses works here verbatim.
 */

import type { LoopSourceField } from '@core/loops/types'

export type SystemSourceId = 'page' | 'site' | 'route'

interface SystemSource {
  id: SystemSourceId
  labelKey: MessageKey
  label: string
  descriptionKey: MessageKey
  description: string
  fields: Array<LoopSourceField & { labelKey: MessageKey }>
}

// ---------------------------------------------------------------------------
// page — current page being rendered
// ---------------------------------------------------------------------------

const PAGE_SOURCE: SystemSource = {
  id: 'page',
  labelKey: 'shell.copy.page', get label() { return translate(this.labelKey) },
  descriptionKey: 'shell.copy.fieldsOfThePageCurrentlyBeingRendered', get description() { return translate(this.descriptionKey) },
  fields: [
    { id: 'title', labelKey: 'shell.copy.pageTitle', get label() { return translate(this.labelKey) } },
    { id: 'slug', labelKey: 'shell.copy.slug', get label() { return translate(this.labelKey) } },
    { id: 'permalink', labelKey: 'shell.copy.permalink', get label() { return translate(this.labelKey) }, format: 'url' },
    { id: 'parentSlug', labelKey: 'shell.copy.parentSlug', get label() { return translate(this.labelKey) } },
  ],
}

// ---------------------------------------------------------------------------
// site — site-level fields
// ---------------------------------------------------------------------------

const SITE_SOURCE: SystemSource = {
  id: 'site',
  labelKey: 'shell.copy.site', get label() { return translate(this.labelKey) },
  descriptionKey: 'shell.copy.siteWideAuthorFacingFields', get description() { return translate(this.descriptionKey) },
  fields: [
    { id: 'name', labelKey: 'shell.copy.siteName', get label() { return translate(this.labelKey) } },
  ],
}

// ---------------------------------------------------------------------------
// route — current URL frame
// ---------------------------------------------------------------------------

const ROUTE_SOURCE: SystemSource = {
  id: 'route',
  labelKey: 'shell.copy.route', get label() { return translate(this.labelKey) },
  descriptionKey: 'shell.copy.currentURLPathAndSlugUsefulForSEOAndBreadcrumbs', get description() { return translate(this.descriptionKey) },
  fields: [
    { id: 'path', labelKey: 'shell.copy.path', get label() { return translate(this.labelKey) }, format: 'url' },
    { id: 'slug', labelKey: 'shell.copy.uRLSlug', get label() { return translate(this.labelKey) } },
  ],
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const SYSTEM_SOURCES: readonly SystemSource[] = [
  PAGE_SOURCE,
  SITE_SOURCE,
  ROUTE_SOURCE,
]

/** Snapshot only host-owned source labels, retaining stable binding IDs/formats. */
export function localizedSystemSources(locale: SupportedLocale): SystemSource[] {
  return SYSTEM_SOURCES.map((source) => ({
    ...source,
    label: translate(source.labelKey, {}, locale),
    description: translate(source.descriptionKey, {}, locale),
    fields: source.fields.map((field) => ({ ...field, label: translate(field.labelKey, {}, locale) })),
  }))
}
