/**
 * Site status widget — rows of (site / build / backup / plugins) with a
 * status dot per row.
 */
import { useI18n, formatNumber, formatRelativeTime } from '@admin/i18n'
import { ZapSolidIcon } from 'pixel-art-icons/icons/zap-solid'
import type { DashboardWidgetRendererProps } from '@core/dashboard'
import { Widget } from '@ui/components/Widget'
import styles from './widgets.module.css'


export function StatusWidget({ span, editing }: DashboardWidgetRendererProps) {
  const { t } = useI18n()
  const rows = [
    { id: 'site', label: t('dashboard.status.site'), value: t('dashboard.status.live'), tone: 'green' },
    { id: 'build', label: t('dashboard.status.build'), value: formatRelativeTime(-3, 'minute', { style: 'short' }), tone: 'green' },
    { id: 'backup', label: t('dashboard.status.backup'), value: formatRelativeTime(-2, 'hour', { style: 'short' }), tone: 'green' },
    { id: 'plugins', label: t('dashboard.widgets.plugins.name'), value: t('dashboard.status.updates', { count: 1, number: formatNumber(1) }), tone: 'amber' },
  ]
  return (
    <Widget
      widgetId="status"
      title={t('dashboard.widgets.status.name')}
      icon={ZapSolidIcon}
      tint="mint"
      span={span}
      editing={editing}
    >
      <div className={styles.statusGrid}>
        {rows.map((r) => (
          <div key={r.id} className={styles.statusRow}>
            <span className={styles.statusLabel}>
              <span className={`${styles.dot} ${r.tone === 'green' ? styles.dotGreen : styles.dotAmber}`} />
              {r.label}
            </span>
            <span className={styles.wlistMeta}>{r.value}</span>
          </div>
        ))}
      </div>
    </Widget>
  )
}
