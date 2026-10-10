import { localizedPageSlugError } from '../SiteCreateDialog'
import { useI18n } from '@admin/i18n'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import type { Page } from '@core/page-tree'
import {
  isHomePage,
  normalizePageSlug,
} from '@core/page-tree'
import { Button } from '@ui/components/Button'
import { Dialog } from '@ui/components/Dialog'
import { Input } from '@ui/components/Input'
import dialogStyles from '../SiteCreateDialog/SiteCreateDialog.module.css'

export interface PageSettingsPayload {
  title: string
  slug: string
}

interface PageSettingsDialogProps {
  page: Page
  pages: Page[]
  onCancel: () => void
  onSave: (payload: PageSettingsPayload) => void
}

const FORM_ID = 'page-settings-form'

/**
 * Title + slug editor for a regular page. The site explorer's inline rename
 * only ever changes the title (`renamePage(id, title)` with no third arg
 * leaves the slug untouched) — this dialog is the one place a page's slug
 * can actually be changed after creation.
 */
export function PageSettingsDialog({
  page,
  pages,
  onCancel,
  onSave,
}: PageSettingsDialogProps) {
  const { t } = useI18n()
  const [title, setTitle] = useState(page.title)
  const [slug, setSlug] = useState(page.slug)
  const isHome = isHomePage(page)
  const inputRef = useRef<HTMLInputElement>(null)
  const titleInputId = useId()
  const slugInputId = useId()

  const trimmedTitle = title.trim()
  const normalizedSlug = normalizePageSlug(slug)
  const slugValidation = isHome
    ? null
    : localizedPageSlugError(normalizedSlug, pages, page.id)

  const saveDisabled = !trimmedTitle || Boolean(slugValidation)

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.select())
  }, [])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (saveDisabled) return
    onSave({ title: trimmedTitle, slug: isHome ? page.slug : normalizedSlug })
  }

  return (
    <Dialog
      open
      onClose={onCancel}
      title={t('shell.copy.pageSettings')}
      size="sm"
      initialFocusRef={inputRef}
      footer={
        <>
          <Button variant="secondary" size="sm" type="button" onClick={onCancel}>
            {t('shell.copy.cancel')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            form={FORM_ID}
            disabled={saveDisabled}
          >
            {t('shell.copy.save')}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} className={dialogStyles.form} onSubmit={handleSubmit}>
        <div className={dialogStyles.field}>
          <label htmlFor={titleInputId} className={dialogStyles.label}>{t('shell.copy.title')}</label>
          <Input
            id={titleInputId}
            ref={inputRef}
            fieldSize="sm"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className={dialogStyles.field}>
          <label htmlFor={slugInputId} className={dialogStyles.label}>{t('shell.copy.slug')}</label>
          <Input
            id={slugInputId}
            fieldSize="sm"
            value={isHome ? page.slug : slug}
            onChange={(event) => setSlug(normalizePageSlug(event.target.value))}
            autoComplete="off"
            spellCheck={false}
            disabled={isHome}
            invalid={Boolean(slugValidation)}
          />
          {isHome ? (
            <p className={dialogStyles.label}>{t('shell.copy.theHomepageIsAlwaysServedAt')}</p>
          ) : slugValidation ? (
            <p role="alert" className={dialogStyles.errorText}>{slugValidation}</p>
          ) : null}
        </div>
      </form>
    </Dialog>
  )
}
