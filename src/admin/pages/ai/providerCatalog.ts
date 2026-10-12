import { translate } from '@admin/i18n'
export type ProviderId = 'anthropic' | 'openai' | 'openrouter' | 'ollama' | 'openai-compatible'
export type ProviderAuthMode = 'apiKey' | 'baseUrl'

export interface ProviderSpec {
  id: ProviderId
  label: string
  shortLabel: string
  description: string
  authMode: ProviderAuthMode
  endpointLabel: string
}

export const PROVIDER_SPECS: ProviderSpec[] = [
  {
    id: 'anthropic',
    label: 'Anthropic',
    get shortLabel() { return translate('metadata.ai.claudeModels') },
    get description() { return translate('metadata.ai.claudeModelsWithStrongToolUseAndLongContextReasoning') },
    authMode: 'apiKey',
    endpointLabel: 'api.anthropic.com',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    get shortLabel() { return translate('metadata.ai.gptModels') },
    get description() { return translate('metadata.ai.generalPurposeLanguageAndMultimodalModelsFromOpenAI') },
    authMode: 'apiKey',
    endpointLabel: 'api.openai.com',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    get shortLabel() { return translate('metadata.ai.multiProviderModels') },
    get description() { return translate('metadata.ai.routeRequestsToModelsFromMultipleProvidersThroughOneAPI') },
    authMode: 'apiKey',
    endpointLabel: 'openrouter.ai',
  },
  {
    id: 'ollama',
    label: 'Ollama',
    get shortLabel() { return translate('metadata.ai.localModels') },
    get description() { return translate('metadata.ai.runLocalModelsOnInfrastructureYouControl') },
    authMode: 'baseUrl',
    get endpointLabel() { return translate('metadata.ai.localEndpoint') },
  },
  {
    id: 'openai-compatible',
    get label() { return translate('metadata.ai.customEndpoint') },
    get shortLabel() { return translate('metadata.ai.openaiCompatibleAPI') },
    get description() { return translate('metadata.ai.connectAnyOpenAICompatibleAPIEndpoint') },
    authMode: 'baseUrl',
    get endpointLabel() { return translate('metadata.ai.customEndpoint') },
  },
]

export function getProviderSpec(providerId: ProviderId): ProviderSpec {
  const spec = PROVIDER_SPECS.find((provider) => provider.id === providerId)
  if (!spec) throw new Error(`Unknown AI provider: ${providerId}`)
  return spec
}
