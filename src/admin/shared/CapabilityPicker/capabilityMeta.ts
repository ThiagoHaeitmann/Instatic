import { translate, type SupportedLocale } from '@admin/i18n'
import { shellEnglishMessages, shellPortugueseMessages } from '../../i18n/shellMessages'
/**
 * Capability presentation metadata — the human-readable label + description
 * rendered next to each capability checkbox so admins don't have to decode raw
 * permission strings like `site.structure.edit`.
 *
 * Co-located with `CapabilityPicker` (its only renderer). Consumed by the role
 * dialog and the MCP connector dialog. Coverage (every `CoreCapability` has an
 * entry) is gated by `capability-picker-coverage.test.ts`.
 */
import type { CoreCapability } from '@core/capabilities'

export interface CapabilityMeta {
  labelKey: keyof typeof shellEnglishMessages
  descriptionKey: keyof typeof shellEnglishMessages
  /** Human-readable label rendered next to the checkbox. */
  label: string
  /** Short, plain-language description of what this capability grants. */
  description: string
}

export const CAPABILITY_META: Record<CoreCapability, CapabilityMeta> = {
  'dashboard.read': {
    labelKey: 'shell.copy.viewDashboard',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.openTheDashboardWorkspaceAndSeeActivityWidgets',
    get description() { return translate(this.descriptionKey) },
  },
  'site.read': {
    labelKey: 'shell.copy.viewSite',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.openTheSiteWorkspaceViewPagesComponentsAndClasses',
    get description() { return translate(this.descriptionKey) },
  },
  'site.structure.edit': {
    labelKey: 'shell.copy.editSiteStructure',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.addRemoveMoveAndRenameNodesManagePagesComponentsAnd',
    get description() { return translate(this.descriptionKey) },
  },
  'site.content.edit': {
    labelKey: 'shell.copy.editSiteContent',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.changeTextImagesAndLinksOnExistingNodesNoStructure',
    get description() { return translate(this.descriptionKey) },
  },
  'site.style.edit': {
    labelKey: 'shell.copy.editSiteStyles',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.modifyCSSClassesStyleOverridesBreakpointsAndFrameworkTokens',
    get description() { return translate(this.descriptionKey) },
  },
  'site.branches.create': {
    labelKey: 'shell.copy.createBranches',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.forkABranchAndRenameDeleteUpdateOrShareA',
    get description() { return translate(this.descriptionKey) },
  },
  'site.branches.manage': {
    labelKey: 'shell.copy.manageBranches',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.actOnEveryBranchMergeBranchesIntoMainAndDecline',
    get description() { return translate(this.descriptionKey) },
  },
  'pages.edit': {
    labelKey: 'shell.copy.editPages',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.editPageMetadataSuchAsTitleSlugAndSEOFields',
    get description() { return translate(this.descriptionKey) },
  },
  'pages.publish': {
    labelKey: 'shell.copy.publishPages',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.publishOrUnpublishPagesToTheLiveSite',
    get description() { return translate(this.descriptionKey) },
  },
  'content.create': {
    labelKey: 'shell.copy.createContent',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.createNewDraftPostsAndContentRows',
    get description() { return translate(this.descriptionKey) },
  },
  'content.edit.own': {
    labelKey: 'shell.copy.editOwnContent',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.editPostsAndRowsThatYouAuthored',
    get description() { return translate(this.descriptionKey) },
  },
  'content.edit.any': {
    labelKey: 'shell.copy.editAnyContent',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.editPostsAndRowsAuthoredByAnyone',
    get description() { return translate(this.descriptionKey) },
  },
  'content.publish.own': {
    labelKey: 'shell.copy.publishOwnContent',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.publishPostsAndRowsThatYouAuthored',
    get description() { return translate(this.descriptionKey) },
  },
  'content.publish.any': {
    labelKey: 'shell.copy.publishAnyContent',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.publishPostsAndRowsAuthoredByAnyone',
    get description() { return translate(this.descriptionKey) },
  },
  'content.manage': {
    labelKey: 'shell.copy.manageContent',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.fullAdminManageEveryContentRowRegardlessOfAuthor',
    get description() { return translate(this.descriptionKey) },
  },
  // ---------------------------------------------------------------------
  // Media — granular split (read/write/replace/delete)
  // ---------------------------------------------------------------------
  'media.read': {
    labelKey: 'shell.copy.browseMediaLibrary',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.openTheMediaWorkspaceBrowseAssetsAndFoldersSeeThumbnails',
    get description() { return translate(this.descriptionKey) },
  },
  'media.write': {
    labelKey: 'shell.copy.uploadAndEditMedia',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.uploadAssetsEditMetadataAltTextCaptionTagsManageFolders',
    get description() { return translate(this.descriptionKey) },
  },
  'media.replace': {
    labelKey: 'shell.copy.replaceMediaBytes',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.overwriteTheBytesOfAnExistingAssetVariantsRegenerateUniquely',
    get description() { return translate(this.descriptionKey) },
  },
  'media.delete': {
    labelKey: 'shell.copy.deleteMedia',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.softDeleteAssetsToTrashHardPurgeAlsoRequiresStep',
    get description() { return translate(this.descriptionKey) },
  },
  // ---------------------------------------------------------------------
  // Runtime + storage — split from the old monolithic `runtime.manage`
  // ---------------------------------------------------------------------
  'runtime.dependencies': {
    labelKey: 'shell.copy.manageRuntimeDependencies',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.editTheSiteSPackageJsonDependenciesAndTriggerResolve',
    get description() { return translate(this.descriptionKey) },
  },
  'storage.elect': {
    labelKey: 'shell.copy.electStorageBackends',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.electTheMediaStorageAdapterPerAssetRoleOriginalsVariants',
    get description() { return translate(this.descriptionKey) },
  },
  'storage.migrate': {
    labelKey: 'shell.copy.migrateStorageBytes',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.runTheMigrationSSEThatMovesBytesBetweenStorageAdapters',
    get description() { return translate(this.descriptionKey) },
  },
  // ---------------------------------------------------------------------
  // Plugins — granular split (read/configure/install/lifecycle)
  // ---------------------------------------------------------------------
  'plugins.read': {
    labelKey: 'shell.copy.browseInstalledPlugins',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.seeTheInstalledPluginListMaskedSettingsSchedulesAndEvent',
    get description() { return translate(this.descriptionKey) },
  },
  'plugins.configure': {
    labelKey: 'shell.copy.configurePlugins',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.editPerPluginSettingsAndManagePluginOwnedRecords',
    get description() { return translate(this.descriptionKey) },
  },
  'plugins.install': {
    labelKey: 'shell.copy.installOrUninstallPlugins',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.installUpgradeAndUninstallPluginsRunsThirdPartyCodeOn',
    get description() { return translate(this.descriptionKey) },
  },
  'plugins.lifecycle': {
    labelKey: 'shell.copy.pluginLifecycleControl',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.enableDisableRestartPluginsPauseResumeRunNowTheirSchedules',
    get description() { return translate(this.descriptionKey) },
  },
  'users.manage': {
    labelKey: 'shell.copy.manageUsers',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.createEditDeleteAndSuspendUsersAssignRoles',
    get description() { return translate(this.descriptionKey) },
  },
  'roles.manage': {
    labelKey: 'shell.copy.manageRoles',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.ownerAccountOnlyCreateEditAndDeleteRolesAssignCapabilities',
    get description() { return translate(this.descriptionKey) },
  },
  'audit.read': {
    labelKey: 'shell.copy.readAuditLog',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.viewTheAuditLogAndTheDashboardActivityWidget',
    get description() { return translate(this.descriptionKey) },
  },
  // ---------------------------------------------------------------------
  // Data workspace — split from `content.manage`
  // ---------------------------------------------------------------------
  'data.custom.tables.read': {
    labelKey: 'shell.copy.browseCustomTables',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.openTheDataWorkspaceBrowseUserCreatedCustomTablesAnd',
    get description() { return translate(this.descriptionKey) },
  },
  'data.custom.tables.manage': {
    labelKey: 'shell.copy.manageCustomTables',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.createRenameAndDeleteCustomTablesAddEditRemoveTheir',
    get description() { return translate(this.descriptionKey) },
  },
  'data.system.tables.read': {
    labelKey: 'shell.copy.browseSystemTables',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.seeAndOpenTheFourBuiltInSystemTablesPosts',
    get description() { return translate(this.descriptionKey) },
  },
  'data.system.tables.manage': {
    labelKey: 'shell.copy.manageSystemTableCustomFields',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.onSystemTablesAddEditRemoveCustomFieldsAndChoose',
    get description() { return translate(this.descriptionKey) },
  },
  'data.rows.move': {
    labelKey: 'shell.copy.moveRowsBetweenTables',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.moveARowFromOneTableToAnotherChangesPublic',
    get description() { return translate(this.descriptionKey) },
  },
  'data.export': {
    labelKey: 'shell.copy.exportDataBundles',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.downloadAJSONBundleOfTablesRowsPlusOptionalMedia',
    get description() { return translate(this.descriptionKey) },
  },
  'data.import': {
    labelKey: 'shell.copy.importDataBundles',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.uploadAJSONBundleToMergeOrReplaceLocalData',
    get description() { return translate(this.descriptionKey) },
  },
  // ---------------------------------------------------------------------
  // AI runtime — split `ai.use` into chat vs write-tools
  // ---------------------------------------------------------------------
  'ai.chat': {
    labelKey: 'shell.copy.useAIChat',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.openAIConversationsAndUseReadOnlyToolsSnapshotSearch',
    get description() { return translate(this.descriptionKey) },
  },
  'ai.tools.write': {
    labelKey: 'shell.copy.allowAIWriteTools',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.letsAIConversationsMutateTheEditorStoreInsertNodesEdit',
    get description() { return translate(this.descriptionKey) },
  },
  'ai.providers.manage': {
    labelKey: 'shell.copy.manageAIProviders',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.configureAIProvidersCredentialsAndPerScopeDefaults',
    get description() { return translate(this.descriptionKey) },
  },
  'ai.audit.read': {
    labelKey: 'shell.copy.readAIAuditLog',
    get label() { return translate(this.labelKey) },
    descriptionKey: 'shell.copy.viewSiteWideAIUsageCostAndErrorEventsAcross',
    get description() { return translate(this.descriptionKey) },
  },
}

/**
 * Human-readable label for a capability — falls back to the raw ID for any
 * value not in the meta map (defensive: a stored role/connector may reference
 * a capability since removed from the codebase).
 */
export function capabilityLabel(capability: string): string {
  return (CAPABILITY_META as Record<string, CapabilityMeta>)[capability]?.label ?? capability
}

/** Snapshot existing metadata with an explicit locale input for compiler caches. */
export function localizeCapabilityMetadata(capability: string, locale: SupportedLocale): { label: string; description: string | null } {
  const meta = (CAPABILITY_META as Partial<Record<string, CapabilityMeta>>)[capability]
  if (!meta) return { label: capability, description: null }
  const messages = locale === 'pt-BR' ? shellPortugueseMessages : shellEnglishMessages
  return { label: messages[meta.labelKey], description: messages[meta.descriptionKey] }
}
