import { Select } from '@ui/components/Select'
import { useI18n } from './useI18n'
import { normalizeLocale } from './locale'

interface LanguageSelectorProps {
  id?: string
  className?: string
  'aria-label'?: string
}

export function LanguageSelector({ id, className, 'aria-label': ariaLabel }: LanguageSelectorProps) {
  const { locale, setLocale, t } = useI18n()
  return (
    <Select
      id={id}
      className={className}
      fieldSize="sm"
      value={locale}
      aria-label={ariaLabel ?? t('common.language.label')}
      options={[
        { value: 'en', label: t('common.language.english') },
        { value: 'pt-BR', label: t('common.language.portugueseBrazil') },
      ]}
      onChange={(event) => {
        const nextLocale = normalizeLocale(event.target.value)
        if (nextLocale) setLocale(nextLocale)
      }}
    />
  )
}
