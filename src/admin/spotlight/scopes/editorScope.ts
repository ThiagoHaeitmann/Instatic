/**
 * Editor scope — context for editor-specific commands (Phase 2).
 * Stub: full implementation in Phase 2 with layers/breakpoints sub-scopes.
 */

import { translate } from '@admin/i18n'

import type { Scope } from '../types'

export const editorScope: Scope = {
  id: 'editor',
  get title() { return translate('metadata.spotlight.editor') },
  get placeholder() { return translate('metadata.spotlight.searchEditorCommands') },
  commands: () => [],  // Phase 2
}
