import { useI18n } from '@admin/i18n'

const useLocaleProbeI18n = useI18n
const probeKey = 'accountUsers.copy.security'

/** Both this minimal consumer and its hook must be compiled to expose stale t caches. */
export function LocaleProbe() {
  const { t } = useLocaleProbeI18n()
  return <span>{t(probeKey)}</span>
}
