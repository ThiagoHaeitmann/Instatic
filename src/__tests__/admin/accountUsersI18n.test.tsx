import { ToastProvider } from '@ui/components/Toast'
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ComponentType, ReactNode } from 'react'
import { readFileSync } from 'node:fs'
import { I18nProvider, formatDate, resetI18nForTests, setLocale, translate, useI18n } from '@admin/i18n'
import { accountUsersEnglishMessages, accountUsersPortugueseMessages } from '../../admin/i18n/accountUsersMessages'
import { AdminSessionProvider } from '@admin/session'
import { MemoryRouter } from '@admin/lib/routing'
import { StepUpContext } from '../../admin/shared/StepUp/StepUpContext'
import { feedback, feedbackError, renderFeedback, reportFeedbackError } from '@admin/shared/accountUsersFeedback'
import { CAPABILITY_META } from '@admin/shared/CapabilityPicker'
import { CAPABILITY_GROUPS } from '../../admin/pages/users/utils/capabilities'
import { emptyRoleForm, emptyUserForm } from '../../admin/pages/users/types'
import { auditActor, auditDetails, auditTitle } from '../../admin/pages/users/utils/audit'
import type { CmsAuditEvent, CmsCurrentUser, CmsSession } from '@core/persistence'
import type { UsersPageData } from '../../admin/pages/users/hooks/useUsersPageData'
import type { AccountPage } from '../../admin/pages/account/AccountPage'
import type { UsersPage } from '../../admin/pages/users/UsersPage'
import type { ProfileTab } from '../../admin/pages/account/tabs/ProfileTab'
import type { PasswordSettingsCard } from '../../admin/pages/account/tabs/PasswordSettingsCard'
import type { StepUpSettingsCard } from '../../admin/pages/account/tabs/StepUpSettingsCard'
import type { MfaSettingsCards } from '../../admin/pages/account/tabs/MfaSettingsCards'
import type { UsersTab } from '../../admin/pages/users/tabs/UsersTab'
import type { RolesTab } from '../../admin/pages/users/tabs/RolesTab'
import type { AuditTab } from '../../admin/pages/users/tabs/AuditTab'
import type { UserDialog } from '../../admin/pages/users/components/UserDialog'
import type { RoleDialog } from '../../admin/pages/users/components/RoleDialog'
import type { CapabilityPicker } from '../../admin/shared/CapabilityPicker/CapabilityPicker'
import { compileAdminMetadataModule } from './metadataCompilerHarness'

const originalFetch = globalThis.fetch
const timestamp = '2026-05-09T10:00:00.000Z'
const user: CmsCurrentUser = {
  id: 'user_1', displayName: 'Profile', email: 'owner@example.com', status: 'active',
  role: { id: 'role_1', slug: 'content-editor', name: 'Content editor', description: 'Role', isSystem: false, capabilities: ['site.read'] },
  capabilities: ['users.manage', 'roles.manage', 'audit.read'], lastLoginAt: timestamp, failedLoginCount: 0, lockedUntil: null,
  passwordUpdatedAt: timestamp, mfaEnabled: false, mfaEnabledAt: null, mfaRecoveryCodesRemaining: 0,
  stepUpAuthMode: 'required', stepUpWindowMinutes: 15, avatarMediaId: null, avatarUrl: null, gravatarHash: '',
  createdAt: timestamp, updatedAt: timestamp,
}
const data: UsersPageData = {
  users: [user], roles: [user.role], events: [], loading: false, error: null, defaultAssignableRoleId: user.role.id,
  setUsers: () => {}, setRoles: () => {}, setError: () => {}, refresh: async () => {},
}
const securityProps = { user, busy: null, runStepUp: <T,>(action: () => Promise<T>) => action(), setSessionUser: () => {}, setBusy: () => {}, setStatus: () => {} }

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}
function mount(children: ReactNode) {
  return render(<I18nProvider><MemoryRouter initialEntries={['/admin/account']}><AdminSessionProvider user={user}>
    <StepUpContext.Provider value={{ runStepUp: (action) => action() }}>{children}</StepUpContext.Provider>
  </AdminSessionProvider></MemoryRouter></I18nProvider>)
}
async function compiled<T>(path: string, exports: readonly string[] = []) {
  // Both consumer AND useI18n are transformed: an uncompiled hook masks a cached t closure.
  return compileAdminMetadataModule<T>(new URL(`../../admin/${path}`, import.meta.url), exports, true)
}
function switchToPortuguese() { act(() => setLocale('pt-BR')) }
function switchToEnglish() { act(() => setLocale('en')) }

beforeEach(() => {
  localStorage.clear()
  resetI18nForTests()
  setLocale('en')
  globalThis.fetch = (async (input) => {
    const url = String(input)
    if (url.endsWith('/users')) return json({ users: [user] })
    if (url.endsWith('/roles')) return json({ roles: [user.role] })
    if (url.endsWith('/audit-events') || url.endsWith('/auth/activity')) return json({ events: [] })
    if (url.endsWith('/auth/sessions')) return json({ sessions: [] })
    if (url.endsWith('/plugins')) return json({ plugins: [], adminPages: [] })
    if (url.endsWith('/branches')) return json({ branches: [] })
    return json({ error: 'raw server diagnostic' }, 404)
  }) as typeof fetch
})
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; localStorage.clear(); resetI18nForTests() })

describe('Phase 4 Account / Users catalogs and boundaries', () => {
  it('ships data-only exact en/pt key and interpolation parity', () => {
    expect(Object.keys(accountUsersPortugueseMessages).sort()).toEqual(Object.keys(accountUsersEnglishMessages).sort())
    const placeholders = (text: string) => [...text.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort()
    for (const key of Object.keys(accountUsersEnglishMessages) as (keyof typeof accountUsersEnglishMessages)[]) {
      expect(accountUsersPortugueseMessages[key].trim()).not.toBe('')
      expect(placeholders(accountUsersPortugueseMessages[key])).toEqual(placeholders(accountUsersEnglishMessages[key]))
      expect(translate(key, {}, 'en')).toBe(accountUsersEnglishMessages[key])
      expect(translate(key, {}, 'pt-BR')).toBe(accountUsersPortugueseMessages[key])
    }
    expect(readFileSync(new URL('../../admin/i18n/accountUsersMessages.ts', import.meta.url), 'utf8')).not.toMatch(/^\s*import\s/m)
  })

  it('uses plural categories and locale-aware counts, including zero', () => {
    for (const count of [0, 1, 2, 1234]) {
      const message = feedback('accountUsers.recovery.remaining', { count })
      const en = renderFeedback(message, 'en', (key, values) => translate(key, values, 'en'))
      const pt = renderFeedback(message, 'pt-BR', (key, values) => translate(key, values, 'pt-BR'))
      expect(en).toContain(new Intl.NumberFormat('en').format(count))
      expect(pt).toContain(new Intl.NumberFormat('pt-BR').format(count))
      expect(pt).toContain(count === 0 || count === 1 ? 'código de recuperação restante' : 'códigos de recuperação restantes')
    }
  })

  it('preserves raw diagnostic/server text while translating host fallback feedback', () => {
    switchToPortuguese()
    expect(renderFeedback(feedbackError(new Error('Wrong password / E_DB_42'), 'accountUsers.copy.couldNotSaveUser'), 'pt-BR', translate)).toBe('Wrong password / E_DB_42')
    expect(renderFeedback(feedbackError(null, 'accountUsers.copy.couldNotSaveUser'), 'pt-BR', translate)).toBe('Não foi possível salvar o usuário')
  })

  it('uses translated toast titles for operation failures while retaining raw error bodies', () => {
    mount(<ToastProvider />)
    switchToPortuguese()
    const originalError = console.error
    console.error = () => {}
    try {
      act(() => reportFeedbackError(new Error('Wrong password / E_DB_42'), 'accountUsers.copy.couldNotSaveUser'))
    } finally {
      console.error = originalError
    }
    expect(screen.getByRole('alert').textContent).toContain('Não foi possível salvar o usuário')
    expect(screen.getByRole('alert').textContent).toContain('Wrong password / E_DB_42')
  })

  it('translates known audit chrome, preserving names, role slugs, IPs and unknown diagnostic actions', () => {
    const event: CmsAuditEvent = { id: 'audit_1', actorUserId: user.id, actorLabel: null, targetType: 'user', targetId: user.id, targetLabel: null, action: 'user.update', metadata: { roleId: user.role.id, status: 'active' }, metadataLabels: {}, ipAddress: '203.0.113.10', userAgent: 'Chrome/123', createdAt: timestamp }
    const users = new Map([[user.id, user]])
    const roles = new Map([[user.role.id, user.role]])
    switchToPortuguese()
    expect(auditTitle(event, users, roles)).toBe('Profile foi atualizado')
    expect(auditActor(event, users)).toBe('por Profile')
    expect(auditDetails(event, roles)).toEqual(['Função: Content editor', 'Status: Ativo', 'IP: 203.0.113.10'])
    expect(auditTitle({ ...event, action: 'custom.raw_action' }, users, roles)).toBe('Custom raw_action')
    expect(auditTitle({ ...event, targetId: 'deleted_user', targetLabel: 'Security' }, new Map(), roles)).toBe('Security foi atualizado')
    expect(auditTitle({ ...event, action: 'ai.default.updated', targetId: null, metadata: { scope: 'site' } }, users, roles)).toBe('Padrão de IA para site foi atualizado')
    expect(auditDetails({ ...event, metadata: { roleId: 'unregistered-role-slug', status: 'custom_status' } }, new Map())).toEqual(['Função: unregistered-role-slug', 'Status: custom_status', 'IP: 203.0.113.10'])
  })
})

describe('production compiler mounted locale regressions', () => {
  it('isolates each compiler invocation, locale-hook bridge and extra-export variant', async () => {
    type ProbeModule = { LocaleProbe: ComponentType; useLocaleProbeI18n?: typeof useI18n; probeKey?: string }
    const source = new URL('./accountUsersCompilerFixture.tsx', import.meta.url)
    const plain = await compileAdminMetadataModule<ProbeModule>(source, ['useLocaleProbeI18n'])
    const compiledHook = await compileAdminMetadataModule<ProbeModule>(source, ['useLocaleProbeI18n'], true)
    const keyOnly = await compileAdminMetadataModule<ProbeModule>(source, ['probeKey'], true)
    const both = await compileAdminMetadataModule<ProbeModule>(source, ['useLocaleProbeI18n', 'probeKey'], true)
    const repeated = await compileAdminMetadataModule<ProbeModule>(source, ['useLocaleProbeI18n'], true)
    const variants = [plain, compiledHook, keyOnly, both, repeated]

    expect(new Set(variants.map((variant) => variant.output)).size).toBe(variants.length)
    expect(new Set(variants.map((variant) => variant.module.LocaleProbe)).size).toBe(variants.length)
    expect(plain.module.useLocaleProbeI18n).toBe(useI18n)
    expect(compiledHook.module.useLocaleProbeI18n).not.toBe(useI18n)
    expect(compiledHook.module.useLocaleProbeI18n).toBeInstanceOf(Function)
    expect(compiledHook.module.probeKey).toBeUndefined()
    expect(keyOnly.module.probeKey).toBe('accountUsers.copy.security')
    expect(keyOnly.module.useLocaleProbeI18n).toBeUndefined()
    expect(both.module.probeKey).toBe('accountUsers.copy.security')
    expect(both.module.useLocaleProbeI18n).toBeInstanceOf(Function)
    expect(repeated.module.useLocaleProbeI18n).not.toBe(compiledHook.module.useLocaleProbeI18n)

    const bridges = variants.slice(1).map((variant) => {
      const output = readFileSync(variant.output, 'utf8')
      const bridge = output.match(/from ['"]([^'"]+compiled-i18n\.ts)['"]/)?.[1]
      expect(bridge).toBeTruthy()
      return bridge!
    })
    expect(new Set(bridges).size).toBe(bridges.length)
    const hookPaths = bridges.map((bridge) => {
      const source = readFileSync(bridge, 'utf8')
      const hook = source.match(/export \{ useI18n \} from "([^"]+)"/)?.[1]
      expect(hook).toBeTruthy()
      expect(readFileSync(hook!, 'utf8')).toContain('react/compiler-runtime')
      return hook
    })
    expect(new Set(hookPaths).size).toBe(hookPaths.length)
  })

  it.each([
    { label: 'translatable fallback', failure: null, english: 'Could not load sessions', portuguese: 'Não foi possível carregar as sessões' },
    { label: 'raw diagnostic', failure: new Error('Session refresh / E_DB_42'), english: 'Session refresh / E_DB_42', portuguese: 'Session refresh / E_DB_42' },
  ])('retains the last successful devices after a revoked-session refresh fails: $label', async ({ failure, english, portuguese }) => {
    const { module } = await compiled<{ SessionsTab: ComponentType }>('pages/account/tabs/SessionsTab.tsx')
    const Sessions = module.SessionsTab
    const current: CmsSession = { id: 'current', deviceLabel: 'Current browser', ipAddress: '203.0.113.10', userAgent: 'Chrome/123', createdAt: timestamp, lastSeenAt: timestamp, expiresAt: '2027-05-09T10:00:00.000Z', isCurrent: true, mfaPassedAt: null, stepUpExpiresAt: null }
    const first = { ...current, id: 'first', deviceLabel: 'Chrome on macOS', isCurrent: false }
    const second = { ...current, id: 'second', deviceLabel: 'Firefox on Linux', isCurrent: false }
    let loads = 0
    const revoked: string[] = []
    globalThis.fetch = (async (input, init) => {
      const url = String(input)
      if (init?.method === 'DELETE') {
        revoked.push(url)
        return new Response(null, { status: 204 })
      }
      loads++
      if (loads === 2) throw failure
      return json({ sessions: loads === 1 ? [current, first, second] : [current] })
    }) as typeof fetch

    mount(<Sessions />)
    await waitFor(() => expect(screen.getByRole('row', { name: 'Session Chrome on macOS' })).toBeTruthy())
    fireEvent.click(screen.getByTestId('account-sessions-sign-out-first'))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(english))
    expect(revoked).toEqual(['/admin/api/cms/auth/sessions/first'])
    expect(loads).toBe(2)
    for (const session of [current, first, second]) {
      expect(screen.getByRole('row', { name: `Session ${session.deviceLabel}` })).toBeTruthy()
    }
    expect(screen.queryByText('No active sessions.')).toBeNull()

    switchToPortuguese()
    expect(screen.getByRole('alert').textContent).toBe(portuguese)
    expect(screen.getByRole('row', { name: 'Sessão de Firefox on Linux' })).toBeTruthy()
    switchToEnglish()
    expect(screen.getByRole('alert').textContent).toBe(english)
    expect(loads).toBe(2)

    fireEvent.click(screen.getByTestId('account-sessions-sign-out-second'))
    await waitFor(() => expect(loads).toBe(3))
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
    expect(screen.getByRole('row', { name: 'Session Current browser' })).toBeTruthy()
    expect(screen.queryByRole('row', { name: 'Session Chrome on macOS' })).toBeNull()
    expect(screen.queryByRole('row', { name: 'Session Firefox on Linux' })).toBeNull()
    expect(revoked).toEqual(['/admin/api/cms/auth/sessions/first', '/admin/api/cms/auth/sessions/second'])
  })

  it('updates compiled load fallbacks already on screen, but never translates raw server diagnostics', async () => {
    const { module } = await compiled<{ SessionsTab: ComponentType }>('pages/account/tabs/SessionsTab.tsx')
    const Sessions = module.SessionsTab
    globalThis.fetch = (async () => { throw null }) as typeof fetch
    const view = mount(<Sessions />)
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Could not load sessions'))
    switchToPortuguese()
    expect(screen.getByRole('alert').textContent).toBe('Não foi possível carregar as sessões')
    switchToEnglish()
    expect(screen.getByRole('alert').textContent).toBe('Could not load sessions')
    view.unmount()
    globalThis.fetch = (async () => json({ error: 'Wrong password / E_DB_42' }, 500)) as typeof fetch
    mount(<Sessions />)
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Wrong password / E_DB_42'))
    switchToPortuguese()
    expect(screen.getByRole('alert').textContent).toBe('Wrong password / E_DB_42')
  })

  it('updates compiled MFA dates and recovery counts with identical user inputs', async () => {
    const { module, code } = await compiled<{ MfaSettingsCards: typeof MfaSettingsCards }>('pages/account/tabs/MfaSettingsCards.tsx')
    expect(code).toMatch(/export function MfaSettingsCards[\s\S]*?const \$ = _c\(/)
    const Mfa = module.MfaSettingsCards
    mount(<Mfa {...securityProps} user={{ ...user, mfaEnabled: true, mfaEnabledAt: timestamp, mfaRecoveryCodesRemaining: 1234 }} />)
    expect(screen.getByText('1,234 recovery codes remaining.')).toBeTruthy()
    switchToPortuguese()
    expect(screen.getByText('1.234 códigos de recuperação restantes.')).toBeTruthy()
    expect(screen.getByText(`Ativada desde ${formatDate(timestamp, { dateStyle: 'medium', timeStyle: 'short' })}`)).toBeTruthy()
    switchToEnglish()
    expect(screen.getByText('1,234 recovery codes remaining.')).toBeTruthy()
  })

  it('updates stored profile success feedback without changing user-authored values', async () => {
    const { module } = await compiled<{ ProfileTab: typeof ProfileTab }>('pages/account/tabs/ProfileTab.tsx')
    const Profile = module.ProfileTab
    globalThis.fetch = (async () => json({ user: { ...user, displayName: 'Security' } })) as typeof fetch
    mount(<Profile user={user} />)
    fireEvent.change(screen.getByTestId('profile-display-name'), { target: { value: 'Security' } })
    fireEvent.submit(screen.getByTestId('profile-save').closest('form')!)
    await waitFor(() => expect(screen.getByTestId('profile-status').textContent).toBe('Profile saved.'))
    switchToPortuguese()
    expect(screen.getByTestId('profile-status').textContent).toBe('Perfil salvo.')
    expect(screen.getByDisplayValue('Security')).toBeTruthy()
    switchToEnglish()
    expect(screen.getByTestId('profile-status').textContent).toBe('Profile saved.')
  })

  it('invalidates a compiled consumer of the compiled hook for real locale inputs', async () => {
    const { module, code } = await compileAdminMetadataModule<{ useI18n: typeof useI18n }>(new URL('../../admin/i18n/useI18n.ts', import.meta.url))
    expect(code).toMatch(/!== locale/)
    expect(module.useI18n).toBeTruthy()
    const probe = await compileAdminMetadataModule<{ LocaleProbe: ComponentType }>(new URL('./accountUsersCompilerFixture.tsx', import.meta.url), [], true)
    const Probe = probe.module.LocaleProbe
    mount(<Probe />)
    expect(screen.getByText('Security')).toBeTruthy()
    switchToPortuguese()
    expect(screen.getByText('Segurança')).toBeTruthy()
    switchToEnglish()
    expect(screen.getByText('Security')).toBeTruthy()
  })

  it('updates compiled Account and Users page shells without remounting tabs', async () => {
    const account = await compiled<{ AccountPage: typeof AccountPage }>('pages/account/AccountPage.tsx')
    const Account = account.module.AccountPage
    const view = mount(<Account />)
    const profileTab = screen.getByTestId('account-tab-profile')
    switchToPortuguese()
    expect(screen.getByTestId('account-tab-profile')).toBe(profileTab)
    expect(profileTab.textContent).toBe('Perfil')
    expect(screen.getByRole('tablist', { name: 'Seções da conta' })).toBeTruthy()
    expect(screen.getByText('Conta', { selector: 'h1' })).toBeTruthy()
    switchToEnglish()
    expect(profileTab.textContent).toBe('Profile')
    view.unmount()
    const users = await compiled<{ UsersPage: typeof UsersPage }>('pages/users/UsersPage.tsx')
    const Users = users.module.UsersPage
    mount(<Users />)
    switchToPortuguese()
    expect(screen.getByRole('tablist', { name: 'Seções de usuários' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Funções' })).toBeTruthy()
    switchToEnglish()
    expect(screen.getByRole('tab', { name: 'Roles' })).toBeTruthy()
  })

  it('updates compiled profile form chrome without changing typed names/emails or authored roles', async () => {
    const { module } = await compiled<{ ProfileTab: typeof ProfileTab }>('pages/account/tabs/ProfileTab.tsx')
    const Profile = module.ProfileTab
    mount(<Profile user={user} />)
    const name = screen.getByTestId('profile-display-name') as HTMLInputElement
    fireEvent.change(name, { target: { value: 'Security' } })
    switchToPortuguese()
    expect(screen.getByLabelText('Nome')).toBe(name)
    expect(name.value).toBe('Security')
    expect(screen.getByDisplayValue(user.email)).toBeTruthy()
    expect(screen.getByText('Content editor')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Salvar perfil' })).toBeTruthy()
    switchToEnglish()
    expect(screen.getByLabelText('Name')).toBe(name)
  })

  it('updates an open compiled password dialog, persisted validation and timestamps', async () => {
    const { module, code } = await compiled<{ PasswordSettingsCard: typeof PasswordSettingsCard }>('pages/account/tabs/PasswordSettingsCard.tsx')
    expect(code).toContain('locale')
    const Password = module.PasswordSettingsCard
    mount(<Password {...securityProps} />)
    fireEvent.click(screen.getByTestId('security-change-password'))
    const input = screen.getByTestId('security-password-new') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'short' } })
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!)
    expect(screen.getByRole('alert').textContent).toBe('Password must be at least 12 characters.')
    switchToPortuguese()
    expect(screen.getByRole('dialog', { name: 'Alterar senha' })).toBeTruthy()
    expect(screen.getByLabelText('Nova senha')).toBe(input)
    expect(input.value).toBe('short')
    expect(screen.getByRole('alert').textContent).toBe('A senha deve ter pelo menos 12 caracteres.')
    expect(screen.getByText(`Última alteração: ${formatDate(timestamp, { dateStyle: 'medium', timeStyle: 'short' })}`)).toBeTruthy()
    switchToEnglish()
    expect(screen.getByRole('alert').textContent).toBe('Password must be at least 12 characters.')
  })

  it('updates compiled step-up option snapshots with stable numeric protocol values', async () => {
    const { module } = await compiled<{ StepUpSettingsCard: typeof StepUpSettingsCard }>('pages/account/tabs/StepUpSettingsCard.tsx')
    const StepUp = module.StepUpSettingsCard
    mount(<StepUp {...securityProps} />)
    const select = screen.getByRole('combobox', { name: 'Step-up window' }) as HTMLInputElement
    expect(select.value).toBe('15 minutes')
    switchToPortuguese()
    expect(screen.getByRole('combobox', { name: 'Intervalo de reautenticação' })).toBe(select)
    expect(select.value).toBe('15 minutos')
    expect(screen.getByRole('switch', { name: 'Exigir reautenticação' }).getAttribute('aria-checked')).toBe('true')
    switchToEnglish()
    expect(select.value).toBe('15 minutes')
  })

  it('updates compiled MFA setup and recovery dialogs without translating secrets, codes or otpauth URLs', async () => {
    const { module } = await compiled<{ MfaSettingsCards: typeof MfaSettingsCards }>('pages/account/tabs/MfaSettingsCards.tsx')
    const Mfa = module.MfaSettingsCards
    const secret = 'JBSWY3DPEHPK3PXP'
    const otpauthUrl = `otpauth://totp/Instatic?secret=${secret}`
    globalThis.fetch = (async (input) => String(input).endsWith('/start') ? json({ secret, otpauthUrl }) : json({ user: { ...user, mfaEnabled: true, mfaRecoveryCodesRemaining: 2 }, recoveryCodes: ['aaaa-bbbb-cccc', 'dddd-eeee-ffff'] })) as typeof fetch
    mount(<Mfa {...securityProps} />)
    fireEvent.click(screen.getByTestId('security-mfa-enable'))
    await waitFor(() => expect(screen.getByTestId('security-mfa-secret')).toBeTruthy())
    const input = screen.getByTestId('security-mfa-code') as HTMLInputElement
    fireEvent.change(input, { target: { value: '123456' } })
    switchToPortuguese()
    expect(screen.getByRole('dialog', { name: 'Ativar autenticação de dois fatores' })).toBeTruthy()
    expect(screen.getByLabelText('Código de autenticação')).toBe(input)
    expect(input.value).toBe('123456')
    expect(screen.getByTestId('security-mfa-secret').textContent).toBe(secret)
    expect(screen.getByRole('link', { name: 'Abrir aplicativo autenticador' }).getAttribute('href')).toBe(otpauthUrl)
    await waitFor(() => expect(screen.getByTestId('security-mfa-qr-code').getAttribute('alt')).toBe('Leia este código QR com seu aplicativo autenticador'))
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!)
    await waitFor(() => expect(screen.getByText('aaaa-bbbb-cccc')).toBeTruthy())
    expect(screen.getByRole('dialog', { name: 'Códigos de recuperação' })).toBeTruthy()
    switchToEnglish()
    expect(screen.getByRole('dialog', { name: 'Recovery codes' })).toBeTruthy()
    expect(screen.getByText('aaaa-bbbb-cccc')).toBeTruthy()
  })

  it('updates compiled users table status, counts, row ARIA and an open menu with unchanged data', async () => {
    const { module, code } = await compiled<{ UsersTab: typeof UsersTab }>('pages/users/tabs/UsersTab.tsx')
    expect(code).toMatch(/!== locale/)
    const Users = module.UsersTab
    mount(<Users data={data} canManageUsers />)
    fireEvent.click(screen.getByRole('button', { name: 'Actions for Profile' }))
    const menu = screen.getByRole('menu')
    switchToPortuguese()
    expect(screen.getByRole('menu', { name: 'Ações de usuário para Profile' })).toBe(menu)
    expect(screen.getByText('Redefinir senha')).toBeTruthy()
    expect(screen.getByRole('row', { name: 'Usuário owner@example.com' })).toBeTruthy()
    expect(screen.getByText('Ativo')).toBeTruthy()
    expect(screen.getByText('1 conta com acesso administrativo.')).toBeTruthy()
    switchToEnglish()
    expect(screen.getByRole('menu', { name: 'User actions for Profile' })).toBe(menu)
  })

  it('updates compiled user and role dialogs while preserving authored values and form identity', async () => {
    const users = await compiled<{ UserDialog: typeof UserDialog }>('pages/users/components/UserDialog.tsx')
    const User = users.module.UserDialog
    const view = mount(<User mode="edit" form={{ ...emptyUserForm, email: user.email, displayName: 'Security' }} roleOptions={[]} statusOptions={[]} busy={false} error={feedback('accountUsers.copy.passwordMustBeAtLeast12Characters')} onChange={() => {}} onClose={() => {}} onSubmit={() => {}} />)
    const email = screen.getByLabelText('Email')
    switchToPortuguese()
    expect(screen.getByRole('dialog', { name: 'Editar usuário' })).toBeTruthy()
    expect(screen.getByLabelText('E-mail')).toBe(email)
    expect(screen.getByDisplayValue('Security')).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toContain('12 caracteres')
    switchToEnglish()
    view.unmount()
    const roles = await compiled<{ RoleDialog: typeof RoleDialog }>('pages/users/components/RoleDialog.tsx')
    const Role = roles.module.RoleDialog
    mount(<Role mode="edit" form={{ ...emptyRoleForm, name: 'Content editor', slug: 'content-editor', description: 'Security', capabilities: ['site.read'] }} busy={false} error={null} onChange={() => {}} onClose={() => {}} onSubmit={() => {}} />)
    const slug = screen.getByDisplayValue('content-editor')
    const capability = screen.getAllByRole('checkbox')[1]
    switchToPortuguese()
    expect(screen.getAllByRole('checkbox')[1]).toBe(capability)
    expect(screen.getByRole('dialog', { name: 'Editar função' })).toBeTruthy()
    expect(screen.getByDisplayValue('content-editor')).toBe(slug)
    expect(screen.getByDisplayValue('Content editor')).toBeTruthy()
    expect(screen.getByDisplayValue('Security')).toBeTruthy()
    expect(screen.getByText('Runtime e armazenamento')).toBeTruthy()
    switchToEnglish()
    expect(screen.getByRole('dialog', { name: 'Edit Role' })).toBeTruthy()
  })

  it('updates production-compiled capability metadata for stable groups/selection and preserves IDs', async () => {
    const { module, code } = await compiled<{ CapabilityPicker: typeof CapabilityPicker }>('shared/CapabilityPicker/CapabilityPicker.tsx')
    expect(code).toMatch(/localizeCapabilityMetadata\(capability\w*, locale\)/)
    const Picker = module.CapabilityPicker
    const selected = new Set<'site.read'>(['site.read'])
    const groups = [{ title: 'Plugin-owned title', capabilities: ['site.read' as const] }]
    const snapshot = CAPABILITY_GROUPS.map((group) => [...group.capabilities])
    mount(<Picker groups={groups} selected={selected} onChange={() => {}} />)
    const checkbox = screen.getByRole('checkbox')
    expect(screen.getByText(CAPABILITY_META['site.read'].label)).toBeTruthy()
    switchToPortuguese()
    expect(screen.getByText(CAPABILITY_META['site.read'].label)).toBeTruthy()
    expect(screen.getByText(CAPABILITY_META['site.read'].description)).toBeTruthy()
    expect(screen.getByRole('checkbox')).toBe(checkbox)
    expect(screen.getByText('Plugin-owned title')).toBeTruthy()
    expect([...selected]).toEqual(['site.read'])
    expect(CAPABILITY_GROUPS.map((group) => [...group.capabilities])).toEqual(snapshot)
    switchToEnglish()
    expect(screen.getByText(CAPABILITY_META['site.read'].description)).toBeTruthy()
  })

  it('updates compiled role summaries and audit rows for unchanged role/event references', async () => {
    const roles = await compiled<{ RolesTab: typeof RolesTab }>('pages/users/tabs/RolesTab.tsx')
    const Roles = roles.module.RolesTab
    const view = mount(<Roles data={data} canManageRoles />)
    switchToPortuguese()
    expect(screen.getByText('1 permissão')).toBeTruthy()
    expect(screen.getByText('Função personalizada')).toBeTruthy()
    expect(screen.getByRole('row', { name: 'Função Content editor' })).toBeTruthy()
    switchToEnglish()
    expect(screen.getByText('1 capability')).toBeTruthy()
    view.unmount()
    const audit = await compiled<{ AuditTab: typeof AuditTab }>('pages/users/tabs/AuditTab.tsx')
    const Audit = audit.module.AuditTab
    const event: CmsAuditEvent = { id: 'audit', action: 'user.update', actorUserId: user.id, actorLabel: null, targetType: 'user', targetId: user.id, targetLabel: null, metadata: { status: 'active' }, metadataLabels: {}, ipAddress: '203.0.113.10', userAgent: 'Chrome/123', createdAt: timestamp }
    mount(<Audit data={{ ...data, events: [event] }} />)
    switchToPortuguese()
    expect(screen.getByText('Profile foi atualizado')).toBeTruthy()
    expect(screen.getByText('por Profile')).toBeTruthy()
    expect(screen.getByText('Status: Ativo')).toBeTruthy()
    expect(screen.getByText('IP: 203.0.113.10')).toBeTruthy()
    expect(screen.getByText(formatDate(timestamp, { dateStyle: 'medium', timeStyle: 'short' }))).toBeTruthy()
    switchToEnglish()
    expect(screen.getByText('Profile was updated')).toBeTruthy()
  })

  it('updates compiled session date/relative time and activity outcomes without refetching', async () => {
    const sessions = await compiled<{ SessionsTab: ComponentType }>('pages/account/tabs/SessionsTab.tsx')
    const Sessions = sessions.module.SessionsTab
    const session: CmsSession = { id: 'sess_1', deviceLabel: 'Chrome on macOS', ipAddress: '203.0.113.10', userAgent: 'Chrome/123', createdAt: timestamp, lastSeenAt: new Date(Date.now() - 5 * 60_000).toISOString(), expiresAt: '2027-05-09T10:00:00.000Z', isCurrent: false, mfaPassedAt: null, stepUpExpiresAt: null }
    let calls = 0
    globalThis.fetch = (async () => { calls++; return json({ sessions: [session] }) }) as typeof fetch
    const view = mount(<Sessions />)
    await waitFor(() => expect(screen.getByRole('row', { name: 'Session Chrome on macOS' })).toBeTruthy())
    switchToPortuguese()
    expect(screen.getByRole('row', { name: 'Sessão de Chrome on macOS' })).toBeTruthy()
    expect(screen.getByText('há 5 minutos')).toBeTruthy()
    expect(screen.getByText('203.0.113.10')).toBeTruthy()
    switchToEnglish()
    expect(calls).toBe(1)
    view.unmount()
    const activity = await compiled<{ ActivityTab: ComponentType }>('pages/account/tabs/ActivityTab.tsx')
    const Activity = activity.module.ActivityTab
    calls = 0
    globalThis.fetch = (async () => { calls++; return json({ events: [{ id: 'activity_1', emailNorm: user.email, userId: user.id, attemptedAt: new Date().toISOString(), deviceLabel: 'Chrome on macOS', ipAddress: '203.0.113.10', result: 'locked' }] }) }) as typeof fetch
    mount(<Activity />)
    await waitFor(() => expect(screen.getByText('Account locked')).toBeTruthy())
    switchToPortuguese()
    expect(screen.getByRole('row', { name: 'Atividade: Conta bloqueada' })).toBeTruthy()
    expect(screen.getByTestId('account-activity-failed-count').textContent).toBe('1 tentativa malsucedida nas últimas 24 h')
    expect(screen.getByTestId('account-activity-suspicious').textContent).toContain('Atividade suspeita')
    switchToEnglish()
    expect(screen.getByText('Account locked')).toBeTruthy()
    expect(calls).toBe(1)
  })

  it('localizes compiled loading and empty states without interpreting protocol values', async () => {
    const { module } = await compiled<{ UsersTab: typeof UsersTab }>('pages/users/tabs/UsersTab.tsx')
    const Users = module.UsersTab
    const view = mount(<Users data={{ ...data, loading: true }} canManageUsers />)
    switchToPortuguese()
    expect(screen.getByRole('table', { name: 'Carregando usuários' }).getAttribute('aria-busy')).toBe('true')
    view.unmount()
    mount(<Users data={{ ...data, users: [] }} canManageUsers />)
    expect(screen.getByText('Ainda não há usuários.')).toBeTruthy()
    expect(screen.getByText('0 conta com acesso administrativo.')).toBeTruthy()
  })
})
