import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import {
  I18nProvider,
  LanguageSelector,
  LOCALE_STORAGE_KEY,
  detectBrowserLocale,
  formatCurrency,
  formatDate,
  formatList,
  formatNumber,
  formatRelativeTime,
  getLocale,
  initializeI18n,
  readPersistedLocale,
  resetI18nForTests,
  resolveInitialLocale,
  setLocale,
  translate,
  useI18n,
} from '@admin/i18n'
import { translateMessage } from '../../admin/i18n/runtime'
import { englishMessages, portugueseBrazilMessages } from '../../admin/i18n/messages'

beforeEach(() => {
  localStorage.clear()
  resetI18nForTests()
  document.documentElement.lang = 'en'
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  resetI18nForTests()
  document.documentElement.lang = 'en'
})

describe('admin i18n locale resolution', () => {
  it('detects Brazilian Portuguese and falls back to English', () => {
    expect(detectBrowserLocale(['pt-BR'])).toBe('pt-BR')
    expect(detectBrowserLocale(['pt', 'en-US'])).toBe('pt-BR')
    expect(detectBrowserLocale(['fr-FR', 'en-GB'])).toBe('en')
    expect(detectBrowserLocale(['fr-FR'])).toBe('en')
  })

  it('prefers a persisted locale over the browser locale', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, JSON.stringify({ locale: 'en' }))
    expect(resolveInitialLocale({ storage: localStorage, languages: ['pt-BR'] })).toBe('en')
    expect(readPersistedLocale(localStorage)).toBe('en')
  })

  it('ignores corrupted or unsupported persisted values', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, '{broken')
    expect(resolveInitialLocale({ storage: localStorage, languages: ['pt-BR'] })).toBe('pt-BR')

    localStorage.setItem(LOCALE_STORAGE_KEY, JSON.stringify({ locale: 'fr' }))
    expect(resolveInitialLocale({ storage: localStorage, languages: ['en-US'] })).toBe('en')
  })
})

describe('admin i18n messages', () => {
  it('ships complete catalogs with exact key and interpolation parity', () => {
    expect(Object.keys(portugueseBrazilMessages).sort()).toEqual(Object.keys(englishMessages).sort())
    for (const key of Object.keys(englishMessages) as (keyof typeof englishMessages)[]) {
      const english = englishMessages[key]
      const portuguese = portugueseBrazilMessages[key]
      const placeholders = (value: string) => [...value.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort()
      expect(english.trim().length).toBeGreaterThan(0)
      expect(portuguese.trim().length).toBeGreaterThan(0)
      expect(placeholders(portuguese)).toEqual(placeholders(english))
    }
  })
  it('interpolates named values', () => {
    setLocale('pt-BR')
    expect(translateMessage('pt-BR', 'greeting', { name: 'Ana' }, { greeting: 'Olá, {{name}}!' }, {})).toBe('Olá, Ana!')
  })

  it('uses locale-aware plural forms', () => {
    setLocale('en')
    expect(translate('auth.validation.passwordMinimum', { count: 1 })).toBe('Password must be at least 1 character')
    expect(translate('auth.validation.passwordMinimum', { count: 2 })).toBe('Password must be at least 2 characters')

    setLocale('pt-BR')
    expect(translate('auth.validation.passwordMinimum', { count: 1 })).toBe('A senha deve ter pelo menos 1 caractere')
    expect(translate('auth.validation.passwordMinimum', { count: 2 })).toBe('A senha deve ter pelo menos 2 caracteres')
  })

  it('falls back to the English catalog', () => {
    setLocale('pt-BR')
    expect(translateMessage('pt-BR', 'missing', {}, {}, { missing: 'English fallback' })).toBe('English fallback')
  })
})

describe('admin i18n document and cross-tab synchronization', () => {
  function LocaleProbe() {
    const { locale } = useI18n()
    return <span>{locale}</span>
  }

  it('sets and updates the document language', () => {
    initializeI18n()
    expect(document.documentElement.lang).toBe(getLocale())

    act(() => setLocale('pt-BR'))
    expect(document.documentElement.lang).toBe('pt-BR')
    expect(document.documentElement.dir).toBe('ltr')
    expect(JSON.parse(localStorage.getItem(LOCALE_STORAGE_KEY) ?? '{}')).toEqual({ locale: 'pt-BR' })
  })

  it('persists a manual selection through the shared selector', () => {
    render(<I18nProvider><LanguageSelector /></I18nProvider>)
    fireEvent.change(document.querySelector('select')!, { target: { value: 'pt-BR' } })
    expect(getLocale()).toBe('pt-BR')
    expect(readPersistedLocale(localStorage)).toBe('pt-BR')
    expect(screen.getByRole('combobox', { name: 'Idioma' })).toBeDefined()
  })

  it('reacts to locale changes from another tab', () => {
    render(
      <I18nProvider>
        <LocaleProbe />
      </I18nProvider>,
    )
    expect(screen.getByText('en')).toBeDefined()

    act(() => {
      window.dispatchEvent(new window.StorageEvent('storage', {
        key: LOCALE_STORAGE_KEY,
        newValue: JSON.stringify({ locale: 'pt-BR' }),
      }))
    })

    expect(screen.getByText('pt-BR')).toBeDefined()
    expect(document.documentElement.lang).toBe('pt-BR')
  })
})

describe('admin locale-aware formatting', () => {
  it('formats numbers, currency, dates, relative time, and lists with the active locale', () => {
    setLocale('pt-BR')
    expect(formatNumber(1234.5)).toContain('1.234,5')
    expect(formatCurrency(12.5, 'BRL')).toContain('12,50')
    expect(formatDate('2026-10-09T12:00:00Z', { timeZone: 'UTC', dateStyle: 'short' })).toBe('09/10/2026')
    expect(formatRelativeTime(-1, 'day', { numeric: 'auto' })).toContain('ontem')
    expect(formatList(['A', 'B'])).toContain(' e ')
  })
})
