import { useI18n } from '@admin/i18n'
import type { PanelResizeHandleProps } from './useResizablePanel'
import styles from './PanelResizeHandle.module.css'

interface ResizeHandleProps {
  panelLabel: string
  resizeHandleProps: PanelResizeHandleProps
}

/** Bottom-right pointer and keyboard affordance for a floating panel. */
export function PanelResizeHandle({
  panelLabel,
  resizeHandleProps,
}: ResizeHandleProps) {
  const { t } = useI18n()
  return (
    <div
      {...resizeHandleProps}
      role="separator"
      aria-label={t('shell.panel.resize', { label: panelLabel })}
      tabIndex={0}
      className={styles.handle}
      title={t('shell.panel.resize', { label: panelLabel })}
    />
  )
}
