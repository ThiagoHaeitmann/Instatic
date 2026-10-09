import { Type } from '@sinclair/typebox'
import { parseJsonWithFallback } from '@core/utils/jsonValidate'

export const SUPPORTED_LOCALES = ['en', 'pt-BR'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: SupportedLocale = 'en'
export const LOCALE_STORAGE_KEY = 'instatic-locale'

const LocaleSchema = Type.Union([
  Type.Literal('en'),
  Type.Literal('pt-BR'),
])
const StoredLocaleSchema = Type.Object(
  { locale: LocaleSchema },
  { additionalProperties: true },
)
const OptionalStoredLocaleSchema = Type.Union([StoredLocaleSchema, Type.Null()])

export function normalizeLocale(locale: string): SupportedLocale | null {
  const normalized = locale.trim().replace('_', '-').toLowerCase()
  if (normalized === 'pt' || normalized === 'pt-br') return 'pt-BR'
  if (normalized === 'en' || normalized.startsWith('en-')) return 'en'
  return null
}

export function detectBrowserLocale(languages: readonly string[]): SupportedLocale {
  for (const language of languages) {
    const supported = normalizeLocale(language)
    if (supported) return supported
  }
  return DEFAULT_LOCALE
}

export function readPersistedLocale(storage?: Pick<Storage, 'getItem'>): SupportedLocale | null {
  try {
    return parsePersistedLocale((storage ?? globalThis.localStorage)?.getItem(LOCALE_STORAGE_KEY) ?? null)
  } catch (_err) {
    // Reading storage can be blocked by the browser's privacy settings.
    return null
  }
}

export function parsePersistedLocale(raw: string | null): SupportedLocale | null {
  return parseJsonWithFallback(raw, OptionalStoredLocaleSchema, null)?.locale ?? null
}

export function resolveInitialLocale(options: {
  storage?: Pick<Storage, 'getItem'>
  languages?: readonly string[]
} = {}): SupportedLocale {
  const persisted = readPersistedLocale(options.storage)
  if (persisted) return persisted

  const browserLanguages = options.languages ?? (
    globalThis.navigator?.languages?.length ? globalThis.navigator.languages
      : globalThis.navigator?.language ? [globalThis.navigator.language] : []
  )
  return detectBrowserLocale(browserLanguages)
}

export function persistLocale(
  locale: SupportedLocale,
  storage?: Pick<Storage, 'setItem'>,
): void {
  try {
    ;(storage ?? globalThis.localStorage)?.setItem(LOCALE_STORAGE_KEY, JSON.stringify({ locale }))
  } catch (_err) {
    // Locale persistence is best-effort when storage is unavailable or full.
  }
}
