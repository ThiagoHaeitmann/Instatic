import { uiEnglishMessages, type UiMessageKey, type UiMessageValues } from './englishMessages'
import type { UiI18nValue } from './context'

export function translateUiMessage(
  { messages }: UiI18nValue,
  key: UiMessageKey,
  values: UiMessageValues = {},
): string {
  return (messages[key] ?? uiEnglishMessages[key]).replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (placeholder, name: string) => {
    const value = values[name]
    return value === undefined ? placeholder : String(value)
  })
}
