/**
 * Posts widget — total post count + daily-publish histogram for the
 * last 28 days. Data comes from `usePostsStats()` (server-side
 * aggregated from `data_rows.published_at` across every
 * `kind: 'postType'` table).
 *
 * Skeleton: `loading={stats === null}` and the Widget primitive
 * handles the rest.
 */
import { useI18n, formatNumber } from '@admin/i18n'
import { PenSquareSolidIcon } from 'pixel-art-icons/icons/pen-square-solid'
import { Bars, StatValue } from '@ui/components/charts'
import type { DashboardWidgetRendererProps } from '@core/dashboard'
import { Widget } from '@ui/components/Widget'
import { usePostsStats } from '../hooks/useDashboardStats'

// Last 6 days of the histogram are highlighted as the "current week".
const ACCENT_INDEXES = [22, 23, 24, 25, 26, 27]

export function PostsWidget({ span, editing }: DashboardWidgetRendererProps) {
  const { t } = useI18n()
  const stats = usePostsStats()
  return (
    <Widget
      widgetId="posts"
      title={t('dashboard.widgets.posts.name')}
      icon={PenSquareSolidIcon}
      tint="peach"
      span={span}
      editing={editing}
      loading={stats === null}
    >
      {stats && (
        <>
          <StatValue
            value={formatNumber(stats.total)}
            sub={(
              stats.categories === 0
                ? <span>{t('dashboard.posts.noCategories')}</span>
                : <span>{t('dashboard.posts.categories', { count: stats.categories, number: formatNumber(stats.categories) })}</span>
            )}
          />
          <Bars data={stats.daily28} accentIndexes={ACCENT_INDEXES} />
        </>
      )}
    </Widget>
  )
}
