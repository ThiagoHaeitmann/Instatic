import { createContext } from 'react'
import { uiEnglishMessages, type UiMessages } from './englishMessages'

export interface UiI18nValue {
  locale: string
  messages: UiMessages
}

export const UiI18nContext = createContext<UiI18nValue>({
  locale: 'en',
  messages: uiEnglishMessages,
})
