import { useI18n } from '@admin/i18n'
import styles from './AppLoadingScreen.module.css'

export function AppLoadingScreen() {
  const { t } = useI18n()
  return (
    <div
      className={styles.screen}
      role="status"
      aria-busy="true"
      aria-label={t('shell.copy.loadingInstatic')}
    >
      <BanterLoader />
    </div>
  )
}

function BanterLoader() {
  return (
    <div
      className={styles.banterLoader}
      data-loader-spinner="true"
      aria-hidden="true"
    >
      <div className={styles.banterBox} />
      <div className={styles.banterBox} />
      <div className={styles.banterBox} />
      <div className={styles.banterBox} />
      <div className={styles.banterBox} />
      <div className={styles.banterBox} />
      <div className={styles.banterBox} />
      <div className={styles.banterBox} />
      <div className={styles.banterBox} />
    </div>
  )
}
