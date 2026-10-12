/**
 * Help commands — §4.15 of the Command Spotlight master plan.
 *
 * - Show keyboard shortcuts
 * - Open documentation
 * - Report an issue
 * - About Instatic
 * - Copy environment info (for bug reports)
 */

import { translate } from '@admin/i18n'

import type { Command } from '../types'

export function getHelpCommands(): Command[] {
  return [
    {
      id: 'help.shortcuts',
      get title() { return translate('metadata.spotlight.showKeyboardShortcuts') },
      get subtitle() { return translate('metadata.spotlight.browseAllKeyboardShortcuts') },
      group: 'help',
      iconName: 'command',
      keywords: ['shortcuts', 'keyboard', 'hotkeys', 'keybindings', 'help', 'cheatsheet'],
      workspaces: ['site'],
      run: async (ctx) => {
        ctx.closeSpotlight()
        const { useEditorStore } = await import('@site/store/store')
        useEditorStore.getState().openSettings('shortcuts')
      },
    },

    {
      id: 'help.documentation',
      get title() { return translate('metadata.spotlight.openDocumentation') },
      get subtitle() { return translate('metadata.spotlight.viewTheInstaticDocs') },
      group: 'help',
      iconName: 'book-open-solid',
      keywords: ['docs', 'documentation', 'help', 'guide', 'reference'],
      workspaces: ['any'],
      run: (ctx) => {
        ctx.closeSpotlight()
        window.open('https://github.com/corebunch/instatic/blob/main/docs/', '_blank', 'noopener,noreferrer')
      },
    },

    {
      id: 'help.reportIssue',
      get title() { return translate('metadata.spotlight.reportAnIssue') },
      get subtitle() { return translate('metadata.spotlight.openGitHubIssuesToReportABugOrRequestAFeature') },
      group: 'help',
      iconName: 'circle-alert-solid',
      keywords: ['report', 'issue', 'bug', 'feedback', 'github'],
      workspaces: ['any'],
      run: (ctx) => {
        ctx.closeSpotlight()
        window.open('https://github.com/corebunch/instatic/issues/new', '_blank', 'noopener,noreferrer')
      },
    },

    {
      id: 'help.about',
      get title() { return translate('metadata.spotlight.aboutInstatic') },
      get subtitle() { return translate('metadata.spotlight.versionInformationAndLicense') },
      group: 'help',
      iconName: 'book-open-solid',
      keywords: ['about', 'version', 'license', 'info'],
      workspaces: ['any'],
      run: (ctx) => {
        ctx.closeSpotlight()
        // Navigate to About section in settings when available, else open docs
        window.open('https://github.com/corebunch/instatic', '_blank', 'noopener,noreferrer')
      },
    },

    {
      id: 'help.copyEnvInfo',
      get title() { return translate('metadata.spotlight.copyEnvironmentInfo') },
      get subtitle() { return translate('metadata.spotlight.copyBrowserOSAndVersionInfoForBugReports') },
      group: 'help',
      iconName: 'copy-solid',
      keywords: ['copy', 'environment', 'info', 'debug', 'browser', 'version', 'bug report'],
      workspaces: ['any'],
      run: (ctx) => {
        ctx.closeSpotlight()
        const info = [
          `Instatic`,
          `Browser: ${navigator.userAgent}`,
          `Platform: ${navigator.platform}`,
          `URL: ${window.location.href}`,
          `Date: ${new Date().toISOString()}`,
        ].join('\n')
        navigator.clipboard?.writeText(info).catch((_err) => {
          // Clipboard API may be unavailable in non-secure contexts; silently ignore.
        })
      },
    },
  ]
}
