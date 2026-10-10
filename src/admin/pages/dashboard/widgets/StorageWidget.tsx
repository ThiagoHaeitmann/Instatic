/**
 * Storage widget — total used + a StackedBar showing the per-category
 * breakdown.
 *
 * There is intentionally **no quota** here. Self-hosted Instatic
 * never imposes an artificial disk cap, so the headline stat is the
 * total currently in use and the breakdown bar stretches to fill its
 * full width — each segment reads as a proportion of *what is used*,
 * not of an imaginary plan limit. The widget caption surfaces which
 * database adapter is active (`SQLite` / `Postgres`) so the operator
 * knows where data physically lives.
 *
 * Data comes from `useStorageStats()` → `/admin/api/cms/dashboard/storage`.
 * Sizing detail per segment:
 *   • Images     — sum of `media_assets.size_bytes` for `image/*`.
 *   • Videos     — sum of `media_assets.size_bytes` for `video/*`.
 *   • Documents  — sum of `media_assets.size_bytes` for everything else
 *                  (audio, PDFs, archives, NULL mime types).
 *   • Plugins    — total bytes under `<uploadsDir>/plugins/` on disk.
 *   • Database   — for SQLite the file + WAL/SHM sidecars; for
 *                  Postgres `pg_database_size(current_database())`.
 */
import { useI18n, formatBytes } from '@admin/i18n'
import { DatabaseSolidIcon } from 'pixel-art-icons/icons/database-solid'
import { StackedBar, StatValue } from '@ui/components/charts'
import type { DashboardWidgetRendererProps } from '@core/dashboard'
import { Widget } from '@ui/components/Widget'
import { useStorageStats } from '../hooks/useDashboardStats'

function dialectLabel(dialect: 'sqlite' | 'postgres'): string {
  return dialect === 'postgres' ? 'Postgres' : 'SQLite'
}

export function StorageWidget({ span, editing }: DashboardWidgetRendererProps) {
  const { t } = useI18n()
  const stats = useStorageStats()
  return (
    <Widget
      widgetId="storage"
      title={t('dashboard.widgets.storage.name')}
      icon={DatabaseSolidIcon}
      tint="sky"
      span={span}
      editing={editing}
      loading={stats === null}
    >
      {stats && (
        <>
          <StatValue
            value={formatBytes(stats.totalBytes)}
            sub={<span>{t('dashboard.storage.used', { database: dialectLabel(stats.dialect) })}</span>}
          />
          {/* The breakdown bar is given `total = totalBytes` so the
              segments stretch to fill the entire width — with no quota
              there is no empty "remaining" tail. When totalBytes is 0
              (fresh install, no media, no plugins, near-empty DB) we
              fall back to `1` to avoid `NaN%` widths; every segment
              value is also 0 in that case, so the bar simply renders
              the empty-track background and the legend reads "0 B"
              across the board. */}
          <StackedBar
            segments={[
              {
                label: t('dashboard.storage.images'),
                value: stats.imageBytes,
                color: 'var(--accent-4)',
              },
              {
                label: t('dashboard.storage.videos'),
                value: stats.videoBytes,
                color: 'var(--accent-2)',
              },
              {
                label: t('dashboard.storage.documents'),
                value: stats.documentBytes,
                color: 'var(--accent-5)',
              },
              {
                label: t('dashboard.storage.plugins'),
                value: stats.pluginBytes,
                color: 'var(--accent-1)',
              },
              {
                label: t('dashboard.storage.database'),
                value: stats.databaseBytes,
                color: 'var(--accent-3)',
              },
            ]}
            total={stats.totalBytes > 0 ? stats.totalBytes : 1}
            formatValue={(value) => formatBytes(value)}
          />
        </>
      )}
    </Widget>
  )
}
