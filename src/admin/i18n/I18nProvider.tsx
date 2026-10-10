import { useSyncExternalStore, type ReactNode } from 'react'
import { getLocale, initializeI18n, subscribeToLocale } from './runtime'

export function I18nProvider({ children }: { children: ReactNode }) {
  initializeI18n()
  useSyncExternalStore(subscribeToLocale, getLocale, getLocale)
  return children
}
