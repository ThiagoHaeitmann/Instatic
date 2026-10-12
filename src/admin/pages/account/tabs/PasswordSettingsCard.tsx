import { reportFeedbackError, feedback, renderFeedback, type AccountUsersFeedback } from '@admin/shared/accountUsersFeedback'
import { useI18n } from '@admin/i18n'
import { useId, useState, type FormEvent } from 'react'
import type { CmsCurrentUser } from '@core/persistence'
import { changeCurrentUserPassword } from '@core/persistence'
import { Button } from '@ui/components/Button'
import { Dialog } from '@ui/components/Dialog'
import { Input } from '@ui/components/Input'
import { SecurityCard } from './SecurityCard'
import { isStepUpCancelled } from './securityErrors'
import { formatDateTime } from './securityFormat'
import styles from '../AccountPage.module.css'

interface PasswordSettingsCardProps {
  user: CmsCurrentUser
  busy: string | null
  runStepUp: <T>(fn: () => Promise<T>) => Promise<T>
  setSessionUser: (user: CmsCurrentUser) => void
  setBusy: (v: string | null) => void
  setStatus: (v: AccountUsersFeedback | null) => void
}

async function updatePassword(
  newPassword: string,
  { runStepUp, setSessionUser, setBusy, setStatus }: PasswordSettingsCardProps,
  resetDialog: () => void,
): Promise<void> {
  setBusy('password')
  try {
    const updated = await runStepUp(() => changeCurrentUserPassword({ newPassword }))
    setSessionUser(updated)
    resetDialog()
    setStatus(feedback('accountUsers.copy.passwordUpdatedOtherDevicesWereSignedOut'))
  } catch (err) {
    if (!isStepUpCancelled(err)) {
      reportFeedbackError(err, 'accountUsers.copy.couldNotUpdatePassword')
    }
  } finally {
    setBusy(null)
  }
}

export function PasswordSettingsCard({
  user,
  busy,
  runStepUp,
  setSessionUser,
  setBusy,
  setStatus,
}: PasswordSettingsCardProps) {
  const { t, locale } = useI18n()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<AccountUsersFeedback | null>(null)
  const newPasswordId = useId()
  const confirmPasswordId = useId()

  const passwordStatus = user.passwordUpdatedAt
    ? t('accountUsers.password.lastChanged', { date: formatDateTime(user.passwordUpdatedAt, locale) })
    : user.lastLoginAt
      ? t('accountUsers.password.lastLogin', { date: formatDateTime(user.lastLoginAt, locale) })
      : t('accountUsers.copy.passwordHasNotBeenUsedYet')

  function resetDialog(): void {
    setDialogOpen(false)
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (busy) return
    setPasswordError(null)
    setStatus(null)
    if (newPassword.length < 12) {
      setPasswordError(feedback('accountUsers.copy.passwordMustBeAtLeast12Characters'))
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(feedback('accountUsers.copy.passwordsDoNotMatch'))
      return
    }

    await updatePassword(newPassword, { user, busy, runStepUp, setSessionUser, setBusy, setStatus }, resetDialog)
  }

  return (
    <>
      <SecurityCard
        testId="security-password-card"
        title={t('accountUsers.copy.password')}
        description={t('accountUsers.copy.changeYourPasswordOtherDevicesAreSignedOutAfterASuccessfulUpdate')}
        status={passwordStatus}
        action={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy !== null}
            onClick={() => setDialogOpen(true)}
            data-testid="security-change-password"
          >
            <span>{t('accountUsers.copy.changePassword')}</span>
          </Button>
        }
      />

      <Dialog
        open={dialogOpen}
        onClose={resetDialog}
        title={t('accountUsers.copy.changePassword')}
        size="md"
        footer={
          <>
            <Button type="button" variant="secondary" size="sm" disabled={busy === 'password'} onClick={resetDialog}>
              <span>{t('accountUsers.copy.cancel')}</span>
            </Button>
            <Button
              type="submit"
              form="security-password-form"
              variant="primary"
              size="sm"
              disabled={busy === 'password'}
              data-testid="security-password-submit"
            >
              <span>{busy === 'password' ? t('accountUsers.copy.savingAlternate') : t('accountUsers.copy.savePassword')}</span>
            </Button>
          </>
        }
      >
        <form id="security-password-form" className={styles.dialogFields} onSubmit={(event) => void handleSubmit(event)}>
          <div className={styles.dialogField}>
            <label htmlFor={newPasswordId} className={styles.dialogLabel}>{t('accountUsers.copy.newPassword')}</label>
            <Input
              id={newPasswordId}
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.currentTarget.value)}
              data-testid="security-password-new"
            />
          </div>
          <div className={styles.dialogField}>
            <label htmlFor={confirmPasswordId} className={styles.dialogLabel}>{t('accountUsers.copy.confirmNewPassword')}</label>
            <Input
              id={confirmPasswordId}
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.currentTarget.value)}
              data-testid="security-password-confirm"
            />
          </div>
          {passwordError && <p className={styles.error} role="alert">{renderFeedback(passwordError, locale, t)}</p>}
        </form>
      </Dialog>
    </>
  )
}
