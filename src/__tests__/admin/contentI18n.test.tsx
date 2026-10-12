import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createRef, useState, type ComponentType, type ReactNode } from 'react'
import { readFileSync } from 'node:fs'
import { I18nProvider, formatDate, formatNumber, resetI18nForTests, setLocale, translate } from '@admin/i18n'
import { contentEnglishMessages, contentPortugueseMessages } from '../../admin/i18n/contentMessages'
import { contentFeedback, contentFeedbackError, renderContentFeedback, reportContentError } from '@admin/shared/contentFeedback'
import { ToastProvider } from '@ui/components/Toast'
import { buildPostTypeDefaultFields } from '@core/data/fields'
import type { DataRow, DataTable } from '@core/data/schemas'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { exitSuggestion, SuggestionPluginKey } from '@tiptap/suggestion'
import { compileAdminMetadataModule } from './metadataCompilerHarness'
import type { ContentExplorerPanel } from '../../admin/pages/content/components/ContentExplorerPanel/ContentExplorerPanel'
import type { ContentSettingsPanel } from '../../admin/pages/content/components/ContentSettingsPanel/ContentSettingsPanel'
import type { ContentToolbar } from '../../admin/pages/content/components/ContentToolbar/ContentToolbar'
import type { ContentModeToggle } from '../../admin/pages/content/components/ContentModeToggle/ContentModeToggle'
import type { ContentItemRenameDialog } from '../../admin/pages/content/components/ContentItemRenameDialog/ContentItemRenameDialog'
import type { ContentCollectionSettingsDialog } from '../../admin/pages/content/components/ContentCollectionSettingsDialog/ContentCollectionSettingsDialog'
import type { BodySlashMenu, SlashMenuHandle } from '../../admin/pages/content/components/BodySlashMenu/BodySlashMenu'
import { SlashCommand } from '../../admin/pages/content/components/BodySlashMenu/SlashCommand'
import type { TiptapBodyEditor } from '../../admin/pages/content/TiptapBodyEditor'
import type { SchedulePublishDialog } from '../../admin/modals/SchedulePublishDialog/SchedulePublishDialog'
import type { VersionHistoryDialog } from '../../admin/shared/VersionHistoryDialog/VersionHistoryDialog'
import { syncContentEditorLocale } from '../../admin/pages/content/utils/editorI18n'
import type { ContentDocumentCanvas } from '../../admin/pages/content/components/ContentDocumentCanvas/ContentDocumentCanvas'
import type { ContentInsertNotch } from '../../admin/pages/content/components/ContentInsertNotch'
import type { LiveCanvas } from '../../admin/pages/content/components/LiveCanvas/LiveCanvas'
import type { DataBindingPicker } from '@admin/shared/DataBindingPicker'
import { clearDataMetaCache } from '../../admin/shared/DataBindingPicker/cache'
import { runEntryOp } from '../../admin/pages/content/utils/entryOp'

const originalFetch = globalThis.fetch
const timestamp = '2026-05-09T10:00:00.000Z'
const collection: DataTable = {
  id: 'posts', name: 'Content', slug: 'posts', kind: 'postType', singularLabel: 'Article', pluralLabel: 'Articles',
  routeBase: '/blog', primaryFieldId: 'title', fields: buildPostTypeDefaultFields(), system: true,
  createdByUserId: null, updatedByUserId: null, createdAt: timestamp, updatedAt: timestamp,
}
const entry: DataRow = {
  id: 'row_1', tableId: collection.id, cells: { title: 'Title', body: '**Body**', slug: 'title', seoTitle: 'SEO title' }, slug: 'title', status: 'draft',
  authorUserId: null, createdByUserId: null, updatedByUserId: null, publishedByUserId: null,
  author: null, createdBy: null, updatedBy: null, publishedBy: null, createdAt: timestamp, updatedAt: timestamp,
  publishedAt: null, scheduledPublishAt: null, deletedAt: null,
}
const noop = () => {}
const asyncNoop = async () => {}
function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }) }
function mount(children: ReactNode) { return render(<I18nProvider>{children}</I18nProvider>) }
async function compiled<T>(path: string, exports: readonly string[] = []) {
  return compileAdminMetadataModule<T>(new URL(`../../admin/${path}`, import.meta.url), exports, true)
}
function locale(value: 'en' | 'pt-BR') { act(() => setLocale(value)) }
function explorerProps(): Parameters<typeof ContentExplorerPanel>[0] {
  return {
    loading: false, error: null, collections: [collection], entries: [entry], selectedCollection: collection,
    selectedCollectionId: collection.id, selectedEntryId: entry.id, canCreateCollection: true, canCreateEntry: true,
    canManageCollections: true, canEditEntry: () => true, canMoveEntry: () => true, canPublishEntry: () => true,
    getFeaturedMediaAssetForEntry: () => null, onSelectCollection: noop, onSelectEntry: noop, onClose: noop,
    entryActions: { createCollection: noop, updateCollection: asyncNoop, deleteCollection: asyncNoop, createEntry: noop,
      renameEntry: asyncNoop, publishEntry: asyncNoop, convertEntryToDraft: asyncNoop, deleteEntry: asyncNoop,
      duplicateEntry: asyncNoop, moveEntryToCollection: asyncNoop },
  }
}
function settingsProps(): Parameters<typeof ContentSettingsPanel>[0] {
  return {
    selectedEntry: entry, authors: [], authorsLoading: false, collections: [collection], tables: [collection], selectedCollection: collection,
    loading: false, slug: 'title', slugId: 'slug', seoTitle: 'SEO title', seoTitleId: 'seo-title', seoDescription: 'description', seoDescriptionId: 'seo-description',
    publicPath: '/blog/title', mediaError: null, featuredMediaId: null, featuredMediaAsset: null, customCells: {},
    canEditEntry: true, canMoveEntry: true, canPublishEntry: true, canChangeAuthor: false,
    onCollectionChange: noop, onAuthorChange: noop, onSlugChange: noop, onSeoTitleChange: noop, onSeoDescriptionChange: noop,
    onCustomCellChange: noop, onStatusChange: noop, onChooseFeaturedMedia: noop, onClearFeaturedMedia: noop, onEditFeaturedMedia: noop,
  }
}
beforeEach(() => {
  localStorage.clear(); resetI18nForTests(); setLocale('en')
  globalThis.fetch = (async () => json({ error: 'E_DB_42 / raw server detail' }, 404)) as typeof fetch
})
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; localStorage.clear(); resetI18nForTests() })

describe('Phase 5 Content catalogs and presentation boundaries', () => {
  it('ships data-only exact key and named-interpolation parity', () => {
    expect(Object.keys(contentPortugueseMessages).sort()).toEqual(Object.keys(contentEnglishMessages).sort())
    const placeholders = (value: string) => [...value.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort()
    for (const key of Object.keys(contentEnglishMessages) as (keyof typeof contentEnglishMessages)[]) {
      expect(contentPortugueseMessages[key].trim()).not.toBe('')
      expect(placeholders(contentPortugueseMessages[key])).toEqual(placeholders(contentEnglishMessages[key]))
      expect(translate(key, {}, 'en')).toBe(contentEnglishMessages[key])
      expect(translate(key, {}, 'pt-BR')).toBe(contentPortugueseMessages[key])
    }
    expect(readFileSync(new URL('../../admin/i18n/contentMessages.ts', import.meta.url), 'utf8')).not.toMatch(/^\s*import\s/m)
  })
  it('uses locale plural rules and formatted counts for zero, one, many and thousands', () => {
    for (const count of [0, 1, 2, 1234]) for (const lang of ['en', 'pt-BR'] as const) {
      const result = translate('content.count.entries', { count, formattedCount: formatNumber(count, undefined, lang) }, lang)
      expect(result).toContain(new Intl.NumberFormat(lang).format(count))
      const category = new Intl.PluralRules(lang).select(count)
      expect(result).toContain(lang === 'en' ? category === 'one' ? 'entry' : 'entries' : category === 'one' ? 'entrada' : 'entradas')
    }
  })
  it('keeps diagnostic details verbatim and host fallback descriptors live', () => {
    const fallback = contentFeedback('content.copy.couldNotLoadContent')
    expect(renderContentFeedback(contentFeedbackError(new Error('Publish / E_DB_42'), fallback), 'pt-BR')).toBe('Publish / E_DB_42')
    expect(renderContentFeedback(contentFeedbackError(null, fallback), 'pt-BR')).toBe('Não foi possível carregar o conteúdo')
    expect(renderContentFeedback(fallback, 'en')).toBe('Could not load content')
  })
  it('emits localized toast titles without translating server details', () => {
    mount(<ToastProvider />); locale('pt-BR')
    const error = console.error; console.error = noop
    try { act(() => reportContentError(new Error('Publish / E_DB_42'), contentFeedback('content.copy.couldNotPublishEntry'))) } finally { console.error = error }
    expect(screen.getByRole('alert').textContent).toContain('Não foi possível publicar a entrada')
    expect(screen.getByRole('alert').textContent).toContain('Publish / E_DB_42')
  })
  it('keeps operation fallback descriptors and rejects dialog failures unchanged', async () => {
    let feedback: Parameters<typeof renderContentFeedback>[0] | null = null
    const error = new Error('raw operation error')
    await expect(runEntryOp({ setError: (value) => { feedback = value }, setSaveMessage: noop }, async () => { throw error }, {
      fallback: contentFeedback('content.copy.couldNotRenameEntry'), rethrow: true,
    })).rejects.toBe(error)
    expect(feedback).toBe('raw operation error')
  })
  it('refreshes editor chrome without changing document, selection or editor identity', () => {
    const editor = new Editor({ extensions: [StarterKit], content: '<p>User Title / {currentEntry.body}</p>' })
    const before = editor.getJSON(); const selection = editor.state.selection.toJSON()
    syncContentEditorLocale(editor, 'pt-BR')
    expect(editor.view.dom.getAttribute('aria-label')).toBe('Corpo da publicação')
    expect(editor.getJSON()).toEqual(before); expect(editor.state.selection.toJSON()).toEqual(selection)
    syncContentEditorLocale(editor, 'en', true)
    expect(editor.view.dom.getAttribute('aria-label')).toBe('Post body (live preview)')
    expect(editor.getJSON()).toEqual(before); editor.destroy()
  })
})

describe('mounted production compiler Content locale switches (actual compiled locale hook)', () => {
  it('updates the Content-only insert notch without pulling in Site module insertion', async () => {
    const { module } = await compiled<{ ContentInsertNotch: typeof ContentInsertNotch }>('pages/content/components/ContentInsertNotch.tsx')
    const Notch = module.ContentInsertNotch; let count = 0
    mount(<Notch actions={[{ id: 'heading', label: 'User label', icon: () => null, onClick: () => { count++ } }]} />)
    expect(screen.getByRole('button', { name: 'Add User label' })).toBeTruthy()
    locale('pt-BR'); fireEvent.click(screen.getByRole('button', { name: 'Adicionar User label' })); expect(count).toBe(1)
    expect(screen.getByLabelText('Inserir blocos')).toBeTruthy()
    locale('en'); expect(screen.getByRole('button', { name: 'Add User label' })).toBeTruthy()
  })
  it('updates document-canvas empty state and ARIA, preserving authored collection labels', async () => {
    const { module } = await compiled<{ ContentDocumentCanvas: typeof ContentDocumentCanvas }>('pages/content/components/ContentDocumentCanvas/ContentDocumentCanvas.tsx')
    const Canvas = module.ContentDocumentCanvas
    mount(<Canvas selectedEntry={null} selectedCollection={collection} loading={false} title="" body="" notchActions={[]} canEditEntry canCreateEntry focusTitleSignal={0} focusBodySignal={0} contentMode="write" onContentModeChange={noop} onTitleChange={noop} onTitleEnter={noop} onBodyChange={noop} onPickMedia={noop} onInsertDataToken={noop} onCreateEntry={noop} />)
    expect(screen.getByText('Create the first Article')).toBeTruthy()
    locale('pt-BR'); expect(screen.getByText('Crie a primeira entrada: Article')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Nova entrada: Article' })).toBeTruthy()
    expect(screen.getByRole('region', { name: 'Área de conteúdo' })).toBeTruthy()
    locale('en'); expect(screen.getByText('Create the first Article')).toBeTruthy()
  })
  it('updates live-preview failure chrome while keeping raw server diagnostics', async () => {
    const { module } = await compiled<{ LiveCanvas: typeof LiveCanvas }>('pages/content/components/LiveCanvas/LiveCanvas.tsx')
    const Live = module.LiveCanvas
    mount(<Live entry={entry} collection={collection} title="Title" body="Body" readOnly={false} onBodyChange={noop} onPickMedia={noop} onInsertDataToken={noop} />)
    await screen.findByText('Live preview unavailable')
    locale('pt-BR'); expect(screen.getByText('Prévia ao vivo indisponível')).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toContain('E_DB_42 / raw server detail')
    expect(screen.getByRole('alert').textContent).toContain('Publique o site uma vez e tente novamente.')
    locale('en'); expect(screen.getByText('Live preview unavailable')).toBeTruthy()
  })
  it('updates compiled shared binding source snapshots without translating schema keys or preview values', async () => {
    clearDataMetaCache()
    globalThis.fetch = (async () => json({ meta: { tables: [] } })) as typeof fetch
    const { module } = await compiled<{ DataBindingPicker: typeof DataBindingPicker }>('shared/DataBindingPicker/DataBindingPicker.tsx')
    const Picker = module.DataBindingPicker; const anchor = createRef<HTMLDivElement>(); const values: unknown[] = []
    mount(<><div ref={anchor} /><Picker label="User control" control={{ type: 'text', label: 'User control' }} anchorRef={anchor} triggerRef={anchor} onClose={noop} onPick={(value) => values.push(value)} systemPreviewValues={{ page: { title: 'Publish' } }} /></>)
    await screen.findByText('Page title')
    locale('pt-BR'); expect(screen.getByText('Título da página')).toBeTruthy(); expect(screen.getByText('Publish')).toBeTruthy()
    fireEvent.click(screen.getByText('Título da página').closest('button')!)
    expect(values[0]).toEqual({ source: 'page', field: 'title' })
    locale('en'); expect(screen.getByText('Page title')).toBeTruthy()
    clearDataMetaCache()
  })
  it('updates mode labels and ARIA without changing mode values', async () => {
    const { module } = await compiled<{ ContentModeToggle: typeof ContentModeToggle }>('pages/content/components/ContentModeToggle/ContentModeToggle.tsx')
    const Mode = module.ContentModeToggle; const values: string[] = []
    mount(<Mode mode="write" onChange={(value) => values.push(value)} />)
    expect(screen.getByRole('tab', { name: 'Write' }).getAttribute('aria-selected')).toBe('true')
    locale('pt-BR'); fireEvent.click(screen.getByRole('tab', { name: 'Ao vivo' })); expect(values).toEqual(['live'])
    expect(screen.getByRole('tablist', { name: 'Modo do editor de conteúdo' })).toBeTruthy()
    locale('en'); expect(screen.getByRole('tab', { name: 'Write' })).toBeTruthy()
  })
  it('updates explorer counts, status, open context menus and fallbacks, preserving authored text', async () => {
    const { module } = await compiled<{ ContentExplorerPanel: typeof ContentExplorerPanel }>('pages/content/components/ContentExplorerPanel/ContentExplorerPanel.tsx')
    const Explorer = module.ContentExplorerPanel
    mount(<Explorer {...explorerProps()} error={contentFeedback('content.copy.couldNotLoadEntries')} />)
    fireEvent.contextMenu(screen.getByText('Title').closest('button')!, { clientX: 20, clientY: 20 })
    expect(screen.getByRole('menuitem', { name: 'Publish' })).toBeTruthy()
    locale('pt-BR')
    expect(screen.getByRole('menuitem', { name: 'Renomear' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Excluir' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Publicar' })).toBeTruthy()
    expect(screen.getByText('Rascunho')).toBeTruthy(); expect(screen.getByText('Autor desconhecido')).toBeTruthy()
    expect(screen.getByLabelText('1 entrada')).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toBe('Não foi possível carregar as entradas')
    expect(screen.getByText('Title')).toBeTruthy(); expect(screen.getByText('Content')).toBeTruthy(); expect(screen.getByText('Articles')).toBeTruthy()
    locale('en'); expect(screen.getByRole('menuitem', { name: 'Publish' })).toBeTruthy()
  })
  it('updates explorer loading and empty ARIA', async () => {
    const { module } = await compiled<{ ContentExplorerPanel: typeof ContentExplorerPanel }>('pages/content/components/ContentExplorerPanel/ContentExplorerPanel.tsx')
    const Explorer = module.ContentExplorerPanel
    const view = mount(<Explorer {...explorerProps()} loading />)
    locale('pt-BR'); expect(screen.getByLabelText('Carregando entradas')).toBeTruthy()
    view.rerender(<I18nProvider><Explorer {...explorerProps()} entries={[]} /></I18nProvider>)
    expect(screen.getByText('Nenhuma entrada ainda.')).toBeTruthy()
    locale('en'); expect(screen.getByText('No entries yet.')).toBeTruthy()
  })
  it('updates settings and status options while keeping schema keys, routes and field values', async () => {
    const { module } = await compiled<{ ContentSettingsPanel: typeof ContentSettingsPanel }>('pages/content/components/ContentSettingsPanel/ContentSettingsPanel.tsx')
    const Settings = module.ContentSettingsPanel
    mount(<Settings {...settingsProps()} mediaError={contentFeedback('content.copy.couldNotLoadMedia')} />)
    const slug = screen.getByLabelText('Slug') as HTMLInputElement
    locale('pt-BR')
    expect(screen.getByRole('complementary', { name: 'Configurações de conteúdo' })).toBeTruthy()
    expect(screen.getByLabelText('Título de SEO').getAttribute('value')).toBe('SEO title')
    expect(screen.getByLabelText('Slug')).toBe(slug); expect(slug.value).toBe('title')
    expect(screen.getByText('/blog/title')).toBeTruthy(); expect(screen.getByText('Usuário desconhecido')).toBeTruthy()
    fireEvent.click(screen.getByRole('combobox', { name: 'Status' }))
    expect(screen.getByRole('option', { name: 'Rascunho' })).toBeTruthy()
    locale('en'); expect(screen.getByRole('option', { name: 'Draft' })).toBeTruthy()
  })
  it('updates an open rename dialog, retaining user input and operation payload', async () => {
    const { module } = await compiled<{ ContentItemRenameDialog: typeof ContentItemRenameDialog }>('pages/content/components/ContentItemRenameDialog/ContentItemRenameDialog.tsx')
    const Rename = module.ContentItemRenameDialog; const values: unknown[] = []
    mount(<Rename title="User dialog title" titleLabel="User field label" initialTitle="Publish" initialSlug="publish" onCancel={noop} onRename={(value) => { values.push(value) }} />)
    locale('pt-BR'); expect(screen.getByRole('button', { name: 'Salvar' })).toBeTruthy()
    expect((screen.getByLabelText('User field label') as HTMLInputElement).value).toBe('Publish')
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' })); await waitFor(() => expect(values).toEqual([{ title: 'Publish', slug: 'publish' }]))
    locale('en'); expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy()
  })
  it('updates collection settings fields and preserves stored labels, IDs and routes', async () => {
    const { module } = await compiled<{ ContentCollectionSettingsDialog: typeof ContentCollectionSettingsDialog }>('pages/content/components/ContentCollectionSettingsDialog/ContentCollectionSettingsDialog.tsx')
    const Settings = module.ContentCollectionSettingsDialog; const values: unknown[] = []
    mount(<Settings collection={collection} onCancel={noop} onSave={(value) => { values.push(value) }} />)
    locale('pt-BR'); expect(screen.getByRole('dialog', { name: 'Configurações da coleção' })).toBeTruthy()
    expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('Content')
    expect((screen.getByLabelText('Caminho da URL') as HTMLInputElement).value).toBe('/blog')
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' })); await waitFor(() => expect(values).toHaveLength(1))
    expect(values[0]).toEqual({ name: 'Content', slug: 'posts', routeBase: '/blog', singularLabel: 'Article', pluralLabel: 'Articles', fields: collection.fields })
    locale('en'); expect(screen.getByRole('dialog', { name: 'Collection settings' })).toBeTruthy()
  })
  it('updates toolbar status and open action-menu presentation', async () => {
    const { module } = await compiled<{ ContentToolbar: typeof ContentToolbar }>('pages/content/components/ContentToolbar/ContentToolbar.tsx')
    const Toolbar = module.ContentToolbar
    mount(<Toolbar contentLoading={false} saveMessage="saved" isDirty={false} selectedEntry={entry} selectedCollection={collection} publicPath="/blog/title" canSaveDraft canPublish onSaveDraft={noop} onPublish={noop} onSchedule={noop} onRestored={noop} />)
    expect(screen.getByText('Draft saved')).toBeTruthy()
    fireEvent.click(screen.getByTestId('toolbar-publish-actions-trigger'))
    expect(screen.getByRole('menuitem', { name: 'Schedule Article…' })).toBeTruthy()
    locale('pt-BR'); expect(screen.getByText('Rascunho salvo')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Publicar Article' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Agendar Article…' })).toBeTruthy()
    expect(screen.getByRole('menu', { name: 'Ações de publicação' })).toBeTruthy()
    locale('en'); expect(screen.getByText('Draft saved')).toBeTruthy()
  })
  it('keeps the published button as the sole clean-state indicator and preserves dirty, retry, busy and permission behavior in both locales', async () => {
    const { module } = await compiled<{ ContentToolbar: typeof ContentToolbar }>('pages/content/components/ContentToolbar/ContentToolbar.tsx')
    const Toolbar = module.ContentToolbar
    let publishCalls = 0
    const props: Parameters<typeof ContentToolbar>[0] = {
      contentLoading: false, saveMessage: 'published', isDirty: false,
      selectedEntry: { ...entry, status: 'published' }, selectedCollection: collection,
      publicPath: '/blog/title', canSaveDraft: true, canPublish: true,
      onSaveDraft: noop, onPublish: () => { publishCalls++ }, onSchedule: noop, onRestored: noop,
    }
    const view = mount(<Toolbar {...props} />)
    const rerender = (overrides: Partial<typeof props> = {}) => view.rerender(<I18nProvider><Toolbar {...props} {...overrides} /></I18nProvider>)

    for (const lang of ['en', 'pt-BR', 'en'] as const) {
      locale(lang)
      rerender()
      const published = translate('content.copy.published', {}, lang)
      const publishAria = translate('content.publishEntry', { entity: 'Article' }, lang)
      const button = screen.getByRole('button', { name: published }) as HTMLButtonElement
      expect(button.getAttribute('aria-disabled')).toBe('true')
      expect(button.getAttribute('data-state')).toBe('success')
      expect(button.textContent).toBe(published)
      expect(screen.getAllByText(published)).toHaveLength(1)
      expect(screen.queryByRole('status')).toBeNull()
      const callsBefore = publishCalls
      fireEvent.click(button)
      expect(publishCalls).toBe(callsBefore)

      rerender({ isDirty: true })
      expect(screen.getByRole('status').textContent).toBe(translate('content.copy.unsavedDraft', {}, lang))
      const dirtyButton = screen.getByRole('button', { name: publishAria }) as HTMLButtonElement
      expect(dirtyButton.getAttribute('aria-disabled')).toBeNull()
      expect(dirtyButton.getAttribute('data-state')).toBe('idle')
      expect(dirtyButton.textContent).toBe(translate('content.copy.publish', {}, lang))
      fireEvent.click(dirtyButton)
      expect(publishCalls).toBe(callsBefore + 1)

      rerender({ saveMessage: 'error' })
      expect(screen.getByRole('status').textContent).toBe(translate('content.copy.saveFailed', {}, lang))
      const retryButton = screen.getByRole('button', { name: publishAria }) as HTMLButtonElement
      expect(retryButton.textContent).toBe(translate('content.copy.retryPublish', {}, lang))
      expect(retryButton.getAttribute('aria-disabled')).toBeNull()
      expect(retryButton.getAttribute('data-state')).toBe('error')
      fireEvent.click(retryButton)
      expect(publishCalls).toBe(callsBefore + 2)

      rerender({ saveMessage: 'publishing' })
      expect(screen.getByRole('status').textContent).toBe(translate('content.copy.publishing', {}, lang))
      const busyButton = screen.getByRole('button', { name: publishAria }) as HTMLButtonElement
      expect(busyButton.getAttribute('aria-disabled')).toBe('true')
      expect(busyButton.getAttribute('aria-busy')).toBe('true')
      expect(busyButton.getAttribute('data-state')).toBe('busy')
      fireEvent.click(busyButton)
      expect(publishCalls).toBe(callsBefore + 2)

      rerender({ isDirty: true, canPublish: false })
      const forbiddenButton = screen.getByRole('button', { name: publishAria }) as HTMLButtonElement
      expect(forbiddenButton.getAttribute('aria-disabled')).toBe('true')
      fireEvent.click(forbiddenButton)
      expect(publishCalls).toBe(callsBefore + 2)

      rerender({ selectedEntry: null })
      expect(screen.getByRole('status').textContent).toBe(translate('content.copy.noEntrySelected', {}, lang))
      expect(screen.getByRole('button', { name: publishAria }).getAttribute('aria-disabled')).toBe('true')
    }
  })
  it('updates cached slash items while keeping command IDs and command behavior', async () => {
    const { module } = await compiled<{ BodySlashMenu: typeof BodySlashMenu }>('pages/content/components/BodySlashMenu/BodySlashMenu.tsx')
    const Menu = module.BodySlashMenu; const handle = createRef<SlashMenuHandle>(); let selected = false
    const editor = new Editor({ extensions: [StarterKit], content: '<p>User prose</p>' })
    mount(<Menu handleRef={handle} />)
    act(() => handle.current?.open(editor, { from: 1, to: 1 }, [{ id: 'heading-2', labelKey: 'content.copy.heading2', descriptionKey: 'content.copy.sectionTitle', keywords: ['h2'], command: () => { selected = true } }], null))
    expect(screen.getByRole('menuitem', { name: 'Heading 2' })).toBeTruthy()
    locale('pt-BR'); expect(screen.getByRole('menuitem', { name: 'Título 2' })).toBeTruthy()
    locale('en'); fireEvent.click(screen.getByRole('menuitem', { name: 'Heading 2' })); expect(selected).toBe(true)
    editor.destroy()
  })
  it('updates open link and alt-text forms without translating authored URL/alt values', async () => {
    const link = await compiled<{ LinkEditor: ComponentType<{ initial: string; onCancel: () => void; onClear: () => void; onSubmit: (value: string) => void }> }>('pages/content/components/BodyBubbleMenu/BodyBubbleMenu.tsx', ['LinkEditor'])
    const alt = await compiled<{ AltEditor: ComponentType<{ initial: string; onCancel: () => void; onSubmit: (value: string) => void }> }>('pages/content/components/MediaNodeToolbar/MediaNodeToolbar.tsx', ['AltEditor'])
    const Link = link.module.LinkEditor; const Alt = alt.module.AltEditor
    mount(<><Link initial="https://example.com/Title" onCancel={noop} onClear={noop} onSubmit={noop} /><Alt initial="Publish this image" onCancel={noop} onSubmit={noop} /></>)
    locale('pt-BR'); expect(screen.getByRole('button', { name: 'Aplicar' })).toBeTruthy()
    expect((screen.getByLabelText('URL do link') as HTMLInputElement).value).toBe('https://example.com/Title')
    expect((screen.getByLabelText('Texto alternativo') as HTMLInputElement).value).toBe('Publish this image')
    locale('en'); expect(screen.getByRole('button', { name: 'Apply' })).toBeTruthy()
  })
  it('keeps compiled editor ARIA localized after same-locale edits and parent rerenders without replacing the editor or selection', async () => {
    const { module } = await compiled<{ TiptapBodyEditor: typeof TiptapBodyEditor }>('pages/content/TiptapBodyEditor.tsx')
    const Body = module.TiptapBodyEditor
    const changes: string[] = []
    function BodyFixture({ revision }: { revision: number }) {
      const [markdown, setMarkdown] = useState('User prose / {currentEntry.body}')
      return <div data-revision={revision}><Body markdown={markdown} onChange={(next) => { changes.push(next); setMarkdown(next) }} onPickMedia={noop} onInsertDataToken={noop} /></div>
    }
    const view = mount(<BodyFixture revision={0} />)
    const dom = await screen.findByLabelText('Post body')
    const editor = (dom as HTMLElement & { editor: Editor }).editor
    act(() => { editor.commands.setTextSelection({ from: 2, to: 5 }) })
    const documentBefore = editor.getJSON()
    const selectionBefore = editor.state.selection.toJSON()
    locale('pt-BR')
    await waitFor(() => expect(dom.getAttribute('aria-label')).toBe('Corpo da publicação'))
    expect(editor.getJSON()).toEqual(documentBefore)
    expect(editor.state.selection.toJSON()).toEqual(selectionBefore)
    const changesBefore = changes.length

    act(() => { editor.view.dispatch(editor.state.tr.insertText(' edited', editor.state.doc.content.size - 1)) })
    await waitFor(() => expect(changes.at(-1)).toContain(' edited'))
    const editedDocument = editor.getJSON()
    const editedSelection = editor.state.selection.toJSON()
    view.rerender(<I18nProvider><BodyFixture revision={1} /></I18nProvider>)
    await act(async () => {})
    expect(dom.getAttribute('aria-label')).toBe('Corpo da publicação')
    expect(screen.getByLabelText('Corpo da publicação')).toBe(dom)
    expect((dom as HTMLElement & { editor: Editor }).editor).toBe(editor)
    expect(editor.getJSON()).toEqual(editedDocument)
    expect(editor.state.selection.toJSON()).toEqual(editedSelection)
    expect(changes.length).toBe(changesBefore + 1)
    locale('en')
    expect(dom.getAttribute('aria-label')).toBe('Post body')
    expect(editor.getJSON()).toEqual(editedDocument)
    expect(editor.state.selection.toJSON()).toEqual(editedSelection)
  })
  it('refilters the installed Suggestion for an unchanged /tít query on locale switches without editing text, range or selection', async () => {
    const { module } = await compiled<{ TiptapBodyEditor: typeof TiptapBodyEditor }>('pages/content/TiptapBodyEditor.tsx')
    const Body = module.TiptapBodyEditor
    const changes: string[] = []
    function BodyFixture() {
      const [markdown, setMarkdown] = useState('')
      return <Body markdown={markdown} onChange={(next) => { changes.push(next); setMarkdown(next) }} onPickMedia={noop} onInsertDataToken={noop} />
    }
    mount(<BodyFixture />)
    const dom = await screen.findByLabelText('Post body')
    const editor = (dom as HTMLElement & { editor: Editor }).editor
    act(() => { editor.view.dom.focus(); editor.commands.insertContent('/tít') })
    await screen.findByRole('menuitem', { name: 'No matches' })
    const documentBefore = editor.getJSON()
    const selectionBefore = editor.state.selection.toJSON()
    const changesBefore = changes.length
    const pluginsBefore = editor.state.plugins
    const stateBefore = SuggestionPluginKey.getState(editor.state)
    expect(stateBefore.query).toBe('tít')

    locale('pt-BR')
    await screen.findByRole('menuitem', { name: 'Título 2' })
    expect(screen.getByRole('menuitem', { name: 'Título 3' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Título 4' })).toBeTruthy()
    expect(screen.queryByRole('menuitem', { name: 'Nenhum resultado' })).toBeNull()
    expect(editor.getJSON()).toEqual(documentBefore)
    expect(editor.state.selection.toJSON()).toEqual(selectionBefore)
    expect(SuggestionPluginKey.getState(editor.state).range).toEqual(stateBefore.range)
    expect(SuggestionPluginKey.getState(editor.state).query).toBe('tít')
    expect(editor.state.plugins).toBe(pluginsBefore)
    expect((dom as HTMLElement & { editor: Editor }).editor).toBe(editor)
    expect(changes.length).toBe(changesBefore)

    locale('en')
    await screen.findByRole('menuitem', { name: 'No matches' })
    expect(screen.queryByRole('menuitem', { name: 'Heading 2' })).toBeNull()
    expect(editor.getJSON()).toEqual(documentBefore)
    expect(editor.state.selection.toJSON()).toEqual(selectionBefore)
    expect(SuggestionPluginKey.getState(editor.state).range).toEqual(stateBefore.range)
    expect(changes.length).toBe(changesBefore)
  })
  it('refreshes Suggestion before its first items callback settles, keeps exited menus closed, and unsubscribes on plugin destruction', async () => {
    const snapshots: string[][] = []
    let exits = 0
    const editor = new Editor({
      extensions: [StarterKit, SlashCommand.configure({
        suggestion: { render: () => ({
          onStart: (props) => snapshots.push(props.items.map((item) => item.id)),
          onUpdate: (props) => snapshots.push(props.items.map((item) => item.id)),
          onExit: () => { exits++ },
        }) },
      })],
      content: '<p></p>',
    })
    try {
      // The installed Suggestion awaits its items callback even for a static
      // catalog. Switch locale in that gap, not after manually supplying items.
      act(() => { editor.commands.insertContent('/tít'); setLocale('pt-BR') })
      await waitFor(() => expect(snapshots.at(-1)).toEqual(['heading-2', 'heading-3', 'heading-4']))
      locale('en')
      expect(snapshots.at(-1)).toEqual([])
      act(() => { editor.commands.insertContent(' ') })
      await waitFor(() => expect(exits).toBe(1))
      const afterExit = snapshots.length
      locale('pt-BR')
      expect(snapshots.length).toBe(afterExit)
      act(() => { editor.commands.insertContent('/tít') })
      await waitFor(() => expect(snapshots.length).toBeGreaterThan(afterExit))
      expect(snapshots.at(-1)).toEqual(['heading-2', 'heading-3', 'heading-4'])
      editor.destroy()
      const afterDestroy = snapshots.length
      const exitsAfterDestroy = exits
      locale('en')
      expect(snapshots.length).toBe(afterDestroy)
      expect(exits).toBe(exitsAfterDestroy)
    } finally {
      if (!editor.isDestroyed) editor.destroy()
    }
  })
  it.each([
    ['start', 'exit'], ['start', 'destroy'], ['update', 'exit'], ['update', 'destroy'],
  ] as const)('rejects delayed Suggestion %s callbacks when %s happens before items settle', async (phase, stop) => {
    const renders: string[] = []
    let startsPending = 0
    let updatesPending = 0
    let exits = 0
    const editor = new Editor({
      extensions: [StarterKit, SlashCommand.configure({
        suggestion: { render: () => ({
          onBeforeStart: () => { startsPending++ },
          onBeforeUpdate: () => { updatesPending++ },
          onStart: (props) => renders.push(`start:${props.query}`),
          onUpdate: (props) => renders.push(`update:${props.query}`),
          onExit: () => { exits++ },
        }) },
      })],
      content: '<p></p>',
    })
    try {
      if (phase === 'update') {
        act(() => { editor.commands.insertContent('/h') })
        await waitFor(() => expect(renders).toEqual(['start:h']))
      }
      const rendersBefore = [...renders]
      // Suggestion invokes onBefore* synchronously, then awaits its real items
      // callback. Exit/destroy in that same turn, before the await can resume.
      act(() => {
        editor.commands.insertContent(phase === 'start' ? '/h' : '2')
        if (stop === 'exit') exitSuggestion(editor.view)
        else editor.destroy()
      })
      expect(startsPending).toBe(1)
      expect(updatesPending).toBe(phase === 'update' ? 1 : 0)
      expect(exits).toBeGreaterThan(0)
      const documentAfterStop = editor.getJSON()
      const selectionAfterStop = editor.state.selection.toJSON()
      await act(async () => {})
      expect(renders).toEqual(rendersBefore)
      locale('pt-BR')
      expect(renders).toEqual(rendersBefore)
      expect(editor.getJSON()).toEqual(documentAfterStop)
      expect(editor.state.selection.toJSON()).toEqual(selectionAfterStop)
      if (stop === 'exit') {
        expect(SuggestionPluginKey.getState(editor.state).active).toBe(false)
        // The guard must not disable subsequent valid Suggestion sessions.
        act(() => { editor.commands.insertContent(' /tít') })
        await waitFor(() => expect(renders.at(-1)).toBe('start:tít'))
      } else {
        expect(editor.isDestroyed).toBe(true)
      }
    } finally {
      if (!editor.isDestroyed) editor.destroy()
    }
  })
  it('refreshes the real mounted compiled Tiptap editor without resetting its markdown', async () => {
    const { module } = await compiled<{ TiptapBodyEditor: typeof TiptapBodyEditor }>('pages/content/TiptapBodyEditor.tsx')
    const Body = module.TiptapBodyEditor
    mount(<Body markdown="User prose / {currentEntry.body}" onChange={noop} onPickMedia={noop} onInsertDataToken={noop} />)
    const editor = await screen.findByLabelText('Post body')
    locale('pt-BR'); await waitFor(() => expect(screen.getByLabelText('Corpo da publicação')).toBe(editor))
    expect(editor.textContent).toContain('User prose / {currentEntry.body}')
    locale('en'); expect(screen.getByLabelText('Post body')).toBe(editor)
  })
  it('updates mounted schedule title and controls while preserving entity text', async () => {
    const { module } = await compiled<{ SchedulePublishDialog: typeof SchedulePublishDialog }>('modals/SchedulePublishDialog/SchedulePublishDialog.tsx')
    const Schedule = module.SchedulePublishDialog
    mount(<Schedule open onClose={noop} rowId={entry.id} currentScheduledAt={null} entityLabel="Article" onScheduled={noop} />)
    expect(screen.getByRole('dialog', { name: 'Schedule this Article' })).toBeTruthy()
    locale('pt-BR'); expect(screen.getByRole('dialog', { name: 'Agendar Article' })).toBeTruthy()
    locale('en'); expect(screen.getByRole('dialog', { name: 'Schedule this Article' })).toBeTruthy()
  })
  it('updates mounted version dates, counts and confirmation while preserving names and titles', async () => {
    globalThis.fetch = (async () => json({ versions: [{ id: 'version_1', rowId: entry.id, versionNumber: 1234, slug: entry.slug, publishedAt: timestamp, publishedByUserId: 'user_1', publishedByName: 'Publish' }] })) as typeof fetch
    const { module } = await compiled<{ VersionHistoryDialog: typeof VersionHistoryDialog }>('shared/VersionHistoryDialog/VersionHistoryDialog.tsx')
    const Versions = module.VersionHistoryDialog
    mount(<Versions rowId={entry.id} entityLabel="Article" title="Title" onClose={noop} />)
    await screen.findByTestId('version-row-1234')
    expect(screen.getByText(/Version 1,234/)).toBeTruthy()
    locale('pt-BR'); expect(screen.getByText(/Versão 1.234/)).toBeTruthy()
    expect(screen.getByTestId('version-row-1234').textContent).toContain(formatDate(timestamp, { dateStyle: 'medium', timeStyle: 'short' }, 'pt-BR'))
    expect(screen.getByTestId('version-row-1234').textContent).toContain('Publish')
    fireEvent.click(screen.getByTestId('version-restore-1234')); locale('en')
    expect(screen.getByTestId('version-row-1234').textContent).toContain('1,234')
    expect(screen.getByText('Title')).toBeTruthy()
  })
})
