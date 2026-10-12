import { getLocale } from './runtime'
import type { SupportedLocale } from './locale'

export function formatNumber(value: number, options?: Intl.NumberFormatOptions, locale: SupportedLocale = getLocale()): string {
  return new Intl.NumberFormat(locale, options).format(value)
}

export function formatCurrency(
  value: number,
  currency = 'USD',
  options: Omit<Intl.NumberFormatOptions, 'style' | 'currency'> = {},
): string {
  return new Intl.NumberFormat(getLocale(), {
    ...options,
    style: 'currency',
    currency,
  }).format(value)
}

export function formatDate(
  value: Date | number | string,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
  locale: SupportedLocale = getLocale(),
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(value))
}

export function formatRelativeTime(
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  options?: Intl.RelativeTimeFormatOptions,
  locale: SupportedLocale = getLocale(),
): string {
  return new Intl.RelativeTimeFormat(locale, options).format(value, unit)
}

export function formatList(
  values: readonly string[],
  options?: Intl.ListFormatOptions,
): string {
  return new Intl.ListFormat(getLocale(), options).format(values)
}

export function formatBytes(bytes: number, options?: Intl.NumberFormatOptions, locale: SupportedLocale = getLocale()): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return `${formatNumber(0, undefined, locale)} B`
  const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** unitIndex
  return `${formatNumber(value, options ?? { maximumFractionDigits: unitIndex === 0 ? 0 : 1 }, locale)} ${units[unitIndex]}`
}

