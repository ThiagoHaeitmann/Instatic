import { useSyncExternalStore, type ReactNode } from 'react'
import {
  getLocale,
  initializeI18n,
  setLocale,
  subscribeToLocale,
  translate,
  type MessageValues,
  type TranslationKey,
} from './runtime'

export function I18nProvider({ children }: { children: ReactNode }) {
  initializeI18n()
  useSyncExternalStore(subscribeToLocale, getLocale, getLocale)
  return children
}

export function useI18n() {
  const locale = useSyncExternalStore(subscribeToLocale, getLocale, getLocale)
  return {
    locale,
    setLocale,
    t: (key: TranslationKey, values?: MessageValues) => translate(key, values),
  }
}
