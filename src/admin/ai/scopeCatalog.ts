import { translate } from '@admin/i18n'

export type ToolScope = 'site' | 'content' | 'data' | 'plugin'

export const AI_TOOL_SCOPES: ToolScope[] = ['site', 'content', 'data', 'plugin']
export const AI_SCOPE_META: Record<ToolScope, {
  label: string
  description: string
}> = {
  site: {
    get label() { return translate('metadata.ai.siteEditor') },
    get description() { return translate('metadata.ai.visualEditorChatAndPageBuildingTools') },
  },
  content: {
    get label() { return translate('metadata.ai.content') },
    get description() { return translate('metadata.ai.writingEditingAndStructuredContentWorkflows') },
  },
  data: {
    get label() { return translate('metadata.ai.data') },
    get description() { return translate('metadata.ai.dataWorkspaceAssistanceAndTableOperations') },
  },
  plugin: {
    get label() { return translate('metadata.ai.plugins') },
    get description() { return translate('metadata.ai.aiCallsMadeThroughThePluginAPI') },
  },
}
