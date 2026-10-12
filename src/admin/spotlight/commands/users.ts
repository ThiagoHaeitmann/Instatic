/**
 * Users / Roles / Audit commands — §4.12 of the Command Spotlight master plan.
 */

import { translate } from '@admin/i18n'

import type { Command } from '../types'
import { queuePendingAction } from '../pendingAction'

export function getUsersCommands(): Command[] {
  return [
    // ── Invite user ─────────────────────────────────────────────────────────
    {
      id: 'users.invite',
      get title() { return translate('metadata.spotlight.inviteUser') },
      get subtitle() { return translate('metadata.spotlight.createANewAdminUserAndSendAnInvite') },
      group: 'users',
      iconName: 'plus',
      keywords: ['user', 'invite', 'team', 'member', 'new', 'create', 'add', 'account'],
      workspaces: ['any'],
      capability: 'users.manage',
      run: (ctx) => {
        queuePendingAction('users.invite')
        ctx.navigate('/admin/users')
      },
    },

    // ── New role ─────────────────────────────────────────────────────────────
    {
      id: 'users.newRole',
      get title() { return translate('metadata.spotlight.newRole') },
      get subtitle() { return translate('metadata.spotlight.defineANewRoleWithCustomCapabilities') },
      group: 'users',
      iconName: 'cursor-minimal-solid',
      keywords: ['user', 'role', 'permissions', 'capabilities', 'new', 'create', 'add'],
      workspaces: ['any'],
      capability: 'roles.manage',
      run: (ctx) => {
        queuePendingAction('users.newRole')
        ctx.navigate('/admin/users')
      },
    },
  ]
}
