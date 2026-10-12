/**
 * Users scope — list and search users (Phase 3).
 */

import { translate } from '@admin/i18n'

import type { Scope } from '../types'

export const usersScope: Scope = {
  id: 'users',
  get title() { return translate('metadata.spotlight.openUser') },
  get placeholder() { return translate('metadata.spotlight.searchUsers') },
  commands: () => [],  // Phase 2/3
}
