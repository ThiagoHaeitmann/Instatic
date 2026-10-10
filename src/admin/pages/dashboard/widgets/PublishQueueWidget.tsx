/**
 * Publish lineup widget — what's coming up next, what just shipped, and
 * what's still in drafts. Replaces the old static "Publish queue"
 * placeholder. Three slices, mixed into one chronological list:
 *
 *   • Scheduled rows  → "SCHEDULED" badge, "in 12m" / "in 3d" relative
 *   • Recently published → "PUBLISHED" badge, "5m ago" / "2d ago"
 *   • Drafts           → "DRAFT" badge, em-dash
 *
 * Data flows through `usePublishLineupStats()` — the server already
 * orders and limits the list so the widget just renders.
 */
import { useI18n, formatDate, formatRelativeTime, translate } from '@admin/i18n'
import { CloudUploadSolidIcon } from 'pixel-art-icons/icons/cloud-upload-solid'
import type { DashboardWidgetRendererProps } from '@core/dashboard'
import { Widget } from '@ui/components/Widget'
import { cn } from '@ui/cn'
import {
  usePublishLineupStats,
  type DashboardPublishLineupRow,
} from '../hooks/useDashboardStats'
import styles from './widgets.module.css'

function badgeClass(status: DashboardPublishLineupRow['status']): string {
  if (status === 'scheduled') return styles.badgeQueued
  if (status === 'published') return styles.badgePublished
  return styles.badgeDraft
}

function badgeLabel(status: DashboardPublishLineupRow['status']): string {
  if (status === 'scheduled') return translate('dashboard.publish.scheduled')
  if (status === 'published') return translate('dashboard.publish.published')
  return translate('dashboard.publish.draft')
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

export function PublishQueueWidget({ span, editing }: DashboardWidgetRendererProps) {
  const { t } = useI18n()
  const stats = usePublishLineupStats()
  const rows = stats?.rows ?? []
  const isLoading = stats === null
  const isEmpty = !isLoading && rows.length === 0

  return (
    <Widget
      widgetId="publish"
      title={t('dashboard.widgets.publish.name')}
      icon={CloudUploadSolidIcon}
      tint="sky"
      span={span}
      editing={editing}
      loading={isLoading}
    >
      {isEmpty && (
        <p className={cn(styles.feedTime, styles.feedEmpty)}>
          {t('dashboard.publish.empty')}
        </p>
      )}
      {!isLoading && !isEmpty && (
        <ul className={styles.wlist}>
          {rows.map((r) => (
            <li key={r.id}>
              <span className={styles.wlistTitle}>
                <span className={styles.wlistPath}>{r.path}</span>
              </span>
              <span className={styles.wlistMeta}>
                <span className={`${styles.badge} ${badgeClass(r.status)}`}>{badgeLabel(r.status)}</span>
                <span>{formatRelative(r.at)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Widget>
  )
}
