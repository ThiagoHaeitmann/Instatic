import { feedbackError, renderFeedback, type AccountUsersFeedback } from '@admin/shared/accountUsersFeedback'
import { formatNumber, useI18n } from '@admin/i18n'
import { formatDateTime } from './securityFormat'
/**
 * Account → Sign-in history tab.
 *
 * Shows the user's recent login activity from `login_attempts` — successes,
 * failures, lockouts, and rate-limit hits, both `user_id`-matched rows and
 * pre-lookup attempts that mention the user's email.
 *
 * Append-only audit feed — distinct from the Active devices tab, which is a
 * live mutable list of session cookies. A failed attempt that never produced
 * a session still shows up here; a successful login from a device the user
 * later signed out still shows up here. The chip in the header section
 * surfaces a quick "N failed attempts in last 24h" forensic count so the
 * tab is visibly different from Active devices at a glance even when both
 * happen to contain a single row.
 *
 * The "suspicious activity" banner surfaces whenever there's a `locked` or
 * `rate_limited` event in the last 24 h — a low-cost nudge for the user to
 * change their password.
 */
import { useState } from 'react'
import { useAsyncResource } from '@admin/lib/useAsyncResource'
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from '@ui/components/DataTable'
import { SkeletonRows } from '@ui/components/Skeleton'
import { CircleAlertSolidIcon } from 'pixel-art-icons/icons/circle-alert-solid'
import {
  listCmsLoginActivity,
  type CmsLoginActivityEvent,
  type CmsLoginActivityResult,
} from '@core/persistence'
import styles from '../AccountPage.module.css'

const LOOKBACK_24H_MS = 24 * 60 * 60 * 1000

const RESULT_KEYS: Record<CmsLoginActivityResult, string> = {
  success: 'accountUsers.copy.success',
  bad_password: 'accountUsers.copy.wrongPassword',
  no_user: 'accountUsers.copy.unknownUser',
  account_disabled: 'accountUsers.copy.accountSuspended',
  locked: 'accountUsers.copy.accountLocked',
  rate_limited: 'accountUsers.copy.rateLimited',
  mfa_failed: 'accountUsers.copy.mFAFailed',
}

function resultClass(result: CmsLoginActivityResult): string {
  switch (result) {
    case 'success':
      return styles.activityResultSuccess
    case 'locked':
    case 'rate_limited':
      return styles.activityResultLocked
    default:
      return styles.activityResultBad
  }
}

function isFailure(result: CmsLoginActivityResult): boolean {
  return result !== 'success'
}

function isWithin24h(event: CmsLoginActivityEvent, now: number): boolean {
  const ts = Date.parse(event.attemptedAt)
  if (Number.isNaN(ts)) return false
  return now - ts < LOOKBACK_24H_MS
}

function isRecentSuspicious(event: CmsLoginActivityEvent, now: number): boolean {
  if (event.result !== 'locked' && event.result !== 'rate_limited') return false
  return isWithin24h(event, now)
}

async function loadActivity(): Promise<{ events: CmsLoginActivityEvent[]; error: AccountUsersFeedback | null }> {
  try {
    return { events: await listCmsLoginActivity(), error: null }
  } catch (err) {
    return { events: [], error: feedbackError(err, 'accountUsers.copy.couldNotLoadActivity') }
  }
}

export function ActivityTab() {
  const { t, locale } = useI18n()
  const { data, loading } = useAsyncResource(loadActivity, [])
  const events = data?.events ?? []
  const error = data?.error
  // `now` is captured once at mount so the suspicious-banner threshold is
  // stable across renders. Calling `Date.now()` during render trips the
  // React 19 impure-call rule; the user-visible timestamps inside individual
  // rows are computed at format time, not against this anchor.
  const [mountedAt] = useState<number>(() => Date.now())

  const showSuspiciousBanner = events.some((event) => isRecentSuspicious(event, mountedAt))

  const failedIn24h = events.filter(
    (event) => isFailure(event.result) && isWithin24h(event, mountedAt),
  ).length

  return (
    <section className={styles.section} aria-labelledby="account-activity-title">
      <div className={styles.sectionHeader}>
        <div>
          <h2 id="account-activity-title">{t('accountUsers.copy.signInHistory')}</h2>
          <p>{t('accountUsers.copy.recentSignInAttemptsOnYourAccountIncludingFailuresAndLockoutsToRevokeACurrentSessionUseActiveDevices')}</p>
        </div>
        {failedIn24h > 0 && (
          <span
            className={`${styles.badge} ${styles.activityFailureBadge}`}
            data-testid="account-activity-failed-count"
          >
            {t('accountUsers.activity.failed', { count: failedIn24h, formattedCount: formatNumber(failedIn24h, undefined, locale) })}
          </span>
        )}
      </div>

      {error && <p className={styles.error} role="alert">{renderFeedback(error, locale, t)}</p>}

      {showSuspiciousBanner && (
        <div className={styles.suspiciousBanner} role="status" data-testid="account-activity-suspicious">
          <CircleAlertSolidIcon size={14} aria-hidden="true" />
          <span>
            {t('accountUsers.activity.suspicious')}
          </span>
        </div>
      )}

      {loading ? (
        <SkeletonRows count={6} rowHeight={32} ariaLabel={t('accountUsers.copy.loadingActivity')} />
      ) : events.length === 0 ? (
        <p className={styles.emptyState}>{t('accountUsers.copy.noLoginActivityYet')}</p>
      ) : (
        <DataTable aria-label={t('accountUsers.copy.loginActivity')} density="compact">
          <DataTableHead>
            <DataTableRow>
              <DataTableHeader scope="col">{t('accountUsers.copy.when')}</DataTableHeader>
              <DataTableHeader scope="col">{t('accountUsers.copy.device')}</DataTableHeader>
              <DataTableHeader scope="col">{t('accountUsers.copy.iP')}</DataTableHeader>
              <DataTableHeader scope="col">{t('accountUsers.copy.outcome')}</DataTableHeader>
            </DataTableRow>
          </DataTableHead>
          <DataTableBody>
            {events.map((event) => (
              <DataTableRow key={event.id} aria-label={t('accountUsers.activity.row', { result: t(RESULT_KEYS[event.result]) })}>
                <DataTableCell>
                  <span className={styles.secondaryText}>{formatDateTime(event.attemptedAt, locale)}</span>
                </DataTableCell>
                <DataTableCell>
                  <span className={styles.secondaryText}>{event.deviceLabel || t('accountUsers.copy.unknownDevice')}</span>
                </DataTableCell>
                <DataTableCell>
                  <span className={styles.secondaryText}>{event.ipAddress ?? t('accountUsers.copy.unknown')}</span>
                </DataTableCell>
                <DataTableCell>
                  <span className={styles.activityRow}>
                    <span className={`${styles.activityResult} ${resultClass(event.result)}`}>
                      {t(RESULT_KEYS[event.result])}
                    </span>
                  </span>
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </section>
  )
}
