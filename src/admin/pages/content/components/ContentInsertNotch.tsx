import type { Ref, SyntheticEvent } from 'react'
import type { IconComponent } from 'pixel-art-icons/types'
import { useI18n } from '@admin/i18n'
import { Button } from '@ui/components/Button'
import styles from '../../site/canvas/CanvasNotch.module.css'

export interface ContentInsertAction {
  id: string
  label: string
  icon: IconComponent
  onClick: () => void
  buttonRef?: Ref<HTMLButtonElement>
  expanded?: boolean
}

/** The document notch has no Site module registry or page-tree history. */
export function ContentInsertNotch({ actions }: { actions: ContentInsertAction[] }) {
  const { t } = useI18n()
  function stopCanvasInteraction(event: SyntheticEvent) { event.stopPropagation() }
  return (
    <div className={styles.shell} aria-label={t('content.insertBlocks')} data-testid="canvas-notch" onClick={stopCanvasInteraction}>
      <div className={styles.roller}>
        <div className={styles.notch}>
          {actions.map(({ icon: Icon, ...action }) => (
            <Button
              key={action.id}
              ref={action.buttonRef}
              variant="ghost"
              size="sm"
              iconOnly
              className={styles.quickButton}
              onClick={action.onClick}
              aria-label={t('content.addBlock', { label: action.label })}
              aria-expanded={action.expanded}
              tooltip={action.expanded ? undefined : t('content.addBlock', { label: action.label })}
            >
              <Icon size={14} aria-hidden="true" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
