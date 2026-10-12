import { getLocale, subscribeToLocale, translate, type MessageKey, type SupportedLocale } from '@admin/i18n'
/**
 * Slash-command Tiptap extension.
 *
 * Wires the standard `@tiptap/suggestion` substrate to the `/` trigger
 * character. The actual menu rendering — the floating list, keyboard
 * selection, click handlers — lives in `BodySlashMenu.tsx`; this file
 * is just the plumbing between Tiptap's plugin layer and that React
 * component (which is mounted as a portal once per editor instance).
 *
 * Items are static — there is no async fetch — so `items` filters the
 * built-in catalogue by `query`. Selection invokes the item's `command`,
 * which is in turn responsible for performing the editor mutation
 * (e.g. `setNode('heading', { level })`, `toggleBulletList()`, etc.).
 *
 * External actions (media picker, data-token picker) are routed back to
 * the host component via the extension options' `onExternal` callback.
 * The slash menu invokes the callback synchronously after deleting the
 * trigger range so the host opens its dialog with a clean caret.
 */

import { Extension, type Editor, type Range } from '@tiptap/core'
import Suggestion, { type SuggestionOptions, type SuggestionProps } from '@tiptap/suggestion'
import { Plugin } from '@tiptap/pm/state'

export type SlashExternalAction = 'media' | 'dataToken'

export interface SlashCommandItem {
  id: string
  labelKey: MessageKey
  descriptionKey: MessageKey
  keywords: readonly string[]
  command: (props: { editor: Editor; range: Range }) => void
}

interface SlashCommandOptions {
  /**
   * Called when the user picks an item whose effect cannot be performed
   * from inside the editor (currently: opening the media picker or the
   * data-token binding dialog). The host component opens the dialog and,
   * on confirm, calls back into the editor with the selected payload.
   */
  onExternal: (action: SlashExternalAction) => void
  /**
   * Renderer plumbing — exposed via the extension's `addOptions` so the
   * React layer can mount its menu. The host attaches the four lifecycle
   * methods that `@tiptap/suggestion` expects (onStart / onUpdate /
   * onKeyDown / onExit).
   */
  suggestion: Omit<SuggestionOptions<SlashCommandItem>, 'editor' | 'items'>
}

const SLASH_COMMAND_NAME = 'slashCommand'

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: SLASH_COMMAND_NAME,

  addOptions() {
    return {
      onExternal: () => undefined,
      suggestion: {
        char: '/',
        startOfLine: false,
        allowSpaces: false,
        command: ({ editor, range, props }) => {
          props.command({ editor, range })
        },
      },
    }
  },

  addProseMirrorPlugins() {
    const editor = this.editor
    const catalog = buildSlashItems(this.options.onExternal)
    const options = this.options.suggestion
    let viewAlive = false
    let activeProps: SuggestionProps<SlashCommandItem> | null = null
    const renderer = options.render?.()

    function localizedProps(props: SuggestionProps<SlashCommandItem>): SuggestionProps<SlashCommandItem> {
      return { ...props, items: filterSlashItems(catalog, props.query, getLocale()) }
    }

    function isCurrentSuggestion(props: SuggestionProps<SlashCommandItem>): boolean {
      if (!viewAlive || editor.isDestroyed) return false
      const state = suggestion.getState(editor.state)
      return Boolean(state?.active && state.query === props.query &&
        state.range.from === props.range.from && state.range.to === props.range.to)
    }

    const suggestion = Suggestion<SlashCommandItem>({
      editor,
      ...options,
      items: ({ query }) => filterSlashItems(catalog, query, getLocale()),
      render: () => ({
        ...renderer,
        onStart: (props) => {
          // Awaited items can outlive the active query or the plugin view.
          if (!isCurrentSuggestion(props)) return
          activeProps = localizedProps(props)
          renderer?.onStart?.(activeProps)
        },
        onUpdate: (props) => {
          if (!isCurrentSuggestion(props)) return
          activeProps = localizedProps(props)
          renderer?.onUpdate?.(activeProps)
        },
        onExit: (props) => {
          activeProps = null
          renderer?.onExit?.(props)
        },
      }),
    })

    // Suggestion only reloads items for query/range changes. Locale is another
    // filter input: refresh its active renderer without faking document changes.
    return [new Plugin({
      ...suggestion.spec,
      view: (view) => {
        viewAlive = true
        const suggestionView = suggestion.spec.view?.(view)
        const unsubscribe = subscribeToLocale(() => {
          // Pending query callbacks will resolve the latest locale themselves.
          if (!activeProps || !isCurrentSuggestion(activeProps)) return
          activeProps = localizedProps(activeProps)
          renderer?.onBeforeUpdate?.(activeProps)
          renderer?.onUpdate?.(activeProps)
        })
        return {
          update: (nextView, previousState) => suggestionView?.update?.(nextView, previousState),
          destroy: () => {
            viewAlive = false
            unsubscribe()
            suggestionView?.destroy?.()
            activeProps = null
          },
        }
      },
    })]
  },
})

// ---------------------------------------------------------------------------
// Item catalogue
// ---------------------------------------------------------------------------

function buildSlashItems(onExternal: (action: SlashExternalAction) => void): SlashCommandItem[] {
  return [
    {
      id: 'heading-2',
      labelKey: 'content.copy.heading2',
      descriptionKey: 'content.copy.sectionTitle',
      keywords: ['h2', 'heading', 'section', 'title'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run(),
    },
    {
      id: 'heading-3',
      labelKey: 'content.copy.heading3',
      descriptionKey: 'content.copy.subSection',
      keywords: ['h3', 'heading', 'subsection'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run(),
    },
    {
      id: 'heading-4',
      labelKey: 'content.copy.heading4',
      descriptionKey: 'content.copy.smallHeading',
      keywords: ['h4', 'heading'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 4 }).run(),
    },
    {
      id: 'bullet-list',
      labelKey: 'content.copy.bulletList',
      descriptionKey: 'content.copy.unorderedList',
      keywords: ['ul', 'list', 'bullet', 'unordered'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleBulletList().run(),
    },
    {
      id: 'ordered-list',
      labelKey: 'content.copy.numberedList',
      descriptionKey: 'content.copy.orderedList',
      keywords: ['ol', 'list', 'number', 'ordered'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
    },
    {
      id: 'blockquote',
      labelKey: 'content.copy.quote',
      descriptionKey: 'content.copy.blockQuote',
      keywords: ['quote', 'blockquote'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
    },
    {
      id: 'code-block',
      labelKey: 'content.copy.codeBlock',
      descriptionKey: 'content.copy.fencedCode',
      keywords: ['code', 'pre', 'snippet'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
    },
    {
      id: 'horizontal-rule',
      labelKey: 'content.copy.divider',
      descriptionKey: 'content.copy.horizontalRule',
      keywords: ['hr', 'divider', 'separator', 'line'],
      command: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
    },
    {
      id: 'table',
      labelKey: 'content.copy.table',
      descriptionKey: 'content.copy.2Column3Row',
      keywords: ['table', 'grid'],
      command: ({ editor, range }) =>
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertTable({ rows: 3, cols: 2, withHeaderRow: true })
          .run(),
    },
    {
      id: 'media',
      labelKey: 'content.copy.media',
      descriptionKey: 'content.copy.imageOrVideoFromLibrary',
      keywords: ['image', 'img', 'video', 'media', 'picture'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run()
        onExternal('media')
      },
    },
    {
      id: 'data-token',
      labelKey: 'content.copy.dataToken',
      descriptionKey: 'content.copy.insertSourceField',
      keywords: ['data', 'token', 'binding', 'field', 'dynamic'],
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run()
        onExternal('dataToken')
      },
    },
  ]
}

function filterSlashItems(items: SlashCommandItem[], query: string, locale: SupportedLocale): SlashCommandItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter((item) => {
    if (translate(item.labelKey, {}, locale).toLowerCase().includes(q)) return true
    if (translate(item.descriptionKey, {}, locale).toLowerCase().includes(q)) return true
    return item.keywords.some((kw) => kw.includes(q))
  })
}
