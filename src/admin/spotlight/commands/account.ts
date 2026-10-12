/**
 * Account commands — §4.13 of the Command Spotlight master plan.
 *
 * Sign out (destructive), navigate to account settings sections.
 */

import { translate } from '@admin/i18n'

import { logoutCms } from '@core/persistence'
import type { Command } from '../types'

export function getAccountCommands(): Command[] {
  return [
    {
      id: 'account.profile',
      get title() { return translate('metadata.spotlight.editProfile') },
      get subtitle() { return translate('metadata.spotlight.updateYourNameEmailAndAvatar') },
      group: 'account',
      iconName: 'cursor-minimal-solid',
      keywords: ['account', 'profile', 'edit', 'name', 'email', 'avatar'],
      workspaces: ['any'],
      run: (ctx) => {
        ctx.closeSpotlight()
        ctx.navigate('/admin/account')
      },
    },

    {
      id: 'account.signOut',
      get title() { return translate('metadata.spotlight.signOut') },
      get subtitle() { return translate('metadata.spotlight.endYourCurrentSession') },
      group: 'account',
      iconName: 'power-off',
      keywords: ['sign out', 'logout', 'log out', 'session', 'exit'],
      workspaces: ['any'],
      destructive: true,
      run: async (ctx) => {
        ctx.closeSpotlight()
        try {
          await logoutCms()
          window.location.assign('/admin')
        } catch (err) {
          console.error('[spotlight] sign out failed:', err)
        }
      },
    },
  ]
}
