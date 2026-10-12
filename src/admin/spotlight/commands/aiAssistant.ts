/**
 * AI Assistant commands — §4.14 of the Command Spotlight master plan.
 *
 * Open the AI assistant panel, send a prompt to the AI.
 */

import { translate } from '@admin/i18n'

import type { Command } from '../types'

export function getAiAssistantCommands(): Command[] {
  return [
    // ── Open AI Assistant ────────────────────────────────────────────────────
    {
      id: 'ai.open',
      get title() { return translate('metadata.spotlight.openAIAssistant') },
      get subtitle() { return translate('metadata.spotlight.openTheAIAssistantPanel') },
      group: 'ai',
      iconName: 'sparkles-solid',
      keywords: ['ai', 'assistant', 'claude', 'open', 'panel', 'agent'],
      workspaces: ['site'],
      capability: 'ai.chat',
      run: async (ctx) => {
        ctx.closeSpotlight()
        try {
          const { useEditorStore } = await import('@site/store/store')
          useEditorStore.getState().setLeftSidebarPanel('agent')
        } catch (err) {
          console.error('[spotlight] open AI assistant panel failed:', err)
        }
      },
    },

    // ── Ask AI ───────────────────────────────────────────────────────────────
    {
      id: 'ai.ask',
      get title() { return translate('metadata.spotlight.askAI') },
      get subtitle() { return translate('metadata.spotlight.sendAPromptToTheAIAssistant') },
      group: 'ai',
      iconName: 'ai-box-solid',
      keywords: ['ai', 'ask', 'prompt', 'claude', 'generate', 'agent'],
      workspaces: ['site'],
      capability: 'ai.chat',
      args: [
        {
          id: 'prompt',
          get label() { return translate('metadata.spotlight.askAnything') },
          type: 'text',
          get placeholder() { return translate('metadata.spotlight.eGAddAHeroSectionWithABlueBackground') },
          required: true,
        },
      ],
      run: async (ctx) => {
        const prompt = ctx.args['prompt']?.trim()
        if (!prompt) return
        try {
          const { useEditorStore } = await import('@site/store/store')
          const store = useEditorStore.getState()
          store.openAgent()
          store.sendAgentMessage([{ kind: 'text', text: prompt }])
        } catch (err) {
          console.error('[spotlight] ask AI failed:', err)
        }
      },
    },
  ]
}
