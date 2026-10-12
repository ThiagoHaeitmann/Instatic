import { translate, type MessageKey, type MessageValues, type SupportedLocale } from '@admin/i18n'
import { pushToast } from '@ui/components/Toast'

/** Host fallbacks remain live descriptors; server and diagnostic details remain raw. */
export type ContentFeedback = string | { key: MessageKey; values?: MessageValues }

export function contentFeedback(key: MessageKey, values?: MessageValues): ContentFeedback {
  return { key, values }
}

export function contentFeedbackError(error: unknown, fallback: ContentFeedback): ContentFeedback {
  return error instanceof Error && error.message.trim() ? error.message : fallback
}

export function renderContentFeedback(value: ContentFeedback, locale: SupportedLocale): string {
  return typeof value === 'string' ? value : translate(value.key, value.values, locale)
}

export function reportContentError(error: unknown, fallback: ContentFeedback): void {
  console.error('[content] Operation failed:', error)
  const title = typeof fallback === 'string' ? fallback : translate(fallback.key, fallback.values)
  const detail = contentFeedbackError(error, fallback)
  pushToast({ kind: 'error', title, body: typeof detail === 'string' ? detail : translate(detail.key, detail.values) })
}
