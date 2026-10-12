import type { Editor } from '@tiptap/core'
import { translate, type SupportedLocale } from '@admin/i18n'

export function contentEditorPlaceholder(nodeName: string, live = false): string {
  return translate(nodeName === 'heading' ? 'content.copy.heading' : live ? 'content.copy.startWriting' : 'content.placeholder.commands')
}

/** Refresh chrome/decorations without recreating the editor or touching its document. */
export function syncContentEditorLocale(editor: Editor | null, locale: SupportedLocale, live = false): void {
  if (!editor || editor.isDestroyed) return
  editor.setOptions({
    editorProps: {
      ...editor.options.editorProps,
      attributes: {
        ...editor.options.editorProps.attributes,
        'aria-label': translate(live ? 'content.copy.postBodyLivePreview' : 'content.copy.postBody', {}, locale),
      },
    },
  })
  editor.view.dispatch(editor.state.tr.setMeta('contentLocale', locale))
}
