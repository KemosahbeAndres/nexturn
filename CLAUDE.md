# CLAUDE.md — Plataforma de gestión operativa de turnos

> Documento de referencia del proyecto. Es la **fuente de verdad** para arquitectura, modelo de datos y convenciones. Cualquier refactor debe respetar lo aquí descrito.

---

## 1. Visión del proyecto

Plataforma web **multiempresa (multi-tenant)** para la **gestión operativa de turnos** de dos tipos de organización:

- **Empresas comerciales**: turnos con rotación de estaciones, colación y cobertura continua (caso de referencia del proyecto).
- **Congregaciones**: asignación de publicadores/capitanes a territorios y stands (caso degenerado, sin rotación).

El núcleo es un **algoritmo de asignación** que casa la *demanda* (qué puestos cubrir y cuándo) con la *oferta* (qué persona está disponible y calificada), respetando reglas de convivencia y carga.

---

## 2. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Vue 3 (`<script setup>`) + TypeScript |
| Estado | Pinia |
| Routing | Vue Router — organizado por **scope** |
| Backend | Firebase **Firestore** (plan Blaze) |
| Binding reactivo | VueFire (`useCollection`) |
| Auth/sesión | Sesión propia (colección `sesiones` + token) |
| Funciones servidor | **Cloud Functions** (webhooks de MercadoPago, validaciones críticas) |
| Pagos | **MercadoPago** — Suscripciones (preapproval), moneda CLP |
| UI | Tailwind (dark mode), layouts por scope |

### Convenciones de código (obligatorias)
- Cada modelo es una **clase** con su `FirestoreDataConverter` (`toFirestore`/`fromFirestore`).
- **Soft delete** en todas las colecciones: `active: boolean` + `deletedAt: Date | null`.
- **Timestamps** en todas: `createdAt`, `updatedAt`.
- IDs: `string` (UUID o id de Firestore).
- Navegación **por `name`**, nunca por path literal (los prefijos de URL pueden cambiar sin romper links).

---

## 3. Arquitectura multinivel (scopes)

La jerarquía de recursos tiene **5 niveles**. Las rutas se organizan por **scope** (no por rol), con **prefijos de recurso explícitos** para evitar ambigüedad (estilo GitHub/Vercel).

```
Plataforma (super_admin)
  └─ Cliente / Cuenta        ← entidad de facturación
       └─ Empresa (tenant)
            └─ Zona
                 └─ Sucursal
```

### Mapa de rutas

| Scope | Path | Layout |
|---|---|---|
| Global | `/` | `MainLayout` |
| Cliente | `/c/:clienteSlug` | `ClienteLayout` (selector de empresas, facturación) |
| Empresa | `/:companySlug` | `EmpresaLayout` |
| Zona | `/:companySlug/zonas/:zonaSlug` | `ZonaLayout` |
| Sucursal | `/:companySlug/sucursales/:ubicacionSlug` | `SucursalLayout` |

- Los bloques de ruta son **hermanos** (no un árbol anidado): cada layout reemplaza el shell completo.
- Los prefijos `zonas/` y `sucursales/` eliminan la colisión `/:companySlug/:slug`.
- **Refactor pendiente:** extraer un `AppShell.vue` único (sidebar/topbar/bottombar/tema/logout) parametrizado por `navItems` + slots, para eliminar la duplicación entre los 4 layouts.

---

## 4. Modelo de autorización — RBAC con scope (grants + permisos)

**Tres ejes ortogonales que NUNCA se mezclan:**

1. **Identidad**: `contacto` + `usuario`.
2. **Autorización**: `(usuario, rol, scope)` vía colección **`grants`**, donde el rol es un *bundle* de **permisos atómicos**.
3. **Negocio**: `cargo` (puesto contractual) y `estación` (competencia operativa).

> El cargo **no** codifica acceso. El acceso a una zona/sucursal es un **grant**, no un cargo ni un contrato.

### `system_role` (coarse, en `usuarios`)
Solo distingue staff de plataforma vs cliente:
- `super_admin`: plataforma (tú). `cliente_id = null`.
- `client_user`: todos los demás. Sus poderes vienen **exclusivamente de sus grants**.

### Roles de grant (bundles de permisos)
| Rol | Permisos (resumen) |
|---|---|
| `owner` | Todo dentro del cliente, incluida **facturación** y creación de empresas |
| `company_admin` | Gestión total de una empresa (usuarios, cargos, personal, turnos) |
| `zone_manager` | Lectura/gestión de su zona y de las sucursales que contiene |
| `branch_manager` | Gestión de su sucursal (personal, turnos, asignaciones) |
| `member` | Operación acotada de su sucursal |
| `viewer` | Solo lectura |

### Permisos atómicos (chequear permiso, no rol)
`billing.manage`, `company.manage`, `users.manage`, `cargos.manage`, `zone.read`, `zone.manage`, `branch.read`, `branch.manage`, `employees.write`, `stations.manage`, `coverage.manage`, `schedule.write`, `schedule.publish`, `requests.manage`.

El mapa `rol → permisos[]` vive como **constante en código** (`src/auth/permissions.ts`). Door abierta a roles personalizados por cliente en el futuro (colección `roles`).

### Resolución jerárquica de scope
Un grant sobre una **zona** cubre automáticamente las **sucursales** cuyo `zone_id` coincida. No se emite un grant por sucursal.

```ts
// src/auth/access.ts (esquema)
function puedeAcceder(
  user: Usuario, grants: Grant[],
  scopeType: ScopeType, scopeId: string,
  ctx?: { zonaDeLaSucursal?: string; companyId?: string },
): boolean {
  if (user.system_role === 'super_admin') return true;
  return grants.some(g =>
    (g.scope_type === 'client') ||
    (g.scope_type === 'company' && g.scope_id === ctx?.companyId) ||
    (g.scope_type === scopeType && g.scope_id === scopeId) ||
    (scopeType === 'branch' && g.scope_type === 'zone' && g.scope_id === ctx?.zonaDeLaSucursal)
  );
}
```

> El guard de Vue Router usa esto para **UX**. La seguridad real vive en **Firestore Security Rules** (ver §9).

---

## 4-bis. Persona, Empleado y Usuario (facetas del contacto)

El **`contacto` es la identidad canónica** de la persona. `empleado` y `usuario` son **dos facetas opcionales e independientes** del mismo contacto, vinculadas por `contact_id`:

- **Empleado sin usuario:** lo normal para un operario que no inicia sesión. Existe en el algoritmo y los turnos, pero no tiene acceso a la plataforma.
- **Empleado con usuario:** gerentes, supervisores, asistentes que sí entran a gestionar. Dentro de una empresa habrá **varios** empleados-usuario.
- **Usuario sin empleado:** p.ej. el `owner` del cliente (dueño de la cuenta) que no es personal operativo.

### Provisión de cuenta de acceso
Crear el `usuario` de un empleado puede ser:
1. **Automático al crear el empleado** — flag `crear_acceso: boolean` en el formulario de alta. Si es `true`, se provisiona el usuario en el acto (con clave temporal / invitación por email).
2. **Diferido** — acción "Invitar a la plataforma" sobre un empleado existente.

Al provisionar, **opcionalmente** se crean los `grants` según el `scope_role_template` del cargo del empleado (acción sugerida, confirmable por el admin — ver §6).

### Integridad
- A lo más **un `usuario` por `contacto` por cliente**.
- El vínculo es `usuario.contact_id === empleado.contact_id` (misma persona). No se duplica identidad.
- La empresa/scope del empleado-usuario se resuelve por sus **grants**, no por un campo plano en `usuario`.

---

## 5. Modelo de datos (colecciones Firestore)

### `clientes` *(entidad de facturación)*
```
id, contact_id (dueño),
mp_preapproval_id|null, mp_preapproval_plan_id|null, mp_payer_email|null,
plan: 'free'|'pro'|'business'|'enterprise',
subscription_status: 'active'|'paused'|'past_due'|'canceled'|'pending',
entitlements: { max_empleados, max_sucursales, multiempresa: bool, features: string[] },
slug, active, createdAt, updatedAt, deletedAt
```

### `empresas` *(tenant)*
```
id, cliente_id, contact_id, type: 'empresa'|'congregacion',
cargos: Cargo[] (catálogo dinámico, ver §6),
slug, active, createdAt, updatedAt, deletedAt
```

### `usuarios` *(login — faceta de acceso del contacto)*
```
id, cliente_id|null, contact_id, password,
system_role: 'super_admin'|'client_user',
estado: 'invitado'|'activo'|'suspendido',
active, createdAt, updatedAt, deletedAt
```

### `grants` *(autorización con scope)*
```
id, user_id, cliente_id (denormalizado p/ rules),
company_id|null (denormalizado p/ rules),
scope_type: 'client'|'company'|'zone'|'branch',
scope_id, role, active, createdAt, updatedAt, deletedAt
```
Índices: `(user_id, active)`, `(company_id, scope_type)`, `(scope_type, scope_id)`.

### `contactos`
```
id, first_name, last_name, rut, email, phone, address,
is_company?, active, timestamps, deletedAt
```

### `zonas`
```
id, empresa_id, name, slug, manager_id|null (→ empleado, hecho de negocio),
required_cargos: string[] (cargos elegibles como encargado),
active, timestamps, deletedAt
```

### `ubicaciones` *(sucursales / territorios / stands)*
```
id, company_id, zone_id|null, category, name, address, slug,
manager_id|null, required_cargos: string[],
configuraciones: ConfiguracionTurnos[] (scope default/month/range),
bloques_cobertura: BloqueCobertura[] (ver §7),
active, timestamps, deletedAt
```

### `empleados` *(personal — faceta operativa del contacto)*
```
id, company_id, contact_id, active,
estacion_ids: string[] (competencias / calificación),
contratos: Contrato[],
disponibilidad: Disponibilidad|null,
timestamps, deletedAt
```
> El alta acepta un flag transitorio `crear_acceso` (no se persiste en el doc): dispara la provisión del `usuario` asociado (§4-bis).

### `Contrato` *(embebido en empleado — relación de empleo)*
```
id, empleado_id, ubicacion_id, cargo_id, active,
limite_horas, fecha_inicio, fecha_fin, timestamps, deletedAt
```

### `estaciones` *(competencias / puestos operativos)*
```
id, empresa_id, nombre, descripcion,
intensidad: 'alta'|'media'|'baja',
max_continuo_min: number|null (tope de minutos seguidos),
active, timestamps, deletedAt
```

### `excepciones`, `reglas_asignacion`, `sesiones`
Se mantienen (vacaciones/ausencias; juntos/nunca_juntos; tokens de sesión).

### `asignaciones`, `presencias`, `segmentos` *(ver §7)*

---

## 6. Cargos dinámicos

Cada **empresa define su propio catálogo** de cargos. Nada hardcodeado. El `Cargo` es un árbol (`parent_role` = herencia de capacidades para el algoritmo, **no** línea de reporte).

### Modelo `Cargo`
```ts
interface Cargo {
  id: string;
  nombre: string;
  slug: string;
  parent_role: string | null;                 // herencia de capacidades
  scope_role_template: 'zone_manager' | 'branch_manager' | 'member' | null; // grant sugerido
  elegible_encargado: boolean;                 // puede ser manager_id de zona/sucursal
  estaciones_default?: string[];               // competencias sugeridas
  timestamps...
}
```

### Mapeo de los cargos reales (ejemplo por defecto, editable por la empresa)
| Cargo | `scope_role_template` | `elegible_encargado` | Scope típico |
|---|---|---|---|
| supervisor | `zone_manager` | sí | Zona (varias sucursales) |
| gerente | `branch_manager` | sí | Sucursal |
| asistente (subgerente) | `branch_manager` | sí | Sucursal |
| operario | `member` / `null` | no | — |

> El `scope_role_template` es una **plantilla sugerida**, no una provisión automática. Al darle acceso a un empleado (§4-bis), el admin confirma el `grant`. Cargo (negocio) y grant (auth) se vinculan por la **misma persona** (`contact_id`), pero son independientes.

---

## 7. Estaciones y scheduling (modelo de 3 capas)

El solape de turnos es **intencional** (cobertura escalonada con rotación), no un conflicto. Se separan tres objetos:

### Capa 1 — Demanda de cobertura (`BloqueCobertura`, en `ubicacion`)
```ts
interface BloqueCobertura {
  id: string;
  estacion_id: string;
  day_of_week: string;
  start_time: string;   // "09:00"
  end_time: string;     // "18:00"
  cantidad: number;     // personas requeridas en ese intervalo
}
```
Bloques **solapados se suman** (caja base 1 todo el día + 1 extra en peak 12–14).

### Capa 2 — Presencia del empleado (`presencias`)
```ts
interface Presencia {
  id: string; empresa_id: string; ubicacion_id: string; empleado_id: string;
  date: string;          // YYYY-MM-DD
  start: number;         // minutos desde medianoche
  end: number;
  colacion?: { start: number; end: number };
  timestamps...
}
```
Las presencias **se solapan a propósito** entre empleados (handover de caja).

### Capa 3 — Segmento de asignación (`segmentos` — salida del algoritmo)
```ts
interface Segmento {
  id: string; empresa_id: string; ubicacion_id: string; empleado_id: string;
  date: string;          // YYYY-MM-DD
  estacion_id: string | null;          // null = colación/descanso
  tipo: 'estacion' | 'colacion' | 'descanso';
  start: number; end: number;          // minutos desde medianoche
  asignacion_id: string;               // agrupador (publish unit)
  status: 'draft' | 'published';
  timestamps...
}
```
Índice obligatorio: **`(empleado_id, date)`** — detección de solape por persona en O(n) sobre su día.

### `asignaciones` (agrupador / unidad de publicación)
```
id, empresa_id, ubicacion_id, date, status: 'draft'|'published', timestamps
```

### Invariante dura única
Los **segmentos de un mismo empleado no se solapan** entre sí (ni entre sucursales — nadie está en dos lugares a la vez):
```ts
const solapan = (a, b) => a.start < b.end && b.start < a.end;
```

### Restricciones blandas (optimización del algoritmo)
- Cobertura: por cada bucket (p.ej. 15 min), Σ segmentos activos por estación ≥ demanda.
- Calificación: `estacion_id ∈ empleado.estacion_ids`.
- Anti-saturación: respetar `estacion.max_continuo_min`; tras `intensidad: 'alta'`, rotar a menor.
- Colación: insertar segmento `colacion`; al volver, preferir estación de baja intensidad.
- Convivencia: `reglas_asignacion` (juntos / nunca_juntos, `is_strict`).

### Caso congregación (degenerado)
Un empleado = **un solo segmento** = toda su presencia en una estación. Sin rotación ni colación. El modelo rico colapsa al simple; **no se mantienen dos sistemas**.

---

## 8. Planes y facturación (MercadoPago)

### Dónde vive
La **suscripción se ancla en el `cliente`**. Un medio de pago, una cuenta, aunque gestione varias empresas. **Límites pooled a nivel cliente** (no por empresa).

### Modelo de cobro con MercadoPago
MercadoPago cobra mediante **preapproval** (suscripción) sobre un **`preapproval_plan`**, con `auto_recurring` de **monto fijo** (`transaction_amount`, CLP) por frecuencia. Implicaciones:

- **No hay facturación por uso/por-asiento nativa** (a diferencia de Stripe). Por lo tanto:
  - **Cada tier = un `preapproval_plan`** con monto fijo en CLP.
  - La métrica "empleados activos" **no se factura al gateway**: determina **en qué tier debe estar** el cliente y se **enforcea vía `entitlements`** (lado servidor).
  - Upgrade/downgrade = actualizar el preapproval (`PUT /preapproval/:id`) o cancelar + recrear.
- **Checkout:** redirección al `init_point` que devuelve MercadoPago al crear el preapproval.
- **Campos en `cliente`:** `mp_preapproval_id`, `mp_preapproval_plan_id`, `mp_payer_email`.

### Métrica de valor (gating, no metering)
- **Primaria:** empleados activos (pooled) → define el tier.
- **Secundaria (guardrail):** nº de sucursales/ubicaciones.
- **Multiempresa = feature de tier**, NO eje de precio.

### Tiers (referencia)
| Tier | Empleados (pooled) | Empresas | Features |
|---|---|---|---|
| Free / Congregación | ~15 | 1 | Turnos, personal, sin zonas, sin algoritmo avanzado |
| Pro | ~75 | 1 | + zonas, algoritmo, reglas de asignación |
| Business | ~300 | Multiempresa | + multiempresa, exportaciones, roles finos |
| Enterprise | ilimitado | Multiempresa | + SSO, API, soporte |

- `empresa.type = 'congregacion'` → tier **gratuito/non-profit** (voluntarios, no empleados).

### Sincronización (Cloud Functions)
- **Webhooks de MercadoPago** → Cloud Function: notificaciones tipo `subscription_preapproval` (estado de la suscripción) y `subscription_authorized_payment` (cobro recurrente exitoso/fallido).
- La function obtiene el preapproval (`GET /preapproval/:id`), mapea su `status` (`pending`/`authorized`/`paused`/`cancelled`) a `clientes.subscription_status` y actualiza `entitlements` según el plan.
- Feature gating en la app lee `entitlements` (no consulta MercadoPago en runtime).
- **Security Rules** validan límites del lado servidor (rechazar empleado #16 en Free).
- UX multiempresa: tras login, si el cliente tiene **1 empresa → redirect directo**; varias → selector.

---

## 9. Requisitos técnicos y seguridad

### Reglas de oro (invariantes)
1. **Aislamiento por tenant:** toda query lleva filtro por `cliente_id`/`company_id`. Nadie ve datos fuera de su scope.
2. **El filtro `empresa_id` ya no basta:** dentro de una empresa, el acceso a zona/sucursal se valida contra `grants`.
3. **Seguridad en servidor:** el guard de Vue es UX. **Firestore Security Rules** reflejan la resolución de scope (`grants`) y los `entitlements`.
4. **Soft delete + timestamps** en todo.
5. **Navegación por `name`.**
6. **Identidad única:** un `contacto` por persona; `empleado`/`usuario` la referencian, no la duplican.

### Security Rules (lineamientos)
- Helper que resuelve si la sesión tiene un grant que cubra el doc (por `company_id`/`zone_id`/`ubicacion_id`).
- Validar `entitlements` en `create` de `empleados`/`ubicaciones` contra los límites del plan.
- Negar lectura cross-tenant siempre.

---

## 10. Plan de trabajo (por fases)

> Cada fase: (a) migración si aplica, (b) modelos + converters, (c) stores, (d) UI, (e) Security Rules, (f) verificación.

**Fase 0 — Fundaciones** *(en curso)*
- Crear colección `clientes`. Migrar `empresas` añadiendo `cliente_id`.
- Definir `src/auth/permissions.ts` (mapa rol→permisos).

**Fase 1 — Autorización + provisión de cuentas**
- Colección `grants` + modelo/converter. Helpers `puedeAcceder()` / `can()`.
- Refactor de `beforeEach` (resolución de scope).
- **Provisión de usuario desde empleado**: flag `crear_acceso` + acción "Invitar"; estado `invitado/activo`; creación opcional de grants desde el cargo.
- Security Rules base con grants.

**Fase 2 — Routing por scope**
- Prefijos `sucursales/` y `zonas/`. Nuevo `ZonaLayout` + `views/zona/*`.
- Extraer `AppShell.vue` compartido.

**Fase 3 — Cargos dinámicos**
- Extender `Cargo` (`scope_role_template`, `elegible_encargado`, `estaciones_default`).
- UI catálogo por empresa. Provisión de grant desde cargo (acción explícita).

**Fase 4 — Estaciones + scheduling**
- `Estacion`: `intensidad`, `max_continuo_min`.
- `BloqueCobertura` en `ubicacion`. Colecciones `presencias` y `segmentos`.
- Refactor `asignaciones` (de `assigned_staff[]` a segmentos). Algoritmo (cobertura + rotación + colación + convivencia).

**Fase 5 — Facturación (MercadoPago)**
- `preapproval_plan` por tier. Checkout vía `init_point`. Cloud Functions (webhooks `subscription_preapproval` / `subscription_authorized_payment`). `entitlements` + feature gating. Security Rules de límites.

**Fase 6 — Multiempresa UX**
- `ClienteLayout`, selector de empresa, default si hay una sola.

---

## 11. Glosario rápido

- **Cliente/Cuenta:** quien paga; agrupa empresas; entidad de facturación.
- **Empresa:** tenant operativo.
- **Contacto:** identidad canónica de la persona.
- **Empleado / Usuario:** facetas opcionales del contacto (operativa / acceso).
- **Grant:** `(usuario, rol, scope)` — autorización.
- **Cargo:** puesto contractual/jerárquico (negocio).
- **Estación:** competencia/puesto operativo de un turno (scheduling).
- **BloqueCobertura:** demanda de personal por estación e intervalo.
- **Presencia:** ventana en que un empleado está en el local.
- **Segmento:** estación asignada a un empleado en un sub-intervalo (salida del algoritmo).