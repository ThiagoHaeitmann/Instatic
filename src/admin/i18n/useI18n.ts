import { useSyncExternalStore } from 'react'
import {
  getLocale,
  setLocale,
  subscribeToLocale,
  translate,
  type MessageValues,
  type TranslationKey,
} from './runtime'

export function useI18n() {
  const locale = useSyncExternalStore(subscribeToLocale, getLocale, getLocale)
  return {
    locale,
    setLocale,
    t: (key: TranslationKey, values?: MessageValues) => translate(key, values),
  }
}
