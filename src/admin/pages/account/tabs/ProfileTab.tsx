import { feedback, reportFeedbackError, renderFeedback, type AccountUsersFeedback } from '@admin/shared/accountUsersFeedback'
import { formatBytes, useI18n } from '@admin/i18n'
/**
 * Account → Profile tab.
 *
 * Shows the current user's identity (avatar + display name + email + role)
 * and lets them edit profile basics or upload/remove a profile picture.
 * Without an upload, the avatar falls back to the deterministic Gravatar
 * identicon derived from the user's email, so every user has a recognisable
 * picture out of the box.
 */
import { useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Button } from '@ui/components/Button'
import { Input } from '@ui/components/Input'
import {
  deleteCurrentUserAvatar,
  updateCurrentUserProfile,
  uploadCurrentUserAvatar,
  type CmsCurrentUser,
} from '@core/persistence'
import { isValidEmail } from '@core/utils/email'
import { useAdminSessionSetter } from '@admin/sessionContext'
import { useStepUp } from '@admin/shared/StepUp'
import { UserAvatar } from '@admin/shared/UserAvatar'
import styles from '../AccountPage.module.css'
import { isStepUpCancelled } from './securityErrors'

interface ProfileTabProps {
  user: CmsCurrentUser
}

type ProfileBusy = null | 'profile' | 'upload' | 'remove'
type ProfileStatus = { tone: 'info' | 'error'; message: AccountUsersFeedback } | null
type ProfileForm = { displayName: string; email: string }

async function uploadAvatarHelper(
  file: File,
  setBusy: (v: ProfileBusy) => void,
  setSessionUser: (user: CmsCurrentUser) => void,
  setStatus: (v: ProfileStatus) => void,
): Promise<void> {
  try {
    const updated = await uploadCurrentUserAvatar(file)
    setSessionUser(updated)
    setStatus({ tone: 'info', message: feedback('accountUsers.copy.profilePictureUpdated') })
  } catch (err) {
    console.error('[profile-tab] avatar upload failed:', err)
    reportFeedbackError(err, 'accountUsers.copy.couldNotUploadAvatar')
  } finally {
    setBusy(null)
  }
}

async function removeAvatarHelper(
  setBusy: (v: ProfileBusy) => void,
  setSessionUser: (user: CmsCurrentUser) => void,
  setStatus: (v: ProfileStatus) => void,
): Promise<void> {
  try {
    const updated = await deleteCurrentUserAvatar()
    setSessionUser(updated)
    setStatus({ tone: 'info', message: feedback('accountUsers.copy.profilePictureRemoved') })
  } catch (err) {
    console.error('[profile-tab] avatar remove failed:', err)
    reportFeedbackError(err, 'accountUsers.copy.couldNotRemoveAvatar')
  } finally {
    setBusy(null)
  }
}

export function ProfileTab({ user }: ProfileTabProps) {
  const { t, locale } = useI18n()
  const setSessionUser = useAdminSessionSetter()
  const { runStepUp } = useStepUp()
  const [busy, setBusy] = useState<ProfileBusy>(null)
  const [status, setStatus] = useState<ProfileStatus>(null)
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    displayName: user.displayName,
    email: user.email,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const displayNameId = useId()
  const emailId = useId()

  const displayName = user.displayName.trim() || user.email
  const hasUploadedAvatar = user.avatarUrl !== null
  const profileDirty =
    profileForm.displayName.trim() !== user.displayName ||
    profileForm.email.trim() !== user.email

  function openFilePicker(): void {
    if (busy) return
    fileInputRef.current?.click()
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0]
    // Reset the value so picking the same filename twice still fires
    // `change` — needed for re-upload after an error.
    event.target.value = ''
    if (!file) return

    setBusy('upload')
    setStatus(null)
    await uploadAvatarHelper(file, setBusy, setSessionUser, setStatus)
  }

  async function handleRemove(): Promise<void> {
    if (busy) return
    setBusy('remove')
    setStatus(null)
    await removeAvatarHelper(setBusy, setSessionUser, setStatus)
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (busy) return

    const email = profileForm.email.trim()
    if (!isValidEmail(email)) {
      setStatus({ tone: 'error', message: feedback('accountUsers.copy.enterAValidEmailAddress') })
      return
    }

    setBusy('profile')
    setStatus(null)
    try {
      const updated = await runStepUp(() => updateCurrentUserProfile({
        displayName: profileForm.displayName,
        email,
      }))
      setSessionUser(updated)
      setProfileForm({
        displayName: updated.displayName,
        email: updated.email,
      })
      setStatus({ tone: 'info', message: feedback('accountUsers.copy.profileSaved') })
    } catch (err) {
      if (!isStepUpCancelled(err)) {
        console.error('[profile-tab] profile update failed:', err)
        reportFeedbackError(err, 'accountUsers.copy.couldNotSaveProfile')
      }
    }
    setBusy(null)
  }

  return (
    <section className={styles.section} aria-labelledby="account-profile-title">
      <div className={styles.sectionHeader}>
        <div>
          <h2 id="account-profile-title">{t('accountUsers.copy.profile')}</h2>
          <p>{t('accountUsers.copy.yourNameEmailAndRoleAcrossTheInstall')}</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.profileGrid}>
          <div className={styles.avatarColumn}>
            <UserAvatar user={user} size={96} alt={t('shell.avatar.for', { name: displayName })} />
            <div className={styles.avatarActions}>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={openFilePicker}
                disabled={busy !== null}
                aria-busy={busy === 'upload'}
                data-testid="profile-avatar-upload"
              >
                <span>
                  {busy === 'upload'
                    ? t('accountUsers.copy.uploading')
                    : hasUploadedAvatar
                      ? t('accountUsers.copy.changePicture')
                      : t('accountUsers.copy.uploadPicture')}
                </span>
              </Button>
              {hasUploadedAvatar && (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  tone="danger"
                  onClick={() => void handleRemove()}
                  disabled={busy !== null}
                  aria-busy={busy === 'remove'}
                  data-testid="profile-avatar-remove"
                >
                  <span>{busy === 'remove' ? t('accountUsers.copy.removing') : t('accountUsers.copy.remove')}</span>
                </Button>
              )}
            </div>
            <p className={styles.avatarHint}>{t('accountUsers.avatar.hint', { size: formatBytes(5 * 1024 * 1024, undefined, locale) })}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className={styles.hiddenFileInput}
              tabIndex={-1}
              aria-hidden="true"
              onChange={(event) => void handleFileChange(event)}
              data-testid="profile-avatar-file"
            />
          </div>
          <form className={styles.profileForm} onSubmit={(event) => void handleProfileSubmit(event)}>
            <div className={styles.profileFields}>
              <div className={styles.profileField}>
                <label className={styles.profileFieldLabel} htmlFor={displayNameId}>{t('accountUsers.copy.name')}</label>
                <Input
                  id={displayNameId}
                  value={profileForm.displayName}
                  name="current-user-display-name"
                  autoComplete="name"
                  data-testid="profile-display-name"
                  disabled={busy !== null}
                  onChange={(event) => {
                    setProfileForm({ ...profileForm, displayName: event.currentTarget.value })
                  }}
                />
              </div>
              <div className={styles.profileField}>
                <label className={styles.profileFieldLabel} htmlFor={emailId}>{t('accountUsers.copy.email')}</label>
                <Input
                  id={emailId}
                  type="email"
                  value={profileForm.email}
                  name="current-user-email-address"
                  autoComplete="email"
                  data-testid="profile-email"
                  required
                  disabled={busy !== null}
                  onChange={(event) => {
                    setProfileForm({ ...profileForm, email: event.currentTarget.value })
                  }}
                />
              </div>
              <div className={styles.profileField}>
                <span className={styles.profileFieldLabel}>{t('accountUsers.copy.role')}</span>
                <span className={styles.profileFieldValue}>{user.role.name}</span>
              </div>
            </div>
            <div className={styles.profileActions}>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={busy !== null || !profileDirty}
                aria-busy={busy === 'profile'}
                data-testid="profile-save"
              >
                <span>{busy === 'profile' ? t('accountUsers.copy.saving') : t('accountUsers.copy.saveProfile')}</span>
              </Button>
            </div>
          </form>
        </div>
        {status && (
          <p
            className={status.tone === 'error' ? styles.error : styles.cardStatus}
            role={status.tone === 'error' ? 'alert' : 'status'}
            data-testid="profile-status"
          >
            {renderFeedback(status.message, locale, t)}
          </p>
        )}
      </div>
    </section>
  )
}
