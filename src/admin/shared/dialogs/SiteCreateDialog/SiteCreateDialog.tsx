import { localizedPageSlugError } from './siteItemNames'
import { translate, useI18n } from '@admin/i18n'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import type { Page } from '@core/page-tree'
import {
  createUniquePageSlug,
  normalizePageSlug,
} from '@core/page-tree'
import { Button } from '@ui/components/Button'
import { Dialog } from '@ui/components/Dialog'
import { Input } from '@ui/components/Input'
import type { SiteCreateKind } from './siteItemNames'
import styles from './SiteCreateDialog.module.css'

export type { SiteCreateKind } from './siteItemNames'

export interface SiteCreatePayload {
  name: string
  slug?: string
}

interface SiteCreateDialogProps {
  kind: SiteCreateKind
  pages?: Page[]
  onCancel: () => void
  onCreate: (payload: SiteCreatePayload) => void
}

const COPY: Record<SiteCreateKind, { title: string; placeholder: string }> = {
  page: { get title() { return translate('shell.copy.newPage') }, get placeholder() { return translate('shell.copy.about') } },
  component: { get title() { return translate('shell.copy.newComponent') }, get placeholder() { return translate('shell.copy.heroCard') } },
  style: { get title() { return translate('shell.copy.newStylesheet') }, placeholder: 'theme' },
  script: { get title() { return translate('shell.copy.newScript') }, placeholder: 'analytics' },
}

const FORM_ID = 'site-create-form'

export function SiteCreateDialog({
  kind,
  pages = [],
  onCancel,
  onCreate,
}: SiteCreateDialogProps) {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const nameInputId = useId()
  const slugInputId = useId()
  const copy = COPY[kind]
  const trimmedName = name.trim()
  const isPage = kind === 'page'
  const generatedSlug = isPage && trimmedName ? createUniquePageSlug(trimmedName, pages) : ''
  const pageSlug = slugTouched ? slug : generatedSlug
  const slugError = isPage && trimmedName
    ? localizedPageSlugError(pageSlug, pages)
    : null

  // Focus the name field on mount. Dialog's first-focusable would otherwise
  // pick the close (X) button in the header.
  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!trimmedName) return
    if (slugError) return
    onCreate(isPage ? { name: trimmedName, slug: pageSlug } : { name: trimmedName })
  }

  return (
    <Dialog
      open
      onClose={onCancel}
      title={copy.title}
      size="sm"
      initialFocusRef={inputRef}
      footer={
        <>
          <Button variant="secondary" size="sm" type="button" onClick={onCancel}>
            {t('shell.copy.cancel')}
          </Button>
          {/* `form` attribute associates this submit button with the form
              that lives in the dialog body. Standard HTML — works across the
              portal boundary, no extra plumbing needed. */}
          <Button
            variant="primary"
            size="sm"
            type="submit"
            form={FORM_ID}
            disabled={!trimmedName || Boolean(slugError)}
          >
            {t('shell.copy.create')}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor={nameInputId} className={styles.label}>{t('shell.copy.name')}</label>
          <Input
            id={nameInputId}
            ref={inputRef}
            fieldSize="sm"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={copy.placeholder}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {isPage && (
          <div className={styles.field}>
            <label htmlFor={slugInputId} className={styles.label}>{t('shell.copy.slug')}</label>
            <Input
              id={slugInputId}
              fieldSize="sm"
              value={pageSlug}
              onChange={(event) => {
                setSlugTouched(true)
                setSlug(normalizePageSlug(event.target.value))
              }}
              placeholder="about"
              autoComplete="off"
              spellCheck={false}
              invalid={Boolean(slugError)}
              aria-describedby={slugError ? 'site-create-slug-error' : undefined}
            />
            {slugError && (
              <p id="site-create-slug-error" role="alert" className={styles.errorText}>
                {slugError}
              </p>
            )}
          </div>
        )}
      </form>
    </Dialog>
  )
}
