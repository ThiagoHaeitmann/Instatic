import { useI18n } from '@admin/i18n'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Button } from '@ui/components/Button'
import { Dialog } from '@ui/components/Dialog'
import { Input } from '@ui/components/Input'
import dialogStyles from '../../../../shared/dialogs/SiteCreateDialog/SiteCreateDialog.module.css'
import { slugFromTitle } from '@core/utils/slug'
import { contentFeedback, reportContentError } from '@admin/shared/contentFeedback'

export interface ContentItemRenamePayload {
  title: string
  slug: string
}

interface ContentItemRenameDialogProps {
  title: string
  titleLabel: string
  initialTitle: string
  initialSlug: string
  onCancel: () => void
  onRename: (payload: ContentItemRenamePayload) => void | Promise<void>
}


const FORM_ID = 'content-item-rename-form'

export function ContentItemRenameDialog({
  title,
  titleLabel,
  initialTitle,
  initialSlug,
  onCancel,
  onRename,
}: ContentItemRenameDialogProps) {
  const { t } = useI18n()
  const [value, setValue] = useState(initialTitle)
  const [slug, setSlug] = useState(initialSlug)
  const inputRef = useRef<HTMLInputElement>(null)
  const titleInputId = useId()
  const slugInputId = useId()
  const trimmedValue = value.trim()
  const normalizedSlug = slugFromTitle(slug || trimmedValue)

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.select())
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!trimmedValue) return

    try {
      await onRename({ title: trimmedValue, slug: normalizedSlug })
    } catch (err) {
      reportContentError(err, contentFeedback('content.copy.unableToRenameItem'))
    }
  }

  return (
    <Dialog
      open
      onClose={onCancel}
      title={title}
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
            disabled={!trimmedValue}
          >
            {t('content.copy.save')}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} className={dialogStyles.form} onSubmit={handleSubmit}>
        <div className={dialogStyles.field}>
          <label htmlFor={titleInputId} className={dialogStyles.label}>{titleLabel}</label>
          <Input
            id={titleInputId}
            ref={inputRef}
            fieldSize="sm"
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
            }}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className={dialogStyles.field}>
          <label htmlFor={slugInputId} className={dialogStyles.label}>{t('content.copy.slug')}</label>
          <Input
            id={slugInputId}
            fieldSize="sm"
            value={slug}
            onChange={(event) => {
              setSlug(slugFromTitle(event.target.value))
            }}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

      </form>
    </Dialog>
  )
}
