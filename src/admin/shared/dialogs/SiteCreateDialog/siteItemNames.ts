import { translate } from '@admin/i18n'
import { pageSlugError, pageSlugDuplicateError, type Page } from '@core/page-tree'

export type SiteCreateKind = 'page' | 'component' | 'style' | 'script'

export function slugifySiteItemName(value: string, fallback = 'page') {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || fallback
}

function stripSitePrefix(value: string, prefix: string) {
  const trimmed = value.trim()
  // Plain string match — no RegExp, so the prefix's `/` (and any other regex
  // metacharacters) are treated literally (CodeQL js/incomplete-sanitization).
  return trimmed.startsWith(prefix) ? trimmed.slice(prefix.length) : trimmed
}

function ensureExtension(value: string, extension: string) {
  return value.endsWith(extension) ? value : `${value}${extension}`
}

export function buildStylePath(value: string) {
  const name = ensureExtension(stripSitePrefix(value, 'src/styles/'), '.css')
  return `src/styles/${name}`
}

export function buildScriptPath(value: string) {
  const requestedName = stripSitePrefix(value, 'src/scripts/')
  const name = /\.(?:[cm]?ts|tsx)$/.test(requestedName)
    ? requestedName
    : ensureExtension(requestedName, '.ts')
  return `src/scripts/${name}`
}

/** Present engine validation in the admin locale without localizing stored slugs. */
export function localizedPageSlugError(slug: string, pages: Page[], currentPageId?: string): string | null {
  const error = pageSlugError(slug)
  if (error) {
    if (!slug) return translate('shell.validation.slugRequired')
    if (error === 'Page slug must use lowercase letters, numbers, single hyphens, and optional single slashes.') {
      return translate('shell.validation.slugFormat')
    }
    const segment = slug.split('/')[0] ?? slug
    return translate(segment === slug ? 'shell.validation.slugReserved' : 'shell.validation.slugPrefix', { slug: segment })
  }
  return pageSlugDuplicateError(slug, pages, currentPageId)
    ? translate('shell.validation.slugDuplicate', { slug })
    : null
}
