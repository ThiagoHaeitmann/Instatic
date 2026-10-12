/**
 * Branch commands — switch, create, manage. Available on every workspace:
 * the active branch is a property of the tab, not of a section.
 *
 * Switching to a specific branch by name is a provider (`branchesProvider`)
 * so typing a branch name in the root palette finds it directly.
 */

import { translate } from '@admin/i18n'
import { MAIN_BRANCH_ID } from '@core/branches'
import { isOnMainBranch, switchBranch, useBranchStore } from '@admin/state/branchStore'
import type { Command } from '../types'

export function getBranchesCommands(): Command[] {
  return [
    {
      id: 'branches.switch',
      get title() { return translate('metadata.spotlight.switchBranch') },
      get subtitle() { return translate('metadata.spotlight.openTheBranchSwitcher') },
      group: 'branches',
      iconName: 'git-branch-solid',
      keywords: ['branch', 'switch', 'checkout', 'workspace'],
      workspaces: ['any'],
      capability: 'site.read',
      run: (ctx) => {
        ctx.closeSpotlight()
        useBranchStore.getState().openSwitcher('list')
      },
    },
    {
      id: 'branches.create',
      get title() { return translate('metadata.spotlight.createBranch') },
      get subtitle() { return translate('metadata.spotlight.forkTheCurrentBranchIntoAPrivateCopy') },
      group: 'branches',
      iconName: 'git-branch-solid',
      keywords: ['branch', 'create', 'new', 'fork'],
      workspaces: ['any'],
      capability: 'site.branches.create',
      run: (ctx) => {
        ctx.closeSpotlight()
        useBranchStore.getState().openSwitcher('create')
      },
    },
    {
      id: 'branches.switchMain',
      get title() { return translate('metadata.spotlight.switchToMain') },
      get subtitle() { return translate('metadata.spotlight.backToTheLiveSite') },
      group: 'branches',
      iconName: 'circle-dot-solid',
      keywords: ['branch', 'main', 'live', 'switch'],
      workspaces: ['any'],
      capability: 'site.read',
      available: () => !isOnMainBranch(),
      run: (ctx) => {
        ctx.closeSpotlight()
        switchBranch(MAIN_BRANCH_ID)
      },
    },
    {
      id: 'branches.manage',
      get title() { return translate('metadata.spotlight.manageBranches') },
      get subtitle() { return translate('metadata.spotlight.renameOrDeleteBranches') },
      group: 'branches',
      iconName: 'edit-solid',
      keywords: ['branch', 'manage', 'rename', 'delete'],
      workspaces: ['any'],
      // Creators rename and delete their own branches from the same dialog;
      // the server and the dialog's rows keep them off everyone else's.
      capability: 'site.branches.create',
      run: (ctx) => {
        ctx.closeSpotlight()
        useBranchStore.getState().openManage()
      },
    },
  ]
}
