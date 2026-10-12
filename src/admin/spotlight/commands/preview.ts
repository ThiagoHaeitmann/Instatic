/**
 * Preview commands — §4.2 (canvas mode / preview) of the master plan.
 *
 * Toggle preview overlay, switch canvas mode, control zoom.
 * All gated to workspace: ['site'] and capability `site.read` — these are
 * pure viewing affordances against the canvas.
 */

import { translate } from '@admin/i18n'

import type { Command } from '../types'

const PREVIEW_CAPABILITY = 'site.read'

export function getPreviewCommands(): Command[] {
  return [
    // ── Toggle preview ───────────────────────────────────────────────────────
    {
      id: 'preview.toggle',
      get title() { return translate('metadata.spotlight.togglePreview') },
      get subtitle() { return translate('metadata.spotlight.switchBetweenEditAndPreviewMode') },
      group: 'preview',
      iconName: 'eye-solid',
      keywords: ['preview', 'toggle', 'view', 'live', 'read-only'],
      workspaces: ['site'],
      capability: PREVIEW_CAPABILITY,
      run: async (ctx) => {
        ctx.closeSpotlight()
        try {
          const { useEditorStore } = await import('@site/store/store')
          const store = useEditorStore.getState()
          if (store.previewOpen) {
            store.closePreview()
          } else {
            store.openPreview()
          }
        } catch (err) {
          console.error('[spotlight] togglePreview failed:', err)
        }
      },
    },

    // ── Select mode ──────────────────────────────────────────────────────────
    {
      id: 'preview.modeSelect',
      get title() { return translate('metadata.spotlight.switchToSelectMode') },
      get subtitle() { return translate('metadata.spotlight.useThePointerToSelectAndEditLayers') },
      group: 'preview',
      iconName: 'pointer-solid',
      keywords: ['mode', 'select', 'pointer', 'cursor', 'canvas'],
      workspaces: ['site'],
      capability: PREVIEW_CAPABILITY,
      run: async (ctx) => {
        ctx.closeSpotlight()
        try {
          const { useEditorStore } = await import('@site/store/store')
          useEditorStore.getState().setCanvasMode('select')
        } catch (err) {
          console.error('[spotlight] setCanvasMode select failed:', err)
        }
      },
    },

    // ── Pan mode ─────────────────────────────────────────────────────────────
    {
      id: 'preview.modePan',
      get title() { return translate('metadata.spotlight.switchToPanMode') },
      get subtitle() { return translate('metadata.spotlight.useTheHandToolToPanTheCanvas') },
      group: 'preview',
      iconName: 'hand-grab-solid',
      keywords: ['mode', 'pan', 'hand', 'drag', 'canvas', 'scroll'],
      workspaces: ['site'],
      capability: PREVIEW_CAPABILITY,
      run: async (ctx) => {
        ctx.closeSpotlight()
        try {
          const { useEditorStore } = await import('@site/store/store')
          useEditorStore.getState().setCanvasMode('pan')
        } catch (err) {
          console.error('[spotlight] setCanvasMode pan failed:', err)
        }
      },
    },

    // ── Zoom in ──────────────────────────────────────────────────────────────
    {
      id: 'preview.zoomIn',
      get title() { return translate('metadata.spotlight.zoomIn') },
      get subtitle() { return translate('metadata.spotlight.increaseCanvasZoomLevel') },
      group: 'preview',
      iconName: 'plus',
      keywords: ['zoom', 'in', 'enlarge', 'magnify', 'canvas'],
      workspaces: ['site'],
      capability: PREVIEW_CAPABILITY,
      keepOpenAfterRun: false,
      run: async (ctx) => {
        ctx.closeSpotlight()
        try {
          const { useEditorStore } = await import('@site/store/store')
          useEditorStore.getState().zoomIn()
        } catch (err) {
          console.error('[spotlight] zoomIn failed:', err)
        }
      },
    },

    // ── Zoom out ─────────────────────────────────────────────────────────────
    {
      id: 'preview.zoomOut',
      get title() { return translate('metadata.spotlight.zoomOut') },
      get subtitle() { return translate('metadata.spotlight.decreaseCanvasZoomLevel') },
      group: 'preview',
      iconName: 'proportions-solid',
      keywords: ['zoom', 'out', 'shrink', 'canvas'],
      workspaces: ['site'],
      capability: PREVIEW_CAPABILITY,
      keepOpenAfterRun: false,
      run: async (ctx) => {
        ctx.closeSpotlight()
        try {
          const { useEditorStore } = await import('@site/store/store')
          useEditorStore.getState().zoomOut()
        } catch (err) {
          console.error('[spotlight] zoomOut failed:', err)
        }
      },
    },

    // ── Reset zoom ───────────────────────────────────────────────────────────
    {
      id: 'preview.zoomReset',
      get title() { return translate('metadata.spotlight.resetZoomTo100') },
      get subtitle() { return translate('metadata.spotlight.resetTheCanvasTo11Zoom') },
      group: 'preview',
      iconName: 'laptop-solid',
      keywords: ['zoom', 'reset', '100%', 'actual size', 'canvas'],
      workspaces: ['site'],
      capability: PREVIEW_CAPABILITY,
      keepOpenAfterRun: false,
      run: async (ctx) => {
        ctx.closeSpotlight()
        try {
          const { useEditorStore } = await import('@site/store/store')
          useEditorStore.getState().setZoom(1)
        } catch (err) {
          console.error('[spotlight] setZoom reset failed:', err)
        }
      },
    },
  ]
}
