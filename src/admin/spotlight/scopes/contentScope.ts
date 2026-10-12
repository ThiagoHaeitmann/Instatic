/**
 * Content scope — search content documents (data rows) via contentProvider.
 *
 * Phase 3: wires the live server-backed content provider plus static commands
 * for creating/managing content.
 */

import { translate } from '@admin/i18n'

import type { Scope, Command } from '../types'
import { contentProvider } from '../providers/contentProvider'

function getContentScopeCommands(): Command[] {
  return [
    {
      id: 'content.newDocument',
      get title() { return translate('metadata.spotlight.newContentDocument') },
      get subtitle() { return translate('metadata.spotlight.createANewUntitledDocumentInTheCurrentCollection') },
      group: 'content',
      iconName: 'file-plus-solid',
      keywords: ['new', 'create', 'document', 'content', 'entry'],
      workspaces: ['content'],
      run: (ctx) => {
        ctx.closeSpotlight()
        // The content page listens for this URL param to auto-create a row.
        ctx.navigate('/admin/content?action=new')
      },
    },
    {
      id: 'content.createCollection',
      get title() { return translate('metadata.spotlight.createCollection') },
      get subtitle() { return translate('metadata.spotlight.addANewContentCollection') },
      group: 'content',
      iconName: 'folder-solid',
      keywords: ['new', 'create', 'collection', 'table', 'post type'],
      workspaces: ['content'],
      run: (ctx) => {
        ctx.closeSpotlight()
        ctx.navigate('/admin/content?action=createCollection')
      },
    },
    {
      id: 'content.openMedia',
      get title() { return translate('metadata.spotlight.openMediaPicker') },
      get subtitle() { return translate('metadata.spotlight.browseAndInsertMediaAssets') },
      group: 'content',
      iconName: 'image-solid',
      keywords: ['media', 'image', 'file', 'asset', 'picker'],
      workspaces: ['content'],
      run: (ctx) => {
        ctx.closeSpotlight()
        ctx.navigate('/admin/content?action=media')
      },
    },
  ]
}

export const contentScope: Scope = {
  id: 'content',
  get title() { return translate('metadata.spotlight.openContentDocument') },
  get placeholder() { return translate('metadata.spotlight.searchContent') },
  commands: getContentScopeCommands,
  providers: [contentProvider],
}
