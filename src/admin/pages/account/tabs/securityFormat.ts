import { formatDate, type SupportedLocale } from '@admin/i18n'

export function formatDateTime(value: string, locale: SupportedLocale): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : formatDate(date, { dateStyle: 'medium', timeStyle: 'short' }, locale)
}
