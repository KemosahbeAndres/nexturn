// Permisos atómicos del sistema. Siempre chequear permiso, nunca el rol directamente.
export type Permission =
  | 'billing.manage'
  | 'company.manage'
  | 'users.manage'
  | 'cargos.manage'
  | 'zone.read'
  | 'zone.manage'
  | 'branch.read'
  | 'branch.manage'
  | 'employees.write'
  | 'stations.manage'
  | 'coverage.manage'
  | 'schedule.write'
  | 'schedule.publish'
  | 'requests.manage';

// Roles de grant — bundles de permisos atómicos.
export type GrantRole =
  | 'owner'
  | 'company_admin'
  | 'zone_manager'
  | 'branch_manager'
  | 'member'
  | 'viewer';

// Tipos de scope — jerarquía de resolución: client > company > zone > branch.
export type ScopeType = 'client' | 'company' | 'zone' | 'branch';

// Mapa autoritativo rol → permisos. Modificar aquí para ajustar capacidades de cada rol.
export const ROLE_PERMISSIONS: Record<GrantRole, Permission[]> = {
  owner: [
    'billing.manage',
    'company.manage',
    'users.manage',
    'cargos.manage',
    'zone.read',
    'zone.manage',
    'branch.read',
    'branch.manage',
    'employees.write',
    'stations.manage',
    'coverage.manage',
    'schedule.write',
    'schedule.publish',
    'requests.manage',
  ],
  company_admin: [
    'company.manage',
    'users.manage',
    'cargos.manage',
    'zone.read',
    'zone.manage',
    'branch.read',
    'branch.manage',
    'employees.write',
    'stations.manage',
    'coverage.manage',
    'schedule.write',
    'schedule.publish',
    'requests.manage',
  ],
  zone_manager: [
    'zone.read',
    'zone.manage',
    'branch.read',
    'branch.manage',
    'employees.write',
    'stations.manage',
    'coverage.manage',
    'schedule.write',
    'schedule.publish',
    'requests.manage',
  ],
  branch_manager: [
    'branch.read',
    'branch.manage',
    'employees.write',
    'stations.manage',
    'coverage.manage',
    'schedule.write',
    'schedule.publish',
    'requests.manage',
  ],
  member: [
    'branch.read',
    'employees.write',
    'schedule.write',
    'requests.manage',
  ],
  viewer: [
    'zone.read',
    'branch.read',
  ],
};

export function hasPermission(role: GrantRole, perm: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(perm) ?? false;
}
