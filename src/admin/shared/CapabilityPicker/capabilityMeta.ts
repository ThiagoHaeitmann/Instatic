import { translate } from '@admin/i18n'
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
  /** Human-readable label rendered next to the checkbox. */
  label: string
  /** Short, plain-language description of what this capability grants. */
  description: string
}

export const CAPABILITY_META: Record<CoreCapability, CapabilityMeta> = {
  'dashboard.read': {
    get label() { return translate('shell.copy.viewDashboard') },
    get description() { return translate('shell.copy.openTheDashboardWorkspaceAndSeeActivityWidgets') },
  },
  'site.read': {
    get label() { return translate('shell.copy.viewSite') },
    get description() { return translate('shell.copy.openTheSiteWorkspaceViewPagesComponentsAndClasses') },
  },
  'site.structure.edit': {
    get label() { return translate('shell.copy.editSiteStructure') },
    get description() { return translate('shell.copy.addRemoveMoveAndRenameNodesManagePagesComponentsAnd') },
  },
  'site.content.edit': {
    get label() { return translate('shell.copy.editSiteContent') },
    get description() { return translate('shell.copy.changeTextImagesAndLinksOnExistingNodesNoStructure') },
  },
  'site.style.edit': {
    get label() { return translate('shell.copy.editSiteStyles') },
    get description() { return translate('shell.copy.modifyCSSClassesStyleOverridesBreakpointsAndFrameworkTokens') },
  },
  'site.branches.create': {
    get label() { return translate('shell.copy.createBranches') },
    get description() { return translate('shell.copy.forkABranchAndRenameDeleteUpdateOrShareA') },
  },
  'site.branches.manage': {
    get label() { return translate('shell.copy.manageBranches') },
    get description() { return translate('shell.copy.actOnEveryBranchMergeBranchesIntoMainAndDecline') },
  },
  'pages.edit': {
    get label() { return translate('shell.copy.editPages') },
    get description() { return translate('shell.copy.editPageMetadataSuchAsTitleSlugAndSEOFields') },
  },
  'pages.publish': {
    get label() { return translate('shell.copy.publishPages') },
    get description() { return translate('shell.copy.publishOrUnpublishPagesToTheLiveSite') },
  },
  'content.create': {
    get label() { return translate('shell.copy.createContent') },
    get description() { return translate('shell.copy.createNewDraftPostsAndContentRows') },
  },
  'content.edit.own': {
    get label() { return translate('shell.copy.editOwnContent') },
    get description() { return translate('shell.copy.editPostsAndRowsThatYouAuthored') },
  },
  'content.edit.any': {
    get label() { return translate('shell.copy.editAnyContent') },
    get description() { return translate('shell.copy.editPostsAndRowsAuthoredByAnyone') },
  },
  'content.publish.own': {
    get label() { return translate('shell.copy.publishOwnContent') },
    get description() { return translate('shell.copy.publishPostsAndRowsThatYouAuthored') },
  },
  'content.publish.any': {
    get label() { return translate('shell.copy.publishAnyContent') },
    get description() { return translate('shell.copy.publishPostsAndRowsAuthoredByAnyone') },
  },
  'content.manage': {
    get label() { return translate('shell.copy.manageContent') },
    get description() { return translate('shell.copy.fullAdminManageEveryContentRowRegardlessOfAuthor') },
  },
  // ---------------------------------------------------------------------
  // Media — granular split (read/write/replace/delete)
  // ---------------------------------------------------------------------
  'media.read': {
    get label() { return translate('shell.copy.browseMediaLibrary') },
    get description() { return translate('shell.copy.openTheMediaWorkspaceBrowseAssetsAndFoldersSeeThumbnails') },
  },
  'media.write': {
    get label() { return translate('shell.copy.uploadAndEditMedia') },
    get description() { return translate('shell.copy.uploadAssetsEditMetadataAltTextCaptionTagsManageFolders') },
  },
  'media.replace': {
    get label() { return translate('shell.copy.replaceMediaBytes') },
    get description() { return translate('shell.copy.overwriteTheBytesOfAnExistingAssetVariantsRegenerateUniquely') },
  },
  'media.delete': {
    get label() { return translate('shell.copy.deleteMedia') },
    get description() { return translate('shell.copy.softDeleteAssetsToTrashHardPurgeAlsoRequiresStep') },
  },
  // ---------------------------------------------------------------------
  // Runtime + storage — split from the old monolithic `runtime.manage`
  // ---------------------------------------------------------------------
  'runtime.dependencies': {
    get label() { return translate('shell.copy.manageRuntimeDependencies') },
    get description() { return translate('shell.copy.editTheSiteSPackageJsonDependenciesAndTriggerResolve') },
  },
  'storage.elect': {
    get label() { return translate('shell.copy.electStorageBackends') },
    get description() { return translate('shell.copy.electTheMediaStorageAdapterPerAssetRoleOriginalsVariants') },
  },
  'storage.migrate': {
    get label() { return translate('shell.copy.migrateStorageBytes') },
    get description() { return translate('shell.copy.runTheMigrationSSEThatMovesBytesBetweenStorageAdapters') },
  },
  // ---------------------------------------------------------------------
  // Plugins — granular split (read/configure/install/lifecycle)
  // ---------------------------------------------------------------------
  'plugins.read': {
    get label() { return translate('shell.copy.browseInstalledPlugins') },
    get description() { return translate('shell.copy.seeTheInstalledPluginListMaskedSettingsSchedulesAndEvent') },
  },
  'plugins.configure': {
    get label() { return translate('shell.copy.configurePlugins') },
    get description() { return translate('shell.copy.editPerPluginSettingsAndManagePluginOwnedRecords') },
  },
  'plugins.install': {
    get label() { return translate('shell.copy.installOrUninstallPlugins') },
    get description() { return translate('shell.copy.installUpgradeAndUninstallPluginsRunsThirdPartyCodeOn') },
  },
  'plugins.lifecycle': {
    get label() { return translate('shell.copy.pluginLifecycleControl') },
    get description() { return translate('shell.copy.enableDisableRestartPluginsPauseResumeRunNowTheirSchedules') },
  },
  'users.manage': {
    get label() { return translate('shell.copy.manageUsers') },
    get description() { return translate('shell.copy.createEditDeleteAndSuspendUsersAssignRoles') },
  },
  'roles.manage': {
    get label() { return translate('shell.copy.manageRoles') },
    get description() { return translate('shell.copy.ownerAccountOnlyCreateEditAndDeleteRolesAssignCapabilities') },
  },
  'audit.read': {
    get label() { return translate('shell.copy.readAuditLog') },
    get description() { return translate('shell.copy.viewTheAuditLogAndTheDashboardActivityWidget') },
  },
  // ---------------------------------------------------------------------
  // Data workspace — split from `content.manage`
  // ---------------------------------------------------------------------
  'data.custom.tables.read': {
    get label() { return translate('shell.copy.browseCustomTables') },
    get description() { return translate('shell.copy.openTheDataWorkspaceBrowseUserCreatedCustomTablesAnd') },
  },
  'data.custom.tables.manage': {
    get label() { return translate('shell.copy.manageCustomTables') },
    get description() { return translate('shell.copy.createRenameAndDeleteCustomTablesAddEditRemoveTheir') },
  },
  'data.system.tables.read': {
    get label() { return translate('shell.copy.browseSystemTables') },
    get description() { return translate('shell.copy.seeAndOpenTheFourBuiltInSystemTablesPosts') },
  },
  'data.system.tables.manage': {
    get label() { return translate('shell.copy.manageSystemTableCustomFields') },
    get description() { return translate('shell.copy.onSystemTablesAddEditRemoveCustomFieldsAndChoose') },
  },
  'data.rows.move': {
    get label() { return translate('shell.copy.moveRowsBetweenTables') },
    get description() { return translate('shell.copy.moveARowFromOneTableToAnotherChangesPublic') },
  },
  'data.export': {
    get label() { return translate('shell.copy.exportDataBundles') },
    get description() { return translate('shell.copy.downloadAJSONBundleOfTablesRowsPlusOptionalMedia') },
  },
  'data.import': {
    get label() { return translate('shell.copy.importDataBundles') },
    get description() { return translate('shell.copy.uploadAJSONBundleToMergeOrReplaceLocalData') },
  },
  // ---------------------------------------------------------------------
  // AI runtime — split `ai.use` into chat vs write-tools
  // ---------------------------------------------------------------------
  'ai.chat': {
    get label() { return translate('shell.copy.useAIChat') },
    get description() { return translate('shell.copy.openAIConversationsAndUseReadOnlyToolsSnapshotSearch') },
  },
  'ai.tools.write': {
    get label() { return translate('shell.copy.allowAIWriteTools') },
    get description() { return translate('shell.copy.letsAIConversationsMutateTheEditorStoreInsertNodesEdit') },
  },
  'ai.providers.manage': {
    get label() { return translate('shell.copy.manageAIProviders') },
    get description() { return translate('shell.copy.configureAIProvidersCredentialsAndPerScopeDefaults') },
  },
  'ai.audit.read': {
    get label() { return translate('shell.copy.readAIAuditLog') },
    get description() { return translate('shell.copy.viewSiteWideAIUsageCostAndErrorEventsAcross') },
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
