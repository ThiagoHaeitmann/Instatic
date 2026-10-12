/**
 * Pages commands — §4.3 of the Command Spotlight master plan.
 *
 * - Switch to page      → pushes 'pages' scope (lets user pick any page)
 * - New page            → arg: title (available from any workspace)
 * - Rename current page → arg: title
 * - Duplicate current page → arg: title (copy name)
 * - Delete current page → destructive
 */

import { translate } from '@admin/i18n'

import type { Command } from '../types'
import { queuePendingAction } from '../pendingAction'

export function getPagesCommands(): Command[] {
  return [
    // ── Switch to page ───────────────────────────────────────────────────────
    {
      id: 'pages.switchPage',
      get title() { return translate('metadata.spotlight.switchToPage') },
      get subtitle() { return translate('metadata.spotlight.navigateToADifferentPage') },
      group: 'pages',
      iconName: 'file-text-solid',
      keywords: ['page', 'switch', 'navigate', 'go', 'open'],
      workspaces: ['site'],
      capability: 'site.read',
      run: (ctx) => {
        ctx.pushScope('pages')
      },
    },

    // ── New page ─────────────────────────────────────────────────────────────
    // Available everywhere. When the user is already on the site workspace
    // and the editor store has hydrated, we run `addPage` directly. When
    // they're on a different workspace (Content, Account, …) we queue a
    // pending action and navigate — SitePage's pending-action consumer
    // runs `addPage` on mount once the site has loaded.
    {
      id: 'pages.newPage',
      get title() { return translate('metadata.spotlight.newPage') },
      get subtitle() { return translate('metadata.spotlight.createANewPageInTheCurrentSite') },
      group: 'pages',
      iconName: 'file-plus-solid',
      keywords: ['page', 'add', 'new', 'create'],
      workspaces: ['any'],
      capability: 'pages.edit',
      args: [
        {
          id: 'title',
          get label() { return translate('metadata.spotlight.pageTitle') },
          type: 'text',
          get placeholder() { return translate('metadata.spotlight.eGAboutUs') },
          required: true,
        },
      ],
      run: async (ctx) => {
        const title = ctx.args['title']?.trim()
        if (!title) return

        if (ctx.workspace === 'site') {
          try {
            const { useEditorStore } = await import('@site/store/store')
            const store = useEditorStore.getState()
            if (store.site) {
              store.addPage(title)
              return
            }
          } catch (err) {
            console.error('[spotlight] addPage failed:', err)
          }
        }

        // Cross-workspace: queue + navigate. SitePage executes on mount.
        queuePendingAction('site.newPage', { title })
        ctx.navigate('/admin/site')
      },
    },

    // ── Rename current page ──────────────────────────────────────────────────
    {
      id: 'pages.renamePage',
      get title() { return translate('metadata.spotlight.renameCurrentPage') },
      get subtitle() { return translate('metadata.spotlight.changeTheTitleOfTheActivePage') },
      group: 'pages',
      iconName: 'edit-solid',
      keywords: ['page', 'rename', 'title', 'slug'],
      workspaces: ['site'],
      capability: 'pages.edit',
      when: (ctx) => Boolean(ctx.editor?.activePageId),
      args: [
        {
          id: 'title',
          get label() { return translate('metadata.spotlight.newTitle') },
          type: 'text',
          get placeholder() { return translate('metadata.spotlight.eGAboutUs') },
          required: true,
        },
      ],
      run: async (ctx) => {
        const title = ctx.args['title']?.trim()
        if (!title) return
        const pageId = ctx.editor?.activePageId
        if (!pageId) return
        try {
          const { useEditorStore } = await import('@site/store/store')
          useEditorStore.getState().renamePage(pageId, title)
        } catch (err) {
          console.error('[spotlight] renamePage failed:', err)
        }
      },
    },

    // ── Duplicate current page ───────────────────────────────────────────────
    {
      id: 'pages.duplicatePage',
      get title() { return translate('metadata.spotlight.duplicateCurrentPage') },
      get subtitle() { return translate('metadata.spotlight.createACopyOfTheActivePage') },
      group: 'pages',
      iconName: 'copy-solid',
      keywords: ['page', 'duplicate', 'copy', 'clone'],
      workspaces: ['site'],
      capability: 'pages.edit',
      when: (ctx) => Boolean(ctx.editor?.activePageId),
      args: [
        {
          id: 'title',
          get label() { return translate('metadata.spotlight.copyTitle') },
          type: 'text',
          get placeholder() { return translate('metadata.spotlight.eGAboutUsCopy') },
          required: true,
        },
      ],
      run: async (ctx) => {
        const title = ctx.args['title']?.trim()
        if (!title) return
        const pageId = ctx.editor?.activePageId
        if (!pageId) return
        try {
          const { useEditorStore } = await import('@site/store/store')
          useEditorStore.getState().duplicatePage(pageId, title)
        } catch (err) {
          console.error('[spotlight] duplicatePage failed:', err)
        }
      },
    },

    // ── Delete current page ──────────────────────────────────────────────────
    {
      id: 'pages.deletePage',
      get title() { return translate('metadata.spotlight.deleteCurrentPage') },
      get subtitle() { return translate('metadata.spotlight.permanentlyRemoveTheActivePage') },
      group: 'pages',
      iconName: 'trash-solid',
      keywords: ['page', 'delete', 'remove', 'destroy'],
      workspaces: ['site'],
      capability: 'pages.edit',
      when: (ctx) => Boolean(ctx.editor?.activePageId),
      destructive: true,
      run: async (ctx) => {
        const pageId = ctx.editor?.activePageId
        if (!pageId) return
        try {
          const { useEditorStore } = await import('@site/store/store')
          useEditorStore.getState().deletePage(pageId)
        } catch (err) {
          console.error('[spotlight] deletePage failed:', err)
        }
      },
    },
  ]
}
