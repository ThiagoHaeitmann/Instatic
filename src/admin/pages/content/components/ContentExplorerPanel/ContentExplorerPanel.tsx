import { renderContentFeedback, reportContentError, contentFeedback, type ContentFeedback } from '@admin/shared/contentFeedback'
import { useI18n, formatNumber } from '@admin/i18n'
import { useState, type KeyboardEvent, type MouseEvent } from 'react'
import { Button } from '@ui/components/Button'
import { EmptyState } from '@ui/components/EmptyState'
import { Skeleton } from '@ui/components/Skeleton'
import { cn } from '@ui/cn'
import { BookOpenSolidIcon } from 'pixel-art-icons/icons/book-open-solid'
import { BookPlusSolidIcon } from 'pixel-art-icons/icons/book-plus-solid'
import { CopySolidIcon } from 'pixel-art-icons/icons/copy-solid'
import { Copy2SolidIcon } from 'pixel-art-icons/icons/copy-2-solid'
import { ExternalLinkSolidIcon } from 'pixel-art-icons/icons/external-link-solid'
import { FilePlusSolidIcon } from 'pixel-art-icons/icons/file-plus-solid'
import { FileTextSolidIcon } from 'pixel-art-icons/icons/file-text-solid'
import { MoveIcon } from 'pixel-art-icons/icons/move'
import { Settings2SolidIcon } from 'pixel-art-icons/icons/settings-2-solid'
import { UploadIcon } from 'pixel-art-icons/icons/upload'
import { readTitleCell } from '@core/data/cells'
import type { CmsMediaAsset } from '@core/persistence'
import type { DataTable, DataRow, UpdateDataTableInput } from '@core/data/schemas'
import { ExplorerItemContextMenu, type ExplorerContextMenuItem } from '@site/explorer-actions'
import { pickVariantUrl } from '@admin/pages/media/utils/variants'
import explorerStyles from '../../../site/panels/SiteExplorerPanel/SiteExplorerPanel.module.css'
import { Panel } from '@admin/shared/Panel'
import { ContentCollectionSettingsDialog } from '@content/components/ContentCollectionSettingsDialog/ContentCollectionSettingsDialog'
import {
  ContentItemRenameDialog,
  type ContentItemRenamePayload,
} from '@content/components/ContentItemRenameDialog/ContentItemRenameDialog'
import styles from '../../ContentPage.module.css'
import { StepUpCancelledMessage } from '@admin/shared/StepUp'
import { publicContentPath } from '@content/utils/contentEntryUtils'

type ContentExplorerContextTarget =
  | { kind: 'collection'; collection: DataTable }
  | { kind: 'entry'; entry: DataRow }

interface ContextMenuState {
  x: number
  y: number
  target: ContentExplorerContextTarget
}

interface ContentExplorerPanelProps {
  loading: boolean
  error: ContentFeedback | null
  collections: DataTable[]
  entries: DataRow[]
  selectedCollection: DataTable | null
  selectedCollectionId: string | null
  selectedEntryId: string | null
  canCreateCollection: boolean
  canCreateEntry: boolean
  canManageCollections: boolean
  canEditEntry: (entry: DataRow) => boolean
  canMoveEntry: (entry: DataRow) => boolean
  canPublishEntry: (entry: DataRow) => boolean
  /**
   * Resolves the entry's `featuredMedia` cell to a loaded media asset, when
   * one is available. Returns `null` while the asset list hasn't loaded yet,
   * when the cell is empty, or when the referenced asset can't be found —
   * the row falls back to the default file icon in any of those cases.
   */
  getFeaturedMediaAssetForEntry: (entry: DataRow) => CmsMediaAsset | null
  onSelectCollection: (tableId: string) => void
  onSelectEntry: (entry: DataRow) => void
  /**
   * The collection + entry mutation surface, grouped into one object instead
   * of a dozen props-drilled `onXxx` callbacks (mirrors how `useMediaWorkspace`
   * exposes its flat mutation surface). Selection and close stay as their own
   * props because they're navigation, not mutations.
   */
  entryActions: ContentEntryActions
  onClose: () => void
}

interface ContentEntryActions {
  createCollection: () => void
  updateCollection: (collection: DataTable, input: UpdateDataTableInput) => void | Promise<void>
  deleteCollection: (collection: DataTable) => void | Promise<void>
  createEntry: () => void
  renameEntry: (entry: DataRow, input: ContentItemRenamePayload) => void | Promise<void>
  publishEntry: (entry: DataRow) => void | Promise<void>
  convertEntryToDraft: (entry: DataRow) => void | Promise<void>
  deleteEntry: (entry: DataRow) => void | Promise<void>
  duplicateEntry: (entry: DataRow) => void | Promise<void>
  moveEntryToCollection: (entry: DataRow, tableId: string) => void | Promise<void>
}

async function runContentMenuAction(action: () => void | Promise<void>, fallback: ContentFeedback): Promise<void> {
  try {
    await action()
  } catch (error) {
    if (error instanceof Error && error.message === StepUpCancelledMessage) return
    reportContentError(error, fallback)
  }
}

function keyboardMenuPosition(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  return {
    x: rect.left + Math.min(rect.width - 8, 24),
    y: rect.top + Math.min(rect.height - 8, 24),
  }
}

function entryAuthorLabel(entry: DataRow): string {
  if (entry.author?.displayName) return entry.author.displayName
  if (entry.author?.email) return entry.author.email
  return ''
}

export function ContentExplorerPanel({
  loading,
  error,
  collections,
  entries,
  selectedCollection,
  selectedCollectionId,
  selectedEntryId,
  canCreateCollection,
  canCreateEntry,
  canManageCollections,
  canEditEntry,
  canMoveEntry,
  canPublishEntry,
  getFeaturedMediaAssetForEntry,
  onSelectCollection,
  onSelectEntry,
  entryActions,
  onClose,
}: ContentExplorerPanelProps) {
  const { t, locale } = useI18n()
  const {
    createCollection,
    updateCollection,
    deleteCollection,
    createEntry,
    renameEntry,
    publishEntry,
    convertEntryToDraft,
    deleteEntry,
    duplicateEntry,
    moveEntryToCollection,
  } = entryActions
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [renameTarget, setRenameTarget] = useState<ContentExplorerContextTarget | null>(null)
  const [settingsTarget, setSettingsTarget] = useState<DataTable | null>(null)
  const entryListLabel = selectedCollection?.pluralLabel || t('content.copy.entries')
  const singularLabel = selectedCollection?.singularLabel || t('content.copy.entry')
  const newEntryLabel = t('content.newEntry', { entity: singularLabel })

  function collectionForEntry(entry: DataRow): DataTable | null {
    return collections.find((collection) => collection.id === entry.tableId) ?? selectedCollection
  }

  function openContextMenu(target: ContentExplorerContextTarget, event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    setContextMenu({ x: event.clientX, y: event.clientY, target })
  }

  function openKeyboardContextMenu(target: ContentExplorerContextTarget, event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'ContextMenu' && !(event.key === 'F10' && event.shiftKey)) return
    event.preventDefault()
    event.stopPropagation()
    setContextMenu({ ...keyboardMenuPosition(event.currentTarget), target })
  }

  async function copyEntryUrl(entry: DataRow) {
    const collection = collectionForEntry(entry)
    if (!collection) return
    const url = `${window.location.origin}${publicContentPath(collection.routeBase, entry.slug)}`
    try {
      await navigator.clipboard.writeText(url)
    } catch (err) {
      reportContentError(err, contentFeedback('content.copyUrlFailed'))
    }
  }

  function moveSubmenuItem(target: ContentExplorerContextTarget): ExplorerContextMenuItem | null {
    if (target.kind !== 'entry') return null
    if (!canMoveEntry(target.entry)) return null
    const others = collections.filter((collection) => collection.id !== target.entry.tableId)
    if (others.length === 0) return null
    return {
      kind: 'submenu',
      label: t('content.copy.moveToCollection'),
      icon: <MoveIcon size={13} />,
      width: 220,
      items: others.map((collection) => ({
        kind: 'action' as const,
        label: collection.name,
        icon: <BookOpenSolidIcon size={13} />,
        action: () => {
          void runContentMenuAction(() => moveEntryToCollection(target.entry, collection.id), contentFeedback('content.copy.couldNotMoveEntry'))
          setContextMenu(null)
        },
      })),
    }
  }

  function extraMenuItems(target: ContentExplorerContextTarget): ExplorerContextMenuItem[] {
    if (target.kind === 'collection') {
      if (!canManageCollections) return []
      return [{
        label: t('content.copy.collectionSettings'),
        icon: <Settings2SolidIcon size={13} />,
        action: () => {
          setSettingsTarget(target.collection)
          setContextMenu(null)
        },
      }]
    }

    const items: ExplorerContextMenuItem[] = []

    if (target.entry.status !== 'published' && canPublishEntry(target.entry)) {
      items.push({
        label: t('content.copy.publish'),
        icon: <UploadIcon size={13} />,
        action: () => {
          void runContentMenuAction(() => publishEntry(target.entry), contentFeedback('content.copy.couldNotPublishEntry'))
          setContextMenu(null)
        },
      })
    } else {
      items.push({
        label: t('content.copy.openInNewTab'),
        icon: <ExternalLinkSolidIcon size={13} />,
        action: () => {
          const collection = collectionForEntry(target.entry)
          if (collection) {
            window.open(publicContentPath(collection.routeBase, target.entry.slug), '_blank', 'noopener,noreferrer')
          }
          setContextMenu(null)
        },
      })
      items.push({
        label: t('content.copy.copyUrl'),
        icon: <Copy2SolidIcon size={13} />,
        action: () => {
          void copyEntryUrl(target.entry)
          setContextMenu(null)
        },
      })
      if (canEditEntry(target.entry)) {
        items.push({
          label: t('content.copy.convertToDraft'),
          icon: <FileTextSolidIcon size={13} />,
          action: () => {
            void runContentMenuAction(() => convertEntryToDraft(target.entry), contentFeedback('content.copy.couldNotConvertEntryToDraft'))
            setContextMenu(null)
          },
        })
      }
    }

    if (canCreateEntry) {
      items.push({
        label: t('content.copy.duplicate'),
        icon: <CopySolidIcon size={13} />,
        action: () => {
          void runContentMenuAction(() => duplicateEntry(target.entry), contentFeedback('content.copy.couldNotDuplicateEntry'))
          setContextMenu(null)
        },
      })
    }

    const moveItem = moveSubmenuItem(target)
    if (moveItem) items.push(moveItem)

    return items
  }

  function renameDialogTitle(target: ContentExplorerContextTarget): string {
    if (target.kind === 'collection') return t('content.copy.renameCollection')
    const collection = collectionForEntry(target.entry)
    return t('content.renameEntry', { entity: collection?.singularLabel ?? t('content.copy.entry') })
  }

  async function handleRename(payload: ContentItemRenamePayload) {
    if (!renameTarget) return

    if (renameTarget.kind === 'collection') {
      await updateCollection(renameTarget.collection, {
        name: payload.title,
        slug: payload.slug,
      })
    } else {
      await renameEntry(renameTarget.entry, payload)
    }
    setRenameTarget(null)
  }

  async function handleDelete(target: ContentExplorerContextTarget) {
    setContextMenu(null)
    if (target.kind === 'collection') {
      await deleteCollection(target.collection)
    } else {
      await deleteEntry(target.entry)
    }
  }

  return (
    <>
      <Panel
        panelId="content-explorer"
        title={t('content.copy.content')}
        ariaLabel={t('content.copy.contentExplorer')}
        testId="content-explorer-panel"
        onClose={onClose}
      >
        {error && <p className={styles.error} role="alert">{renderContentFeedback(error, locale)}</p>}

          <section className={explorerStyles.section} aria-label={t('content.copy.collections')}>
            <div className={explorerStyles.sectionHeader}>
              <h2 className={explorerStyles.sectionTitle}>{t('content.copy.collections')}</h2>
              {/* Hide the count while loading — `0` would look like an
                  empty install. Same for the entries section below. */}
              {!loading && (
                <span className={explorerStyles.sectionCount} aria-label={t('content.count.collections', { count: collections.length, formattedCount: formatNumber(collections.length, undefined, locale) })}>{formatNumber(collections.length, undefined, locale)}</span>
              )}
              {canCreateCollection && (
                <Button
                  variant="ghost"
                  size="xs"
                  iconOnly
                  onClick={createCollection}
                  aria-label={t('content.copy.newCollection')}
                  tooltip={t('content.copy.newCollection')}
                >
                  <BookPlusSolidIcon size={13} aria-hidden="true" />
                </Button>
              )}
            </div>
            <div className={explorerStyles.rows}>
              {loading
                ? Array.from({ length: 2 }, (_, i) => (
                    // Skeleton collection row mirrors the real row 1:1:
                    // 14px icon + label text + small meta count slot.
                    <div
                      key={`skeleton-coll-${i}`}
                      className={explorerStyles.row}
                      aria-hidden="true"
                    >
                      <Skeleton width={14} height={14} radius={3} />
                      <span className={explorerStyles.rowLabel}>
                        <Skeleton width={`${56 + (i % 2) * 16}%`} height={12} />
                      </span>
                      <span className={explorerStyles.rowMeta}>
                        <Skeleton width={16} height={10} />
                      </span>
                    </div>
                  ))
                : collections.map((collection) => (
                <button
                  key={collection.id}
                  type="button"
                  className={cn(
                    explorerStyles.row,
                    collection.id === selectedCollectionId && explorerStyles.rowActive,
                  )}
                  onClick={() => onSelectCollection(collection.id)}
                  onContextMenu={(event) => openContextMenu({ kind: 'collection', collection }, event)}
                  onKeyDown={(event) => openKeyboardContextMenu({ kind: 'collection', collection }, event)}
                >
                  <BookOpenSolidIcon size={14} aria-hidden="true" />
                  <span className={explorerStyles.rowLabel}>{collection.name}</span>
                  <span className={explorerStyles.rowMeta}>
                    {collection.id === selectedCollectionId ? formatNumber(entries.length, undefined, locale) : ''}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className={explorerStyles.section} aria-label={entryListLabel}>
            <div className={explorerStyles.sectionHeader}>
              <h2 className={explorerStyles.sectionTitle}>{entryListLabel}</h2>
              {!loading && (
                <span className={explorerStyles.sectionCount} aria-label={t('content.count.entries', { count: entries.length, formattedCount: formatNumber(entries.length, undefined, locale) })}>{formatNumber(entries.length, undefined, locale)}</span>
              )}
              <Button
                variant="ghost"
                size="xs"
                iconOnly
                onClick={createEntry}
                disabled={!selectedCollectionId || !canCreateEntry}
                aria-label={newEntryLabel}
                tooltip={newEntryLabel}
              >
                <FilePlusSolidIcon size={13} aria-hidden="true" />
              </Button>
            </div>

            {loading ? (
              <ContentEntriesLoading />
            ) : entries.length === 0 ? (
              <EmptyState compact title={t('content.copy.noEntriesYet')} />
            ) : (
              <div className={explorerStyles.rows}>
                {entries.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className={cn(
                      explorerStyles.row,
                      styles.entryRow,
                      entry.id === selectedEntryId && explorerStyles.rowActive,
                    )}
                    onClick={() => onSelectEntry(entry)}
                    onContextMenu={(event) => openContextMenu({ kind: 'entry', entry }, event)}
                    onKeyDown={(event) => openKeyboardContextMenu({ kind: 'entry', entry }, event)}
                  >
                    <EntryRowPreview asset={getFeaturedMediaAssetForEntry(entry)} />
                    <span className={styles.entryTitleStack}>
                      <span className={styles.entryTitle}>{readTitleCell(entry.cells) || t('content.placeholder.untitled')}</span>
                      <span className={styles.entryAuthor} aria-hidden="true">{entryAuthorLabel(entry) || t('content.copy.unknownAuthor')}</span>
                    </span>
                    <span className={explorerStyles.rowMeta}>{t(`metadata.status.content.${entry.status}`)}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
      </Panel>

      {contextMenu && (
        <ExplorerItemContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          ariaLabel={t('content.copy.contentItemOptions')}
          renameLabel={t('content.rename')}
          deleteLabel={t('content.copy.delete')}
          renameDisabled={contextMenu.target.kind === 'collection'
            ? !canManageCollections
            : !canEditEntry(contextMenu.target.entry)}
          deleteDisabled={contextMenu.target.kind === 'collection'
            ? contextMenu.target.collection.id === 'posts' || !canManageCollections
            : !canEditEntry(contextMenu.target.entry)}
          extraItems={extraMenuItems(contextMenu.target)}
          onClose={() => setContextMenu(null)}
          onRename={() => {
            setRenameTarget(contextMenu.target)
            setContextMenu(null)
          }}
          onDelete={() => { void runContentMenuAction(() => handleDelete(contextMenu.target), contentFeedback(contextMenu.target.kind === 'collection' ? 'content.copy.couldNotDeleteCollection' : 'content.copy.couldNotDeleteEntry')) }}
        />
      )}

      {renameTarget && (
        <ContentItemRenameDialog
          title={renameDialogTitle(renameTarget)}
          titleLabel={renameTarget.kind === 'collection' ? t('content.copy.name') : t('content.copy.title')}
          initialTitle={renameTarget.kind === 'collection' ? renameTarget.collection.name : readTitleCell(renameTarget.entry.cells)}
          initialSlug={renameTarget.kind === 'collection' ? renameTarget.collection.slug : renameTarget.entry.slug}
          onCancel={() => setRenameTarget(null)}
          onRename={handleRename}
        />
      )}

      {settingsTarget && (
        <ContentCollectionSettingsDialog
          collection={settingsTarget}
          onCancel={() => setSettingsTarget(null)}
          onSave={async (input) => {
            await updateCollection(settingsTarget, input)
            setSettingsTarget(null)
          }}
        />
      )}
    </>
  )
}

// Target CSS width for the row preview slot. Matches the column width used
// by `.entryRow` in ContentPage.module.css and drives `pickVariantUrl` so
// the browser fetches a tile-sized variant instead of the full-size original.
const ENTRY_PREVIEW_CSS_WIDTH = 28

function EntryRowPreview({ asset }: { asset: CmsMediaAsset | null }) {
  // Restricted to images — the user-facing request is specifically "if the
  // post has a featured image, display it as the thumbnail instead of the
  // icon". Non-image featured media (video, document, …) keeps the existing
  // file icon so the row layout stays predictable.
  const isImage = asset?.mimeType.startsWith('image/') ?? false
  const previewUrl = isImage ? pickVariantUrl(asset!, ENTRY_PREVIEW_CSS_WIDTH) : null
  return (
    <span className={styles.entryRowPreview} aria-hidden="true">
      {previewUrl ? (
        <img
          className={styles.entryRowImage}
          src={previewUrl}
          alt=""
          loading="lazy"
          decoding="async"
        />
      ) : (
        <FileTextSolidIcon size={14} />
      )}
    </span>
  )
}

function ContentEntriesLoading() {
  const { t } = useI18n()
  // Skeleton entry row mirrors the real `.entryRow` chrome 1:1:
  //   - 28 × 28 thumbnail preview slot
  //   - title + author stack (two lines)
  //   - status meta on the right
  // The wrapper is the same `.row` + `.entryRow` button skeleton so
  // padding / hover ring / border-radius match the loaded state and
  // there's no visual shift when entries swap in.
  return (
    <div
      className={explorerStyles.rows}
      data-testid="content-entries-loading"
      aria-busy="true"
      aria-label={t('content.copy.loadingEntries')}
    >
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={`skeleton-entry-${i}`}
          className={cn(explorerStyles.row, styles.entryRow)}
          aria-hidden="true"
        >
          <Skeleton width={28} height={28} radius={4} />
          <span className={styles.entryTitleStack}>
            <Skeleton width={`${60 + (i % 3) * 12}%`} height={12} />
            <Skeleton width={`${40 + (i % 2) * 14}%`} height={10} />
          </span>
          <span className={explorerStyles.rowMeta}>
            <Skeleton width={48} height={10} radius={999} />
          </span>
        </div>
      ))}
    </div>
  )
}
