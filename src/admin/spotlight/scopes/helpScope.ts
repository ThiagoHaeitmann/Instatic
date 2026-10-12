/**
 * Help scope — keyboard shortcuts reference (Phase 5).
 * Phase 5: replaces ShortcutsSection with a generated list from the registry.
 */

import { translate } from '@admin/i18n'

import type { Scope } from '../types'

export const helpScope: Scope = {
  id: 'help',
  get title() { return translate('metadata.spotlight.keyboardShortcuts') },
  get placeholder() { return translate('metadata.spotlight.searchShortcuts') },
  commands: () => [],  // Phase 5
}
