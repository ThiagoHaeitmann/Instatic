import { feedback, feedbackError, reportFeedbackError, renderFeedback, type AccountUsersFeedback } from '@admin/shared/accountUsersFeedback'
import { formatDateTime } from './securityFormat'
import { formatRelativeTime, translate, type SupportedLocale, useI18n } from '@admin/i18n'
/**
 * Account → Active devices tab.
 *
 * Lists every live session the current user has across browsers and devices,
 * pinning the *current* one to the top with a "This device" badge. Each
 * other row exposes a "Sign out" action that calls
 * `DELETE /admin/api/cms/auth/sessions/:id`. A "Sign out everywhere else"
 * action in the section header revokes every non-current session in one go.
 *
 * Mutable live state — this is the "kick a device out" surface. Past sign-in
 * activity (including failures and lockouts) lives in the Sign-in history
 * tab and is intentionally append-only there.
 *
 * The current session's row is intentionally non-revocable from this UI —
 * users should use the toolbar avatar's "Sign out" item to drop the cookie
 * along with the row. Calling `DELETE` against the current session id would
 * succeed on the server (well, it would 400 — see `auth.ts`) but leaves the
 * cookie around, so we don't even surface the affordance.
 *
 * Revocations run through the shared step-up authentication flow.
 */
import { useState } from 'react'
import { isAbortError } from '@core/http'
import { useAsyncResource } from '@admin/lib/useAsyncResource'
import { Button } from '@ui/components/Button'
import { SkeletonRows } from '@ui/components/Skeleton'
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from '@ui/components/DataTable'
import {
  listCmsSessions,
  logoutAllOtherCmsSessions,
  revokeCmsSession,
  type CmsSession,
} from '@core/persistence'
import { StepUpCancelledMessage, useStepUp } from '@admin/shared/StepUp'
import styles from '../AccountPage.module.css'

function formatLastSeen(value: string, locale: SupportedLocale, t: typeof translate): string {
  const ms = Date.now() - new Date(value).getTime()
  if (Number.isNaN(ms) || ms < 0) return formatDateTime(value, locale)
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 1) return t('accountUsers.copy.justNow')
  if (minutes < 60) return formatRelativeTime(-minutes, 'minute', undefined, locale)
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return formatRelativeTime(-hours, 'hour', undefined, locale)
  const days = Math.floor(hours / 24)
  if (days < 30) return formatRelativeTime(-days, 'day', undefined, locale)
  return formatDateTime(value, locale)
}

async function revokeSessionHelper(
  session: CmsSession,
  runStepUp: <T>(fn: () => Promise<T>) => Promise<T>,
  setBusy: (v: string | null) => void,
  setStatus: (v: AccountUsersFeedback | null) => void,
  refresh: () => void,
): Promise<void> {
  try {
    await runStepUp(() => revokeCmsSession(session.id))
    setStatus(session.deviceLabel
      ? feedback('accountUsers.sessions.signedOut', { device: session.deviceLabel })
      : feedback('accountUsers.sessions.signedOutUnknown'))
    refresh()
  } catch (err) {
    if (err instanceof Error && err.message === StepUpCancelledMessage) return
    reportFeedbackError(err, 'accountUsers.copy.couldNotSignOutDevice')
  } finally {
    setBusy(null)
  }
}

async function revokeAllOthersHelper(
  runStepUp: <T>(fn: () => Promise<T>) => Promise<T>,
  setBusy: (v: string | null) => void,
  setStatus: (v: AccountUsersFeedback | null) => void,
  refresh: () => void,
): Promise<void> {
  try {
    const revokedCount = await runStepUp(() => logoutAllOtherCmsSessions())
    setStatus(
      revokedCount === 0
        ? feedback('accountUsers.copy.noOtherDevicesWereSignedIn')
        : feedback('accountUsers.sessions.revoked', { count: revokedCount }),
    )
    refresh()
  } catch (err) {
    if (err instanceof Error && err.message === StepUpCancelledMessage) return
    reportFeedbackError(err, 'accountUsers.copy.couldNotSignOutOtherDevices')
  } finally {
    setBusy(null)
  }
}

async function loadSessions(
  signal: AbortSignal,
  setLoadError: (error: AccountUsersFeedback | null) => void,
): Promise<CmsSession[]> {
  setLoadError(null)
  try {
    return await listCmsSessions()
  } catch (err) {
    if (!signal.aborted && !isAbortError(err)) {
      setLoadError(feedbackError(err, 'accountUsers.copy.couldNotLoadSessions'))
    }
    // A failed load must stay a rejection so the resource retains its last successful data.
    throw err
  }
}

export function SessionsTab() {
  const { t, locale } = useI18n()
  const { runStepUp } = useStepUp()
  const [loadError, setLoadError] = useState<AccountUsersFeedback | null>(null)
  const {
    data,
    loading,
    refresh,
  } = useAsyncResource((signal) => loadSessions(signal, setLoadError), [], {
    // Render the locale-aware error above instead of the resource's string-only error channel.
    swallowErrors: true,
  })
  const sessions = data ?? []
  const [busy, setBusy] = useState<string | null>(null)
  const [status, setStatus] = useState<AccountUsersFeedback | null>(null)
  const error = loadError

  async function handleRevoke(session: CmsSession): Promise<void> {
    if (busy) return
    setBusy(session.id)
    setStatus(null)
    // The user cancelling the step-up dialog is a silent dismiss — handled inside the helper.
    await revokeSessionHelper(session, runStepUp, setBusy, setStatus, refresh)
  }

  async function handleRevokeAllOthers(): Promise<void> {
    if (busy) return
    setBusy('all')
    setStatus(null)
    await revokeAllOthersHelper(runStepUp, setBusy, setStatus, refresh)
  }

  const otherCount = sessions.filter((s) => !s.isCurrent).length

  return (
    <section className={styles.section} aria-labelledby="account-sessions-title">
      <div className={styles.sectionHeader}>
        <div>
          <h2 id="account-sessions-title">{t('accountUsers.copy.activeDevices')}</h2>
          <p>{t('accountUsers.copy.devicesCurrentlySignedInToYourAccountSignAnyOutIndividuallyOrAllAtOnceForARecordOfPastSignInAttemptsIncludingFailuresSeeSignInHistory')}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy !== null || otherCount === 0}
          onClick={() => void handleRevokeAllOthers()}
          data-testid="account-sessions-sign-out-others"
        >
          <span>{busy === 'all' ? t('accountUsers.copy.signingOut') : t('accountUsers.copy.signOutEverywhereElse')}</span>
        </Button>
      </div>

      {error && <p className={styles.error} role="alert">{renderFeedback(error, locale, t)}</p>}
      {status && <p className={styles.cardStatus} role="status">{renderFeedback(status, locale, t)}</p>}

      {loading ? (
        <SkeletonRows count={4} rowHeight={36} ariaLabel={t('accountUsers.copy.loadingSessions')} />
      ) : sessions.length === 0 ? (
        // The current session is always present, so this branch is only
        // reached on transient empty responses (e.g. the list raced with a
        // global revoke). Render an honest empty state rather than a fake
        // "this device" placeholder.
        <p className={styles.emptyState}>{t('accountUsers.copy.noActiveSessions')}</p>
      ) : (
        <DataTable aria-label={t('accountUsers.copy.activeSessions')} density="compact">
          <DataTableHead>
            <DataTableRow>
              <DataTableHeader scope="col">{t('accountUsers.copy.device')}</DataTableHeader>
              <DataTableHeader scope="col">{t('accountUsers.copy.iP')}</DataTableHeader>
              <DataTableHeader scope="col">{t('accountUsers.copy.lastActive')}</DataTableHeader>
              <DataTableHeader scope="col" className={styles.actionsHeader}>{t('accountUsers.copy.actions')}</DataTableHeader>
            </DataTableRow>
          </DataTableHead>
          <DataTableBody>
            {sessions.map((session) => {
              const labelText = session.deviceLabel || t('accountUsers.copy.unknownDevice')
              return (
                <DataTableRow key={session.id} aria-label={t('accountUsers.sessions.row', { device: labelText })}>
                  <DataTableCell>
                    <div className={styles.deviceLabel}>
                      <strong>{labelText}</strong>
                      <span>{t('accountUsers.sessions.signedIn', { date: formatDateTime(session.createdAt, locale) })}</span>
                    </div>
                  </DataTableCell>
                  <DataTableCell>
                    <span className={styles.secondaryText}>{session.ipAddress ?? t('accountUsers.copy.unknown')}</span>
                  </DataTableCell>
                  <DataTableCell>
                    <span className={styles.secondaryText}>
                      {session.isCurrent ? t('accountUsers.copy.thisDevice') : formatLastSeen(session.lastSeenAt, locale, t)}
                    </span>
                  </DataTableCell>
                  <DataTableCell className={styles.actionsCell}>
                    {session.isCurrent ? (
                      <span className={styles.badgeMuted}>{t('accountUsers.copy.current')}</span>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        disabled={busy !== null}
                        onClick={() => void handleRevoke(session)}
                        data-testid={`account-sessions-sign-out-${session.id}`}
                      >
                        <span>{busy === session.id ? t('accountUsers.copy.signingOut') : t('accountUsers.copy.signOut')}</span>
                      </Button>
                    )}
                  </DataTableCell>
                </DataTableRow>
              )
            })}
          </DataTableBody>
        </DataTable>
      )}
    </section>
  )
}
