import { pushToast } from '@ui/components/Toast'
import { getErrorMessage } from '@core/utils/errorMessage'
import { formatNumber, translate, type MessageKey, type MessageValues, type SupportedLocale } from '@admin/i18n'

/** Keep host feedback translatable while preserving raw server/diagnostic messages. */
export type AccountUsersFeedback = string | { key: MessageKey; values?: MessageValues }

export function feedback(key: MessageKey, values?: MessageValues): AccountUsersFeedback {
  return { key, values }
}

export function feedbackError(error: unknown, key: MessageKey): AccountUsersFeedback {
  return error instanceof Error && error.message.trim() ? error.message : feedback(key)
}

export function renderFeedback(value: AccountUsersFeedback, locale: SupportedLocale, t: typeof translate): string {
  if (typeof value === 'string') return value
  const count = value.values?.count
  return t(value.key, {
    ...value.values,
    ...(typeof count === 'number' ? { formattedCount: formatNumber(count, undefined, locale) } : {}),
  })
}

export function reportFeedbackError(error: unknown, key: MessageKey): void {
  console.error('[account-users] Operation failed:', error)
  const title = translate(key)
  pushToast({ kind: 'error', title, body: getErrorMessage(error, title) })
}
