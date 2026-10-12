import { translate, getLocale, type SupportedLocale } from '@admin/i18n'
/**
 * Audit-event labelling helpers.
 *
 * The CMS persists audit events with raw IDs (`actorUserId`, `targetId`) and
 * a small `metadata` bag. The Users → Audit tab needs to enrich these with
 * the *current* display name of the related user/role, falling back to the
 * snapshot label captured at write time when the related row no longer
 * exists. These helpers do that enrichment, plus the per-action
 * sentence-case title rendering.
 */
import type { CmsAuditEvent, CmsCurrentUser, CmsRole } from '@core/persistence'
import { displayUserName, statusLabel } from './format'

function metadataString(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key]
  return typeof value === 'string' && value.trim() ? value : null
}

function capitalize(value: string): string {
  return value ? `${value[0]?.toUpperCase()}${value.slice(1)}` : value
}

function humanizeActionId(action: string, t: typeof translate): string {
  const words = action.split('.').filter(Boolean)
  if (words.length === 0) return t('accountUsers.copy.unknownActivity')
  return capitalize(words.join(' '))
}

function dataTableLabel(event: CmsAuditEvent, t: typeof translate): string {
  return metadataString(event.metadata, 'name')
    ?? metadataString(event.metadata, 'slug')
    ?? event.targetId
    ?? t('accountUsers.copy.unknownTable')
}

function dataRowLabel(event: CmsAuditEvent, t: typeof translate): string {
  return metadataString(event.metadata, 'slug') ?? event.targetId ?? t('accountUsers.copy.unknownRow')
}

function aiCredentialLabel(event: CmsAuditEvent, t: typeof translate): string {
  return metadataString(event.metadata, 'displayLabel') ?? event.targetId ?? t('accountUsers.copy.aICredential')
}

function aiScopeLabel(event: CmsAuditEvent, t: typeof translate): string {
  return metadataString(event.metadata, 'scope') ?? event.targetId ?? t('accountUsers.copy.scope')
}

function auditUserLabel(
  userId: string | null,
  usersById: Map<string, CmsCurrentUser>,
  fallback: string | null,
): string | null {
  if (!userId) return fallback
  const user = usersById.get(userId)
  return user ? displayUserName(user) : fallback ?? userId
}

export function auditActor(event: CmsAuditEvent, usersById: Map<string, CmsCurrentUser>, t: typeof translate = translate): string {
  if (!event.actorUserId) return t('accountUsers.copy.bySystem')
  return t('accountUsers.audit.actor', { name: auditUserLabel(event.actorUserId, usersById, event.actorLabel) ?? t('accountUsers.copy.unknownUser') })
}

function auditTargetUser(event: CmsAuditEvent, usersById: Map<string, CmsCurrentUser>, t: typeof translate): string {
  return auditUserLabel(event.targetId, usersById, event.targetLabel) ?? t('accountUsers.copy.unknownUser')
}

function roleName(
  roleId: string | null,
  rolesById: Map<string, CmsRole>,
  fallback: string | null = null,
): string | null {
  if (!roleId) return null
  return rolesById.get(roleId)?.name ?? fallback ?? roleId
}

function auditTargetRole(event: CmsAuditEvent, rolesById: Map<string, CmsRole>): string | null {
  if (event.targetType !== 'role') return null
  return roleName(
    event.targetId,
    rolesById,
    event.targetLabel ?? metadataString(event.metadata, 'name') ?? metadataString(event.metadata, 'slug'),
  )
}

export function auditTitle(
  event: CmsAuditEvent,
  usersById: Map<string, CmsCurrentUser>,
  rolesById: Map<string, CmsRole>,
  t: typeof translate = translate,
): string {
  const targetUser = auditTargetUser(event, usersById, t)
  const role = auditTargetRole(event, rolesById)
  const email = metadataString(event.metadata, 'email')
  const pluginId = metadataString(event.metadata, 'pluginId') ?? event.targetId ?? t('accountUsers.copy.plugin')
  const dataTable = dataTableLabel(event, t)
  const dataRow = dataRowLabel(event, t)
  const aiCredential = aiCredentialLabel(event, t)
  const aiScope = aiScopeLabel(event, t)

  switch (event.action) {
    case 'login.success':
      return t('accountUsers.audit.action.login.success', { name: event.actorUserId ? auditUserLabel(event.actorUserId, usersById, event.actorLabel) ?? t('accountUsers.copy.user') : email ?? t('accountUsers.copy.user') })
    case 'login.failure':
      return t('accountUsers.audit.action.login.failure', { name: email ?? targetUser })
    case 'login.locked':
      return t('accountUsers.audit.action.login.locked', { name: targetUser })
    case 'login.unlocked':
      return t('accountUsers.audit.action.login.unlocked', { name: targetUser })
    case 'login.rate_limited':
      return email ? t('accountUsers.audit.action.login.rate_limited.email', { name: email }) : t('accountUsers.audit.action.login.rate_limited')
    case 'logout':
      return t('accountUsers.audit.action.logout', { name: event.actorUserId ? auditUserLabel(event.actorUserId, usersById, event.actorLabel) ?? t('accountUsers.copy.user') : t('accountUsers.copy.user') })
    case 'user.create':
      return t('accountUsers.audit.action.user.create', { name: targetUser })
    case 'user.update':
      return t('accountUsers.audit.action.user.update', { name: targetUser })
    case 'user.delete':
      return t('accountUsers.audit.action.user.delete', { name: targetUser })
    case 'user.suspend':
      return t('accountUsers.audit.action.user.suspend', { name: targetUser })
    case 'password.change':
      return t('accountUsers.audit.action.password.change', { name: targetUser })
    case 'role.create':
      return t('accountUsers.audit.action.role.create', { name: role ?? t('accountUsers.copy.role') })
    case 'role.update':
      return t('accountUsers.audit.action.role.update', { name: role ?? t('accountUsers.copy.role') })
    case 'role.delete':
      return t('accountUsers.audit.action.role.delete', { name: role ?? event.targetId ?? t('accountUsers.copy.role') })
    case 'role.assign':
      return t('accountUsers.audit.action.role.assign', { name: targetUser })
    case 'data.table.create':
      return t('accountUsers.audit.action.data.table.create', { name: dataTable })
    case 'data.table.update':
      return t('accountUsers.audit.action.data.table.update', { name: dataTable })
    case 'data.table.delete':
      return t('accountUsers.audit.action.data.table.delete', { name: dataTable })
    case 'data.row.create':
      return t('accountUsers.audit.action.data.row.create', { name: dataRow })
    case 'data.row.update':
      return t('accountUsers.audit.action.data.row.update', { name: dataRow })
    case 'data.row.delete':
      return t('accountUsers.audit.action.data.row.delete', { name: dataRow })
    case 'data.row.publish':
      return t('accountUsers.audit.action.data.row.publish', { name: dataRow })
    case 'data.row.schedule':
      return t('accountUsers.audit.action.data.row.schedule', { name: dataRow })
    case 'data.row.schedule.cancel':
      return t('accountUsers.audit.action.data.row.schedule.cancel', { name: dataRow })
    case 'data.row.status':
      return t('accountUsers.audit.action.data.row.status', { name: dataRow })
    case 'data.row.move':
      return t('accountUsers.audit.action.data.row.move', { name: dataRow })
    case 'data.author.assign':
      return t('accountUsers.audit.action.data.author.assign', { name: dataRow })
    case 'publish':
      return t('accountUsers.audit.action.publish')
    case 'plugin.install':
      return t('accountUsers.audit.action.plugin.install', { name: pluginId })
    case 'plugin.update':
      return t('accountUsers.audit.action.plugin.update', { name: pluginId })
    case 'plugin.enable':
      return t('accountUsers.audit.action.plugin.enable', { name: pluginId })
    case 'plugin.disable':
      return t('accountUsers.audit.action.plugin.disable', { name: pluginId })
    case 'plugin.delete':
      return t('accountUsers.audit.action.plugin.delete', { name: pluginId })
    case 'plugin.pack.install':
      return t('accountUsers.audit.action.plugin.pack.install', { name: pluginId })
    case 'plugin.settings.update':
      return t('accountUsers.audit.action.plugin.settings.update', { name: pluginId })
    case 'ai.credential.created':
      return t('accountUsers.audit.action.ai.credential.created', { name: aiCredential })
    case 'ai.credential.updated':
      return t('accountUsers.audit.action.ai.credential.updated', { name: aiCredential })
    case 'ai.credential.deleted':
      return t('accountUsers.audit.action.ai.credential.deleted', { name: aiCredential })
    case 'ai.credential.tested':
      return t('accountUsers.audit.action.ai.credential.tested', { name: aiCredential })
    case 'ai.default.updated':
      return t('accountUsers.audit.action.ai.default.updated', { name: aiScope })
    case 'ai.default.cleared':
      return t('accountUsers.audit.action.ai.default.cleared', { name: aiScope })
    case 'ai.chat.started':
      return t('accountUsers.audit.action.ai.chat.started', { name: aiScope })
    case 'ai.chat.completed':
      return t('accountUsers.audit.action.ai.chat.completed', { name: aiScope })
    case 'ai.chat.failed':
      return t('accountUsers.audit.action.ai.chat.failed', { name: aiScope })
    case 'ai.mcp_connector.created':
      return t('accountUsers.audit.action.ai.mcp_connector.created')
    case 'ai.mcp_connector.revoked':
      return t('accountUsers.audit.action.ai.mcp_connector.revoked')
    default:
      return humanizeActionId(event.action, t)
  }
}

export function auditDetails(event: CmsAuditEvent, rolesById: Map<string, CmsRole>, locale: SupportedLocale = getLocale(), t: typeof translate = translate): string[] {
  const details: string[] = []
  const roleId = metadataString(event.metadata, 'roleId')
  const status = metadataString(event.metadata, 'status')
  if (roleId) details.push(t('accountUsers.audit.role', { name: roleName(roleId, rolesById, event.metadataLabels.roleId) ?? roleId }))
  if (status) details.push(t('accountUsers.audit.status', { status: status === 'active' || status === 'suspended' ? statusLabel(status, locale) : status }))
  if (event.ipAddress && event.ipAddress !== 'unknown') details.push(t('accountUsers.audit.ip', { ip: event.ipAddress }))
  return details
}
