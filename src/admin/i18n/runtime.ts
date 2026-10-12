import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, detectBrowserLocale, parsePersistedLocale, persistLocale, resolveInitialLocale, type SupportedLocale } from './locale'
import { englishMessages, portugueseBrazilMessages, type MessageCatalog } from './messages'
export type { MessageKey } from './messages'

export type MessageValues = Readonly<Record<string, string | number>>
export type TranslationKey = string

const catalogs: Readonly<Record<SupportedLocale, MessageCatalog>> = {
  en: englishMessages,
  'pt-BR': portugueseBrazilMessages,
}

let currentLocale: SupportedLocale = DEFAULT_LOCALE
let initialized = false
let storageListenerWired = false
const subscribers = new Set<() => void>()

function notifySubscribers(): void {
  for (const subscriber of subscribers) subscriber()
}

function applyDocumentLocale(locale: SupportedLocale, doc = globalThis.document): void {
  if (!doc) return
  doc.documentElement.lang = locale
  doc.documentElement.dir = 'ltr'
}

function interpolate(message: string, values: MessageValues): string {
  return message.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (placeholder, name: string) => {
    const value = values[name]
    return value === undefined ? placeholder : String(value)
  })
}

export function translateMessage(
  locale: SupportedLocale,
  key: string,
  values: MessageValues,
  catalog: MessageCatalog,
  fallback: MessageCatalog,
): string {
  const count = typeof values.count === 'number' ? values.count : undefined
  const pluralKey = count === undefined ? key : `${key}.${new Intl.PluralRules(locale).select(count)}`
  const fallbackPluralKey = count === undefined ? key : `${key}.${new Intl.PluralRules(DEFAULT_LOCALE).select(count)}`
  const message = catalog[pluralKey] ?? catalog[key] ?? fallback[fallbackPluralKey] ?? fallback[key] ?? key
  return interpolate(message, values)
}

function handleStorageEvent(event: StorageEvent): void {
  if (event.key !== LOCALE_STORAGE_KEY && event.key !== null) return
  if (event.storageArea && event.storageArea !== globalThis.localStorage) return
  const nextLocale = parsePersistedLocale(event.newValue)
    ?? detectBrowserLocale(globalThis.navigator?.languages ?? [])
  if (nextLocale === currentLocale) return
  currentLocale = nextLocale
  applyDocumentLocale(nextLocale)
  notifySubscribers()
}

function ensureStorageListener(): void {
  if (storageListenerWired || !globalThis.window) return
  storageListenerWired = true
  globalThis.window.addEventListener('storage', handleStorageEvent)
}

export function initializeI18n(): SupportedLocale {
  if (!initialized) {
    currentLocale = resolveInitialLocale()
    initialized = true
  }
  ensureStorageListener()
  applyDocumentLocale(currentLocale)
  return currentLocale
}

export function getLocale(): SupportedLocale {
  return initialized ? currentLocale : initializeI18n()
}

export function setLocale(locale: SupportedLocale): void {
  initializeI18n()
  persistLocale(locale)
  if (locale === currentLocale) return
  currentLocale = locale
  applyDocumentLocale(locale)
  notifySubscribers()
}

export function subscribeToLocale(listener: () => void): () => void {
  initializeI18n()
  subscribers.add(listener)
  return () => subscribers.delete(listener)
}

export function translate(key: TranslationKey, values: MessageValues = {}, locale: SupportedLocale = getLocale()): string {
  return translateMessage(locale, key, values, catalogs[locale], englishMessages)
}

export function resetI18nForTests(): void {
  if (storageListenerWired && globalThis.window) {
    globalThis.window.removeEventListener('storage', handleStorageEvent)
  }
  currentLocale = DEFAULT_LOCALE
  initialized = false
  storageListenerWired = false
  subscribers.clear()
}
