import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { act, cleanup, fireEvent, render as renderReact, screen, waitFor } from '@testing-library/react'
import { createRef, type ReactElement } from 'react'
import * as bindingCache from '@admin/shared/DataBindingPicker/cache'
import * as persistence from '@core/persistence'
import { VersionHistoryDialog } from '@admin/shared/VersionHistoryDialog'
import { AppLoadingScreen } from '@admin/AppLoadingScreen'
import { CanvasFrameSkeleton } from '@admin/shared/CanvasFrameSkeleton'
import { CapabilityPicker } from '@admin/shared/CapabilityPicker'
import { capabilityLabel } from '@admin/shared/CapabilityPicker'
import { ConfirmDeleteDialog } from '@admin/shared/dialogs/ConfirmDeleteDialog/ConfirmDeleteDialog'
import { SiteCreateDialog } from '@admin/shared/dialogs/SiteCreateDialog'
import { localizedPageSlugError } from '@admin/shared/dialogs/SiteCreateDialog'
import { PanelHeader } from '@admin/shared/PanelHeader'
import { StepUpDialog } from '@admin/shared/StepUp/StepUpDialog'
import { StepUpCancelledMessage, StepUpProvider, useStepUp } from '@admin/shared/StepUp'
import { TemplateSettingsDialog } from '@admin/shared/dialogs/TemplateSettingsDialog'
import { Button } from '@ui/components/Button'
import { makePage } from '../fixtures'
import { DataBindingPicker } from '@admin/shared/DataBindingPicker'
import { formatMetaFieldPreview, formatPreviewValue, resolveBindingLabel } from '@admin/shared/DataBindingPicker/helpers'
import { SYSTEM_SOURCES } from '@admin/shared/DataBindingPicker/systemSources'
import { FrameworkManagerDialog } from '@admin/shared/dialogs/FrameworkManagerDialog'
import { I18nProvider, resetI18nForTests, setLocale, translate } from '@admin/i18n'
import { shellEnglishMessages, shellPortugueseMessages } from '../../admin/i18n/shellMessages'


beforeEach(() => {
  localStorage.clear()
  resetI18nForTests()
  setLocale('en')

})

afterEach(() => {
  cleanup()

  localStorage.clear()
  resetI18nForTests()
})

function render(ui: ReactElement) {
  return renderReact(ui, { wrapper: I18nProvider })
}

function portuguese() {
  act(() => setLocale('pt-BR'))
}

function StepUpProbe({ action, onError }: { action: () => Promise<void>; onError: (error: unknown) => void }) {
  const { runStepUp } = useStepUp()
  return <Button onClick={() => { void runStepUp(action).catch(onError) }}>Start sensitive action</Button>
}

describe('shell catalog', () => {
  it('has exact locale and interpolation parity, with only shell keys', () => {
    expect(Object.keys(shellPortugueseMessages).sort()).toEqual(Object.keys(shellEnglishMessages).sort())
    for (const [key, message] of Object.entries(shellEnglishMessages)) {
      expect(key.startsWith('shell.')).toBe(true)
      const placeholders = (value: string) => [...value.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort()
      expect(placeholders(shellPortugueseMessages[key as keyof typeof shellEnglishMessages])).toEqual(placeholders(message))
    }
  })

  it('uses whole plural messages and preserves interpolated names', () => {
    expect(translate('shell.account.signedOut', { count: 1, countLabel: '1' })).toBe('Signed out 1 device.')
    setLocale('pt-BR')
    expect(translate('shell.account.signedOut', { count: 2, countLabel: '2' })).toBe('2 dispositivos desconectados.')
    expect(translate('shell.account.menuFor', { name: 'Example User' })).toBe('Menu da conta de Example User')
  })
})

describe('shell controls react to locale changes without remounting', () => {
  it('updates loading ARIA names without translating breakpoint IDs', () => {
    render(<><AppLoadingScreen /><CanvasFrameSkeleton breakpointId="custom-wide" /></>)
    expect(screen.getByRole('status', { name: 'Loading Instatic' })).toBeDefined()
    portuguese()
    expect(screen.getByRole('status', { name: 'Carregando Instatic' })).toBeDefined()
    expect(screen.getByRole('status', { name: 'Carregando quadro do canvas custom-wide' })).toBeDefined()
    expect(screen.getByTestId('canvas-frame-skeleton-custom-wide')).toBeDefined()
  })

  it('updates generic dialog defaults but preserves caller-supplied copy', () => {
    const props = { title: 'Custom plugin title', description: 'User-authored description', onCancel() {}, onConfirm() {} }
    const view = render(<ConfirmDeleteDialog {...props} />)
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDefined()
    portuguese()
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDefined()
    expect(screen.getByText(props.title)).toBeDefined()
    expect(screen.getByText(props.description)).toBeDefined()
    view.rerender(<ConfirmDeleteDialog {...props} confirmLabel="Custom confirm" cancelLabel="Custom cancel" />)
    expect(screen.getByRole('button', { name: 'Custom confirm' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Custom cancel' })).toBeDefined()
  })

  it('updates panel ARIA wrappers while leaving the caller title intact', () => {
    render(<PanelHeader title="Plugin Panel" panelId="plugin-id" onClose={() => {}} />)
    expect(screen.getByRole('toolbar', { name: 'Plugin Panel panel header' })).toBeDefined()
    portuguese()
    expect(screen.getByRole('toolbar', { name: 'Cabeçalho do painel Plugin Panel' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Fechar painel Plugin Panel' })).toBeDefined()
    expect(screen.getByText('Plugin Panel')).toBeDefined()
  })

  it('updates capability metadata without translating group titles or IDs', () => {
    render(<CapabilityPicker groups={[{ title: 'Custom group', capabilities: ['dashboard.read'] }]} selected={new Set()} onChange={() => {}} />)
    expect(screen.getByText('View dashboard')).toBeDefined()
    portuguese()
    expect(screen.getByText('Ver painel')).toBeDefined()
    expect(screen.getByText('0 de 1 selecionadas')).toBeDefined()
    expect(screen.getByText('Custom group')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Selecionar todas as permissões de Custom group' })).toBeDefined()
    expect(capabilityLabel('plugin.custom.permission')).toBe('plugin.custom.permission')
    expect(capabilityLabel('dashboard.read')).toBe('Ver painel')
  })

  it('updates step-up defaults and keeps caller reasons and server errors verbatim', () => {
    const props = { mfaRequired: true, submitting: false, error: 'Server envelope message', onSubmit() {}, onCancel() {} }
    const view = render(<StepUpDialog {...props} />)
    portuguese()
    expect(screen.getByRole('heading', { name: 'Confirme sua senha' })).toBeDefined()
    expect(screen.getByLabelText('Código de autenticação ou recuperação')).toBeDefined()
    expect(screen.getByText(props.error)).toBeDefined()
    view.rerender(<StepUpDialog {...props} reason="Caller-owned reason" />)
    expect(screen.getByText('Caller-owned reason')).toBeDefined()
  })

  it('keeps StepUp fallbacks reactive while preserving server messages and MFA/cancel sentinels', async () => {
    const stepUpSpy = spyOn(persistence, 'stepUpCms')
      .mockRejectedValueOnce(new Error(''))
      .mockRejectedValueOnce(new Error('Authentication code required'))
    let rejected: unknown
    try {
      render(<StepUpProvider><StepUpProbe action={async () => { throw new Error('step_up_required') }} onError={(error) => { rejected = error }} /></StepUpProvider>)
      fireEvent.click(screen.getByRole('button', { name: 'Start sensitive action' }))
      await screen.findByRole('heading', { name: 'Confirm your password' })
      fireEvent.change(screen.getByTestId('step-up-password'), { target: { value: 'unchanged-password' } })
      fireEvent.click(screen.getByTestId('step-up-confirm'))
      await screen.findByText('Could not confirm password.')
      portuguese()
      expect(screen.getByText('Não foi possível confirmar a senha.')).toBeDefined()
      expect(screen.getByDisplayValue('unchanged-password')).toBeDefined()
      fireEvent.click(screen.getByTestId('step-up-confirm'))
      await screen.findByText('Authentication code required')
      expect(screen.getByLabelText('Código de autenticação ou recuperação')).toBeDefined()
      act(() => setLocale('en'))
      expect(screen.getByText('Authentication code required')).toBeDefined()
      expect(screen.getByLabelText('Authentication or recovery code')).toBeDefined()
      fireEvent.click(screen.getByTestId('step-up-cancel'))
      await waitFor(() => expect(rejected).toBeInstanceOf(Error))
      expect((rejected as Error).message).toBe(StepUpCancelledMessage)
      expect(stepUpSpy).toHaveBeenCalledTimes(2)
    } finally {
      cleanup()
      stepUpSpy.mockRestore()
    }
  })

  it('updates fallback copy when the retried StepUp action fails without a message', async () => {
    const stepUpSpy = spyOn(persistence, 'stepUpCms').mockResolvedValue({ stepUpExpiresAt: new Date().toISOString() })
    let attempts = 0
    let rejected: unknown
    try {
      render(<StepUpProvider><StepUpProbe action={async () => { attempts += 1; throw new Error(attempts === 1 ? 'step_up_required' : '') }} onError={(error) => { rejected = error }} /></StepUpProvider>)
      fireEvent.click(screen.getByRole('button', { name: 'Start sensitive action' }))
      await screen.findByRole('heading', { name: 'Confirm your password' })
      fireEvent.change(screen.getByTestId('step-up-password'), { target: { value: 'unchanged-password' } })
      fireEvent.click(screen.getByTestId('step-up-confirm'))
      await screen.findByText('Action failed.')
      portuguese()
      expect(screen.getByText('A ação falhou.')).toBeDefined()
      expect(attempts).toBe(2)
      fireEvent.click(screen.getByTestId('step-up-cancel'))
      await waitFor(() => expect(rejected).toBeInstanceOf(Error))
    } finally {
      cleanup()
      stepUpSpy.mockRestore()
    }
  })

  it('updates template options and synthetic fallback labels without translating stored values', async () => {
    const tablesSpy = spyOn(persistence, 'listCmsDataTables').mockResolvedValue([])
    const page = makePage({ title: 'User template', slug: 'user-template', template: { enabled: true, target: { kind: 'postTypes', tableSlugs: ['posts'] }, priority: 100 } })
    let savedSlugs: string[] | undefined
    try {
      render(<TemplateSettingsDialog page={page} pages={[page]} onCancel={() => {}} onSave={(payload) => { if (payload.template.target.kind === 'postTypes') savedSlugs = payload.template.target.tableSlugs }} />)
      await waitFor(() => expect(tablesSpy).toHaveBeenCalledTimes(1))
      expect(screen.getByRole('checkbox', { name: 'Posts' })).toBeDefined()
      portuguese()
      fireEvent.click(screen.getByRole('combobox', { name: 'Aplica-se a' }))
      expect(screen.getByRole('option', { name: 'Em todo lugar' })).toBeDefined()
      expect(screen.getByRole('option', { name: 'Tipos de postagem' })).toBeDefined()
      expect(screen.getByRole('option', { name: 'Não encontrado (404)' })).toBeDefined()
      fireEvent.click(screen.getByRole('option', { name: 'Tipos de postagem' }))
      expect(screen.getByRole('checkbox', { name: 'Postagens' })).toBeDefined()
      expect(screen.getByDisplayValue('User template')).toBeDefined()
      expect(screen.getByDisplayValue('user-template')).toBeDefined()
      fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
      expect(savedSlugs).toEqual(['posts'])
    } finally {
      cleanup()
      tablesSpy.mockRestore()
    }
  })

  it('keeps creation metadata and validation reactive, preserving typed values', () => {
    render(<SiteCreateDialog kind="page" onCancel={() => {}} onCreate={() => {}} />)
    const input = screen.getByPlaceholderText('About')
    fireEvent.change(input, { target: { value: 'My User Title' } })
    portuguese()
    expect(screen.getByRole('heading', { name: 'Nova página' })).toBeDefined()
    expect(screen.getByPlaceholderText('Sobre')).toBeDefined()
    expect(screen.getByDisplayValue('My User Title')).toBeDefined()
    expect(localizedPageSlugError('admin/path', [])).toBe('O caminho do slug da página não pode começar com "admin".')
    expect(localizedPageSlugError('my-valid-slug', [])).toBeNull()
  })

  it('resolves binding system metadata lazily and retains technical and caller labels', () => {
    const source = SYSTEM_SOURCES.find((item) => item.id === 'page')!
    expect(source.fields.find((field) => field.id === 'title')?.label).toBe('Page title')
    portuguese()
    expect(source.id).toBe('page')
    expect(source.label).toBe('Página')
    expect(source.fields.find((field) => field.id === 'title')?.label).toBe('Título da página')
    expect(resolveBindingLabel({ source: 'page', field: 'title' }, undefined, undefined, null)).toBe('Página → Título da página')
    expect(resolveBindingLabel({ source: 'currentEntry', field: 'custom' }, [{ id: 'custom', label: 'Plugin field' }], 'User source', null)).toBe('User source → Plugin field')
    expect(formatPreviewValue(1234.5)).toBe('1.234,5')
    expect(formatPreviewValue('1234.5')).toBe('1234.5')
    expect(formatMetaFieldPreview({ id: 'gallery', label: 'User gallery', type: 'media', mediaKind: 'image' }, ['a', 'b'])).toBe('2 imagens')
  })

  it('updates binding picker loading ARIA copy while preserving control names', () => {
    bindingCache.clearDataMetaCache()
    const loadSpy = spyOn(bindingCache, 'loadDataMeta').mockImplementation(() => new Promise(() => {}))
    try {
      const anchor = createRef<HTMLDivElement>()
      render(<><div ref={anchor} /><DataBindingPicker label="Plugin control" control={{ type: 'text', label: 'Plugin control' }} anchorRef={anchor} triggerRef={anchor} onClose={() => {}} onPick={() => {}} /></>)
      expect(screen.getByRole('menu', { name: 'Bind Plugin control' })).toBeDefined()
      portuguese()
      expect(screen.getByRole('menu', { name: 'Vincular Plugin control' })).toBeDefined()
    } finally {
      cleanup()
      loadSpy.mockRestore()
    }
  })

  it('updates version dates and published-by copy while preserving author names', async () => {
    const versionsSpy = spyOn(persistence, 'listCmsDataRowVersions').mockResolvedValue([{
      id: 'version-id', rowId: 'row-id', versionNumber: 1234, slug: 'user-slug',
      publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      publishedByUserId: 'author-id', publishedByName: 'User Author',
    }])
    try {
      render(<VersionHistoryDialog rowId="row-id" entityLabel="User entity" title="User title" onClose={() => {}} />)
      await screen.findByText('Version 1,234')
      portuguese()
      expect(screen.getByText('Versão 1.234')).toBeDefined()
      expect(screen.getByText(/Publicado anteontem por User Author/)).toBeDefined()
      expect(screen.getByText('User title')).toBeDefined()
      fireEvent.click(screen.getByRole('button', { name: 'Restaurar' }))
      expect(screen.getByText('Substituir o rascunho atual pela versão 1.234? As alterações não publicadas serão perdidas.')).toBeDefined()
    } finally {
      cleanup()
      versionsSpy.mockRestore()
    }
  })

  it('updates framework state descriptions instead of freezing them at module load', () => {
    render(<FrameworkManagerDialog open currentState="none" applier={{ capabilities: { canRemove: true }, async apply() {} }} onClose={() => {}} />)
    expect(screen.getByText('Full framework')).toBeDefined()
    portuguese()
    expect(screen.getByText('Framework completo')).toBeDefined()
    expect(screen.getByText('Somente variáveis')).toBeDefined()
    expect(screen.getByText('Seus próprios estilos permanecem intactos')).toBeDefined()
  })
})
