import { reportFeedbackError, feedback, type AccountUsersFeedback } from '@admin/shared/accountUsersFeedback'
import { formatNumber, useI18n } from '@admin/i18n'
import type { CmsCurrentUser, CmsStepUpAuthMode, CmsStepUpWindowMinutes } from '@core/persistence'
import { updateCurrentUserStepUpSettings } from '@core/persistence'
import { Select } from '@ui/components/Select'
import { Switch } from '@ui/components/Switch'
import { SecurityCard } from './SecurityCard'
import { isStepUpCancelled } from './securityErrors'
import styles from '../AccountPage.module.css'

interface StepUpSettingsCardProps {
  user: CmsCurrentUser
  busy: string | null
  runStepUp: <T>(fn: () => Promise<T>) => Promise<T>
  setSessionUser: (user: CmsCurrentUser) => void
  setBusy: (v: string | null) => void
  setStatus: (v: AccountUsersFeedback | null) => void
}

const STEP_UP_WINDOWS = ['5', '15', '30', '60'] as const

function parseStepUpWindowMinutes(value: string): CmsStepUpWindowMinutes | null {
  if (value === '5') return 5
  if (value === '15') return 15
  if (value === '30') return 30
  if (value === '60') return 60
  return null
}

async function updateStepUpSettings(
  input: {
    mode: CmsStepUpAuthMode
    windowMinutes: CmsStepUpWindowMinutes
  },
  props: StepUpSettingsCardProps,
): Promise<void> {
  const { runStepUp, setSessionUser, setBusy, setStatus } = props
  try {
    const updated = await runStepUp(() => updateCurrentUserStepUpSettings(input))
    setSessionUser(updated)
    setStatus(
      updated.stepUpAuthMode === 'required'
        ? feedback('accountUsers.stepUp.updated', { count: updated.stepUpWindowMinutes })
        : feedback('accountUsers.copy.stepUpAuthenticationDisabled'),
    )
  } catch (err) {
    if (!isStepUpCancelled(err)) {
      reportFeedbackError(err, 'accountUsers.copy.couldNotUpdateStepUpAuthentication')
    }
  } finally {
    setBusy(null)
  }
}

export function StepUpSettingsCard(props: StepUpSettingsCardProps) {
  const { t, locale } = useI18n()
  const { user, busy, setBusy, setStatus } = props
  const stepUpEnabled = user.stepUpAuthMode === 'required'
  const stepUpStatus = stepUpEnabled
    ? t('accountUsers.stepUp.on', { count: user.stepUpWindowMinutes, formattedCount: formatNumber(user.stepUpWindowMinutes, undefined, locale) })
    : t('accountUsers.copy.offSensitiveActionsUseTheActiveSessionOnly')

  async function handleModeChange(checked: boolean): Promise<void> {
    if (busy) return
    const mode: CmsStepUpAuthMode = checked ? 'required' : 'disabled'
    if (mode === user.stepUpAuthMode) return
    setBusy('step-up')
    setStatus(null)
    await updateStepUpSettings({ mode, windowMinutes: user.stepUpWindowMinutes }, props)
  }

  async function handleWindowChange(value: string): Promise<void> {
    if (busy) return
    const windowMinutes = parseStepUpWindowMinutes(value)
    if (windowMinutes === null || windowMinutes === user.stepUpWindowMinutes) return
    setBusy('step-up-window')
    setStatus(null)
    await updateStepUpSettings({ mode: user.stepUpAuthMode, windowMinutes }, props)
  }

  return (
    <SecurityCard
      testId="security-step-up-card"
      title={t('accountUsers.copy.stepUpAuthentication')}
      description={t('accountUsers.copy.requirePasswordConfirmationAgainBeforeSensitiveAccountAndPublishingActions')}
      status={stepUpStatus}
      statusActive={stepUpEnabled}
      action={
        <div className={styles.stepUpControls}>
          <div className={styles.switchControl}>
            <Switch
              checked={stepUpEnabled}
              disabled={busy !== null}
              switchSize="sm"
              onCheckedChange={(checked) => void handleModeChange(checked)}
              aria-label={t('accountUsers.copy.requireStepUpAuthentication')}
              data-testid="security-step-up-toggle"
            />
            <span>{stepUpEnabled ? t('accountUsers.copy.required') : t('accountUsers.copy.disabled')}</span>
          </div>
          <Select
            value={String(user.stepUpWindowMinutes)}
            options={STEP_UP_WINDOWS.map((value) => ({ value, label: t('accountUsers.minutes', { count: Number(value), formattedCount: formatNumber(Number(value), undefined, locale) }) }))}
            fieldSize="sm"
            disabled={busy !== null || !stepUpEnabled}
            aria-label={t('accountUsers.copy.stepUpWindow')}
            data-testid="security-step-up-window"
            onChange={(event) => void handleWindowChange(event.currentTarget.value)}
          />
        </div>
      }
    />
  )
}
