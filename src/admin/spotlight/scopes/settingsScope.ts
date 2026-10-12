/**
 * Settings scope — navigate settings sections.
 *
 * Returns commands for opening each section of the Settings modal.
 */

import { translate } from '@admin/i18n'

import type { Scope, Command } from '../types'

const SETTINGS_COMMANDS: Command[] = [
  {
    id: 'scope.settings.general',
    get title() { return translate('metadata.spotlight.general') },
    get subtitle() { return translate('metadata.spotlight.siteNameDescriptionAndGeneralSettings') },
    group: 'settings',
    iconName: 'settings-cog-solid',
    keywords: ['general', 'site', 'name', 'description'],
    workspaces: ['site'],
    run: async (ctx) => {
      ctx.closeSpotlight()
      const { useEditorStore } = await import('@site/store/store')
      useEditorStore.getState().openSettings('general')
    },
  },
  {
    id: 'scope.settings.publishing',
    get title() { return translate('metadata.spotlight.publishing') },
    get subtitle() { return translate('metadata.spotlight.configurePublishingAndDeploymentSettings') },
    group: 'settings',
    iconName: 'send-solid',
    keywords: ['publishing', 'deploy', 'production', 'domain'],
    workspaces: ['site'],
    run: async (ctx) => {
      ctx.closeSpotlight()
      const { useEditorStore } = await import('@site/store/store')
      useEditorStore.getState().openSettings('publishing')
    },
  },
  {
    id: 'scope.settings.preferences',
    get title() { return translate('metadata.spotlight.preferences') },
    get subtitle() { return translate('metadata.spotlight.editorPreferencesAndAutoSaveSettings') },
    group: 'settings',
    iconName: 'sliders-horizontal',
    keywords: ['preferences', 'autosave', 'editor', 'behavior'],
    workspaces: ['site'],
    run: async (ctx) => {
      ctx.closeSpotlight()
      const { useEditorStore } = await import('@site/store/store')
      useEditorStore.getState().openSettings('preferences')
    },
  },
  {
    id: 'scope.settings.shortcuts',
    get title() { return translate('metadata.spotlight.keyboardShortcutsAlternate') },
    get subtitle() { return translate('metadata.spotlight.viewAndCustomizeKeyboardShortcuts') },
    group: 'settings',
    iconName: 'command',
    keywords: ['shortcuts', 'keyboard', 'hotkeys', 'keybindings'],
    workspaces: ['site'],
    run: async (ctx) => {
      ctx.closeSpotlight()
      const { useEditorStore } = await import('@site/store/store')
      useEditorStore.getState().openSettings('shortcuts')
    },
  },
]

export const settingsScope: Scope = {
  id: 'settings',
  get title() { return translate('metadata.spotlight.settings') },
  get placeholder() { return translate('metadata.spotlight.searchSettingsSections') },
  commands: () => SETTINGS_COMMANDS,
}
