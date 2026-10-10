/**
 * Activity widget — recent edits, publishes, plugin lifecycle, and
 * user/role changes pulled from `audit_events`. Reads from
 * `useRecentActivityStats()`, its own dashboard endpoint, so slower
 * audit projections do not block the other widgets from rendering.
 *
 * Login/logout events are intentionally excluded server-side — those
 * belong in Account → Sign-in history. The widget is about
 * *operational* changes to the site.
 */
import { useI18n, formatDate, formatRelativeTime, translate } from '@admin/i18n'
import { DashboardSolidIcon } from 'pixel-art-icons/icons/dashboard-solid'
import { SettingsCogSolidIcon } from 'pixel-art-icons/icons/settings-cog-solid'
import type { ReactNode } from 'react'
import type { DashboardWidgetRendererProps } from '@core/dashboard'
import { UserAvatar } from '@admin/shared/UserAvatar'
import { Widget } from '@ui/components/Widget'
import { cn } from '@ui/cn'
import {
  useRecentActivityStats,
  type DashboardActivityEntry,
} from '../hooks/useDashboardStats'
import styles from './widgets.module.css'

/**
 * Diameter of the actor avatar in the feed row. Picked to fit the
 * existing 22px-tall row chrome without changing line-height. The
 * `<UserAvatar>` primitive double-scales the requested size for the
 * Gravatar URL, so a 22px CSS avatar fetches a 44px image — crisp on
 * retina.
 */
const AVATAR_SIZE = 22

/**
 * Pick the verb that fronts each row body. The server has already
 * resolved the target into `targetCode` / `targetText`; this only
 * picks the localized verb for the action.
 *
 * Unknown / future actions fall through to a humanised version of
 * the action string itself ("plugin.foobar" → "plugin foobar") so a
 * newly-added audit event still renders something useful before the
 * widget is updated.
 */
function actionVerb(action: string): string {
  switch (action) {
    case 'data.row.create':
      return translate('dashboard.activity.actions.data.row.create')
    case 'data.row.update':
      return translate('dashboard.activity.actions.data.row.update')
    case 'data.row.delete':
      return translate('dashboard.activity.actions.data.row.delete')
    case 'data.row.publish':
      return translate('dashboard.activity.actions.data.row.publish')
    case 'data.row.schedule':
      return translate('dashboard.activity.actions.data.row.schedule')
    case 'data.row.schedule.cancel':
      return translate('dashboard.activity.actions.data.row.schedule.cancel')
    case 'data.row.status':
      return translate('dashboard.activity.actions.data.row.status')
    case 'data.row.move':
      return translate('dashboard.activity.actions.data.row.move')
    case 'data.author.assign':
      return translate('dashboard.activity.actions.data.author.assign')
    case 'data.table.create':
      return translate('dashboard.activity.actions.data.table.create')
    case 'data.table.update':
      return translate('dashboard.activity.actions.data.table.update')
    case 'data.table.delete':
      return translate('dashboard.activity.actions.data.table.delete')
    case 'publish':
      return translate('dashboard.activity.actions.publish')
    case 'plugin.install':
      return translate('dashboard.activity.actions.plugin.install')
    case 'plugin.update':
      return translate('dashboard.activity.actions.plugin.update')
    case 'plugin.enable':
      return translate('dashboard.activity.actions.plugin.enable')
    case 'plugin.disable':
      return translate('dashboard.activity.actions.plugin.disable')
    case 'plugin.delete':
      return translate('dashboard.activity.actions.plugin.delete')
    case 'plugin.pack.install':
      return translate('dashboard.activity.actions.plugin.pack.install')
    case 'plugin.settings.update':
      return translate('dashboard.activity.actions.plugin.settings.update')
    case 'user.create':
      return translate('dashboard.activity.actions.user.create')
    case 'user.update':
      return translate('dashboard.activity.actions.user.update')
    case 'user.delete':
      return translate('dashboard.activity.actions.user.delete')
    case 'user.suspend':
      return translate('dashboard.activity.actions.user.suspend')
    case 'password.change':
      return translate('dashboard.activity.actions.password.change')
    case 'role.create':
      return translate('dashboard.activity.actions.role.create')
    case 'role.update':
      return translate('dashboard.activity.actions.role.update')
    case 'role.delete':
      return translate('dashboard.activity.actions.role.delete')
    case 'role.assign':
      return translate('dashboard.activity.actions.role.assign')
    default:
      return action.replace(/[._]/g, ' ')
  }
}

function renderBody(entry: DashboardActivityEntry): ReactNode {
  const verb = actionVerb(entry.action)
  if (entry.targetCode) {
    return (
      <>
        {verb} <code>{entry.targetCode}</code>
      </>
    )
  }
  if (entry.targetText) {
    return (
      <>
        {verb} <em>{entry.targetText}</em>
      </>
    )
  }
  return verb
}

/** Compact locale-aware timestamps; older entries use a calendar date. */
function formatRelative(iso: string | null): string {
  if (iso === null) return '—'
  const ts = Date.parse(iso)
  if (Number.isNaN(ts)) return '—'
  const minutes = (ts - Date.now()) / 60_000
  const options = { numeric: 'auto', style: 'short' } as const
  if (Math.abs(minutes) < 1) return formatRelativeTime(0, 'second', options)
  if (Math.abs(minutes) < 60) return formatRelativeTime(Math.round(minutes), 'minute', options)
  if (Math.abs(minutes) < 1440) return formatRelativeTime(Math.round(minutes / 60), 'hour', options)
  if (Math.abs(minutes) < 43200) return formatRelativeTime(Math.round(minutes / 1440), 'day', options)
  return formatDate(ts, { month: 'short', day: 'numeric' })
}

export function ActivityWidget({ span, editing }: DashboardWidgetRendererProps) {
  const { t } = useI18n()
  const stats = useRecentActivityStats()
  const rows = stats?.rows ?? []
  const isLoading = stats === null
  const isEmpty = !isLoading && rows.length === 0

  return (
    <Widget
      widgetId="activity"
      title={t('dashboard.widgets.activity.name')}
      icon={DashboardSolidIcon}
      tint="peach"
      span={span}
      editing={editing}
      loading={isLoading}
    >
      <div className={styles.feed}>
        {isEmpty && (
          <p className={cn(styles.feedTime, styles.feedEmpty)}>
            {t('dashboard.activity.empty')}
          </p>
        )}
        {!isLoading && !isEmpty && rows.map((r) => (
          <div key={r.id} className={styles.feedRow}>
            {r.actor ? (
              <UserAvatar
                user={r.actor}
                size={AVATAR_SIZE}
                alt={t('dashboard.activity.avatar', { name: r.actor.displayName || r.actor.email })}
              />
            ) : (
              <span className={styles.feedSystemAvatar} title={t('dashboard.widgets.activity.name')} aria-hidden="true">
                <SettingsCogSolidIcon size={12} />
              </span>
            )}
            <span className={styles.feedBody}>{renderBody(r)}</span>
            <span className={styles.feedTime}>{formatRelative(r.createdAt)}</span>
          </div>
        ))}
      </div>
    </Widget>
  )
}
