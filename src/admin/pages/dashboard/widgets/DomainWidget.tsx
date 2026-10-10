/**
 * Domain widget — primary site domain + DNS / HTTPS verification rows.
 */
import { useI18n } from '@admin/i18n'
import { GlobeSolidIcon } from 'pixel-art-icons/icons/globe-solid'
import type { DashboardWidgetRendererProps } from '@core/dashboard'
import { Widget } from '@ui/components/Widget'
import styles from './widgets.module.css'

export function DomainWidget({ span, editing }: DashboardWidgetRendererProps) {
  const { t } = useI18n()
  return (
    <Widget
      widgetId="domain"
      title={t('dashboard.widgets.domain.name')}
      icon={GlobeSolidIcon}
      tint="sky"
      span={span}
      editing={editing}
    >
      <div className={styles.domainName}>instatic.com</div>
      <div>
        <span className={styles.wlistMeta}>{t('dashboard.domain.ssl')}</span>
      </div>
      <div className={styles.domainList}>
        <div>
          <span>{t('dashboard.domain.record')}</span>
          <span className={styles.domainOk}>{t('dashboard.domain.verified')}</span>
        </div>
        <div>
          <span>HTTPS</span>
          <span className={styles.domainOk}>{t('dashboard.domain.active')}</span>
        </div>
      </div>
    </Widget>
  )
}
