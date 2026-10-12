/**
 * Media scope — search media files via mediaProvider.
 *
 * Phase 3: wires the live server-backed media provider plus static commands
 * for uploading files and creating folders.
 */

import { translate } from '@admin/i18n'

import type { Scope, Command } from '../types'
import { mediaProvider } from '../providers/mediaProvider'

function getMediaScopeCommands(): Command[] {
  return [
    {
      id: 'media.uploadFile',
      get title() { return translate('metadata.spotlight.uploadFile') },
      get subtitle() { return translate('metadata.spotlight.uploadANewImageVideoOrDocument') },
      group: 'media',
      iconName: 'upload-solid',
      keywords: ['upload', 'file', 'image', 'video', 'media', 'add'],
      workspaces: ['media'],
      run: (ctx) => {
        ctx.closeSpotlight()
        ctx.navigate('/admin/media?action=upload')
      },
    },
    {
      id: 'media.newFolder',
      get title() { return translate('metadata.spotlight.newFolder') },
      get subtitle() { return translate('metadata.spotlight.createANewFolderInTheMediaLibrary') },
      group: 'media',
      iconName: 'folder-solid',
      keywords: ['new', 'create', 'folder', 'directory', 'organize'],
      workspaces: ['media'],
      args: [
        {
          id: 'name',
          get label() { return translate('metadata.spotlight.folderName') },
          type: 'text',
          get placeholder() { return translate('metadata.spotlight.myFolder') },
          required: true,
        },
      ],
      run: (ctx) => {
        ctx.closeSpotlight()
        const name = ctx.args['name']
        if (name) {
          ctx.navigate(`/admin/media?action=newFolder&name=${encodeURIComponent(name)}`)
        } else {
          ctx.navigate('/admin/media?action=newFolder')
        }
      },
    },
  ]
}

export const mediaScope: Scope = {
  id: 'media',
  get title() { return translate('metadata.spotlight.openFile') },
  get placeholder() { return translate('metadata.spotlight.searchMediaFiles') },
  commands: getMediaScopeCommands,
  providers: [mediaProvider],
}
