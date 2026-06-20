import { Timestamp } from 'firebase/firestore';
import type { GrantRole } from '../auth/permissions';

// Template de grant que se sugiere al provisionar usuario desde este cargo.
// null = sin acceso al sistema (operario típico).
export type ScopeRoleTemplate = Extract<GrantRole, 'zone_manager' | 'branch_manager' | 'member'> | null;

export class Role {
  // parent_role apunta al `id` (UUID) del rol padre, null si es raíz de jerarquía
  constructor(
    public id: string,
    public nombre: string,
    public slug: string,
    public parent_role: string | null = null,
    public scope_role_template: ScopeRoleTemplate = null,
    public elegible_encargado: boolean = false,
    public estaciones_default: string[] = [],
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
    public deletedAt: Date | null = null
  ) {}

  get isRoot(): boolean {
    return this.parent_role === null;
  }

  /** Devuelve todos los ancestros en orden ascendente (padre primero) */
  static ancestors(roleId: string, roles: Role[]): Role[] {
    const map = new Map(roles.map(r => [r.id, r]));
    const result: Role[] = [];
    let current = map.get(roleId);
    while (current?.parent_role) {
      const parent = map.get(current.parent_role);
      if (!parent) break;
      result.push(parent);
      current = parent;
    }
    return result;
  }

  /** Devuelve todos los descendientes directos e indirectos */
  static descendants(roleId: string, roles: Role[]): Role[] {
    const result: Role[] = [];
    const queue = [roleId];
    while (queue.length) {
      const current = queue.shift()!;
      const children = roles.filter(r => r.parent_role === current);
      result.push(...children);
      queue.push(...children.map(c => c.id));
    }
    return result;
  }
}

export function roleToFirestore(role: Role): Record<string, unknown> {
  return {
    id: role.id,
    nombre: role.nombre,
    slug: role.slug,
    parent_role: role.parent_role,
    scope_role_template: role.scope_role_template,
    elegible_encargado: role.elegible_encargado,
    estaciones_default: role.estaciones_default,
    createdAt: role.createdAt ? Timestamp.fromDate(role.createdAt) : Timestamp.now(),
    updatedAt: Timestamp.now(),
    deletedAt: role.deletedAt ? Timestamp.fromDate(role.deletedAt) : null,
  };
}

export function roleFromFirestore(data: Record<string, any>): Role {
  return new Role(
    data.id || '',
    data.nombre || '',
    data.slug || '',
    data.parent_role ?? null,
    data.scope_role_template ?? null,
    data.elegible_encargado ?? false,
    data.estaciones_default ?? [],
    data.createdAt?.toDate?.() || new Date(),
    data.updatedAt?.toDate?.() || new Date(),
    data.deletedAt?.toDate?.() ?? null
  );
}
