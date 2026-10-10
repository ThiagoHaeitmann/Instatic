import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import { formatNumber, resetI18nForTests, setLocale, translate, type TranslationKey } from '@admin/i18n'
import { translateMessage } from '../../admin/i18n/runtime'
import { dashboardWidgetRegistry, type DashboardWidgetDefinition } from '@core/dashboard'
import { dashboardEnglishMessages, dashboardPortugueseMessages } from '../../admin/i18n/dashboardMessages'
import { BlockLibrary } from '../../admin/pages/dashboard/components/BlockLibrary'
import { LiquidProgressRing } from '../../admin/pages/dashboard/components/LiquidProgressRing'
import { useDashboardWidgets } from '../../admin/pages/dashboard/hooks/useDashboardWidgets'
import { registerFirstPartyDashboardWidgets } from '../../admin/pages/dashboard/widgets'
import { DomainWidget } from '../../admin/pages/dashboard/widgets/DomainWidget'

const PLUGIN_ID = 'dashboard-i18n-test.analytics'
let unregisterPlugin: (() => void) | undefined

function PluginPreview() {
  return <span>My Analytics preview</span>
}

beforeEach(() => {
  localStorage.clear()
  resetI18nForTests()
  setLocale('en')
  registerFirstPartyDashboardWidgets()
})

afterEach(() => {
  cleanup()
  unregisterPlugin?.()
  unregisterPlugin = undefined
  localStorage.clear()
  resetI18nForTests()
})

function LibraryHarness() {
  const widgets = useDashboardWidgets()
  return (
    <DndContext>
      <BlockLibrary
        panelOpen
        dragging={false}
        draggingFromGrid={false}
        availableWidgets={widgets.filter((widget) => widget.id === 'domain' || widget.id === PLUGIN_ID)}
        height={320}
        onHeightChange={() => {}}
        onAdd={() => {}}
        onClose={() => {}}
      />
    </DndContext>
  )
}

function registerPlugin() {
  const domain = dashboardWidgetRegistry.get('domain')!
  const plugin: DashboardWidgetDefinition = {
    id: PLUGIN_ID,
    ownerId: 'dashboard-i18n-test',
    name: 'My Analytics',
    description: 'Plugin-authored description',
    icon: domain.icon,
    defaultSize: 3,
    tint: 'sky',
    render: PluginPreview,
  }
  unregisterPlugin = dashboardWidgetRegistry.register(plugin)
  return plugin
}

describe('Dashboard i18n runtime and components', () => {
  it('has exact English/Portuguese key and interpolation parity in the integrated runtime', () => {
    expect(Object.keys(dashboardPortugueseMessages).sort()).toEqual(Object.keys(dashboardEnglishMessages).sort())
    for (const key of Object.keys(dashboardEnglishMessages) as (keyof typeof dashboardEnglishMessages)[]) {
      expect(key.startsWith('dashboard.')).toBe(true)
      expect(key).not.toMatch(/\.(?:action|step)\d+(?:\.|$)/)
      expect(dashboardEnglishMessages[key].trim().length).toBeGreaterThan(0)
      expect(dashboardPortugueseMessages[key].trim().length).toBeGreaterThan(0)
      const placeholders = (text: string) => [...text.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort()
      expect(placeholders(dashboardPortugueseMessages[key])).toEqual(placeholders(dashboardEnglishMessages[key]))
      expect(translateMessage('en', key, {}, dashboardEnglishMessages, dashboardEnglishMessages))
        .toBe(dashboardEnglishMessages[key])
      expect(translateMessage('pt-BR', key, {}, dashboardPortugueseMessages, dashboardEnglishMessages))
        .toBe(dashboardPortugueseMessages[key])
    }

    const runtimeKeys = [
      'dashboard.title',
      'dashboard.widgets.domain.name',
      'dashboard.library.instructions',
      'dashboard.onboarding.steps.identity.title',
      'dashboard.activity.actions.data.row.create',
    ] as const satisfies readonly TranslationKey[]
    for (const key of runtimeKeys) {
      setLocale('en')
      expect(translate(key)).toBe(dashboardEnglishMessages[key])
      setLocale('pt-BR')
      expect(translate(key)).toBe(dashboardPortugueseMessages[key])
    }
  })

  it('updates a real widget and progress accessible name on locale changes', () => {
    render(<><DomainWidget span={3} editing /><LiquidProgressRing value={2} total={5} /></>)
    expect(screen.getByText('Domain')).toBeDefined()
    expect(screen.getByText('SSL · auto-renew')).toBeDefined()
    expect(screen.getByText('verified')).toBeDefined()
    expect(screen.getByRole('img', { name: '2 of 5 steps complete' })).toBeDefined()

    act(() => setLocale('pt-BR'))
    expect(screen.getByText('Domínio')).toBeDefined()
    expect(screen.getByText('SSL · renovação automática')).toBeDefined()
    expect(screen.getByText('verificado')).toBeDefined()
    expect(screen.getByText('ativo')).toBeDefined()
    expect(screen.getByRole('img', { name: '2 de 5 etapas concluídas' })).toBeDefined()
    expect(screen.getByText('instatic.com')).toBeDefined()
    expect(screen.getByText('HTTPS')).toBeDefined()
    expect(screen.queryByText('Domain')).toBeNull()
  })

  it('preserves getters and updates host metadata after registration without replacing the registry snapshot', () => {
    const plugin = registerPlugin()
    const domain = dashboardWidgetRegistry.get('domain')!
    const snapshot = dashboardWidgetRegistry.list()
    expect(typeof Object.getOwnPropertyDescriptor(domain, 'name')?.get).toBe('function')
    expect(typeof Object.getOwnPropertyDescriptor(domain, 'description')?.get).toBe('function')
    expect(domain.name).toBe('Domain')
    expect(domain.description).toBe('DNS + SSL status')

    setLocale('pt-BR')
    expect(dashboardWidgetRegistry.get('domain')).toBe(domain)
    expect(dashboardWidgetRegistry.list()).toBe(snapshot)
    expect(snapshot.find((widget) => widget.id === 'domain')?.name).toBe('Domínio')
    expect(domain.description).toBe('Status de DNS + SSL')
    expect(dashboardWidgetRegistry.get(PLUGIN_ID)).toBe(plugin)
    expect(plugin.name).toBe('My Analytics')
    expect(plugin.description).toBe('Plugin-authored description')
  })

  it('updates real BlockLibrary metadata, search and ARIA while leaving plugin labels unchanged', () => {
    registerPlugin()
    render(<LibraryHarness />)
    let library = within(screen.getByRole('dialog', { name: 'Block library' }))
    expect(library.getByText('DNS + SSL status')).toBeDefined()
    expect(library.getByText('System')).toBeDefined()
    expect(library.getByRole('button', { name: 'Add Domain to dashboard' })).toBeDefined()
    expect(library.getByRole('group', { name: 'Domain block preview' })).toBeDefined()
    expect(library.getByText('My Analytics')).toBeDefined()

    act(() => setLocale('pt-BR'))
    library = within(screen.getByRole('dialog', { name: 'Biblioteca de blocos' }))
    expect(library.getByText('Status de DNS + SSL')).toBeDefined()
    expect(library.getByText('Sistema')).toBeDefined()
    expect(library.getByRole('button', { name: 'Adicionar Domínio ao painel' })).toBeDefined()
    expect(library.getByRole('group', { name: 'Prévia do bloco Domínio' })).toBeDefined()
    expect(library.getByRole('button', { name: 'Adicionar My Analytics ao painel' })).toBeDefined()
    expect(library.getByText('My Analytics')).toBeDefined()
    expect(library.getByText('Plugin-authored description')).toBeDefined()
    expect(library.getByText('Plugin · dashboard-i18n-test')).toBeDefined()
    expect(library.getByText('Blocos de plugins')).toBeDefined()

    fireEvent.change(library.getByRole('textbox', { name: 'Buscar blocos' }), { target: { value: 'Domínio' } })
    expect(library.getByText('Status de DNS + SSL')).toBeDefined()
    expect(library.queryByText('My Analytics')).toBeNull()
    act(() => setLocale('en'))
    library = within(screen.getByRole('dialog', { name: 'Block library' }))
    expect(library.getByText('No blocks match “Domínio”.')).toBeDefined()
    fireEvent.change(library.getByRole('textbox', { name: 'Search blocks' }), { target: { value: 'My Analytics' } })
    expect(library.getByText('My Analytics')).toBeDefined()
    expect(library.getByText('Plugin-authored description')).toBeDefined()
  })

  it('uses integrated interpolation and locale-formatted counts without translating user text', () => {
    setLocale('pt-BR')
    expect(translate('dashboard.blocks', { count: 1234, number: formatNumber(1234) })).toBe('1.234 blocos')
    expect(translate('dashboard.greeting.morningNamed', { name: 'João Silva' })).toBe('Bom dia, João Silva.')
    expect(translate('dashboard.library.noMatches', { query: 'Plugin · My Analytics' }))
      .toBe('Nenhum bloco corresponde a “Plugin · My Analytics”.')
    expect(translate('dashboard.ai.chatsWithScope', { count: 2, number: 2, scope: 'site-editor' }))
      .toBe('2 conversas neste mês · principal: site-editor')
  })

  it('covers zero, singular and plural widget captions through the runtime in both locales', () => {
    for (const locale of ['en', 'pt-BR'] as const) {
      setLocale(locale)
      for (const key of ['dashboard.pages.drafts', 'dashboard.posts.categories', 'dashboard.ai.chats', 'dashboard.ai.chatsWithScope', 'dashboard.media.files', 'dashboard.status.updates'] as const) {
        for (const count of [0, 1, 2]) {
          const text = translate(key, { count, number: formatNumber(count), size: '1 KB', scope: 'site' })
          expect(text).not.toContain('dashboard.')
          expect(text).not.toContain('{{')
        }
      }
    }
    setLocale('en')
    expect(translate('dashboard.pages.drafts', { count: 1, number: 1 })).toBe('1 draft')
    expect(translate('dashboard.pages.drafts', { count: 2, number: 2 })).toBe('2 drafts')
    setLocale('pt-BR')
    expect(translate('dashboard.pages.drafts', { count: 1, number: 1 })).toBe('1 rascunho')
    expect(translate('dashboard.pages.drafts', { count: 2, number: 2 })).toBe('2 rascunhos')
  })

  it('provides a message for every literal Dashboard translation key', async () => {
    const workspace = new URL('../../admin/pages/dashboard/', import.meta.url).pathname
    for await (const file of new Bun.Glob('**/*.{ts,tsx}').scan(workspace)) {
      if (file.includes('.test.')) continue
      const source = await Bun.file(`${workspace}/${file}`).text()
      for (const match of source.matchAll(/['"](dashboard\.[\w.-]+)['"]/g)) {
        const key = match[1]!
        expect(key in dashboardEnglishMessages || `${key}.other` in dashboardEnglishMessages).toBe(true)
      }
    }
  })

  it('keeps resources data-only so eager catalogs cannot import Dashboard code', async () => {
    const source = await Bun.file(new URL('../../admin/i18n/dashboardMessages.ts', import.meta.url)).text()
    expect(source).not.toMatch(/^\s*import\s/m)
    expect(source).not.toMatch(/from ['"].*dashboard/)
  })
})
