import { useI18n } from '@admin/i18n'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { buildPostTypeDefaultFields, dataTableHasField } from '@core/data/fields'
import {
  POST_TYPE_FIELD_BODY,
  POST_TYPE_FIELD_FEATURED_MEDIA,
  POST_TYPE_FIELD_SEO_TITLE,
  POST_TYPE_FIELD_SEO_DESCRIPTION,
  type DataTable,
  type UpdateDataTableInput,
} from '@core/data/schemas'
import { Button } from '@ui/components/Button'
import { Checkbox } from '@ui/components/Checkbox'
import { Dialog } from '@ui/components/Dialog'
import { Input } from '@ui/components/Input'
import dialogStyles from '../../../../shared/dialogs/SiteCreateDialog/SiteCreateDialog.module.css'
import styles from '../../ContentPage.module.css'
import { slugFromTitle } from '@core/utils/slug'
import { contentFeedback, reportContentError } from '@admin/shared/contentFeedback'
import { StepUpCancelledMessage } from '@admin/shared/StepUp'

interface ContentCollectionSettingsDialogProps {
  collection: DataTable
  onCancel: () => void
  onSave: (input: UpdateDataTableInput) => void | Promise<void>
}

function normalizeRouteBase(value: string): string {
  const slug = slugFromTitle(value)
  return `/${slug}`
}


const FORM_ID = 'content-collection-settings-form'

export function ContentCollectionSettingsDialog({
  collection,
  onCancel,
  onSave,
}: ContentCollectionSettingsDialogProps) {
  const { t } = useI18n()
  const [name, setName] = useState(collection.name)
  const [slug, setSlug] = useState(collection.slug)
  const [routeBase, setRouteBase] = useState(collection.routeBase)
  const [singularLabel, setSingularLabel] = useState(collection.singularLabel)
  const [pluralLabel, setPluralLabel] = useState(collection.pluralLabel)
  const [bodyField, setBodyField] = useState(dataTableHasField(collection, POST_TYPE_FIELD_BODY))
  const [featuredMediaField, setFeaturedMediaField] = useState(dataTableHasField(collection, POST_TYPE_FIELD_FEATURED_MEDIA))
  const [seoField, setSeoField] = useState(dataTableHasField(collection, POST_TYPE_FIELD_SEO_TITLE))
  const inputRef = useRef<HTMLInputElement>(null)
  const nameId = useId()
  const slugId = useId()
  const routeId = useId()
  const singularId = useId()
  const pluralId = useId()
  const bodyFieldId = useId()
  const featuredMediaFieldId = useId()
  const seoFieldId = useId()

  const trimmedName = name.trim()
  const trimmedSingular = singularLabel.trim()
  const trimmedPlural = pluralLabel.trim()
  const normalizedSlug = slugFromTitle(slug || trimmedName)
  const normalizedRouteBase = normalizeRouteBase(routeBase || normalizedSlug)
  const canSave = Boolean(trimmedName && trimmedSingular && trimmedPlural)

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.select())
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSave) return

    try {
      // Preserve custom (non-built-in) fields from the collection so they
      // are not silently dropped when saving built-in field toggles.
      const customFields = collection.fields.filter((f) => !f.builtIn)
      const nextFields = buildPostTypeDefaultFields().filter((field) => {
        if (field.id === POST_TYPE_FIELD_BODY) return bodyField
        if (field.id === POST_TYPE_FIELD_FEATURED_MEDIA) return featuredMediaField
        if (field.id === POST_TYPE_FIELD_SEO_TITLE || field.id === POST_TYPE_FIELD_SEO_DESCRIPTION) return seoField
        return true
      })
      await onSave({
        name: trimmedName,
        slug: normalizedSlug,
        routeBase: normalizedRouteBase,
        singularLabel: trimmedSingular,
        pluralLabel: trimmedPlural,
        fields: [...nextFields, ...customFields],
      })
    } catch (err) {
      // A step-up cancellation means the user backed out of the password
      // re-entry prompt — not a failure. Leave the dialog open, show nothing.
      if (err instanceof Error && err.message === StepUpCancelledMessage) return
      reportContentError(err, contentFeedback('content.copy.couldNotUpdateCollection'))
    }
  }

  return (
    <Dialog
      open
      onClose={onCancel}
      title={t('content.copy.collectionSettings')}
      size="sm"
      initialFocusRef={inputRef}
      footer={
        <>
          <Button variant="secondary" size="sm" type="button" onClick={onCancel}>
            {t('content.copy.cancel')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            form={FORM_ID}
            disabled={!canSave}
          >
            {t('content.copy.save')}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} className={dialogStyles.form} onSubmit={handleSubmit}>
        <div className={dialogStyles.field}>
          <label htmlFor={nameId} className={dialogStyles.label}>{t('content.copy.name')}</label>
          <Input
            id={nameId}
            ref={inputRef}
            fieldSize="sm"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
            }}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className={dialogStyles.field}>
          <label htmlFor={slugId} className={dialogStyles.label}>{t('content.copy.slug')}</label>
          <Input
            id={slugId}
            fieldSize="sm"
            value={slug}
            onChange={(event) => {
              setSlug(slugFromTitle(event.target.value))
            }}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className={dialogStyles.field}>
          <label htmlFor={routeId} className={dialogStyles.label}>{t('content.copy.urlPath')}</label>
          <Input
            id={routeId}
            fieldSize="sm"
            value={routeBase}
            onChange={(event) => {
              setRouteBase(event.target.value)
            }}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className={dialogStyles.field}>
          <label htmlFor={singularId} className={dialogStyles.label}>{t('content.copy.singularLabel')}</label>
          <Input
            id={singularId}
            fieldSize="sm"
            value={singularLabel}
            onChange={(event) => {
              setSingularLabel(event.target.value)
            }}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className={dialogStyles.field}>
          <label htmlFor={pluralId} className={dialogStyles.label}>{t('content.copy.pluralLabel')}</label>
          <Input
            id={pluralId}
            fieldSize="sm"
            value={pluralLabel}
            onChange={(event) => {
              setPluralLabel(event.target.value)
            }}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <fieldset className={styles.collectionFields}>
          <legend>{t('content.copy.fields')}</legend>
          <div>
            <Checkbox
              id={bodyFieldId}
              checked={bodyField}
              onCheckedChange={setBodyField}
            />
            <label htmlFor={bodyFieldId}>{t('content.copy.body')}</label>
          </div>
          <div>
            <Checkbox
              id={featuredMediaFieldId}
              checked={featuredMediaField}
              onCheckedChange={setFeaturedMediaField}
            />
            <label htmlFor={featuredMediaFieldId}>{t('content.copy.featuredMedia')}</label>
          </div>
          <div>
            <Checkbox
              id={seoFieldId}
              checked={seoField}
              onCheckedChange={setSeoField}
            />
            <label htmlFor={seoFieldId}>{t('content.copy.seoFields')}</label>
          </div>
        </fieldset>

      </form>
    </Dialog>
  )
}
