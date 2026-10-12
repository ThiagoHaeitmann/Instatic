/**
 * Panels commands — §4.4 of the Command Spotlight master plan.
 *
 * Toggle/open editor side-panels, cycle panel focus, toggle the code editor.
 * All gated to workspace: ['site'] since panels only exist in the site editor.
 *
 * Capability: `site.read` — every panel is a read-only UI affordance. The
 * underlying mutations the panels expose are themselves capability-gated.
 */

import { translate } from '@admin/i18n'

import type { Command } from '../types'

const PANEL_CAPABILITY = 'site.read'

export function getPanelsCommands(): Command[] {
  return [
    // ── Explorer panel ───────────────────────────────────────────────────────
    {
      id: 'panels.toggleExplorer',
      get title() { return translate('metadata.spotlight.toggleExplorerPanel') },
      get subtitle() { return translate('metadata.spotlight.showOrHideTheExplorerLayersPagesMediaPanel') },
      group: 'editor',
      iconName: 'files-stack-2-solid',
      keywords: ['panel', 'explorer', 'layers', 'pages', 'site', 'media', 'sidebar', 'toggle'],
      workspaces: ['site'],
      capability: PANEL_CAPABILITY,
      run: async (ctx) => {
        ctx.closeSpotlight()
        try {
          const { useEditorStore } = await import('@site/store/store')
          useEditorStore.getState().toggleLeftSidebarPanel('explorer')
        } catch (err) {
          console.error('[spotlight] toggleLeftSidebarPanel explorer failed:', err)
        }
      },
    },

    // ── Explorer → Layers tab ────────────────────────────────────────────────
    {
      id: 'panels.showLayers',
      get title() { return translate('metadata.spotlight.showLayers') },
      get subtitle() { return translate('metadata.spotlight.openTheExplorerPanelOnTheLayersDOMTreeTab') },
      group: 'editor',
      iconName: 'list-box-solid',
      keywords: ['panel', 'layers', 'dom', 'tree', 'explorer', 'show'],
      workspaces: ['site'],
      capability: PANEL_CAPABILITY,
      run: async (ctx) => {
        ctx.closeSpotlight()
        try {
          const { useEditorStore } = await import('@site/store/store')
          const store = useEditorStore.getState()
          store.setExplorerPanelTab('layers')
          store.setExplorerPanelOpen(true)
        } catch (err) {
          console.error('[spotlight] show layers failed:', err)
        }
      },
    },

    // ── Explorer → Site tab ──────────────────────────────────────────────────
    {
      id: 'panels.showSite',
      get title() { return translate('metadata.spotlight.showSite') },
      get subtitle() { return translate('metadata.spotlight.openTheExplorerPanelOnTheSitePagesTemplatesComponentsTab') },
      group: 'editor',
      iconName: 'layout-solid',
      keywords: ['panel', 'site', 'pages', 'templates', 'components', 'explorer', 'sidebar', 'show'],
      workspaces: ['site'],
      capability: PANEL_CAPABILITY,
      run: async (ctx) => {
        ctx.closeSpotlight()
        try {
          const { useEditorStore } = await import('@site/store/store')
          const store = useEditorStore.getState()
          store.setExplorerPanelTab('site')
          store.setExplorerPanelOpen(true)
        } catch (err) {
          console.error('[spotlight] show site failed:', err)
        }
      },
    },

    // ── Explorer → Code tab ──────────────────────────────────────────────────
    {
      id: 'panels.showCode',
      get title() { return translate('metadata.spotlight.showCode') },
      get subtitle() { return translate('metadata.spotlight.openTheExplorerPanelOnTheCodeStylesheetsScriptsTab') },
      group: 'editor',
      iconName: 'code',
      keywords: ['panel', 'code', 'styles', 'stylesheet', 'css', 'scripts', 'js', 'files', 'explorer', 'show'],
      workspaces: ['site'],
      capability: PANEL_CAPABILITY,
      run: async (ctx) => {
        ctx.closeSpotlight()
        try {
          const { useEditorStore } = await import('@site/store/store')
          const store = useEditorStore.getState()
          store.setExplorerPanelTab('code')
          store.setExplorerPanelOpen(true)
        } catch (err) {
          console.error('[spotlight] show code failed:', err)
        }
      },
    },

    // ── Selectors panel ──────────────────────────────────────────────────────
    {
      id: 'panels.toggleSelectors',
      get title() { return translate('metadata.spotlight.toggleSelectorsPanel') },
      get subtitle() { return translate('metadata.spotlight.showOrHideTheCSSSelectorsPanel') },
      group: 'editor',
      iconName: 'code',
      keywords: ['panel', 'selectors', 'css', 'classes', 'toggle'],
      workspaces: ['site'],
      capability: PANEL_CAPABILITY,
      run: async (ctx) => {
        ctx.closeSpotlight()
        try {
          const { useEditorStore } = await import('@site/store/store')
          useEditorStore.getState().toggleLeftSidebarPanel('selectors')
        } catch (err) {
          console.error('[spotlight] toggleLeftSidebarPanel selectors failed:', err)
        }
      },
    },

    // ── Framework panel ──────────────────────────────────────────────────────
    {
      id: 'panels.toggleFramework',
      get title() { return translate('metadata.spotlight.toggleFrameworkPanel') },
      get subtitle() { return translate('metadata.spotlight.showOrHideTheDesignTokenFrameworkPanelColorsTypeSpace') },
      group: 'editor',
      iconName: 'colors-swatch-solid',
      keywords: ['panel', 'framework', 'colors', 'typography', 'spacing', 'tokens', 'toggle'],
      workspaces: ['site'],
      capability: PANEL_CAPABILITY,
      run: async (ctx) => {
        ctx.closeSpotlight()
        try {
          const { useEditorStore } = await import('@site/store/store')
          useEditorStore.getState().toggleLeftSidebarPanel('framework')
        } catch (err) {
          console.error('[spotlight] toggleLeftSidebarPanel framework failed:', err)
        }
      },
    },

    // ── Explorer → Media tab ─────────────────────────────────────────────────
    {
      id: 'panels.showMedia',
      get title() { return translate('metadata.spotlight.showMedia') },
      get subtitle() { return translate('metadata.spotlight.openTheExplorerPanelOnTheMediaAssetLibraryTab') },
      group: 'editor',
      iconName: 'image-solid',
      keywords: ['panel', 'media', 'assets', 'images', 'files', 'explorer', 'show'],
      workspaces: ['site'],
      capability: PANEL_CAPABILITY,
      run: async (ctx) => {
        ctx.closeSpotlight()
        try {
          const { useEditorStore } = await import('@site/store/store')
          const store = useEditorStore.getState()
          store.setExplorerPanelTab('media')
          store.setExplorerPanelOpen(true)
        } catch (err) {
          console.error('[spotlight] show media failed:', err)
        }
      },
    },

    // ── Dependencies panel ───────────────────────────────────────────────────
    {
      id: 'panels.toggleDependencies',
      get title() { return translate('metadata.spotlight.toggleDependenciesPanel') },
      get subtitle() { return translate('metadata.spotlight.showOrHideTheSiteDependenciesPanel') },
      group: 'editor',
      iconName: 'package-solid',
      keywords: ['panel', 'dependencies', 'packages', 'plugins', 'toggle'],
      workspaces: ['site'],
      capability: PANEL_CAPABILITY,
      run: async (ctx) => {
        ctx.closeSpotlight()
        try {
          const { useEditorStore } = await import('@site/store/store')
          useEditorStore.getState().toggleLeftSidebarPanel('dependencies')
        } catch (err) {
          console.error('[spotlight] toggleLeftSidebarPanel dependencies failed:', err)
        }
      },
    },

    // ── AI Assistant panel ───────────────────────────────────────────────────
    {
      id: 'panels.toggleAgent',
      get title() { return translate('metadata.spotlight.toggleAIAssistantPanel') },
      get subtitle() { return translate('metadata.spotlight.showOrHideTheAIAssistantPanel') },
      group: 'editor',
      iconName: 'sparkles-solid',
      keywords: ['panel', 'ai', 'assistant', 'agent', 'claude', 'toggle'],
      workspaces: ['site'],
      capability: PANEL_CAPABILITY,
      run: async (ctx) => {
        ctx.closeSpotlight()
        try {
          const { useEditorStore } = await import('@site/store/store')
          useEditorStore.getState().toggleLeftSidebarPanel('agent')
        } catch (err) {
          console.error('[spotlight] toggleLeftSidebarPanel agent failed:', err)
        }
      },
    },

    // ── Properties panel ─────────────────────────────────────────────────────
    {
      id: 'panels.toggleProperties',
      get title() { return translate('metadata.spotlight.togglePropertiesPanel') },
      get subtitle() { return translate('metadata.spotlight.showOrHideThePropertiesPanel') },
      group: 'editor',
      iconName: 'sliders-horizontal',
      keywords: ['panel', 'properties', 'inspector', 'toggle'],
      workspaces: ['site'],
      capability: PANEL_CAPABILITY,
      run: async (ctx) => {
        ctx.closeSpotlight()
        try {
          const { useEditorStore } = await import('@site/store/store')
          useEditorStore.getState().togglePropertiesPanel()
        } catch (err) {
          console.error('[spotlight] togglePropertiesPanel failed:', err)
        }
      },
    },

    // ── Code editor panel ────────────────────────────────────────────────────
    {
      id: 'panels.toggleCodeEditor',
      get title() { return translate('metadata.spotlight.toggleCodeEditorPanel') },
      get subtitle() { return translate('metadata.spotlight.showOrHideTheFloatingCodeEditor') },
      group: 'editor',
      iconName: 'code',
      keywords: ['panel', 'code', 'editor', 'file', 'toggle'],
      workspaces: ['site'],
      capability: PANEL_CAPABILITY,
      run: async (ctx) => {
        ctx.closeSpotlight()
        try {
          const { useEditorStore } = await import('@site/store/store')
          const store = useEditorStore.getState()
          store.setCodeEditorPanelOpen(!store.codeEditorPanelOpen)
        } catch (err) {
          console.error('[spotlight] toggleCodeEditorPanel failed:', err)
        }
      },
    },

    // ── Cycle panel focus ────────────────────────────────────────────────────
    {
      id: 'panels.cycleFocus',
      get title() { return translate('metadata.spotlight.cyclePanelFocus') },
      get subtitle() { return translate('metadata.spotlight.moveKeyboardFocusBetweenCanvasLayersAndProperties') },
      group: 'editor',
      iconName: 'arrows-horizontal',
      keywords: ['panel', 'focus', 'cycle', 'keyboard', 'navigate'],
      workspaces: ['site'],
      capability: PANEL_CAPABILITY,
      keepOpenAfterRun: false,
      run: async (ctx) => {
        ctx.closeSpotlight()
        try {
          const { useEditorStore } = await import('@site/store/store')
          useEditorStore.getState().cycleFocusedPanel()
        } catch (err) {
          console.error('[spotlight] cycleFocusedPanel failed:', err)
        }
      },
    },
  ]
}
