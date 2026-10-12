import { renderFeedback, type AccountUsersFeedback } from '@admin/shared/accountUsersFeedback'
import { useI18n } from '@admin/i18n'
import { useState } from 'react'
import type { CmsCurrentUser } from '@core/persistence'
import { Button } from '@ui/components/Button'
import { useAdminSessionSetter } from '@admin/sessionContext'
import { useStepUp } from '@admin/shared/StepUp'
import { MfaSettingsCards } from './MfaSettingsCards'
import { PasswordSettingsCard } from './PasswordSettingsCard'
import { SecurityCard } from './SecurityCard'
import { StepUpSettingsCard } from './StepUpSettingsCard'
import styles from '../AccountPage.module.css'

interface SecurityTabProps {
  user: CmsCurrentUser
}

export function SecurityTab({ user }: SecurityTabProps) {
  const { t, locale } = useI18n()
  const { runStepUp } = useStepUp()
  const setSessionUser = useAdminSessionSetter()
  const [busy, setBusy] = useState<string | null>(null)
  const [status, setStatus] = useState<AccountUsersFeedback | null>(null)

  return (
    <section className={styles.section} aria-labelledby="account-security-title">
      <div className={styles.sectionHeader}>
        <div>
          <h2 id="account-security-title">{t('accountUsers.copy.security')}</h2>
          <p>{t('accountUsers.copy.passwordStepUpAuthenticationTwoFactorAuthenticationAndConnectedSignIns')}</p>
        </div>
      </div>

      {status && <p className={styles.cardStatus} role="status">{renderFeedback(status, locale, t)}</p>}

      <div className={styles.cards}>
        <PasswordSettingsCard
          user={user}
          busy={busy}
          runStepUp={runStepUp}
          setSessionUser={setSessionUser}
          setBusy={setBusy}
          setStatus={setStatus}
        />
        <StepUpSettingsCard
          user={user}
          busy={busy}
          runStepUp={runStepUp}
          setSessionUser={setSessionUser}
          setBusy={setBusy}
          setStatus={setStatus}
        />
        <MfaSettingsCards
          user={user}
          busy={busy}
          runStepUp={runStepUp}
          setSessionUser={setSessionUser}
          setBusy={setBusy}
          setStatus={setStatus}
        />
        <SecurityCard
          testId="security-connected-card"
          title={t('accountUsers.copy.connectedSignIns')}
          description={t('accountUsers.copy.oAuthProvidersAndPasskeysYouCanUseAlongsideYourPassword')}
          status={t('accountUsers.copy.emailPasswordIsTheOnlySignInMethodRightNow')}
          action={
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled
              tooltip={t('accountUsers.copy.oAuthAndPasskeysAreASeparateSignInProviderPass')}
            >
              <span>{t('accountUsers.copy.addProvider')}</span>
            </Button>
          }
        />
      </div>
    </section>
  )
}
