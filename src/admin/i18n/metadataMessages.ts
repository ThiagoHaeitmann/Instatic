// Aggregate only data catalogs; never import metadata owners or the runtime.
import { preferenceMetadataEnglishMessages, preferenceMetadataPortugueseMessages } from './preferenceMetadataMessages'
import { spotlightMetadataEnglishMessages, spotlightMetadataPortugueseMessages } from './spotlightMetadataMessages'
import { aiMetadataEnglishMessages, aiMetadataPortugueseMessages } from './aiMetadataMessages'
import { presentationMetadataEnglishMessages, presentationMetadataPortugueseMessages } from './presentationMetadataMessages'

export const metadataEnglishMessages = {
  ...preferenceMetadataEnglishMessages,
  ...spotlightMetadataEnglishMessages,
  ...aiMetadataEnglishMessages,
  ...presentationMetadataEnglishMessages,
} as const

export const metadataPortugueseMessages = {
  ...preferenceMetadataPortugueseMessages,
  ...spotlightMetadataPortugueseMessages,
  ...aiMetadataPortugueseMessages,
  ...presentationMetadataPortugueseMessages,
} satisfies Record<keyof typeof metadataEnglishMessages, string>
