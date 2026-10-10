import type { DndContextProps, UniqueIdentifier } from '@dnd-kit/core'
import { useI18n } from '@admin/i18n'
import type { DashboardWidgetDefinition } from '@core/dashboard'
import { LIBRARY_DRAG_PREFIX, LIBRARY_DROP_ID } from '../components/BlockLibrary'
import { GRID_DROP_ID } from './useDashboardLayout'

/** Localized drag instructions and announcements, using widget labels rather than IDs. */
export function useDashboardDndAccessibility(
  definitions: ReadonlyMap<string, DashboardWidgetDefinition>,
): NonNullable<DndContextProps['accessibility']> {
  const { t } = useI18n()

  function draggedWidgetName(id: UniqueIdentifier): string {
    const widgetId = String(id).replace(LIBRARY_DRAG_PREFIX, '')
    return definitions.get(widgetId)?.name ?? t('dashboard.drag.block')
  }

  return {
    screenReaderInstructions: { draggable: t('dashboard.drag.instructions') },
    announcements: {
      onDragStart: ({ active }) => t('dashboard.drag.pickedUp', { name: draggedWidgetName(active.id) }),
      onDragOver: ({ active, over }) => t(
        over?.id === GRID_DROP_ID ? 'dashboard.drag.overGrid' : over?.id === LIBRARY_DROP_ID ? 'dashboard.drag.overLibrary' : 'dashboard.drag.outside',
        { name: draggedWidgetName(active.id) },
      ),
      onDragEnd: ({ active }) => t('dashboard.drag.dropped', { name: draggedWidgetName(active.id) }),
      onDragCancel: ({ active }) => t('dashboard.drag.cancelled', { name: draggedWidgetName(active.id) }),
    },
  }
}
