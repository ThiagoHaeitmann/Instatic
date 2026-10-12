/**
 * Data provider — live data table search via /admin/api/cms/data/tables.
 *
 * SERVER provider, 150 ms debounce.
 *
 * Searches data tables by name and slug (JS-side filter in the handler).
 * Each result navigates to /admin/data with the table selected.
 */

import { translate } from '@admin/i18n'

import type { Command } from '../types'
import { DataTablesListResponseSchema } from './schemas'
import { makeServerProvider } from './serverProvider'

export const dataProvider = makeServerProvider({
  id: 'data',
  get label() { return translate('metadata.spotlight.data') },
  debounceMs: 150,
  endpoint: '/admin/api/cms/data/tables',
  schema: DataTablesListResponseSchema,
  select: (body) => body.tables,
  toCommand: (table): Command => ({
    id: `data:${table.id}`,
    title: table.name,
    subtitle: table.pluralLabel ? `${table.pluralLabel} · /${table.slug}` : `/${table.slug}`,
    group: 'data',
    iconName: 'table-solid',
    keywords: ['data', 'table', 'database', table.slug],
    run: (ctx) => {
      ctx.closeSpotlight()
      ctx.navigate(`/admin/data?table=${encodeURIComponent(table.id)}`)
    },
  }),
})
