import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import type { MockedFunction, SpyInstance, Mock } from 'bun:test'
import type { Mock as BunMock } from 'bun:test'
type Mock<T> = BunMock<T>
import { useState } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { I18nProvider, resetI18nForTests, setLocale, translate } from '@admin/i18n'
import { AdminPreAuthForm, type PreAuthPhase } from '@admin/preauth/AdminPreAuthForm'
import { MIN_PASSWORD_LENGTH } from '@core/utils/passwordPolicy'

function createFetchSpy() {
  return spyOn(globalThis, 'fetch') as BunMock<typeof globalThis.fetch>
}

let fetchSpy: ReturnType<typeof createFetchSpy>
const brand = 'My Site · João’s Studio'

beforeEach(() => {
  fetchSpy = createFetchSpy()
  localStorage.clear()
  resetI18nForTests()
  setLocale('en')
})

afterEach(() => {
  cleanup()
  fetchSpy.mockRestore()
  localStorage.clear()
  resetI18nForTests()
})

function mount(phase: PreAuthPhase, initialError: string | null = null) {
  function Harness() {
    const [currentPhase, setPhase] = useState(phase)
    return <I18nProvider><AdminPreAuthForm
      phase={currentPhase}
      publicSite={{ name: brand, faviconUrl: '/uploads/operator-logo.png' }}
      initialError={initialError}
      onPhaseChange={setPhase}
      onAuthenticated={() => {}}
    /></I18nProvider>
  }
  return render(<Harness />)
}

function switchLanguage(locale: 'en' | 'pt-BR') {
  fireEvent.change(screen.getByRole('combobox'), { target: { value: locale } })
}

function field(name: string) {
  return screen.getByLabelText(name) as HTMLInputElement
}

function submit() {
  fireEvent.submit(screen.getByRole('button', { name: translate('auth.setup.submit') }).closest('form')!)
}

function fillSetup(email = 'owner@example.com', password = 'unchanged-password') {
  fireEvent.change(field('Email'), { target: { value: email } })
  fireEvent.change(field('Password'), { target: { value: password } })
  fireEvent.change(screen.getByTestId('admin-setup-display-name'), { target: { value: 'João Silva' } })
}

describe('mounted pre-auth i18n', () => {
  for (const phase of ['setup', 'login', 'mfa'] as const) {
    it(`updates ${phase} headings, labels and actions without translating operator branding`, () => {
      mount(phase)
      expect(screen.getByRole('heading', { name: translate(`auth.${phase}.title`) })).toBeDefined()
      expect(screen.getByRole('button', { name: translate(`auth.${phase}.submit`) })).toBeDefined()
      if (phase === 'mfa') expect(field('Authentication code')).toBeDefined()
      else {
        expect(field('Email')).toBeDefined()
        expect(field('Password')).toBeDefined()
      }
      if (phase === 'setup') {
        expect(field('Site name').value).toBe('My Site')
        expect(screen.getByLabelText(/Your name/)).toBeDefined()
      }
      switchLanguage('pt-BR')
      expect(screen.getByRole('heading', { name: translate(`auth.${phase}.title`) })).toBeDefined()
      expect(screen.getByRole('button', { name: translate(`auth.${phase}.submit`) })).toBeDefined()
      if (phase === 'mfa') expect(field('Código de autenticação')).toBeDefined()
      else {
        expect(field('E-mail')).toBeDefined()
        expect(field('Senha')).toBeDefined()
      }
      if (phase === 'setup') {
        expect(field('Nome do site').value).toBe('My Site')
        expect(screen.getByLabelText(/Seu nome/)).toBeDefined()
      }
      expect(screen.getByText(brand)).toBeDefined()
      expect(document.querySelector('img')?.getAttribute('src')).toBe('/uploads/operator-logo.png')
    })
  }

  for (const validation of ['email', 'passwordMinimum'] as const) {
    it(`keeps ${validation} validation reactive without resetting entered fields`, () => {
      fetchSpy.mockImplementation(async () => {
              throw new Error('Unexpected auth request');
            })
      mount('setup')
      const email = validation === 'email' ? 'owner@local' : 'owner@example.com'
      const password = validation === 'email' ? 'unchanged-password' : 'short'
      fillSetup(email, password)
      fireEvent.change(field('Site name'), { target: { value: 'User-entered Site' } })
      submit()
      const values = { count: MIN_PASSWORD_LENGTH }
      expect(screen.getByRole('alert').textContent).toBe(translate(`auth.validation.${validation}`, values))
      switchLanguage('pt-BR')
      expect(screen.getByRole('alert').textContent).toBe(translate(`auth.validation.${validation}`, values))
      expect(field('Nome do site').value).toBe('User-entered Site')
      expect(field('E-mail').value).toBe(email)
      expect(field('Senha').value).toBe(password)
      expect((screen.getByTestId('admin-setup-display-name') as HTMLInputElement).value).toBe('João Silva')
      switchLanguage('en')
      expect(screen.getByRole('alert').textContent).toBe(translate(`auth.validation.${validation}`, values))
      expect(fetchSpy).not.toHaveBeenCalled()
    })
  }

  for (const phase of ['setup', 'login', 'mfa'] as const) {
    it(`retranslates the ${phase} fallback after a message-less failure`, async () => {
      fetchSpy.mockImplementation(async () => {
              throw new Error('   ');
            })
      mount(phase)
      if (phase === 'setup') fillSetup()
      else if (phase === 'login') {
        fireEvent.change(field('Email'), { target: { value: 'owner@example.com' } })
        fireEvent.change(field('Password'), { target: { value: 'unchanged-password' } })
      } else fireEvent.change(field('Authentication code'), { target: { value: '123456' } })
      fireEvent.submit(screen.getByRole('button', { name: translate(`auth.${phase}.submit`) }).closest('form')!)
      await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(translate(`auth.${phase}.failed`)))
      switchLanguage('pt-BR')
      expect(screen.getByRole('alert').textContent).toBe(translate(`auth.${phase}.failed`))
      if (phase === 'mfa') expect(field('Código de autenticação').value).toBe('123456')
      else expect(field('E-mail').value).toBe('owner@example.com')
    })

    it(`preserves raw ${phase} server messages verbatim on language changes`, async () => {
      const message = '  Server says: Login failed · conta bloqueada  '
      fetchSpy.mockImplementation(async () => {
              return Response.json({ error: message }, { status: 403 });
            })
      mount(phase)
      if (phase === 'setup') fillSetup()
      fireEvent.submit(screen.getByRole('button', { name: translate(`auth.${phase}.submit`) }).closest('form')!)
      await waitFor(() => expect(screen.getByRole('alert').textContent).toBe(message))
      switchLanguage('pt-BR')
      expect(screen.getByRole('alert').textContent).toBe(message)
      switchLanguage('en')
      expect(screen.getByRole('alert').textContent).toBe(message)
    })
  }

  it('preserves a raw initial error rather than treating matching English copy as a key', () => {
    mount('login', 'Login failed')
    switchLanguage('pt-BR')
    expect(screen.getByRole('alert').textContent).toBe('Login failed')
  })

  it('submits the untranslated default site name and user data through setup then login', async () => {
    const requests: { url: string; body: unknown }[] = []
    fetchSpy.mockImplementation(async (input, init) => {
      const url = String(input)
      requests.push({ url, body: init?.body ? JSON.parse(String(init.body)) : null })
      if (url.endsWith('/setup')) return Response.json({ ok: true })
      return Response.json({ error: 'Stop after login' }, { status: 403 })
    })
    mount('setup')
    fillSetup()
    switchLanguage('pt-BR')
    submit()
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Stop after login'))
    expect(requests).toEqual([
      { url: '/admin/api/cms/setup', body: { siteName: 'My Site', email: 'owner@example.com', password: 'unchanged-password', displayName: 'João Silva' } },
      { url: '/admin/api/cms/login', body: { email: 'owner@example.com', password: 'unchanged-password' } },
    ])
  })

  it('enters the real MFA phase after login and preserves the code on language changes', async () => {
    fetchSpy.mockImplementation(async () => Response.json({ ok: true, mfaRequired: true }))
    mount('login')
    fireEvent.change(field('Email'), { target: { value: 'owner@example.com' } })
    fireEvent.change(field('Password'), { target: { value: 'unchanged-password' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Sign In' }).closest('form')!)
    await screen.findByRole('heading', { name: 'Two-Factor Authentication' })
    fireEvent.change(field('Authentication code'), { target: { value: '123456' } })
    switchLanguage('pt-BR')
    expect(screen.getByRole('heading', { name: 'Autenticação de dois fatores' })).toBeDefined()
    expect(field('Código de autenticação').value).toBe('123456')
    expect(screen.queryByLabelText('Senha')).toBeNull()
  })
})
