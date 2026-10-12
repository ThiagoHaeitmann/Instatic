import { translate, type SupportedLocale } from '@admin/i18n'
import { presentationMetadataEnglishMessages, presentationMetadataPortugueseMessages } from '../i18n/presentationMetadataMessages'
import type { DataFieldType } from '@core/data/schemas'
import type { MediaAssetRole } from '@core/plugin-sdk'

export const FIELD_TYPE_LABELS: Record<DataFieldType, string> = {
  get text() { return translate('metadata.fields.text') },
  get longText() { return translate('metadata.fields.longText') },
  get richText() { return translate('metadata.fields.richText') },
  get number() { return translate('metadata.fields.number') },
  get boolean() { return translate('metadata.fields.boolean') },
  get date() { return translate('metadata.fields.date') },
  get dateTime() { return translate('metadata.fields.dateTime') },
  get select() { return translate('metadata.fields.select') },
  get multiSelect() { return translate('metadata.fields.multiSelect') },
  url: 'URL',
  get email() { return translate('metadata.fields.email') },
  get media() { return translate('metadata.fields.media') },
  get relation() { return translate('metadata.fields.relation') },
  get repeater() { return translate('metadata.fields.repeater') },
  get pageTree() { return translate('metadata.fields.pageTree') },
  get fieldSchema() { return translate('metadata.fields.fieldSchema') },
}

export const CONTENT_STATUS_LABELS = {
  get draft() { return translate('metadata.status.content.draft') },
  get scheduled() { return translate('metadata.status.content.scheduled') },
  get published() { return translate('metadata.status.content.published') },
  get unpublished() { return translate('metadata.status.content.unpublished') },
} as const

export const USER_STATUS_LABELS = {
  get active() { return translate('metadata.status.user.active') },
  get suspended() { return translate('metadata.status.user.suspended') },
} as const

export const USER_STATUS_OPTIONS = (['active', 'suspended'] as const).map((value) => ({
  value,
  labelKey: `metadata.status.user.${value}` as const,
  get label() { return translate(this.labelKey) },
  get textValue() { return this.label },
}))

export const MEDIA_TYPE_FILTERS = [
  { value: 'all' as const, labelKey: 'metadata.media.filters.all' as const, get label() { return translate(this.labelKey) } },
  { value: 'image' as const, labelKey: 'metadata.media.filters.image' as const, get label() { return translate(this.labelKey) } },
  { value: 'svg' as const, labelKey: 'metadata.media.filters.svg' as const, get label() { return translate(this.labelKey) } },
  { value: 'video' as const, labelKey: 'metadata.media.filters.video' as const, get label() { return translate(this.labelKey) } },
  { value: 'other' as const, labelKey: 'metadata.media.filters.other' as const, get label() { return translate(this.labelKey) } },
]

export const MEDIA_SORT_OPTIONS = [
  { value: 'newest' as const, labelKey: 'metadata.media.sort.newest' as const, get label() { return translate(this.labelKey) } },
  { value: 'oldest' as const, labelKey: 'metadata.media.sort.oldest' as const, get label() { return translate(this.labelKey) } },
  { value: 'largest' as const, labelKey: 'metadata.media.sort.largest' as const, get label() { return translate(this.labelKey) } },
  { value: 'smallest' as const, labelKey: 'metadata.media.sort.smallest' as const, get label() { return translate(this.labelKey) } },
  { value: 'name-asc' as const, labelKey: 'metadata.media.sort.nameAsc' as const, get label() { return translate(this.labelKey) } },
  { value: 'name-desc' as const, labelKey: 'metadata.media.sort.nameDesc' as const, get label() { return translate(this.labelKey) } },
]

// Snapshot host-owned option labels with an explicit locale so React Compiler
// can invalidate derived arrays without relying on ambient getter reads.
export function localizePresentationOptions<TValue extends string>(
  options: readonly { value: TValue; labelKey: keyof typeof presentationMetadataEnglishMessages }[],
  locale: SupportedLocale,
): { value: TValue; label: string; textValue: string }[] {
  const messages = locale === 'pt-BR' ? presentationMetadataPortugueseMessages : presentationMetadataEnglishMessages
  return options.map((option) => {
    const label = messages[option.labelKey]
    return { value: option.value, label, textValue: label }
  })
}

export const MEDIA_ROLE_LABELS: Record<MediaAssetRole, string> = {
  get 'original'() { return translate('metadata.media.roles.original') },
  get 'variant'() { return translate('metadata.media.roles.variant') },
  get 'avatar'() { return translate('metadata.media.roles.avatar') },
  get 'font'() { return translate('metadata.media.roles.font') },
  get 'plugin-pack'() { return translate('metadata.media.roles.pluginPack') },
}
