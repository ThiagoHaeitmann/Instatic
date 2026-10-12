import { FIELD_TYPE_LABELS } from '@admin/shared/presentationCatalog'
import { translate } from '@admin/i18n'
import { nanoid } from 'nanoid'
import type { DataFieldType } from '@core/data/schemas'

export interface DraftOption {
  id: string
  label: string
  value: string
}

export const FIELD_TYPE_OPTIONS: ReadonlyArray<{ value: DataFieldType; label: string }> = [
  { value: 'text', get label() { return FIELD_TYPE_LABELS.text } },
  { value: 'longText', get label() { return FIELD_TYPE_LABELS.longText } },
  { value: 'richText', get label() { return FIELD_TYPE_LABELS.richText } },
  { value: 'number', get label() { return FIELD_TYPE_LABELS.number } },
  { value: 'boolean', get label() { return FIELD_TYPE_LABELS.boolean } },
  { value: 'date', get label() { return FIELD_TYPE_LABELS.date } },
  { value: 'dateTime', get label() { return FIELD_TYPE_LABELS.dateTime } },
  { value: 'select', get label() { return FIELD_TYPE_LABELS.select } },
  { value: 'multiSelect', get label() { return FIELD_TYPE_LABELS.multiSelect } },
  { value: 'url', get label() { return FIELD_TYPE_LABELS.url } },
  { value: 'email', get label() { return FIELD_TYPE_LABELS.email } },
  { value: 'media', get label() { return FIELD_TYPE_LABELS.media } },
  { value: 'relation', get label() { return FIELD_TYPE_LABELS.relation } },
  { value: 'repeater', get label() { return FIELD_TYPE_LABELS.repeater } },
]

export const RICH_TEXT_FORMAT_OPTIONS = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'html', label: 'HTML' },
]

export const NUMBER_FORMAT_OPTIONS = [
  { value: 'number', get label() { return FIELD_TYPE_LABELS.number } },
  { value: 'currency', get label() { return translate('metadata.fields.currency') } },
  { value: 'percent', get label() { return translate('metadata.fields.percent') } },
]

export const MEDIA_KIND_OPTIONS = [
  { value: 'any', get label() { return translate('metadata.fields.any') } },
  { value: 'image', get label() { return translate('metadata.fields.image') } },
  { value: 'video', get label() { return translate('metadata.fields.video') } },
]

/**
 * Field ids must start with a lowercase letter so they stay safe as token
 * and binding keys, but the body accepts any letter case.
 *
 * camelCase is deliberately allowed: the storage schema puts no pattern on
 * `id` at all (`FieldCommonProps.id` is a bare `Type.String()`), the API
 * accepts camelCase today, and three of the built-in post-type fields —
 * `featuredMedia`, `seoTitle`, `seoDescription` — are themselves camelCase.
 * Rejecting it here was the only thing forcing a second convention into
 * tables that already carry the first.
 */
const FIELD_ID_PATTERN = /^[a-z][a-zA-Z0-9_]*$/

export function slugifyOptionValue(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function fieldIdFromLabel(label: string): string {
  const normalized = slugifyOptionValue(
    label.normalize('NFKD').replace(/\p{Diacritic}/gu, ''),
  )
  if (!normalized) return ''
  return /^[a-z]/.test(normalized) ? normalized : `field_${normalized}`
}

export function makeOption(label: string): DraftOption {
  return { id: nanoid(), label, value: slugifyOptionValue(label) }
}

export function fieldIdError(id: string, existingIds: string[]): string | null {
  if (!id) return null
  if (!FIELD_ID_PATTERN.test(id)) return 'Must start with a lowercase letter, then letters, numbers or underscores.'
  if (existingIds.includes(id)) return 'This ID is already in use.'
  return null
}
