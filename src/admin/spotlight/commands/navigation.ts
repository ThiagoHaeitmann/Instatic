/**
 * Navigation commands — §4.1 of the Command Spotlight master plan.
 *
 * Commands that navigate between admin workspaces.
 * Each command declares the capability(ies) required to reach the target
 * workspace; the palette's `filterCommands` hides any whose user lacks them.
 * The lists mirror the predicates in `canAccessWorkspace` (access.ts) — keep
 * them in sync if a workspace's gate changes.
 */

import { translate } from '@admin/i18n'

import type { Command } from '../types'

/** Mirrors `canAccessContent` in access.ts. */
const CONTENT_ACCESS_CAPABILITIES = [
  'content.create',
  'content.edit.own',
  'content.edit.any',
  'content.publish.own',
  'content.publish.any',
  'content.manage',
] as const

/** Mirrors `canAccessUsersWorkspace` in access.ts. */
const USERS_ACCESS_CAPABILITIES = [
  'users.manage',
  'roles.manage',
  'audit.read',
] as const

/** Mirrors `canAccessDataWorkspace` in access.ts (any `data.*` table read/manage or `content.*`). */
const DATA_WORKSPACE_CAPABILITIES = [
  'data.custom.tables.read',
  'data.custom.tables.manage',
  'data.system.tables.read',
  'data.system.tables.manage',
  ...CONTENT_ACCESS_CAPABILITIES,
] as const

/** Mirrors `canAccessPluginsWorkspace` in access.ts. */
const PLUGINS_ACCESS_CAPABILITIES = [
  'plugins.read',
  'plugins.configure',
  'plugins.install',
  'plugins.lifecycle',
] as const

/** Mirrors `canAccessAiWorkspace` in access.ts. */
const AI_ACCESS_CAPABILITIES = [
  'ai.providers.manage',
  'ai.audit.read',
] as const

export function getNavigationCommands(): Command[] {
  return [
    {
      id: 'navigation.goToSite',
      get title() { return translate('metadata.spotlight.goToSiteEditor') },
      get subtitle() { return translate('metadata.spotlight.openTheVisualEditor') },
      group: 'navigation',
      iconName: 'layout-solid',
      keywords: ['site', 'editor', 'pages', 'builder', 'visual'],
      workspaces: ['any'],
      capability: 'site.read',
      run: (ctx) => {
        ctx.navigate('/admin/site')
        ctx.closeSpotlight()
      },
    },
    {
      id: 'navigation.goToContent',
      get title() { return translate('metadata.spotlight.goToContent') },
      get subtitle() { return translate('metadata.spotlight.manageContentDocuments') },
      group: 'navigation',
      iconName: 'file-text-solid',
      keywords: ['content', 'documents', 'articles', 'cms'],
      workspaces: ['any'],
      capability: CONTENT_ACCESS_CAPABILITIES,
      run: (ctx) => {
        ctx.navigate('/admin/content')
        ctx.closeSpotlight()
      },
    },
    {
      id: 'navigation.goToData',
      get title() { return translate('metadata.spotlight.goToData') },
      get subtitle() { return translate('metadata.spotlight.manageStructuredDataTables') },
      group: 'navigation',
      iconName: 'database-solid',
      keywords: ['data', 'tables', 'fields', 'database', 'structured'],
      workspaces: ['any'],
      capability: DATA_WORKSPACE_CAPABILITIES,
      run: (ctx) => {
        ctx.navigate('/admin/data')
        ctx.closeSpotlight()
      },
    },
    {
      id: 'navigation.goToMedia',
      get title() { return translate('metadata.spotlight.goToMedia') },
      get subtitle() { return translate('metadata.spotlight.manageUploadedMediaFiles') },
      group: 'navigation',
      iconName: 'image-solid',
      keywords: ['media', 'files', 'images', 'uploads', 'assets'],
      workspaces: ['any'],
      capability: 'media.read',
      run: (ctx) => {
        ctx.navigate('/admin/media')
        ctx.closeSpotlight()
      },
    },
    {
      id: 'navigation.goToPlugins',
      get title() { return translate('metadata.spotlight.goToPlugins') },
      get subtitle() { return translate('metadata.spotlight.manageInstalledPlugins') },
      group: 'navigation',
      iconName: 'package-solid',
      keywords: ['plugins', 'extensions', 'addons', 'install'],
      workspaces: ['any'],
      capability: PLUGINS_ACCESS_CAPABILITIES,
      run: (ctx) => {
        ctx.navigate('/admin/plugins')
        ctx.closeSpotlight()
      },
    },
    {
      id: 'navigation.goToAi',
      get title() { return translate('metadata.spotlight.goToAISettings') },
      get subtitle() { return translate('metadata.spotlight.manageProvidersDefaultsConnectionsAndUsage') },
      group: 'navigation',
      iconName: 'ai-box-solid',
      keywords: ['ai', 'models', 'providers', 'openai', 'anthropic', 'ollama', 'mcp'],
      workspaces: ['any'],
      capability: AI_ACCESS_CAPABILITIES,
      run: (ctx) => {
        ctx.navigate('/admin/ai')
        ctx.closeSpotlight()
      },
    },
    {
      id: 'navigation.goToUsers',
      get title() { return translate('metadata.spotlight.goToUsers') },
      get subtitle() { return translate('metadata.spotlight.manageUsersAndRoles') },
      group: 'navigation',
      iconName: 'cursor-minimal-solid',
      keywords: ['users', 'roles', 'team', 'members', 'permissions', 'audit'],
      workspaces: ['any'],
      capability: USERS_ACCESS_CAPABILITIES,
      run: (ctx) => {
        ctx.navigate('/admin/users')
        ctx.closeSpotlight()
      },
    },
    {
      // Account is reachable by every authenticated user. No capability gate —
      // the surrounding admin route is itself behind a session, so simply not
      // declaring `capability` here matches `canAccessWorkspace('account')`'s
      // `user !== null` check.
      id: 'navigation.goToAccount',
      get title() { return translate('metadata.spotlight.goToAccount') },
      get subtitle() { return translate('metadata.spotlight.manageYourProfileAndSecurity') },
      group: 'navigation',
      iconName: 'settings-cog-solid',
      keywords: ['account', 'profile', 'security', 'password', 'mfa', 'sessions'],
      workspaces: ['any'],
      run: (ctx) => {
        ctx.navigate('/admin/account')
        ctx.closeSpotlight()
      },
    },
  ]
}
