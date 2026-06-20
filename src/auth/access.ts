import type { Usuario } from '../models/Usuario';
import type { Grant } from '../models/Grant';
import { hasPermission } from './permissions';
import type { Permission, ScopeType } from './permissions';

export interface AccessContext {
  companyId?: string;
  zonaDeLaSucursal?: string;  // zone_id de la sucursal — permite que un grant de zona cubra sus sucursales
}

/**
 * Implementa la resolución jerárquica de scope definida en CLAUDE.md §4.
 * Un grant de scope superior siempre cubre scopes inferiores.
 *
 * Jerarquía: client > company > zone > branch
 */
export function puedeAcceder(
  user: Usuario,
  grants: Grant[],
  scopeType: ScopeType,
  scopeId: string,
  ctx?: AccessContext
): boolean {
  if (user.system_role === 'super_admin') return true;

  return grants.some(g => {
    if (!g.active || g.deletedAt !== null) return false;

    // Grant sobre el cliente completo cubre todo
    if (g.scope_type === 'client') return true;

    // Grant sobre la empresa específica
    if (g.scope_type === 'company' && g.scope_id === ctx?.companyId) return true;

    // Grant exacto sobre el scope pedido
    if (g.scope_type === scopeType && g.scope_id === scopeId) return true;

    // Grant de zona cubre las sucursales de esa zona
    if (
      scopeType === 'branch' &&
      g.scope_type === 'zone' &&
      g.scope_id === ctx?.zonaDeLaSucursal
    ) return true;

    return false;
  });
}

/**
 * Verifica si el usuario tiene un permiso atómico dado en el scope especificado.
 * Evalúa todos los grants aplicables y retorna true si cualquiera concede el permiso.
 */
export function can(
  user: Usuario,
  grants: Grant[],
  permission: Permission,
  scopeType: ScopeType,
  scopeId: string,
  ctx?: AccessContext
): boolean {
  if (user.system_role === 'super_admin') return true;

  const aplicables = grants.filter(g =>
    g.active &&
    g.deletedAt === null &&
    puedeAcceder(user, [g], scopeType, scopeId, ctx)
  );

  return aplicables.some(g => hasPermission(g.role, permission));
}
