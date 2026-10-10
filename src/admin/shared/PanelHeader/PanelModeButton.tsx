import { useI18n } from '@admin/i18n'
import { LayoutSolidIcon } from 'pixel-art-icons/icons/layout-solid'
import { OpenSolidIcon } from 'pixel-art-icons/icons/open-solid'
import { Button } from '@ui/components/Button'
import type { PanelMode } from '@admin/state/workspaceLayoutStorage'
import styles from './PanelModeButton.module.css'

interface PanelModeButtonProps {
  mode: PanelMode
  panelLabel: string
  dockLocation: string
  dockSide?: 'left' | 'right'
  onToggle: () => void
}

/** Shared icon action for moving a panel between its sidebar and the canvas. */
export function PanelModeButton({
  mode,
  panelLabel,
  dockLocation,
  dockSide = 'left',
  onToggle,
}: PanelModeButtonProps) {
  const { t } = useI18n()
  const floating = mode === 'floating'
  const action = floating ? t('shell.panel.dock', { label: panelLabel }) : t('shell.panel.undock', { label: panelLabel })
  const tooltip = floating ? t('shell.panel.dockIn', { location: dockLocation }) : t('shell.copy.undockToCanvas')

  return (
    <Button
      variant="ghost"
      size="xs"
      iconOnly
      onClick={onToggle}
      aria-label={action}
      tooltip={tooltip}
    >
      {floating ? (
        <LayoutSolidIcon
          size={12}
          className={dockSide === 'right' ? styles.rightDockIcon : undefined}
          aria-hidden="true"
        />
      ) : (
        <OpenSolidIcon size={12} aria-hidden="true" />
      )}
    </Button>
  )
}
