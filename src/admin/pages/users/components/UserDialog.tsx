import { renderFeedback, type AccountUsersFeedback } from '@admin/shared/accountUsersFeedback'
import { useI18n } from '@admin/i18n'
/**
 * UserDialog — create / edit / reset-password modal for CMS users.
 *
 * Driven by a single `mode` prop:
 *   - `create` → email + display name + password + role
 *   - `edit`   → email + display name + (optional) password + role + status
 *   - `reset`  → password only (used for "Reset password" row action)
 *
 * The form fields use deliberately weird `name=` attributes
 * (`new-user-email-address`, etc.) so password managers don't try to
 * autofill the admin's own credentials into the create-user form. This is
 * also why every input sets `data-lpignore` and `data-1p-ignore`.
 *
 * Submits go through the parent's `onSubmit` (which wraps the action in
 * `runStepUp` so server-side step-up auth has a chance to re-prompt).
 */
import { useId, type FormEvent } from 'react'
import { Button } from '@ui/components/Button'
import { Dialog } from '@ui/components/Dialog'
import { Input } from '@ui/components/Input'
import { Select } from '@ui/components/Select'
import { PlusIcon } from 'pixel-art-icons/icons/plus'
import { SaveSolidIcon } from 'pixel-art-icons/icons/save-solid'
import dialogStyles from '../../../shared/dialogs/SiteCreateDialog/SiteCreateDialog.module.css'
import type { CmsCurrentUser } from '@core/persistence'
import type { UserDialogMode, UserFormState } from '../types'

interface UserDialogProps {
  mode: UserDialogMode
  form: UserFormState
  roleOptions: Array<{ value: string | number; label: string; textValue: string }>
  statusOptions: Array<{ value: string; label: string; textValue: string }>
  busy: boolean
  error: AccountUsersFeedback | null
  onChange: (form: UserFormState) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

const USER_FORM_ID = 'users-page-user-form'

export function UserDialog({
  mode,
  form,
  roleOptions,
  statusOptions,
  busy,
  error,
  onChange,
  onClose,
  onSubmit,
}: UserDialogProps) {
  const { t, locale } = useI18n()
  const title = mode === 'create' ? t('accountUsers.copy.createUser') : mode === 'edit' ? t('accountUsers.copy.editUser') : t('accountUsers.copy.resetPasswordAlternate')
  const submitLabel = mode === 'create' ? t('accountUsers.copy.createUser') : mode === 'edit' ? t('accountUsers.copy.saveUser') : t('accountUsers.copy.resetPasswordAlternate')
  const emailId = useId()
  const displayNameId = useId()
  const passwordId = useId()
  const roleId = useId()
  const statusId = useId()
  return (
    <Dialog
      open
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={busy}>
            <span>{t('accountUsers.copy.cancel')}</span>
          </Button>
          <Button type="submit" form={USER_FORM_ID} variant="primary" size="sm" disabled={busy}>
            {mode === 'create' ? <PlusIcon size={14} aria-hidden="true" /> : <SaveSolidIcon size={14} aria-hidden="true" />}
            <span>{submitLabel}</span>
          </Button>
        </>
      }
    >
      <form id={USER_FORM_ID} className={dialogStyles.form} autoComplete="off" onSubmit={(event) => void onSubmit(event)}>
        {mode !== 'reset' && (
          <>
            <div className={dialogStyles.field}>
              <label htmlFor={emailId} className={dialogStyles.label}>{t('accountUsers.copy.email')}</label>
              <Input
                id={emailId}
                value={form.email}
                type="email"
                name={mode === 'create' ? 'new-user-email-address' : 'edited-user-email-address'}
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
                required
                onChange={(event) => onChange({ ...form, email: event.currentTarget.value })}
              />
            </div>
            <div className={dialogStyles.field}>
              <label htmlFor={displayNameId} className={dialogStyles.label}>{t('accountUsers.copy.displayName')}</label>
              <Input
                id={displayNameId}
                value={form.displayName}
                name={mode === 'create' ? 'new-user-display-name' : 'edited-user-display-name'}
                autoComplete="off"
                onChange={(event) => onChange({ ...form, displayName: event.currentTarget.value })}
              />
            </div>
          </>
        )}
        <div className={dialogStyles.field}>
          <label htmlFor={passwordId} className={dialogStyles.label}>{mode === 'create' ? t('accountUsers.copy.initialPassword') : t('accountUsers.copy.newPassword')}</label>
          <Input
            id={passwordId}
            value={form.password}
            type="password"
            name={mode === 'create' ? 'new-user-initial-password' : 'edited-user-new-password'}
            autoComplete="new-password"
            data-lpignore="true"
            data-1p-ignore="true"
            minLength={12}
            placeholder={mode === 'edit' ? t('accountUsers.copy.leaveBlankToKeepCurrentPassword') : undefined}
            required={mode !== 'edit'}
            onChange={(event) => onChange({ ...form, password: event.currentTarget.value })}
          />
        </div>
        {mode !== 'reset' && (
          <>
            <div className={dialogStyles.field}>
              <label htmlFor={roleId} className={dialogStyles.label}>{t('accountUsers.copy.role')}</label>
              <Select
                id={roleId}
                value={form.roleId}
                name={mode === 'create' ? 'new-user-role' : 'edited-user-role'}
                options={roleOptions}
                onChange={(event) => onChange({ ...form, roleId: event.currentTarget.value })}
              />
            </div>
            {mode === 'edit' && (
              <div className={dialogStyles.field}>
                <label htmlFor={statusId} className={dialogStyles.label}>{t('accountUsers.copy.status')}</label>
                <Select
                  id={statusId}
                  value={form.status}
                  name="edited-user-status"
                  options={statusOptions}
                  onChange={(event) => onChange({ ...form, status: event.currentTarget.value as CmsCurrentUser['status'] })}
                />
              </div>
            )}
          </>
        )}
        {error && <p role="alert" className={dialogStyles.errorText}>{renderFeedback(error, locale, t)}</p>}
      </form>
    </Dialog>
  )
}
