import { localizePresentationOptions, USER_STATUS_OPTIONS } from '@admin/shared/presentationCatalog'
import { formatDate, formatNumber, translate, type SupportedLocale } from '@admin/i18n'
/**
 * Presentation helpers for raw CMS values. Locale and translator inputs
 * stay explicit so compiled renders invalidate cached formatting.
 */
import type { CmsCurrentUser } from '@core/persistence'
import type { Tab } from '../types'

export function isOwnerUser(user: CmsCurrentUser): boolean {
  return user.role.slug === 'owner'
}

export function displayUserName(user: CmsCurrentUser): string {
  return user.displayName.trim() || user.email
}

export function statusLabel(status: CmsCurrentUser['status'], locale: SupportedLocale): string {
  return localizePresentationOptions(USER_STATUS_OPTIONS, locale).find((option) => option.value === status)?.label ?? status
}

export function formatDateTime(value: string | null, locale: SupportedLocale, t: typeof translate = translate): string {
  if (!value) return t('accountUsers.copy.never')
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : formatDate(date, { dateStyle: 'medium', timeStyle: 'short' }, locale)
}

export function formatCapabilitySummary(capabilities: string[], locale: SupportedLocale, t: typeof translate = translate): string {
  if (capabilities.length === 0) return t('accountUsers.copy.noAdminCapabilities')
  return t('accountUsers.capabilities.count', { count: capabilities.length, formattedCount: formatNumber(capabilities.length, undefined, locale) })
}

export function tabLabel(tab: Tab, t: typeof translate = translate): string {
  return t(tab === 'users' ? 'accountUsers.copy.users' : tab === 'roles' ? 'accountUsers.copy.roles' : 'accountUsers.copy.audit')
}
