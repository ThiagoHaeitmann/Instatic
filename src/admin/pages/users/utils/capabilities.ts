import { translate } from '@admin/i18n'
/**
 * Role-edit capability groupings.
 *
 * Every entry in `CAPABILITY_GROUPS` maps to a `<section>` in the role dialog's
 * `CapabilityPicker`. The human-readable label + description for each
 * capability live with the picker (`@admin/shared/CapabilityPicker` →
 * `CAPABILITY_META`).
 *
 * Adding a new capability: append it to `CORE_CAPABILITIES` (`@core/capabilities`),
 * add it to one of the groups here, and add its meta entry in
 * `CapabilityPicker/capabilityMeta.ts`. The `capability-picker-coverage.test.ts`
 * gate enforces full coverage so a new capability can't quietly disappear from
 * the role-edit UI.
 */
import type { CoreCapability } from '@core/capabilities'
import type { CapabilityGroup } from '../types'

export const CAPABILITY_GROUPS = [
  { titleKey: 'accountUsers.groups.dashboard', get title() { return translate(this.titleKey) }, capabilities: ['dashboard.read'] },
  {
    titleKey: 'accountUsers.groups.site', get title() { return translate(this.titleKey) },
    capabilities: [
      'site.read',
      'site.structure.edit',
      'site.content.edit',
      'site.style.edit',
      'site.branches.create',
      'site.branches.manage',
    ],
  },
  { titleKey: 'accountUsers.groups.pages', get title() { return translate(this.titleKey) }, capabilities: ['pages.edit', 'pages.publish'] },
  {
    titleKey: 'accountUsers.groups.content', get title() { return translate(this.titleKey) },
    capabilities: [
      'content.create',
      'content.edit.own',
      'content.edit.any',
      'content.publish.own',
      'content.publish.any',
      'content.manage',
    ],
  },
  {
    titleKey: 'accountUsers.groups.data', get title() { return translate(this.titleKey) },
    capabilities: [
      'data.custom.tables.read',
      'data.custom.tables.manage',
      'data.system.tables.read',
      'data.system.tables.manage',
      'data.rows.move',
      'data.export',
      'data.import',
    ],
  },
  {
    titleKey: 'accountUsers.groups.media', get title() { return translate(this.titleKey) },
    capabilities: ['media.read', 'media.write', 'media.replace', 'media.delete'],
  },
  {
    titleKey: 'accountUsers.groups.runtimeStorage', get title() { return translate(this.titleKey) },
    capabilities: ['runtime.dependencies', 'storage.elect', 'storage.migrate'],
  },
  {
    titleKey: 'accountUsers.groups.plugins', get title() { return translate(this.titleKey) },
    capabilities: ['plugins.read', 'plugins.configure', 'plugins.install', 'plugins.lifecycle'],
  },
  {
    titleKey: 'accountUsers.groups.ai', get title() { return translate(this.titleKey) },
    capabilities: ['ai.chat', 'ai.tools.write', 'ai.providers.manage', 'ai.audit.read'],
  },
  { titleKey: 'accountUsers.groups.usersRoles', get title() { return translate(this.titleKey) }, capabilities: ['users.manage', 'roles.manage'] },
  { titleKey: 'accountUsers.groups.audit', get title() { return translate(this.titleKey) }, capabilities: ['audit.read'] },
] satisfies CapabilityGroup[]

/**
 * Flat list of every capability rendered by the role-edit dialog, in the
 * order defined by `CAPABILITY_GROUPS`. Used for the dialog's "select all
 * across every group" master toggle.
 */
export const ALL_PICKER_CAPABILITIES: readonly CoreCapability[] = CAPABILITY_GROUPS.flatMap(
  (group) => group.capabilities,
)

export function localizeRoleCapabilityGroups(t: typeof translate) {
  return CAPABILITY_GROUPS.map((group) => ({ id: group.titleKey, title: t(group.titleKey), capabilities: group.capabilities }))
}
