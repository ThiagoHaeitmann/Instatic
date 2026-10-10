import { useSyncExternalStore, type ReactNode } from 'react'
import { UiI18nContext, uiEnglishMessages } from '@ui/localization'
import { englishMessages, portugueseBrazilMessages } from './messages'
import { getLocale, initializeI18n, subscribeToLocale } from './runtime'

export function I18nProvider({ children }: { children: ReactNode }) {
  initializeI18n()
  const locale = useSyncExternalStore(subscribeToLocale, getLocale, getLocale)
  const messages = locale === 'en'
    ? { ...uiEnglishMessages, ...englishMessages }
    : { ...uiEnglishMessages, ...englishMessages, ...portugueseBrazilMessages }
  return <UiI18nContext value={{ locale, messages }}>{children}</UiI18nContext>
}
