/**
 * Pages widget — total published / drafts / scheduled counts pulled
 * from `usePagesStats()`. The "+N this week" delta reads
 * `deltaPublishedThisWeek` from the server-side count of pages
 * whose `published_at` is within the trailing 7 days.
 *
 * Loading state: passing `loading={isLoading}` to `<Widget>` is the
 * entire skeleton story. The Widget primitive renders the universal
 * skeleton body until `stats` resolves; we gate the real children on
 * `stats &&` so they never see a null value.
 */
import { useI18n, formatNumber } from '@admin/i18n'
import { FileTextSolidIcon } from 'pixel-art-icons/icons/file-text-solid'
import { StatValue, Delta } from '@ui/components/charts'
import type { DashboardWidgetRendererProps } from '@core/dashboard'
import { Widget } from '@ui/components/Widget'
import { usePagesStats } from '../hooks/useDashboardStats'
import styles from './widgets.module.css'

export function PagesWidget({ span, editing }: DashboardWidgetRendererProps) {
  const { t } = useI18n()
  const stats = usePagesStats()
  return (
    <Widget
      widgetId="pages"
      title={t('dashboard.widgets.pages.name')}
      icon={FileTextSolidIcon}
      tint="lilac"
      span={span}
      editing={editing}
      loading={stats === null}
    >
      {stats && (
        <>
          <StatValue
            value={formatNumber(stats.published)}
            sub={(
              <>
                <span>{t('dashboard.pages.published')}</span>
                {stats.deltaPublishedThisWeek > 0 && (
                  <Delta>{t('dashboard.pages.week', { number: formatNumber(stats.deltaPublishedThisWeek) })}</Delta>
                )}
              </>
            )}
          />
          <div className={styles.subFootRow}>
            <span>{t('dashboard.pages.drafts', { count: stats.drafts, number: formatNumber(stats.drafts) })}</span>
            <span>{t('dashboard.pages.scheduled', { number: formatNumber(stats.scheduled) })}</span>
          </div>
        </>
      )}
    </Widget>
  )
}
