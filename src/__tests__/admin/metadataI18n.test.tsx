import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { I18nProvider, resetI18nForTests, setLocale, translate, useI18n } from '@admin/i18n'
import { metadataEnglishMessages, metadataPortugueseMessages } from '../../admin/i18n/metadataMessages'
import { PREFERENCE_CATALOG, preferencesByCategory } from '@site/preferences/catalog'
import { PreferencesSection } from '../../admin/modals/Settings/sections/PreferencesSection'
import { PROVIDER_SPECS, getProviderSpec } from '../../admin/pages/ai/providerCatalog'
import { AI_SCOPE_META, AI_TOOL_SCOPES } from '@admin/ai/scopeCatalog'
import {
  CONTENT_STATUS_LABELS, FIELD_TYPE_LABELS, MEDIA_ROLE_LABELS,
  MEDIA_SORT_OPTIONS, MEDIA_TYPE_FILTERS, USER_STATUS_LABELS, USER_STATUS_OPTIONS,
} from '@admin/shared/presentationCatalog'
import { FIELD_TYPE_OPTIONS, MEDIA_KIND_OPTIONS, NUMBER_FORMAT_OPTIONS } from '../../admin/pages/data/components/NewFieldDialog/newFieldDialogModel'
import { ACTION_WORD, FILTER_LABELS, REVIEW_FILTERS, requestStatusLabel } from '../../admin/pages/branches/reviewFormat'
import { getAllCommands, getPluginPaletteSpotlightProviders, getScope } from '@admin/spotlight/commandRegistry'
import { getCappedResults } from '@admin/spotlight/spotlightSearch'
import { contentProvider } from '@admin/spotlight/providers/contentProvider'
import { pluginRuntime } from '@core/plugins/runtime'
import { getPluginsCommands } from '@admin/spotlight/commands/plugins'
import { SpotlightResults } from '@admin/spotlight/SpotlightResults'
import { SpotlightInternalContext, type SpotlightInternalContextValue } from '@admin/spotlight/spotlightContext'
import { DATA_FIELD_TYPES } from '@core/data/schemas'
import type { ComponentType } from 'react'
import type { CmsCurrentUser } from '@core/persistence'
import { AdminSessionProvider } from '@admin/session'
import { StepUpContext } from '../../admin/shared/StepUp/StepUpContext'
import type { UsersTab } from '../../admin/pages/users/tabs/UsersTab'
import type { MediaCanvas } from '../../admin/pages/media/components/MediaCanvas/MediaCanvas'
import { compileAdminMetadataModule } from './metadataCompilerHarness'
import { getMergedCommandList, rowId } from '@admin/spotlight/spotlightSearch'

beforeEach(() => {
  localStorage.clear()
  resetI18nForTests()
  setLocale('en')
})

afterEach(() => {
  cleanup()
  pluginRuntime.reset()
  localStorage.clear()
  resetI18nForTests()
})

describe('Phase 3 host-owned structured metadata', () => {
  it('ships complete data-only catalogs with exact key and interpolation parity', () => {
    expect(Object.keys(metadataPortugueseMessages).sort()).toEqual(Object.keys(metadataEnglishMessages).sort())
    const placeholders = (text: string) => [...text.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort()
    for (const key of Object.keys(metadataEnglishMessages) as (keyof typeof metadataEnglishMessages)[]) {
      expect(key.startsWith('metadata.')).toBe(true)
      expect(metadataPortugueseMessages[key].trim().length).toBeGreaterThan(0)
      expect(placeholders(metadataPortugueseMessages[key])).toEqual(placeholders(metadataEnglishMessages[key]))
      setLocale('en')
      expect(translate(key)).toBe(metadataEnglishMessages[key])
      setLocale('pt-BR')
      expect(translate(key)).toBe(metadataPortugueseMessages[key])
    }
    const source = readFileSync(new URL('../../admin/i18n/metadataMessages.ts', import.meta.url), 'utf8')
    expect(source).not.toMatch(/\btranslate\(/)
    const imports = [...source.matchAll(/from '([^']+)'/g)].map((match) => match[1])
    expect(imports.sort()).toEqual([
      './aiMetadataMessages', './preferenceMetadataMessages', './presentationMetadataMessages', './spotlightMetadataMessages',
    ])
    for (const resource of imports) {
      const catalog = readFileSync(new URL(`../../admin/i18n/${resource.slice(2)}.ts`, import.meta.url), 'utf8')
      expect(catalog).not.toMatch(/^\s*import\s/m)
      expect(catalog).not.toMatch(/\btranslate\(/)
    }
  })

  it('reads preference categories, descriptions and options in the current locale without changing stored definitions', () => {
    const before = PREFERENCE_CATALOG.map((pref) => ({ id: pref.id, category: pref.category, type: pref.type, default: pref.default }))
    const theme = PREFERENCE_CATALOG.find((pref) => pref.id === 'theme')!
    expect(theme.label).toBe('Theme')
    setLocale('pt-BR')
    expect(theme.label).toBe('Tema')
    expect(theme.options.map((option) => [option.value, option.label])).toEqual([['dark', 'Escuro'], ['light', 'Claro']])
    expect(preferencesByCategory().find((group) => group.id === 'layers')?.label).toBe('Painel de camadas')
    expect(theme.description).toContain('interface administrativa')
    expect(PREFERENCE_CATALOG.map((pref) => ({ id: pref.id, category: pref.category, type: pref.type, default: pref.default }))).toEqual(before)
  })

  it('updates an already-rendered Preferences screen, including nested option labels and history controls', () => {
    render(<I18nProvider><PreferencesSection /></I18nProvider>)
    expect(screen.getByLabelText('Theme')).toBeTruthy()
    expect(screen.getByText('Clear command history')).toBeTruthy()
    act(() => setLocale('pt-BR'))
    expect(screen.getByLabelText('Tema')).toBeTruthy()
    expect(screen.getByText('Escuro')).toBeTruthy()
    expect(screen.getByText('Painel de camadas')).toBeTruthy()
    expect(screen.getByText('Limpar histórico de comandos')).toBeTruthy()
    act(() => setLocale('en'))
    expect(screen.getByLabelText('Theme')).toBeTruthy()
  })

  it('keeps cached command objects, execution functions, capability gates, group IDs and arguments stable', () => {
    const commands = getAllCommands().filter((command) => !command.id.startsWith('plugin:'))
    const identity = commands.map((command) => ({ id: command.id, group: command.group, capability: command.capability, workspaces: command.workspaces, run: command.run }))
    const publish = commands.find((command) => command.id === 'editor.publish')!
    const page = commands.find((command) => command.id === 'pages.newPage')!
    expect(publish.title).toBe('Publish')
    setLocale('pt-BR')
    const switched = getAllCommands().filter((command) => !command.id.startsWith('plugin:'))
    for (let index = 0; index < commands.length; index++) expect(switched[index]).toBe(commands[index])
    expect(switched.map((command) => ({ id: command.id, group: command.group, capability: command.capability, workspaces: command.workspaces, run: command.run }))).toEqual(identity)
    expect(publish.title).toBe('Publicar')
    expect(publish.subtitle).toBe('Publique o rascunho atual em produção')
    expect(page.args?.[0].id).toBe('title')
    expect(page.args?.[0].label).toBe('Título da página')
    expect(page.args?.[0].placeholder).toBe('Por exemplo, sobre nós')
  })

  it('does not freeze derived preference-command titles, descriptions or select arguments in the command cache', () => {
    const commands = getAllCommands()
    const theme = commands.find((command) => command.id === 'settings.pref.theme')!
    const toggle = commands.find((command) => command.id === 'settings.pref.hoverPreview')!
    expect(theme.title).toBe('Set: Theme…')
    setLocale('pt-BR')
    expect(theme.title).toBe('Definir: Tema…')
    expect(theme.args?.[0].label).toBe('Tema')
    expect(theme.args?.[0].options?.map((option) => [option.value, option.label])).toEqual([['dark', 'Escuro'], ['light', 'Claro']])
    expect(toggle.title).toBe('Alternar: Pré-visualizar sugestões ao passar o mouse')
    expect(toggle.subtitle).toContain('Aplique temporariamente')
    setLocale('en')
    expect(theme.title).toBe('Set: Theme…')
  })

  it('searches translated command titles and retains English command aliases', () => {
    getAllCommands()
    setLocale('pt-BR')
    expect(getCappedResults('Publicar', null).some((result) => result.command.id === 'editor.publish')).toBe(true)
    expect(getCappedResults('publish', null).some((result) => result.command.id === 'editor.publish')).toBe(true)
    expect(getCappedResults('Tema', null).some((result) => result.command.id === 'settings.pref.theme')).toBe(true)
  })

  it('updates static scope metadata and server-provider labels after construction', () => {
    const scope = getScope('pages')!
    expect(scope.placeholder).toBe('Search pages…')
    expect(contentProvider.label).toBe('Content')
    setLocale('pt-BR')
    expect(scope.id).toBe('pages')
    expect(scope.title).toBe('Trocar de página')
    expect(scope.placeholder).toBe('Buscar páginas…')
    expect(contentProvider.id).toBe('content')
    expect(contentProvider.label).toBe('Conteúdo')
  })

  it('updates an open palette’s command rows and core group headers without reopening it', () => {
    const context: SpotlightInternalContextValue = {
      state: { phase: 'open', query: 'account', scopeStack: [{ scopeId: 'root', pendingArgs: {} }], highlightedIndex: 0, asyncResults: {}, loadingProviders: new Set(), argMode: null, pendingConfirm: null },
      dispatch: () => {}, commandContext: null, runCommand: async () => {}, runCommandWithArgs: async () => {},
    }
    render(<SpotlightInternalContext.Provider value={context}>
      <SpotlightResults listboxId="metadata-results" highlightedIndex={0} onHighlightChange={() => {}} onSelectArg={() => {}} onRun={() => {}} activeScopeId="root" />
    </SpotlightInternalContext.Provider>)
    expect(screen.getByText('Edit profile')).toBeTruthy()
    expect(screen.getAllByText('Account').some((element) => element.tagName === 'SPAN')).toBe(true)
    act(() => setLocale('pt-BR'))
    expect(screen.getByText('Editar perfil')).toBeTruthy()
    expect(screen.getByText('Conta')).toBeTruthy()
  })

  it('translates host-owned provider/scope descriptions while preserving brands, endpoints and protocol values', () => {
    const identities = PROVIDER_SPECS.map((provider) => [provider.id, provider.authMode])
    const anthropic = getProviderSpec('anthropic')
    setLocale('pt-BR')
    expect(anthropic.label).toBe('Anthropic')
    expect(anthropic.endpointLabel).toBe('api.anthropic.com')
    expect(anthropic.shortLabel).toBe('Modelos Claude')
    expect(anthropic.description).toContain('Modelos Claude')
    expect(getProviderSpec('openai').label).toBe('OpenAI')
    expect(getProviderSpec('openai-compatible').label).toBe('Endpoint personalizado')
    expect(PROVIDER_SPECS.map((provider) => [provider.id, provider.authMode])).toEqual(identities)
    expect(AI_TOOL_SCOPES).toEqual(['site', 'content', 'data', 'plugin'])
    expect(AI_SCOPE_META.site.label).toBe('Editor do site')
    expect(AI_SCOPE_META.data.description).toBe('Assistência no espaço de dados e operações de tabelas.')
  })

  it('shares complete field-type labels without changing field/format values', () => {
    expect(Object.keys(FIELD_TYPE_LABELS).sort()).toEqual([...DATA_FIELD_TYPES].sort())
    const values = FIELD_TYPE_OPTIONS.map((option) => option.value)
    setLocale('pt-BR')
    expect(FIELD_TYPE_LABELS.longText).toBe('Texto longo')
    expect(FIELD_TYPE_LABELS.fieldSchema).toBe('Esquema de campos')
    expect(FIELD_TYPE_LABELS.url).toBe('URL')
    expect(FIELD_TYPE_OPTIONS.map((option) => option.value)).toEqual(values)
    for (const option of FIELD_TYPE_OPTIONS) expect(option.label).toBe(FIELD_TYPE_LABELS[option.value])
    expect(NUMBER_FORMAT_OPTIONS.find((option) => option.value === 'currency')?.label).toBe('Moeda')
    expect(MEDIA_KIND_OPTIONS.find((option) => option.value === 'image')?.label).toBe('Imagem')
  })

  it('localizes status/filter/action presentation without changing filter values or state IDs', () => {
    const filters = MEDIA_TYPE_FILTERS.map((option) => option.value)
    const sorts = MEDIA_SORT_OPTIONS.map((option) => option.value)
    setLocale('pt-BR')
    expect(CONTENT_STATUS_LABELS.draft).toBe('Rascunho')
    expect(USER_STATUS_LABELS.suspended).toBe('Suspenso')
    expect(USER_STATUS_OPTIONS.map((option) => [option.value, option.label, option.textValue])).toEqual([['active', 'Ativo', 'Ativo'], ['suspended', 'Suspenso', 'Suspenso']])
    expect(MEDIA_TYPE_FILTERS.map((option) => option.value)).toEqual(filters)
    expect(MEDIA_SORT_OPTIONS.map((option) => option.value)).toEqual(sorts)
    expect(MEDIA_TYPE_FILTERS[1].label).toBe('Imagens')
    expect(MEDIA_SORT_OPTIONS[0].label).toBe('Mais recentes')
    expect(MEDIA_ROLE_LABELS.font).toBe('Fontes')
    expect(REVIEW_FILTERS).toEqual(['all', 'pages', 'content', 'files', 'conflicts', 'comments'])
    expect(FILTER_LABELS.comments).toBe('Com comentários')
    expect(ACTION_WORD.delete).toBe('removido')
    expect(requestStatusLabel('open')).toBe('Aguardando revisão')
  })

  it('never translates plugin command/provider/argument/option metadata even when it matches host English', async () => {
    pluginRuntime.registerCommand('metadata-test', {
      id: 'metadata-test.publish', label: 'Publish', subtitle: 'Content', run: () => {},
      args: [{ id: 'value', label: 'Theme', type: 'select', placeholder: 'New title', options: [{ value: 'custom', label: 'Dark' }] }],
    })
    pluginRuntime.registerPaletteProvider('metadata-test', {
      id: 'metadata-test.provider', label: 'Content', search: async () => [{ id: 'result', title: 'Publish', subtitle: 'Draft', run: () => {} }],
    })
    setLocale('pt-BR')
    const command = getPluginsCommands().find((item) => item.id.includes('metadata-test.publish'))!
    expect(command.title).toBe('Publish')
    expect(command.subtitle).toBe('Content')
    expect(command.args?.[0].label).toBe('Theme')
    expect(command.args?.[0].options?.[0]).toEqual({ value: 'custom', label: 'Dark' })
    const provider = getPluginPaletteSpotlightProviders().find((item) => item.id.includes('metadata-test'))!
    expect(provider.label).toBe('Content')
    const results = await provider.search('', { workspace: 'site' } as never, new AbortController().signal)
    expect(results[0].title).toBe('Publish')
    expect(results[0].subtitle).toBe('Draft')
  })
})

function MetadataHarness() {
  useI18n()
  return <><span>{getProviderSpec('anthropic').description}</span><span>{AI_SCOPE_META.site.label}</span><span>{FIELD_TYPE_LABELS.text}</span></>
}

it('re-renders metadata consumers on locale change without initializing admin state in core/UI', () => {
  render(<MetadataHarness />)
  expect(screen.getByText('Site editor')).toBeTruthy()
  act(() => setLocale('pt-BR'))
  expect(screen.getByText('Editor do site')).toBeTruthy()
  expect(screen.getByText('Texto')).toBeTruthy()
  expect(screen.getByText('Modelos Claude com uso avançado de ferramentas e raciocínio em contextos longos.')).toBeTruthy()
})

function metadataUser(): CmsCurrentUser {
  return {
    id: 'metadata-user',
    email: 'media-manager@example.com',
    displayName: 'Media Manager',
    status: 'active',
    role: {
      id: 'role_media_manager',
      slug: 'media-manager',
      name: 'Media Manager',
      description: 'Media test role',
      isSystem: false,
      capabilities: [],
    },
    capabilities: [],
    lastLoginAt: null,
    failedLoginCount: 0,
    lockedUntil: null,
    passwordUpdatedAt: null,
    mfaEnabled: false,
    mfaEnabledAt: null,
    mfaRecoveryCodesRemaining: 0,
    stepUpAuthMode: 'password',
    stepUpWindowMinutes: 15,
    avatarMediaId: null,
    avatarUrl: null,
    gravatarHash: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

function metadataWorkspace(): Parameters<typeof MediaCanvas>[0]["workspace"] {
  return {
    loading: false,
    error: null,
    clearError: () => {},
    refresh: async () => {},
    folders: [],
    folderTree: [],
    folderById: new Map(),
    assets: [],
    visibleAssets: [],
    tagPalette: [],
    folderSelection: '__all__',
    setFolderSelection: () => {},
    selectedAssetId: null,
    selectedAsset: null,
    setSelectedAssetId: () => {},
    selectedAssetIds: new Set(),
    selectedAssets: [],
    toggleAssetInSelection: () => {},
    addToSelection: () => {},
    selectRange: () => {},
    clearSelection: () => {},
    uploadQueue: {
      items: [],
      active: false,
      enqueue: () => {},
      retry: () => {},
      remove: () => {},
      clearFinished: () => {},
      cancelAll: () => {},
    },
    filters: { type: 'all', q: '', tag: '', sort: 'newest' },
    setFilterType: () => {},
    setQuery: () => {},
    setTag: () => {},
    setSort: () => {},
    uploadFiles: async () => {},
    renameAsset: async () => null,
    updateAsset: async () => null,
    replaceAssetFile: async () => null,
    trashAsset: async () => {},
    restoreAsset: async () => null,
    purgeAsset: async () => {},
    setAssetFolders: async () => null,
    moveAssetsToFolder: async () => {},
    createFolder: async () => null,
    renameFolder: async () => null,
    moveFolder: async () => null,
    deleteFolder: async () => {},
  }
}

describe('production-compiled metadata consumers', () => {
  it('updates mounted media filters and sort options with stable workspace props', async () => {
    const { module, code } = await compileAdminMetadataModule<{ MediaCanvas: typeof MediaCanvas }>(new URL('../../admin/pages/media/components/MediaCanvas/MediaCanvas.tsx', import.meta.url))
    expect(code).toMatch(/if \([^\n]*!== locale\)/)
    const workspace = metadataWorkspace()
    let selected = ''
    workspace.setFilterType = (value) => { selected = value }
    const Canvas = module.MediaCanvas
    render(<AdminSessionProvider user={metadataUser()}><Canvas workspace={workspace} /></AdminSessionProvider>)
    const sort = screen.getByRole('combobox', { name: 'Sort media' }) as HTMLInputElement
    expect(sort.value).toBe('Newest')
    expect(screen.getByText('Images')).toBeTruthy()
    act(() => setLocale('pt-BR'))
    expect(sort.value).toBe('Mais recentes')
    fireEvent.click(screen.getByText('Imagens'))
    expect(selected).toBe('image')
    act(() => setLocale('en'))
    expect(screen.getByRole('combobox', { name: 'Sort media' })).toBe(sort)
    expect(sort.value).toBe('Newest')
  })

  it('updates an open compiled user dialog without changing its form or remounting', async () => {
    const { module, code } = await compileAdminMetadataModule<{ UsersTab: typeof UsersTab }>(new URL('../../admin/pages/users/tabs/UsersTab.tsx', import.meta.url))
    expect(code).toMatch(/if \([^\n]*!== locale\)/)
    const user = metadataUser()
    const Users = module.UsersTab
    render(<StepUpContext.Provider value={{ runStepUp: (action) => action() }}><Users canManageUsers data={{ users: [user], roles: [user.role], events: [], loading: false, error: null, defaultAssignableRoleId: user.role.id, setUsers: () => {}, setRoles: () => {}, setError: () => {}, refresh: async () => {} }} /></StepUpContext.Provider>)
    fireEvent.click(screen.getByRole('button', { name: 'Actions for Media Manager' }))
    fireEvent.click(screen.getByText('Edit'))
    const status = screen.getByRole('combobox', { name: 'Status' }) as HTMLInputElement
    expect(status.value).toBe('Active')
    act(() => setLocale('pt-BR'))
    expect(screen.getByRole('combobox', { name: 'Status' })).toBe(status)
    expect(status.value).toBe('Ativo')
    fireEvent.click(status)
    expect(screen.getAllByText('Suspenso').length).toBeGreaterThan(0)
    act(() => setLocale('en'))
    expect(status.value).toBe('Active')
    expect(screen.getByDisplayValue(user.email)).toBeTruthy()
  })

  it('recomputes compiled breadcrumbs for an unchanged scope stack', async () => {
    const { module, code } = await compileAdminMetadataModule<{ ScopeBreadcrumb: ComponentType<{ scopeStack: { scopeId: string }[] }> }>(new URL('../../admin/spotlight/SpotlightResults.tsx', import.meta.url), ['ScopeBreadcrumb'])
    expect(code).toMatch(/if \([^\n]*!== locale[^\n]*!== scopeStack\)/)
    getAllCommands()
    const ids = ['editor', 'pages', 'breakpoints', 'visualComponents', 'content', 'data', 'media', 'plugins', 'users', 'settings', 'help', 'codeEditor', 'pluginCommands']
    const scopeStack = ['root', ...ids, 'plugin-user-title'].map((scopeId) => ({ scopeId }))
    const Breadcrumb = module.ScopeBreadcrumb
    const { container } = render(<Breadcrumb scopeStack={scopeStack} />)
    const root = container.firstChild
    for (const locale of ['pt-BR', 'en'] as const) {
      act(() => setLocale(locale))
      for (const id of ids) expect(container.textContent).toContain(getScope(id)?.title ?? id)
      expect(container.textContent).toContain('plugin-user-title')
      expect(container.firstChild).toBe(root)
    }
  })

  it('keeps compiled Spotlight highlighting and hover indices aligned with translated search results', async () => {
    const { module } = await compileAdminMetadataModule<{ SpotlightResults: typeof SpotlightResults }>(new URL('../../admin/spotlight/SpotlightResults.tsx', import.meta.url))
    const asyncResults = { content: [{ id: 'user-result', title: 'User-owned title', group: 'content' as const, run: () => {} }] }
    const context: SpotlightInternalContextValue = {
      state: { phase: 'open', query: 'Publicar', scopeStack: [{ scopeId: 'root', pendingArgs: {} }], highlightedIndex: 0, asyncResults, loadingProviders: new Set(), argMode: null, pendingConfirm: null },
      dispatch: () => {}, commandContext: null, runCommand: async () => {}, runCommandWithArgs: async () => {},
    }
    let hovered = -1
    const Results = module.SpotlightResults
    render(<SpotlightInternalContext.Provider value={context}><Results listboxId="compiled-results" highlightedIndex={0} onHighlightChange={(index) => { hovered = index }} onSelectArg={() => {}} onRun={() => {}} activeScopeId="root" /></SpotlightInternalContext.Provider>)
    const list = screen.getByRole('listbox')
    for (const locale of ['en', 'pt-BR', 'en'] as const) {
      act(() => setLocale(locale))
      const expected = getMergedCommandList('Publicar', null, 'root', asyncResults)
      expect(expected.length).toBeGreaterThan(0)
      expect(list.querySelector('[aria-selected="true"]')?.id).toBe(rowId(expected[0].id))
      for (const [index, command] of expected.entries()) {
        const row = document.getElementById(rowId(command.id))!
        fireEvent.mouseEnter(row)
        expect(hovered).toBe(index)
      }
      expect(screen.getByText('User-owned title')).toBeTruthy()
      expect(screen.getByRole('listbox')).toBe(list)
    }
  })
})
