/**
 * Branches provider — "Switch to <branch>" rows for branch names typed in
 * the root palette. LOCAL: reads the branch store synchronously (the toolbar
 * chip keeps the registry fresh), no HTTP, no debounce.
 */

import { translate } from '@admin/i18n'
import { switchBranch, useBranchStore } from '@admin/state/branchStore'
import type { Command, SpotlightProvider } from '../types'

const MAX_RESULTS = 25

export const branchesProvider: SpotlightProvider = {
  id: 'branches',
  get label() { return translate('metadata.spotlight.branches') },
  debounceMs: 0,

  search(query, _ctx, signal): Command[] {
    if (signal.aborted) return []
    const q = query.trim().toLowerCase()
    if (!q) return []
    const { branches, activeBranchId } = useBranchStore.getState()
    return branches
      .filter((branch) => branch.id !== activeBranchId)
      .filter((branch) => branch.name.toLowerCase().includes(q) || branch.id.includes(q))
      .slice(0, MAX_RESULTS)
      .map((branch): Command => ({
        id: `branch:${branch.id}`,
        get title() { return translate('metadata.spotlight.branches.switch', { name: branch.name }) },
        get subtitle() { return branch.baseBranchId
          ? translate('metadata.spotlight.branches.origin', { id: branch.baseBranchId })
          : translate('metadata.spotlight.branches.live') },
        group: 'branches',
        iconName: branch.baseBranchId ? 'git-branch-solid' : 'circle-dot-solid',
        keywords: ['branch', 'switch', branch.id],
        workspaces: ['any'],
        capability: 'site.read',
        run: (ctx) => {
          ctx.closeSpotlight()
          switchBranch(branch.id)
        },
      }))
  },
}
