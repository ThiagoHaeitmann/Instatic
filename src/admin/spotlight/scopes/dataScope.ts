/**
 * Data scope — search data tables via dataProvider.
 *
 * Phase 3: wires the live server-backed data provider plus static commands
 * for creating tables and fields.
 */

import { translate } from '@admin/i18n'

import type { Scope, Command } from '../types'
import { dataProvider } from '../providers/dataProvider'

function getDataScopeCommands(): Command[] {
  return [
    {
      id: 'data.newTable',
      get title() { return translate('metadata.spotlight.newTable') },
      get subtitle() { return translate('metadata.spotlight.createANewDataTable') },
      group: 'data',
      iconName: 'table-solid',
      keywords: ['new', 'create', 'table', 'database'],
      workspaces: ['data'],
      run: (ctx) => {
        ctx.closeSpotlight()
        ctx.navigate('/admin/data?action=newTable')
      },
    },
    {
      id: 'data.newField',
      get title() { return translate('metadata.spotlight.newFieldInCurrentTable') },
      get subtitle() { return translate('metadata.spotlight.addAFieldToTheCurrentlyOpenTable') },
      group: 'data',
      iconName: 'plus-circle-solid',
      keywords: ['new', 'create', 'field', 'column', 'attribute'],
      workspaces: ['data'],
      run: (ctx) => {
        ctx.closeSpotlight()
        ctx.navigate('/admin/data?action=newField')
      },
    },
  ]
}

export const dataScope: Scope = {
  id: 'data',
  get title() { return translate('metadata.spotlight.openTable') },
  get placeholder() { return translate('metadata.spotlight.searchTables') },
  commands: getDataScopeCommands,
  providers: [dataProvider],
}
