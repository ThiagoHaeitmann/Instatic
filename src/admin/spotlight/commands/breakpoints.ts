/**
 * Viewport commands — §4.5 of the Command Spotlight master plan.
 *
 * - Switch viewport → pushes 'breakpoints' scope
 */

import { translate } from '@admin/i18n'

import type { Command } from '../types'

export function getBreakpointsCommands(): Command[] {
  return [
    // ── Switch viewport ──────────────────────────────────────────────────────
    {
      id: 'breakpoints.switch',
      get title() { return translate('metadata.spotlight.switchViewport') },
      get subtitle() { return translate('metadata.spotlight.changeTheActiveCanvasViewport') },
      group: 'editor',
      iconName: 'arrows-horizontal',
      keywords: ['breakpoint', 'switch', 'responsive', 'viewport', 'mobile', 'desktop', 'tablet'],
      workspaces: ['site'],
      capability: 'site.read',
      run: (ctx) => {
        ctx.pushScope('breakpoints')
      },
    },
  ]
}
