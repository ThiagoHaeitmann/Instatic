import { formatNumber, formatList, translate, useI18n } from '@admin/i18n'
/**
 * VCDeletionConfirmDialog — confirmation prompt shown before a Visual Component
 * with active references is deleted.
 *
 * Lists every page and other component that currently uses the VC, grouped by
 * source kind, so the user can review the cascade impact before committing.
 *
 * Built on the shared `<Dialog>` primitive — chrome / focus / Esc / portal
 * mount come from there. Styling mirrors `FrameworkChangeConfirmDialog` for
 * visual consistency.
 */

import { useRef } from 'react'
import { Button } from '@ui/components/Button'
import { Dialog } from '@ui/components/Dialog'
import type { VCDeletionImpact, VCRefUsage } from '@core/visualComponents'
import styles from './VCDeletionConfirmDialog.module.css'

interface VCDeletionConfirmDialogProps {
  impact: VCDeletionImpact
  onCancel: () => void
  onConfirm: () => void
}

export function VCDeletionConfirmDialog({
  impact,
  onCancel,
  onConfirm,
}: VCDeletionConfirmDialogProps) {
  const { t } = useI18n()
  const confirmRef = useRef<HTMLButtonElement>(null)

  const pageUsages = impact.usages.filter(
    (u): u is VCRefUsage & { source: { kind: 'page' } } => u.source.kind === 'page',
  )
  const vcUsages = impact.usages.filter(
    (u): u is VCRefUsage & { source: { kind: 'visualComponent' } } =>
      u.source.kind === 'visualComponent',
  )

  return (
    <Dialog
      open
      onClose={onCancel}
      tone="danger"
      title={t('shell.copy.deleteComponentQuestion')}
      size="lg"
      initialFocusRef={confirmRef}
      footer={
        <>
          <Button variant="secondary" size="sm" type="button" onClick={onCancel}>
            {t('shell.copy.cancel')}
          </Button>
          <Button
            ref={confirmRef}
            variant="destructive"
            size="sm"
            type="button"
            onClick={onConfirm}
          >
            {t('shell.copy.deleteComponent')}
          </Button>
        </>
      }
    >
      <p className={styles.summary}>
        {t('shell.component.summary', { name: impact.vc.name, places: buildUsageSummary(impact.pageCount, impact.vcCount), count: impact.usages.length, countLabel: formatNumber(impact.usages.length) })}
      </p>
      <p className={styles.subline}>
        {t('shell.copy.proceedingWillDeleteTheComponentAndRemoveEveryReferenceFrom')}
      </p>

      {pageUsages.length > 0 && (
        <div className={styles.usageGroup}>
          <div className={styles.groupHeader}>{t('shell.copy.inPages')}</div>
          <ul className={styles.usageList} aria-label={t('shell.copy.pagesUsingThisComponent')}>
            {pageUsages.map((usage) => (
              <li key={`page:${usage.source.pageId}:${usage.source.nodeId}`} className={styles.usageItem}>
                <span className={styles.usageScope}>{usage.source.pageTitle}</span>
                <span className={styles.usageNode} title={usage.source.nodeLabel}>
                  {usage.source.nodeLabel}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {vcUsages.length > 0 && (
        <div className={styles.usageGroup}>
          <div className={styles.groupHeader}>{t('shell.copy.inOtherComponents')}</div>
          <ul className={styles.usageList} aria-label={t('shell.copy.otherComponentsUsingThisComponent')}>
            {vcUsages.map((usage) => (
              <li key={`vc:${usage.source.vcId}:${usage.source.nodeId}`} className={styles.usageItem}>
                <span className={styles.usageScope}>{usage.source.vcName}</span>
                <span className={styles.usageNode} title={usage.source.nodeLabel}>
                  {usage.source.nodeLabel}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Dialog>
  )
}

/**
 * Build the inline usage summary clause.
 *
 * Examples:
 *   pageCount=1, vcCount=0  → "1 page"
 *   pageCount=2, vcCount=0  → "2 pages"
 *   pageCount=0, vcCount=1  → "1 component"
 *   pageCount=1, vcCount=1  → "1 page and 1 component"
 *   pageCount=2, vcCount=3  → "2 pages and 3 components"
 */
function buildUsageSummary(pageCount: number, vcCount: number): string {
  const parts: string[] = []
  if (pageCount > 0) {
    parts.push(translate('shell.component.pages', { count: pageCount, countLabel: formatNumber(pageCount) }))
  }
  if (vcCount > 0) {
    parts.push(translate('shell.component.components', { count: vcCount, countLabel: formatNumber(vcCount) }))
  }
  return formatList(parts)
}
