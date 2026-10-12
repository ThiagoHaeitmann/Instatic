/**
 * Plugins scope — list installed plugins and their admin pages.
 *
 * Phase 3: wires pluginPagesProvider plus static commands for installing
 * plugins and navigating to the plugins workspace.
 * Phase 4: "Run plugin command…" now pushes the pluginCommands scope instead
 * of navigating away — all registered PluginCommands are listed there.
 */

import { translate } from '@admin/i18n'

import type { Scope, Command } from '../types'
import { pluginPagesProvider } from '../providers/pluginPagesProvider'

function getPluginsScopeCommands(): Command[] {
  return [
    {
      id: 'plugins.install',
      get title() { return translate('metadata.spotlight.installPlugin') },
      get subtitle() { return translate('metadata.spotlight.uploadAPluginPackageZip') },
      group: 'plugins',
      iconName: 'download-solid',
      keywords: ['install', 'add', 'plugin', 'package', 'zip'],
      workspaces: ['plugins'],
      run: (ctx) => {
        ctx.closeSpotlight()
        ctx.navigate('/admin/plugins?action=install')
      },
    },
    {
      id: 'plugins.runCommand',
      get title() { return translate('metadata.spotlight.runPluginCommandAlternate') },
      get subtitle() { return translate('metadata.spotlight.browseAndExecuteRegisteredPluginCommands') },
      group: 'plugins',
      iconName: 'play-solid',
      keywords: ['run', 'execute', 'plugin', 'command', 'action'],
      workspaces: ['any'],
      run: (ctx) => {
        ctx.pushScope('pluginCommands')
      },
    },
  ]
}

export const pluginsScope: Scope = {
  id: 'plugins',
  get title() { return translate('metadata.spotlight.openPlugin') },
  get placeholder() { return translate('metadata.spotlight.searchPlugins') },
  commands: getPluginsScopeCommands,
  providers: [pluginPagesProvider],
}
