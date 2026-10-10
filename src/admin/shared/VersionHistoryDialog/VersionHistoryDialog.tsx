import { formatNumber, formatDate, formatRelativeTime, translate, useI18n } from '@admin/i18n'
/**
 * VersionHistoryDialog — every published version of a row, newest first,
 * with "Restore" copying a version's content back into the draft on the
 * active branch. Restoring never publishes: the draft still goes live
 * through Publish (main) or a merge (branch).
 */
import { useEffect, useState } from 'react'
import { ArchiveRestoreSolidIcon } from 'pixel-art-icons/icons/archive-restore-solid'
import type { DataRow, DataRowVersionSummary } from '@core/data/schemas'
import { isAbortError } from '@core/http'
import { listCmsDataRowVersions, restoreCmsDataRowVersion } from '@core/persistence'
import { getErrorMessage } from '@core/utils/errorMessage'
import { Button } from '@ui/components/Button'
import { Dialog } from '@ui/components/Dialog'
import { Skeleton } from '@ui/components/Skeleton'
import { TagPill } from '@ui/components/TagPill'
import { pushToast } from '@ui/components/Toast'
import { cn } from '@ui/cn'
import styles from './VersionHistoryDialog.module.css'

interface VersionHistoryDialogProps {
  rowId: string
  /** "page", "post", … — used in copy. */
  entityLabel: string
  /** The row's current title, for the dialog eyebrow. */
  title?: string | null
  onClose: () => void
  /** Fires with the restored draft row. */
  onRestored?: (row: DataRow) => void
}

function publishedLabel(version: DataRowVersionSummary): string {
  const when = new Date(version.publishedAt)
  if (Number.isNaN(when.getTime())) return translate('shell.versions.unknownDate')
  const seconds = (when.getTime() - Date.now()) / 1000
  const units = [
    ['year', 365 * 86400], ['month', 30 * 86400], ['day', 86400],
    ['hour', 3600], ['minute', 60], ['second', 1],
  ] as const
  const [unit, divisor] = units.find(([, duration]) => Math.abs(seconds) >= duration) ?? units[units.length - 1]!
  const values = {
    relative: formatRelativeTime(Math.round(seconds / divisor), unit, { numeric: 'auto' }),
    absolute: formatDate(when, { dateStyle: 'medium', timeStyle: 'short' }),
    name: version.publishedByName ?? '',
  }
  return translate(version.publishedByName ? 'shell.versions.publishedBy' : 'shell.versions.published', values)
}

export function VersionHistoryDialog({ rowId, entityLabel, title, onClose, onRestored }: VersionHistoryDialogProps) {
  const { t } = useI18n()
  const [versions, setVersions] = useState<DataRowVersionSummary[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [restoring, setRestoring] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    listCmsDataRowVersions(rowId, controller.signal)
      .then((next) => {
        if (!controller.signal.aborted) setVersions(next)
      })
      .catch((err: unknown) => {
        if (isAbortError(err) || controller.signal.aborted) return
        console.error('[versions] failed to load version history:', err)
        setLoadError(getErrorMessage(err, translate('shell.copy.couldNotLoadVersionHistory')))
      })
    return () => controller.abort()
  }, [rowId])

  async function restore(version: DataRowVersionSummary): Promise<void> {
    if (restoring) return
    setRestoring(version.id)
    try {
      const row = await restoreCmsDataRowVersion(rowId, version.id)
      onRestored?.(row)
      onClose()
      pushToast({
        kind: 'success',
        title: t('shell.versions.restored', { version: formatNumber(version.versionNumber) }),
        body: t('shell.versions.restoredBody', { entity: entityLabel, version: formatNumber(version.versionNumber) }),
      })
    } catch (err) {
      console.error('[versions] restore failed:', err)
      pushToast({ kind: 'error', title: t('shell.copy.couldNotRestoreTheVersion'), body: getErrorMessage(err, t('shell.copy.unknownVersionError')) })
    } finally {
      setRestoring(null)
      setConfirming(null)
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={t('shell.copy.versionHistory')}
      eyebrow={title ?? undefined}
      size="md"
      footer={(
        <Button variant="primary" size="sm" type="button" onClick={onClose}>
          {t('shell.copy.done')}
        </Button>
      )}
    >
      {loadError ? (
        <p className={styles.error} role="alert">{loadError}</p>
      ) : !versions ? (
        <div className={styles.loading} aria-busy="true" aria-label={t('shell.copy.loadingVersions')}>
          <Skeleton width="70%" height={14} radius={999} />
          <Skeleton width="55%" height={14} radius={999} />
        </div>
      ) : versions.length === 0 ? (
        <p className={styles.empty} data-testid="version-history-empty">
          {t('shell.versions.empty', { entity: entityLabel })}
        </p>
      ) : (
        <ul className={styles.list} aria-label={t('shell.copy.publishedVersions')} data-testid="version-history-list">
          {versions.map((version, index) => {
            const isLatest = index === 0
            const isConfirming = confirming === version.id
            return (
              <li key={version.id} className={cn(styles.row, isConfirming && styles.rowConfirm)} data-testid={`version-row-${version.versionNumber}`}>
                <span className={styles.icon} aria-hidden="true"><ArchiveRestoreSolidIcon size={12} /></span>
                <span className={styles.main}>
                  <span className={styles.label}>
                    {t('shell.versions.version', { version: formatNumber(version.versionNumber) })}
                    {isLatest && <TagPill label={t('shell.copy.latest')} size="xs" className={styles.pill} />}
                  </span>
                  <span className={styles.meta}>
                    {isConfirming
                      ? t('shell.versions.confirm', { version: formatNumber(version.versionNumber) })
                      : publishedLabel(version)}
                  </span>
                </span>
                {isConfirming ? (
                  <span className={styles.actions}>
                    <Button variant="ghost" size="xs" type="button" onClick={() => setConfirming(null)} disabled={restoring !== null}>
                      {t('shell.copy.cancel')}
                    </Button>
                    <Button
                      variant="primary"
                      size="xs"
                      type="button"
                      busy={restoring === version.id}
                      data-testid={`version-restore-confirm-${version.versionNumber}`}
                      onClick={() => { void restore(version) }}
                    >
                      {t('shell.copy.restore')}
                    </Button>
                  </span>
                ) : (
                  <Button
                    variant="secondary"
                    size="xs"
                    type="button"
                    data-testid={`version-restore-${version.versionNumber}`}
                    onClick={() => setConfirming(version.id)}
                  >
                    {t('shell.copy.restore')}
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Dialog>
  )
}
