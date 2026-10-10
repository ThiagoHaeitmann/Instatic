import { afterEach, describe, expect, it, spyOn } from 'bun:test'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { UiI18nContext, translateUiMessage, uiEnglishMessages } from '@ui/localization'
import { uiPortugueseMessages } from '@admin/i18n/uiMessages'
import { I18nProvider } from '@admin/i18n/I18nProvider'
import { getLocale, resetI18nForTests, setLocale } from '@admin/i18n/runtime'
import { LOCALE_STORAGE_KEY } from '@admin/i18n/locale'
import { SearchBar } from '@ui/components/SearchBar'
import { ContextMenu, ContextMenuItem, ContextMenuSubmenu, MenuSearchHeader } from '@ui/components/ContextMenu'
import { Select } from '@ui/components/Select'
import { Input } from '@ui/components/Input'
import { Dialog } from '@ui/components/Dialog'
import { SplitButton } from '@ui/components/SplitButton'
import { FloatingActionBar } from '@ui/components/FloatingActionBar'
import { DateTimePicker } from '@ui/components/DateTimePicker'
import { Widget, WidgetSkeleton } from '@ui/components/Widget'
import { ErrorBoundary } from '@ui/components/ErrorBoundary'
import { ToastProvider, pushToast, dismissToast } from '@ui/components/Toast'
import { TagPill } from '@ui/components/TagPill'

const noop = () => {}
function localized(children: ReactNode, locale = 'pt-BR') {
  return <UiI18nContext value={{ locale, messages: locale === 'en' ? uiEnglishMessages : uiPortugueseMessages }}>{children}</UiI18nContext>
}

afterEach(() => {
  cleanup()
  resetI18nForTests()
  localStorage.clear()
})

describe('shared primitive localization', () => {
  it('has exact English/Portuguese key and interpolation parity', () => {
    expect(Object.keys(uiPortugueseMessages).sort()).toEqual(Object.keys(uiEnglishMessages).sort())
    for (const key of Object.keys(uiEnglishMessages) as Array<keyof typeof uiEnglishMessages>) {
      expect(key.startsWith('ui.')).toBe(true)
      expect(uiPortugueseMessages[key].match(/\{\{\w+\}\}/g) ?? []).toEqual(uiEnglishMessages[key].match(/\{\{\w+\}\}/g) ?? [])
    }
    expect(translateUiMessage({ locale: 'pt-BR', messages: {} }, 'ui.widgetOptions', { title: 'My plugin' })).toBe('My plugin options')
  })

  it('keeps standalone primitives English even when the admin runtime is Portuguese', () => {
    setLocale('pt-BR')
    render(<SearchBar value="user text" onValueChange={noop} />)
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeDefined()
    expect(screen.getByRole('searchbox').getAttribute('value')).toBe('user text')
  })

  it('does not initialize admin state when standalone primitives render', () => {
    resetI18nForTests()
    localStorage.setItem(LOCALE_STORAGE_KEY, JSON.stringify({ locale: 'en' }))
    const previousLang = document.documentElement.lang
    const previousDir = document.documentElement.dir
    document.documentElement.lang = 'fr'
    document.documentElement.dir = 'rtl'
    const storageRead = spyOn(localStorage, 'getItem')
    const listen = spyOn(window, 'addEventListener')
    const log = spyOn(console, 'error').mockImplementation(noop)
    function Broken(): ReactNode { throw new Error('standalone failure') }
    try {
      render(<>
        <MenuSearchHeader value="query" onValueChange={noop} />
        <DateTimePicker value={new Date(2026, 9, 9)} onConfirm={noop} onCancel={noop} />
        <WidgetSkeleton widgetId="standalone-widget" span={1} />
        <ToastProvider />
        <ErrorBoundary location="standalone" silentToast><Broken /></ErrorBoundary>
      </>)
      expect(screen.getByRole('combobox', { name: 'Search…' })).toBeDefined()
      expect(screen.getByRole('button', { name: 'Clear search' })).toBeDefined()
      expect(screen.getByRole('button', { name: 'Reset' })).toBeDefined()
      expect(screen.getByRole('dialog', { name: 'Date and time picker' })).toBeDefined()
      expect(storageRead.mock.calls.some(([key]) => key === LOCALE_STORAGE_KEY)).toBe(false)
      expect(listen.mock.calls.some(([type]) => type === 'storage')).toBe(false)
      expect(document.documentElement.lang).toBe('fr')
      expect(document.documentElement.dir).toBe('rtl')

      // A first admin read must still detect the newly persisted selection,
      // rather than a locale cached during standalone rendering.
      localStorage.setItem(LOCALE_STORAGE_KEY, JSON.stringify({ locale: 'pt-BR' }))
      expect(getLocale()).toBe('pt-BR')
    } finally {
      storageRead.mockRestore()
      listen.mockRestore()
      log.mockRestore()
      document.documentElement.lang = previousLang
      document.documentElement.dir = previousDir
    }
  })

  it('preserves ContextMenu item and submenu accessible names under the admin provider', () => {
    setLocale('pt-BR')
    render(<I18nProvider>
      <ContextMenu ariaLabel="Plugin menu" x={20} y={20} onClose={noop}>
        <ContextMenuItem aria-label="Caller accessible action">Plugin action</ContextMenuItem>
        <ContextMenuItem>Delete user content</ContextMenuItem>
        <ContextMenuSubmenu label="Plugin submenu">
          <ContextMenuItem>Nested user action</ContextMenuItem>
        </ContextMenuSubmenu>
      </ContextMenu>
    </I18nProvider>)
    expect(screen.getByRole('menu', { name: 'Plugin menu' })).toBeDefined()
    expect(screen.getByRole('menuitem', { name: 'Caller accessible action' })).toBeDefined()
    expect(screen.getByRole('menuitem', { name: 'Delete user content' })).toBeDefined()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Plugin submenu' }))
    expect(screen.getByRole('menu', { name: 'Plugin submenu' })).toBeDefined()
    expect(screen.getByRole('menuitem', { name: 'Nested user action' })).toBeDefined()
  })

  it('updates mounted defaults and preserves caller search labels', () => {
    const view = render(localized(<><MenuSearchHeader value="" onValueChange={noop} /><SearchBar value="query" clearLabel="Plugin clear" onValueChange={noop} /></>))
    expect(screen.getByRole('combobox', { name: 'Buscar…' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Plugin clear' })).toBeDefined()
    view.rerender(localized(<><MenuSearchHeader value="" onValueChange={noop} /><SearchBar value="query" clearLabel="Plugin clear" onValueChange={noop} /></>, 'en'))
    expect(screen.getByRole('combobox', { name: 'Search…' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Plugin clear' })).toBeDefined()
  })

  it('localizes Select portal search and no-match text without translating options or values', () => {
    render(localized(<Select aria-label="Plugin status" value="draft-id" searchable options={[{ value: 'draft-id', label: 'Plugin Draft' }]} onChange={noop} />))
    const trigger = screen.getByRole('combobox', { name: 'Plugin status' })
    fireEvent.click(trigger.nextElementSibling as HTMLElement)
    expect(screen.getByRole('option', { name: 'Plugin Draft' })).toBeDefined()
    fireEvent.change(screen.getByRole('combobox', { name: 'Buscar…' }), { target: { value: 'absent' } })
    expect(screen.getByText('Nenhum resultado')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Limpar busca' })).toBeDefined()
    expect((document.querySelector('select') as HTMLSelectElement).value).toBe('draft-id')
  })

  it('localizes dialog, action, stepping, widget and tag defaults', () => {
    render(localized(<>
      <Dialog open onClose={noop} title="User dialog"><Input type="number" value="12" unit="px" onChange={noop} /></Dialog>
      <SplitButton label="Plugin action" onClick={noop} menuItems={[{ id: 'technical-id', label: 'Plugin item', onSelect: noop }]} />
      <FloatingActionBar ariaLabel="User toolbar" onClose={noop} />
      <WidgetSkeleton widgetId="plugin-id" span={1} />
      <Widget widgetId="user-id" title="Plugin title" tint="mint" span={1} editing={false} onMenuClick={noop} />
      <TagPill label="User tag" onRemove={noop} />
    </>))
    for (const name of ['Fechar diálogo', 'Mais ações', 'Fechar', 'Opções de Plugin title', 'Remover User tag']) {
      expect(screen.getByRole('button', { name })).toBeDefined()
    }
    expect(document.querySelector('[aria-label="Aumentar"]')).not.toBeNull()
    expect(document.querySelector('[aria-label="Diminuir"]')).not.toBeNull()
    expect(document.querySelector('[aria-label="Carregando widget"]')).not.toBeNull()
    expect(screen.getByText('px')).toBeDefined()
    expect(screen.getByText('Plugin title')).toBeDefined()
  })

  it('formats calendar dates with the context locale while retaining wall-clock values', () => {
    const date = new Date(2026, 9, 9, 14, 30)
    let confirmed: Date | undefined
    const view = render(localized(<DateTimePicker value={date} onConfirm={(value) => { confirmed = value }} onCancel={noop} />))
    expect(screen.getByRole('dialog', { name: 'Seletor de data e hora' })).toBeDefined()
    expect(screen.getByText(new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date))).toBeDefined()
    expect(screen.getByRole('gridcell', { name: new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(date) })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Aumentar horas' })).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(confirmed?.getTime()).toBe(date.getTime())
    view.rerender(localized(<DateTimePicker ariaLabel="Caller picker" value={date} onConfirm={noop} onCancel={noop} />, 'en'))
    expect(screen.getByRole('dialog', { name: 'Caller picker' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Previous month' })).toBeDefined()
  })

  it('updates toast accessibility without changing user/plugin notification content', () => {
    const view = render(localized(<ToastProvider />))
    let id = ''
    act(() => { id = pushToast({ kind: 'info', title: 'Plugin notice', body: 'User content', durationMs: null, action: { label: 'Plugin action', onSelect: noop } }) })
    try {
      expect(screen.getByRole('button', { name: 'Dispensar notificação' })).toBeDefined()
      expect(screen.getByTestId('toast-stack').getAttribute('aria-label')).toBe('Notificações')
      view.rerender(localized(<ToastProvider />, 'en'))
      expect(screen.getByRole('button', { name: 'Dismiss notification' })).toBeDefined()
      expect(screen.getByText('Plugin notice')).toBeDefined()
      expect(screen.getByText('User content')).toBeDefined()
      expect(screen.getByRole('button', { name: 'Plugin action' })).toBeDefined()
    } finally {
      act(() => dismissToast(id))
    }
  })

  it('updates class-boundary recovery text without resetting the captured error', () => {
    function Broken(): ReactNode { throw new Error('technical failure') }
    const log = spyOn(console, 'error').mockImplementation(noop)
    try {
      const child = <ErrorBoundary location="technical-location" silentToast><Broken /></ErrorBoundary>
      const view = render(localized(child, 'en'))
      expect(screen.getByRole('button', { name: 'Reset' })).toBeDefined()
      view.rerender(localized(child))
      expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeDefined()
      expect(document.querySelector('[data-error-location="technical-location"]')).not.toBeNull()
    } finally {
      log.mockRestore()
    }
  })

  it('bridges integrated Portuguese catalogs and date formatting through the admin provider', () => {
    setLocale('pt-BR')
    render(<I18nProvider>
      <DateTimePicker value={new Date(2026, 9, 9)} onConfirm={noop} onCancel={noop} />
      <MenuSearchHeader value="query" onValueChange={noop} />
      <Dialog open title="Caller dialog" onClose={noop} />
      <SplitButton label="Caller action" onClick={noop} menuItems={[{ id: 'caller-id', label: 'Caller item', onSelect: noop }]} />
      <WidgetSkeleton widgetId="caller-widget" span={1} />
    </I18nProvider>)
    expect(screen.getByText('outubro de 2026')).toBeDefined()
    expect(screen.getByRole('dialog', { name: 'Seletor de data e hora' })).toBeDefined()
    expect(screen.getByRole('combobox', { name: 'Buscar…' })).toBeDefined()
    for (const name of ['Confirmar', 'Cancelar', 'Mês anterior', 'Limpar busca', 'Fechar diálogo', 'Mais ações']) {
      expect(screen.getByRole('button', { name })).toBeDefined()
    }
    expect(document.querySelector('[aria-label="Carregando widget"]')).not.toBeNull()
  })

  it('switches mounted recovery, search and toast defaults through the admin provider', () => {
    setLocale('en')
    let renderAttempts = 0
    function Broken(): ReactNode {
      renderAttempts++
      throw new Error('technical failure')
    }
    const log = spyOn(console, 'error').mockImplementation(noop)
    let toastId = ''
    try {
      render(<I18nProvider>
        <MenuSearchHeader value="user query" onValueChange={noop} />
        <ToastProvider />
        <ErrorBoundary location="admin-bridge" silentToast><Broken /></ErrorBoundary>
      </I18nProvider>)
      act(() => {
        toastId = pushToast({ kind: 'info', title: 'Plugin notice', body: 'User content', durationMs: null })
      })
      const search = screen.getByRole('combobox', { name: 'Search…' })
      const clear = screen.getByRole('button', { name: 'Clear search' })
      const reset = screen.getByRole('button', { name: 'Reset' })
      const dismiss = screen.getByRole('button', { name: 'Dismiss notification' })
      const attemptsAfterFailure = renderAttempts
      expect(screen.getByTestId('toast-stack').getAttribute('aria-label')).toBe('Notifications')

      act(() => setLocale('pt-BR'))
      expect(screen.getByRole('combobox', { name: 'Buscar…' })).toBe(search)
      expect(screen.getByRole('button', { name: 'Limpar busca' })).toBe(clear)
      expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBe(reset)
      expect(screen.getByRole('button', { name: 'Dispensar notificação' })).toBe(dismiss)
      expect(screen.getByTestId('toast-stack').getAttribute('aria-label')).toBe('Notificações')
      expect(screen.getByText('Esta parte da página não pôde ser carregada.')).toBeDefined()
      expect(screen.getByText('Registramos o erro. Você pode tentar novamente ou atualizar a página.')).toBeDefined()
      expect(renderAttempts).toBe(attemptsAfterFailure)
      expect((search as HTMLInputElement).value).toBe('user query')
      expect(screen.getByText('Plugin notice')).toBeDefined()
      expect(screen.getByText('User content')).toBeDefined()

      act(() => setLocale('en'))
      expect(screen.getByRole('combobox', { name: 'Search…' })).toBe(search)
      expect(screen.getByRole('button', { name: 'Clear search' })).toBe(clear)
      expect(screen.getByRole('button', { name: 'Reset' })).toBe(reset)
      expect(screen.getByRole('button', { name: 'Dismiss notification' })).toBe(dismiss)
      expect(screen.getByTestId('toast-stack').getAttribute('aria-label')).toBe('Notifications')
      expect(renderAttempts).toBe(attemptsAfterFailure)
    } finally {
      if (toastId) act(() => dismissToast(toastId))
      log.mockRestore()
    }
  })
})
