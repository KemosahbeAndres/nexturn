import { Timestamp } from 'firebase/firestore';

export class Role {
  // parent_role apunta al `id` (UUID) del rol padre, null si es raíz de jerarquía
  constructor(
    public id: string,
    public nombre: string,
    public slug: string,
    public parent_role: string | null = null,
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
    data.createdAt?.toDate?.() || new Date(),
    data.updatedAt?.toDate?.() || new Date(),
    data.deletedAt?.toDate?.() ?? null
  );
}
