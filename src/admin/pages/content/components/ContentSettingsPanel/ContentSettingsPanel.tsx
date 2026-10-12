import { renderContentFeedback, type ContentFeedback } from '@admin/shared/contentFeedback'
import { useI18n } from '@admin/i18n'
import { Suspense, lazy } from 'react'
import { Input, Textarea } from '@ui/components/Input'
import { Select } from '@ui/components/Select'
import { SkeletonBlock } from '@ui/components/Skeleton'
import { cn } from '@ui/cn'
import { Settings2SolidIcon } from 'pixel-art-icons/icons/settings-2-solid'
import type { CmsMediaAsset } from '@core/persistence'
import { MediaPickerField } from '@admin/pages/media/components/MediaPickerField'
import { useWorkspaceLayout } from '@admin/state/workspaceLayout'
import { dataTableHasField } from '@core/data/fields'
import {
  POST_TYPE_FIELD_FEATURED_MEDIA,
  POST_TYPE_FIELD_SEO_TITLE,
  type DataField,
  type DataRowCells,
  type DataTable,
  type DataRow,
  type DataRowStatus,
  type DataUserReference,
} from '@core/data/schemas'
import propertiesStyles from '../../../site/panels/PropertiesPanel/PropertiesPanel.module.css'
import { PanelHeader } from '@admin/shared/PanelHeader'
import { useBranchPublishGate } from '@admin/state/branchStore'
import styles from '../../ContentPage.module.css'

// Lazy-load the generic custom-field editors: they pull in the Data
// workspace's cell-editor graph (media picker workspace, relation picker),
// which is too heavy for the Content page's initial chunk budget. Only
// collections that actually have custom fields pay for it.
const ContentCustomFields = lazy(() =>
  import('./ContentCustomFields').then((m) => ({ default: m.ContentCustomFields })),
)

interface ContentSettingsPanelProps {
  selectedEntry: DataRow | null
  authors: DataUserReference[]
  authorsLoading: boolean
  collections: DataTable[]
  /** Every data table (all kinds) — relation custom fields can target any of them. */
  tables: DataTable[]
  selectedCollection: DataTable | null
  loading: boolean
  slug: string
  slugId: string
  seoTitle: string
  seoTitleId: string
  seoDescription: string
  seoDescriptionId: string
  publicPath: string
  mediaError: ContentFeedback | null
  featuredMediaId: string | null
  featuredMediaAsset: CmsMediaAsset | null
  /** Draft values of the collection's custom (non-built-in) fields, keyed by field id. */
  customCells: DataRowCells
  canEditEntry: boolean
  canMoveEntry: boolean
  canPublishEntry: boolean
  canChangeAuthor: boolean
  onCollectionChange: (tableId: string) => void
  onAuthorChange: (authorUserId: string) => void
  onSlugChange: (value: string) => void
  onSeoTitleChange: (value: string) => void
  onSeoDescriptionChange: (value: string) => void
  onCustomCellChange: (fieldId: string, value: unknown) => void
  onStatusChange: (status: DataRowStatus) => void
  onChooseFeaturedMedia: () => void
  onClearFeaturedMedia: () => void
  /**
   * Open the MediaViewerWindow on the currently-picked featured media asset.
   * Hidden when `featuredMediaAsset` is null (nothing to edit yet).
   */
  onEditFeaturedMedia: () => void
}

function contentAuthor(entry: DataRow): DataUserReference | null {
  return entry.author ?? entry.createdBy ?? entry.updatedBy ?? null
}

function contentAuthorLabel(entry: DataRow): string {
  const user = contentAuthor(entry)
  if (user?.displayName) return user.displayName
  if (user?.email) return user.email
  return ''
}

function contentAuthorRoleLabel(entry: DataRow): string | null {
  const author = contentAuthor(entry)
  return author?.roleName ?? author?.roleSlug ?? null
}

function authorOptionLabel(author: DataUserReference): string {
  return author.displayName || author.email || ''
}

/**
 * Custom fields the settings panel can edit: everything the user added to
 * the collection. `pageTree` / `fieldSchema` cells hold whole documents
 * (a node tree / a field array), not values — they have dedicated editors
 * and never belong to a generic input.
 */
function isEditableCustomField(field: DataField): boolean {
  return field.builtIn !== true && field.type !== 'pageTree' && field.type !== 'fieldSchema'
}

export function ContentSettingsPanel({
  selectedEntry,
  authors,
  authorsLoading,
  collections,
  tables,
  selectedCollection,
  loading,
  slug,
  slugId,
  seoTitle,
  seoTitleId,
  seoDescription,
  seoDescriptionId,
  publicPath,
  mediaError,
  featuredMediaId,
  featuredMediaAsset,
  customCells,
  canEditEntry,
  canMoveEntry,
  canPublishEntry,
  canChangeAuthor,
  onCollectionChange,
  onAuthorChange,
  onSlugChange,
  onSeoTitleChange,
  onSeoDescriptionChange,
  onCustomCellChange,
  onStatusChange,
  onChooseFeaturedMedia,
  onClearFeaturedMedia,
  onEditFeaturedMedia,
}: ContentSettingsPanelProps) {
  const { t, locale } = useI18n()
  const setRightPanel = useWorkspaceLayout((s) => s.setRightPanel)
  const seoEnabled = selectedCollection ? dataTableHasField(selectedCollection, POST_TYPE_FIELD_SEO_TITLE) : false
  const featuredMediaEnabled = selectedCollection ? dataTableHasField(selectedCollection, POST_TYPE_FIELD_FEATURED_MEDIA) : false
  const customFields = selectedCollection?.fields.filter(isEditableCustomField) ?? []
  const authorRoleLabel = selectedEntry ? contentAuthorRoleLabel(selectedEntry) : null
  const selectedAuthor = selectedEntry ? contentAuthor(selectedEntry) : null
  const authorOptions = selectedAuthor && !authors.some((author) => author.id === selectedAuthor.id)
    ? [selectedAuthor, ...authors]
    : authors
  const canEditSelectedEntry = Boolean(selectedEntry && canEditEntry)
  const canMoveSelectedEntry = Boolean(selectedEntry && canMoveEntry)
  const canChangeStatus = Boolean(selectedEntry && (canEditEntry || canPublishEntry))
  // Publishing only exists on main — the option stays listed but disabled,
  // and the reason renders under the control while a branch is active.
  const branchGate = useBranchPublishGate()
  const canPublishHere = canPublishEntry && !branchGate.onBranch
  const statusOptions = [
    { value: 'draft', label: t('metadata.status.content.draft'), enabled: canEditEntry },
    { value: 'scheduled', label: t('metadata.status.content.scheduled'), enabled: false },
    { value: 'published', label: t('metadata.status.content.published'), enabled: canPublishHere },
    { value: 'unpublished', label: t('metadata.status.content.unpublished'), enabled: canEditEntry },
  ].filter((option) => option.enabled || option.value === selectedEntry?.status)
    .map(({ value, label, enabled }) => ({ value, label, disabled: !enabled }))

  return (
    <aside
      data-panel=""
      data-testid="content-settings-panel"
      role="complementary"
      aria-label={t('content.copy.contentSettings')}
      className={cn(propertiesStyles.panel, propertiesStyles.panelDocked)}
    >
      <PanelHeader
        panelId="content-settings"
        title={t('content.copy.settings')}
        titleContent={(
          <span className={propertiesStyles.headerNodeTitle}>
            <Settings2SolidIcon size={13} aria-hidden="true" />
            <span className={propertiesStyles.headerNodeLabel}>{t('content.copy.settings')}</span>
          </span>
        )}
        onClose={() => setRightPanel({ collapsed: true })}
      />

      <div className={styles.settingsBody}>
        {loading ? (
          <ContentSettingsLoading />
        ) : (
          <>
            <div className={styles.field}>
              <span>{t('content.copy.collection')}</span>
              <Select
                aria-label={t('content.copy.collection')}
                value={selectedEntry?.tableId ?? selectedCollection?.id ?? ''}
                disabled={!canMoveSelectedEntry}
                onChange={(event) => onCollectionChange(event.target.value)}
                options={collections.map((collection) => ({
                  value: collection.id,
                  label: collection.pluralLabel || collection.name,
                }))}
              />
            </div>
            <label className={styles.field} htmlFor={slugId}>
              <span>{t('content.copy.slug')}</span>
              <Input
                id={slugId}
                value={slug}
                onChange={(event) => onSlugChange(event.target.value)}
                disabled={!canEditSelectedEntry}
              />
            </label>
            {seoEnabled && (
              <>
                <label className={styles.field} htmlFor={seoTitleId}>
                  <span>{t('content.copy.seoTitle')}</span>
                  <Input
                    id={seoTitleId}
                    value={seoTitle}
                    onChange={(event) => onSeoTitleChange(event.target.value)}
                    disabled={!canEditSelectedEntry}
                  />
                </label>
                <label className={styles.field} htmlFor={seoDescriptionId}>
                  <span>{t('content.copy.seoDescription')}</span>
                  <Textarea
                    id={seoDescriptionId}
                    value={seoDescription}
                    onChange={(event) => onSeoDescriptionChange(event.target.value)}
                    disabled={!canEditSelectedEntry}
                    resize="none"
                    rows={4}
                  />
                </label>
              </>
            )}
            <div className={styles.field}>
              <span>{t('content.copy.status')}</span>
              <Select
                aria-label={t('content.copy.status')}
                value={selectedEntry?.status ?? 'draft'}
                disabled={!canChangeStatus}
                onChange={(event) => {
                  const nextStatus = event.target.value as DataRowStatus
                  if (nextStatus === 'published' && !canPublishHere) return
                  if (nextStatus !== 'published' && !canEditEntry) return
                  onStatusChange(nextStatus)
                }}
                options={statusOptions}
              />
              {branchGate.onBranch && (
                <p className={styles.fieldHint} role="note">{t('content.branchReason')}</p>
              )}
            </div>
            <div className={styles.metaBlock}>
              <span>{t('content.copy.publicUrl')}</span>
              <strong>{publicPath || t('content.copy.notAvailable')}</strong>
            </div>
            {selectedEntry && (
              <div className={styles.authorBlock} aria-label={t('content.copy.contentAuthor')}>
                <span>{t('content.copy.author')}</span>
                <div className={styles.authorRow}>
                  {canChangeAuthor && authorOptions.length > 0 ? (
                    <Select
                      aria-label={t('content.copy.author')}
                      value={selectedEntry.authorUserId ?? selectedAuthor?.id ?? ''}
                      disabled={authorsLoading}
                      onChange={(event) => onAuthorChange(event.target.value)}
                      options={authorOptions.map((author) => ({
                        value: author.id,
                        label: authorOptionLabel(author) || t('content.copy.unknownUser'),
                      }))}
                    />
                  ) : (
                    <strong>{contentAuthorLabel(selectedEntry) || t('content.copy.unknownUser')}</strong>
                  )}
                  {authorRoleLabel && (
                    <span className={styles.authorRoleBadge}>{authorRoleLabel}</span>
                  )}
                </div>
              </div>
            )}
            {featuredMediaEnabled && (
              <div className={styles.featuredMediaField}>
                <span>{t('content.copy.featuredMedia')}</span>
                <MediaPickerField
                  asset={featuredMediaAsset}
                  hasValue={Boolean(featuredMediaId)}
                  fallbackLabel={featuredMediaId ?? undefined}
                  fallbackHint={t('content.copy.savedReference')}
                  mediaKind={featuredMediaAsset?.mimeType.startsWith('video/') ? 'video' : 'image'}
                  subjectLabel={t('content.copy.featuredMediaLabel')}
                  changeLabel={t('content.changeFeaturedMedia')}
                  chooseLabel={t('content.copy.chooseFeaturedMedia')}
                  disabled={!canEditSelectedEntry}
                  onBrowse={onChooseFeaturedMedia}
                  onEdit={featuredMediaAsset ? onEditFeaturedMedia : undefined}
                  onClear={featuredMediaId ? onClearFeaturedMedia : undefined}
                />
                {mediaError && <p className={styles.error} role="alert">{renderContentFeedback(mediaError, locale)}</p>}
              </div>
            )}
            {selectedEntry && customFields.length > 0 && (
              <Suspense fallback={null}>
                <ContentCustomFields
                  fields={customFields}
                  entryId={selectedEntry.id}
                  tables={tables}
                  customCells={customCells}
                  readOnly={!canEditSelectedEntry}
                  onCustomCellChange={onCustomCellChange}
                />
              </Suspense>
            )}
          </>
        )}
      </div>
    </aside>
  )
}

function ContentSettingsLoading() {
  const { t } = useI18n()
  // Universal three-bar block — same visual as every other settings /
  // dialog / panel loading region in the editor. The bespoke
  // `settingsSkeleton*` shapes that used to render label / input /
  // textarea silhouettes have been retired in favour of
  // `<SkeletonBlock>`.
  return (
    <div
      className={styles.settingsSkeleton}
      data-testid="content-settings-loading"
      aria-busy="true"
      aria-label={t('content.copy.loadingContentSettings')}
    >
      <SkeletonBlock minHeight={200} />
    </div>
  )
}
