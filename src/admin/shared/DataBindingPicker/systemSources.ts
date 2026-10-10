import { translate } from '@admin/i18n'
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
  label: string
  description: string
  fields: LoopSourceField[]
}

// ---------------------------------------------------------------------------
// page — current page being rendered
// ---------------------------------------------------------------------------

const PAGE_SOURCE: SystemSource = {
  id: 'page',
  get label() { return translate('shell.copy.page') },
  get description() { return translate('shell.copy.fieldsOfThePageCurrentlyBeingRendered') },
  fields: [
    { id: 'title', get label() { return translate('shell.copy.pageTitle') } },
    { id: 'slug', get label() { return translate('shell.copy.slug') } },
    { id: 'permalink', get label() { return translate('shell.copy.permalink') }, format: 'url' },
    { id: 'parentSlug', get label() { return translate('shell.copy.parentSlug') } },
  ],
}

// ---------------------------------------------------------------------------
// site — site-level fields
// ---------------------------------------------------------------------------

const SITE_SOURCE: SystemSource = {
  id: 'site',
  get label() { return translate('shell.copy.site') },
  get description() { return translate('shell.copy.siteWideAuthorFacingFields') },
  fields: [
    { id: 'name', get label() { return translate('shell.copy.siteName') } },
  ],
}

// ---------------------------------------------------------------------------
// route — current URL frame
// ---------------------------------------------------------------------------

const ROUTE_SOURCE: SystemSource = {
  id: 'route',
  get label() { return translate('shell.copy.route') },
  get description() { return translate('shell.copy.currentURLPathAndSlugUsefulForSEOAndBreadcrumbs') },
  fields: [
    { id: 'path', get label() { return translate('shell.copy.path') }, format: 'url' },
    { id: 'slug', get label() { return translate('shell.copy.uRLSlug') } },
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
