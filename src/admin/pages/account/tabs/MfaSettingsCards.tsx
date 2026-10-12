import { feedback, reportFeedbackError, renderFeedback, type AccountUsersFeedback } from '@admin/shared/accountUsersFeedback'
import { formatNumber, useI18n } from '@admin/i18n'
import { useEffect, useId, useReducer, type Dispatch, type FormEvent } from 'react'
import type { CmsCurrentUser } from '@core/persistence'
import {
  disableCurrentUserTotp,
  enableCurrentUserTotp,
  regenerateCurrentUserRecoveryCodes,
  startCurrentUserTotpSetup,
} from '@core/persistence'
import { Button } from '@ui/components/Button'
import { Dialog } from '@ui/components/Dialog'
import { Input } from '@ui/components/Input'
import { CopySolidIcon } from 'pixel-art-icons/icons/copy-solid'
import { SecurityCard } from './SecurityCard'
import { isStepUpCancelled } from './securityErrors'
import { formatDateTime } from './securityFormat'
import styles from '../AccountPage.module.css'

interface MfaSettingsCardsProps {
  user: CmsCurrentUser
  busy: string | null
  runStepUp: <T>(fn: () => Promise<T>) => Promise<T>
  setSessionUser: (user: CmsCurrentUser) => void
  setBusy: (v: string | null) => void
  setStatus: (v: AccountUsersFeedback | null) => void
}

interface TotpSetup {
  secret: string
  otpauthUrl: string
}

interface TotpQrCode {
  otpauthUrl: string
  dataUrl: string
}

interface TotpQrError {
  otpauthUrl: string
  message: AccountUsersFeedback
}

interface MfaState {
  totpSetup: TotpSetup | null
  totpCode: string
  totpQrCode: TotpQrCode | null
  totpQrError: TotpQrError | null
  secretCopied: boolean
  recoveryCodes: string[]
}

type MfaAction =
  | { type: 'setupStarted'; setup: TotpSetup }
  | { type: 'resetSetup' }
  | { type: 'setTotpCode'; code: string }
  | { type: 'qrRendered'; otpauthUrl: string; dataUrl: string }
  | { type: 'qrFailed'; otpauthUrl: string; message: AccountUsersFeedback }
  | { type: 'copySecretSucceeded' }
  | { type: 'setRecoveryCodes'; recoveryCodes: string[] }
  | { type: 'clearRecoveryCodes' }

const initialMfaState: MfaState = {
  totpSetup: null,
  totpCode: '',
  totpQrCode: null,
  totpQrError: null,
  secretCopied: false,
  recoveryCodes: [],
}

function mfaReducer(state: MfaState, action: MfaAction): MfaState {
  switch (action.type) {
    case 'setupStarted':
      return {
        ...state,
        totpSetup: action.setup,
        totpCode: '',
        totpQrCode: null,
        totpQrError: null,
        secretCopied: false,
      }
    case 'resetSetup':
      return {
        ...state,
        totpSetup: null,
        totpCode: '',
        totpQrCode: null,
        totpQrError: null,
        secretCopied: false,
      }
    case 'setTotpCode':
      return { ...state, totpCode: action.code }
    case 'qrRendered':
      if (state.totpSetup?.otpauthUrl !== action.otpauthUrl) return state
      return {
        ...state,
        totpQrCode: { otpauthUrl: action.otpauthUrl, dataUrl: action.dataUrl },
        totpQrError: null,
      }
    case 'qrFailed':
      if (state.totpSetup?.otpauthUrl !== action.otpauthUrl) return state
      return {
        ...state,
        totpQrError: { otpauthUrl: action.otpauthUrl, message: action.message },
      }
    case 'copySecretSucceeded':
      return { ...state, secretCopied: true }
    case 'setRecoveryCodes':
      return { ...state, recoveryCodes: action.recoveryCodes }
    case 'clearRecoveryCodes':
      return { ...state, recoveryCodes: [] }
  }
}

async function renderQrCode(
  setup: TotpSetup,
  isCancelled: () => boolean,
  dispatch: Dispatch<MfaAction>,
): Promise<void> {
  try {
    const { renderSVG } = await import('uqr')
    const svg = renderSVG(setup.otpauthUrl, {
      border: 2,
      ecc: 'M',
      blackColor: '#000000',
      whiteColor: '#ffffff',
    })
    if (!isCancelled()) {
      dispatch({
        type: 'qrRendered',
        otpauthUrl: setup.otpauthUrl,
        dataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      })
    }
  } catch (err) {
    console.error('[account-security] QR code generation failed:', err)
    if (!isCancelled()) {
      dispatch({
        type: 'qrFailed',
        otpauthUrl: setup.otpauthUrl,
        message: feedback('accountUsers.copy.couldNotRenderTheQRCodeUseTheSetupKeyInstead'),
      })
    }
  }
}

interface TotpSetupDialogProps {
  state: MfaState
  busy: string | null
  totpCodeId: string
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCopySecret: () => void
  onCodeChange: (code: string) => void
}

function TotpSetupDialog({
  state,
  busy,
  totpCodeId,
  onClose,
  onSubmit,
  onCopySecret,
  onCodeChange,
}: TotpSetupDialogProps) {
  const { t, locale } = useI18n()
  const currentTotpQrDataUrl =
    state.totpSetup && state.totpQrCode?.otpauthUrl === state.totpSetup.otpauthUrl ? state.totpQrCode.dataUrl : null
  const currentTotpQrError =
    state.totpSetup && state.totpQrError?.otpauthUrl === state.totpSetup.otpauthUrl ? state.totpQrError.message : null

  return (
    <Dialog
      open={state.totpSetup !== null}
      onClose={onClose}
      title={t('accountUsers.copy.enableTwoFactorAuthentication')}
      size="lg"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy === 'mfa-enable'}
            onClick={onClose}
          >
            <span>{t('accountUsers.copy.cancel')}</span>
          </Button>
          <Button
            type="submit"
            form="security-mfa-form"
            variant="primary"
            size="sm"
            disabled={busy === 'mfa-enable' || state.totpCode.trim().length < 6}
            data-testid="security-mfa-submit"
          >
            <span>{busy === 'mfa-enable' ? t('accountUsers.copy.enabling') : t('accountUsers.copy.enableMFA')}</span>
          </Button>
        </>
      }
    >
      {state.totpSetup && (
        <form id="security-mfa-form" className={styles.dialogFields} onSubmit={onSubmit}>
          <div className={styles.mfaSetupGrid}>
            <div className={styles.qrPanel}>
              <div className={styles.qrFrame} aria-live="polite">
                {currentTotpQrDataUrl ? (
                  <img
                    src={currentTotpQrDataUrl}
                    alt={t('accountUsers.copy.scanThisQRCodeWithYourAuthenticatorApp')}
                    data-testid="security-mfa-qr-code"
                  />
                ) : (
                  <span className={styles.qrPlaceholder}>
                    {currentTotpQrError ? t('accountUsers.copy.qRCodeUnavailable') : t('accountUsers.copy.renderingQRCode')}
                  </span>
                )}
              </div>
              {currentTotpQrError && <p className={styles.error} role="alert">{renderFeedback(currentTotpQrError, locale, t)}</p>}
            </div>

            <div className={styles.mfaSetupContent}>
              <div className={styles.mfaStep}>
                <h3>{t('accountUsers.copy.scanTheQRCode')}</h3>
                <p className={styles.secondaryText}>
                  {t('accountUsers.copy.useGoogleAuthenticator1PasswordMicrosoftAuthenticatorAuthyOrAnyTOTPApp')}
                </p>
              </div>

              <div className={styles.secretBox}>
                <span className={styles.dialogLabel}>{t('accountUsers.copy.manualSetupKey')}</span>
                <code data-testid="security-mfa-secret">{state.totpSetup.secret}</code>
                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  onClick={onCopySecret}
                  data-testid="security-mfa-copy-secret"
                >
                  <CopySolidIcon size={12} aria-hidden="true" />
                  <span>{state.secretCopied ? t('accountUsers.copy.copied') : t('accountUsers.copy.copyKey')}</span>
                </Button>
              </div>

              <a className={styles.authenticatorLink} href={state.totpSetup.otpauthUrl}>
                {t('accountUsers.copy.openAuthenticatorApp')}
              </a>

              <div className={styles.dialogField}>
                <label htmlFor={totpCodeId} className={styles.dialogLabel}>{t('accountUsers.copy.authenticationCode')}</label>
                <Input
                  id={totpCodeId}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={state.totpCode}
                  onChange={(event) => onCodeChange(event.currentTarget.value)}
                  data-testid="security-mfa-code"
                />
              </div>
            </div>
          </div>
        </form>
      )}
    </Dialog>
  )
}

interface RecoveryCodesDialogProps {
  recoveryCodes: string[]
  onClose: () => void
}

function RecoveryCodesDialog({ recoveryCodes, onClose }: RecoveryCodesDialogProps) {
  const { t } = useI18n()
  return (
    <Dialog
      open={recoveryCodes.length > 0}
      onClose={onClose}
      title={t('accountUsers.copy.recoveryCodes')}
      size="md"
      footer={
        <Button type="button" variant="primary" size="sm" onClick={onClose}>
          <span>{t('accountUsers.copy.done')}</span>
        </Button>
      }
    >
      <div className={styles.dialogFields}>
        <p className={styles.secondaryText}>
          {t('accountUsers.copy.saveTheseRecoveryCodesNowTheyWillNotBeShownAgain')}
        </p>
        <div className={styles.recoveryGrid}>
          {recoveryCodes.map((code) => (
            <code key={code}>{code}</code>
          ))}
        </div>
      </div>
    </Dialog>
  )
}

async function runMfaAction<TResult>(
  action: () => Promise<TResult>,
  onSuccess: (result: TResult) => void,
  onError: (error: unknown) => void,
  setBusy: (value: string | null) => void,
): Promise<void> {
  try {
    onSuccess(await action())
  } catch (err) {
    if (!isStepUpCancelled(err)) onError(err)
  } finally {
    setBusy(null)
  }
}

export function MfaSettingsCards({
  user,
  busy,
  runStepUp,
  setSessionUser,
  setBusy,
  setStatus,
}: MfaSettingsCardsProps) {
  const { t, locale } = useI18n()
  const [state, dispatch] = useReducer(mfaReducer, initialMfaState)
  const totpCodeId = useId()

  const mfaStatus = user.mfaEnabled
    ? user.mfaEnabledAt
      ? t('accountUsers.mfa.since', { date: formatDateTime(user.mfaEnabledAt, locale) })
      : t('accountUsers.copy.on')
    : t('accountUsers.copy.off')

  const recoveryStatus = user.mfaEnabled
    ? t('accountUsers.recovery.remaining', { count: user.mfaRecoveryCodesRemaining, formattedCount: formatNumber(user.mfaRecoveryCodesRemaining, undefined, locale) })
    : t('accountUsers.copy.enableTwoFactorAuthenticationBeforeGeneratingRecoveryCodes')

  useEffect(() => {
    if (!state.totpSetup) return undefined

    const setup = state.totpSetup
    let cancelled = false

    void renderQrCode(setup, () => cancelled, dispatch)
    return () => { cancelled = true }
  }, [state.totpSetup])

  async function handleCopySecret(): Promise<void> {
    if (!state.totpSetup) return
    if (!navigator.clipboard?.writeText) {
      reportFeedbackError(null, 'accountUsers.copy.clipboardIsNotAvailableInThisBrowser')
      return
    }

    try {
      await navigator.clipboard.writeText(state.totpSetup.secret)
      dispatch({ type: 'copySecretSucceeded' })
    } catch (err) {
      console.error('[account-security] Copy MFA setup key failed:', err)
      reportFeedbackError(err, 'accountUsers.copy.couldNotCopyTheSetupKey')
    }
  }

  async function handleStartMfa(): Promise<void> {
    if (busy) return
    setBusy('mfa-start')
    setStatus(null)
    await runMfaAction(
      () => runStepUp(() => startCurrentUserTotpSetup()),
      (setup) => dispatch({ type: 'setupStarted', setup }),
      (err) => reportFeedbackError(err, 'accountUsers.copy.couldNotStartMFASetup'),
      setBusy,
    )
  }

  async function handleEnableMfa(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const setup = state.totpSetup
    if (busy || !setup) return
    setBusy('mfa-enable')
    setStatus(null)
    await runMfaAction(
      () => runStepUp(() => enableCurrentUserTotp({ secret: setup.secret, code: state.totpCode })),
      (result) => {
        setSessionUser(result.user)
        dispatch({ type: 'resetSetup' })
        dispatch({ type: 'setRecoveryCodes', recoveryCodes: result.recoveryCodes })
        setStatus(feedback('accountUsers.copy.twoFactorAuthenticationEnabled'))
      },
      (err) => reportFeedbackError(err, 'accountUsers.copy.couldNotEnableMFA'),
      setBusy,
    )
  }

  async function handleDisableMfa(): Promise<void> {
    if (busy) return
    setBusy('mfa-disable')
    setStatus(null)
    await runMfaAction(
      () => runStepUp(() => disableCurrentUserTotp()),
      (updated) => {
        setSessionUser(updated)
        dispatch({ type: 'clearRecoveryCodes' })
        setStatus(feedback('accountUsers.copy.twoFactorAuthenticationDisabled'))
      },
      (err) => reportFeedbackError(err, 'accountUsers.copy.couldNotDisableMFA'),
      setBusy,
    )
  }

  async function handleRegenerateRecoveryCodes(): Promise<void> {
    if (busy || !user.mfaEnabled) return
    setBusy('recovery')
    setStatus(null)
    await runMfaAction(
      () => runStepUp(() => regenerateCurrentUserRecoveryCodes()),
      (result) => {
        setSessionUser(result.user)
        dispatch({ type: 'setRecoveryCodes', recoveryCodes: result.recoveryCodes })
        setStatus(feedback('accountUsers.copy.recoveryCodesRegenerated'))
      },
      (err) => reportFeedbackError(err, 'accountUsers.copy.couldNotRegenerateRecoveryCodes'),
      setBusy,
    )
  }

  return (
    <>
      <SecurityCard
        testId="security-mfa-card"
        title={t('accountUsers.copy.twoFactorAuthentication')}
        description={t('accountUsers.copy.useATOTPAuthenticatorAppAsASecondFactorWhenSigningIn')}
        status={mfaStatus}
        statusActive={user.mfaEnabled}
        action={
          user.mfaEnabled ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy !== null}
              onClick={() => void handleDisableMfa()}
              data-testid="security-mfa-disable"
            >
              <span>{busy === 'mfa-disable' ? t('accountUsers.copy.disabling') : t('accountUsers.copy.disable')}</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy !== null}
              onClick={() => void handleStartMfa()}
              data-testid="security-mfa-enable"
            >
              <span>{busy === 'mfa-start' ? t('accountUsers.copy.starting') : t('accountUsers.copy.enable')}</span>
            </Button>
          )
        }
      />
      <SecurityCard
        testId="security-recovery-card"
        title={t('accountUsers.copy.recoveryCodes')}
        description={t('accountUsers.copy.oneTimeCodesYouCanUseIfYouLoseAccessToYourAuthenticatorApp')}
        status={recoveryStatus}
        statusActive={user.mfaEnabled && user.mfaRecoveryCodesRemaining > 0}
        action={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy !== null || !user.mfaEnabled}
            onClick={() => void handleRegenerateRecoveryCodes()}
            data-testid="security-recovery-regenerate"
          >
            <span>{busy === 'recovery' ? t('accountUsers.copy.generating') : t('accountUsers.copy.generateCodes')}</span>
          </Button>
        }
      />

      <TotpSetupDialog
        state={state}
        busy={busy}
        totpCodeId={totpCodeId}
        onClose={() => dispatch({ type: 'resetSetup' })}
        onSubmit={(event) => void handleEnableMfa(event)}
        onCopySecret={() => void handleCopySecret()}
        onCodeChange={(code) => dispatch({ type: 'setTotpCode', code })}
      />
      <RecoveryCodesDialog
        recoveryCodes={state.recoveryCodes}
        onClose={() => dispatch({ type: 'clearRecoveryCodes' })}
      />
    </>
  )
}
