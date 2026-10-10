import { useContext } from 'react'
import { UiI18nContext } from './context'
import { translateUiMessage } from './translate'
import type { UiMessageKey, UiMessageValues } from './englishMessages'

export function useUiI18n() {
  const value = useContext(UiI18nContext)
  return {
    ...value,
    t: (key: UiMessageKey, values?: UiMessageValues) => translateUiMessage(value, key, values),
  }
}
