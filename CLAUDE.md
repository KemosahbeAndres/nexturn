# CLAUDE.md — Plataforma de gestión operativa de turnos

> Documento de referencia del proyecto. Es la **fuente de verdad** para arquitectura, modelo de datos y convenciones. Cualquier refactor debe respetar lo aquí descrito.

---

## 1. Visión del proyecto

Plataforma web **multiempresa (multi-tenant)** para la **gestión operativa de turnos** de dos tipos de organización:

- **Empresas comerciales**: turnos con rotación de estaciones y cobertura continua (caso de referencia).
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
| Binding reactivo | VueFire (`useCollection`) — **ver §9: lecturas puntuales, no listeners** |
| Auth/sesión | Sesión propia (colección `sesiones` + token) |
| Funciones servidor | **Cloud Functions** (algoritmo, webhooks MercadoPago, emisión DTE, validaciones) |
| Pagos | **MercadoPago** — Suscripciones (preapproval), CLP |
| Facturación (DTE) | **Dual**: OpenFactura (API, automático) **o** SII gratuito (manual + upload). A elección del super_admin |
| Almacenamiento | **Firebase Storage** — PDF/XML de los DTE |
| UI | Tailwind (dark mode), layouts por scope |

### Convenciones de código (obligatorias)
- Cada modelo es una **clase** con su `FirestoreDataConverter`.
- **Soft delete** (`active` + `deletedAt`) y **timestamps** (`createdAt`, `updatedAt`) en todo.
- IDs: `string`. Navegación **por `name`**, nunca por path literal.

---

## 3. Arquitectura multinivel (scopes)

```
Plataforma (super_admin)
  └─ Cliente / Cuenta        ← administrador (login). NO es la entidad facturada.
       └─ Empresa (tenant)   ← entidad tributaria independiente (RUT propio). Se factura aquí.
            └─ Zona
                 └─ Sucursal
```

### Mapa de rutas (prefijos de recurso explícitos)

| Scope | Path | Layout |
|---|---|---|
| Global | `/` | `MainLayout` |
| Cliente | `/c/:clienteSlug` | `ClienteLayout` (selector de empresas) |
| Empresa | `/:companySlug` | `EmpresaLayout` (incl. ajustes de facturación de ESA empresa) |
| Zona | `/:companySlug/zonas/:zonaSlug` | `ZonaLayout` |
| Sucursal | `/:companySlug/sucursales/:ubicacionSlug` | `SucursalLayout` |

- Bloques de ruta **hermanos**; cada layout reemplaza el shell completo.
- **Refactor pendiente:** extraer `AppShell.vue` único parametrizado por `navItems` + slots.

---

## 4. Autorización — RBAC con scope (grants + permisos) · Opción B

**Tres ejes ortogonales que NUNCA se mezclan:** identidad (`contacto`/`usuario`) · autorización (`grants`) · negocio (`cargo`/`estación`).

> El cargo no codifica acceso. El acceso es un **grant**.

### `system_role` (coarse, en `usuarios`)
- `super_admin`: plataforma. `cliente_id = null`.
- `client_user`: el resto; sus poderes vienen de sus **grants**.

### Roles de grant (bundles de permisos)
`owner` (administra el cliente y la facturación de sus empresas) · `company_admin` · `zone_manager` · `branch_manager` · `member` · `viewer`.

### Permisos atómicos (chequear permiso, no rol)
`billing.manage`, `company.manage`, `users.manage`, `cargos.manage`, `zone.read/manage`, `branch.read/manage`, `employees.write`, `stations.manage`, `coverage.manage`, `schedule.write/publish`, `requests.manage`. Mapa `rol→permisos[]` en `src/auth/permissions.ts`.

### Resolución jerárquica de scope
Un grant sobre una zona cubre las sucursales con ese `zone_id`. No se emite grant por sucursal.

```ts
function puedeAcceder(user, grants, scopeType, scopeId, ctx?): boolean {
  if (user.system_role === 'super_admin') return true;
  return grants.some(g =>
    (g.scope_type === 'client') ||
    (g.scope_type === 'company' && g.scope_id === ctx?.companyId) ||
    (g.scope_type === scopeType && g.scope_id === scopeId) ||
    (scopeType === 'branch' && g.scope_type === 'zone' && g.scope_id === ctx?.zonaDeLaSucursal)
  );
}
```
El guard de Vue es **UX**; la seguridad real va en **Security Rules** (§9).

---

## 4-bis. Persona, Empleado y Usuario (facetas del contacto)

El **`contacto` es la identidad canónica**. `empleado` y `usuario` son **facetas opcionales** unidas por `contact_id`:

- **Empleado sin usuario:** operario que no inicia sesión (lo normal).
- **Empleado con usuario:** gerentes/supervisores/asistentes que gestionan. Habrá **varios** por empresa.
- **Usuario sin empleado:** el `owner` del cliente.

### Provisión de cuenta
1. **Automática** al crear el empleado (flag `crear_acceso`).
2. **Diferida** (acción "Invitar"). Estado del usuario: `invitado` → `activo` → `suspendido`.

Al provisionar, **opcionalmente** se crean grants según el `scope_role_template` del cargo (confirmable por el admin). A lo más **un usuario por contacto por cliente**.

---

## 5. Modelo de datos (colecciones)

### `clientes` *(cuenta administradora — NO se factura aquí)*
```
id, contact_id (dueño/owner), slug,
default_payer?: { mp_payer_email } (opcional, paga las suscripciones de sus empresas),
active, createdAt, updatedAt, deletedAt
```

### `empresas` *(tenant + entidad tributaria + suscripción)*
```
id, cliente_id, type: 'empresa'|'congregacion',
// datos tributarios (para el DTE):
rut, razon_social, giro, direccion,
// suscripción (vive AQUÍ, no en el cliente):
plan: 'free'|'pro'|'business'|'enterprise',
facturable: boolean,                       // congregacion = false
mp_preapproval_id|null, mp_preapproval_plan_id|null,
subscription_status: 'active'|'trialing'|'paused'|'past_due'|'canceled'|'pending',
entitlements: { max_empleados, max_sucursales, features: string[] },  // POR empresa, sin pooling
cargos: Cargo[] (catálogo dinámico §6),
slug, active, createdAt, updatedAt, deletedAt
```

### `usuarios`
```
id, cliente_id|null, contact_id, password,
system_role: 'super_admin'|'client_user',
estado: 'invitado'|'activo'|'suspendido',
active, timestamps, deletedAt
```

### `grants`
```
id, user_id, cliente_id, company_id|null,
scope_type: 'client'|'company'|'zone'|'branch', scope_id, role,
active, timestamps, deletedAt
```
Índices: `(user_id, active)`, `(company_id, scope_type)`, `(scope_type, scope_id)`.

### `contactos`
```
id, first_name, last_name, rut, email, phone, address, is_company?, active, timestamps, deletedAt
```

### `zonas`
```
id, empresa_id, name, slug, manager_id|null, required_cargos: string[], active, timestamps, deletedAt
```

### `ubicaciones`
```
id, company_id, zone_id|null, category, name, address, slug, manager_id|null,
required_cargos: string[],
configuraciones: ConfiguracionTurnos[] (default/month/range — = demanda de cobertura, §7),
active, timestamps, deletedAt
```

### `empleados`
```
id, company_id, contact_id, active,
estacion_ids: string[] (calificación),
contratos: Contrato[], disponibilidad: Disponibilidad|null,
timestamps, deletedAt
// alta acepta flag transitorio `crear_acceso` (§4-bis)
```

### `Contrato` *(embebido)*
```
id, empleado_id, ubicacion_id, cargo_id, active, limite_horas, fecha_inicio, fecha_fin, timestamps, deletedAt
```

### `estaciones`
```
id, empresa_id, nombre, descripcion,
intensidad: 'alta'|'media'|'baja', max_continuo_min: number|null,
active, timestamps, deletedAt
```

### `presencias` *(presencia del empleado — SIN colación, §7)*
```
id, empresa_id, ubicacion_id, empleado_id, date, start, end, timestamps
```

### `segmentos` *(salida del algoritmo)*
```
id, empresa_id, ubicacion_id, empleado_id, date,
estacion_id|null, tipo: 'estacion'|'descanso',
start, end, asignacion_id, status: 'draft'|'published', timestamps
```
Índice obligatorio: `(empleado_id, date)`.

### `asignaciones` *(agrupador/publicación)*
```
id, empresa_id, ubicacion_id, date, status: 'draft'|'published', timestamps
```

### `solicitudes` *(antes `excepciones` — flujo con estados, §7)*
```
id, empresa_id, empleado_id, sucursal_id,
tipo: 'licencia_medica'|'feriado_legal'|'emergencia',
rango: { start_date, end_date },
estado: 'pendiente'|'aprobada'|'rechazada',
aprobador_id|null (encargado de sucursal),
reemplazo?: { empleado_id, rango },        // definido por el encargado al aprobar
timestamps, deletedAt
```

### `reglas_asignacion`, `sesiones`
Se mantienen (juntos/nunca_juntos con `is_strict`; tokens de sesión).

### `documentos_tributarios` *(DTE emitido por cada cobro, §8)*
```
id, empresa_id, payment_ref (id de pago MercadoPago), periodo (YYYY-MM),
tipo_dte: 'boleta'|'factura', monto_neto, iva, monto_total, folio|null,
origen: 'openfactura'|'sii_manual',
estado: 'pendiente'|'emitido'|'notificado'|'error',
archivo_pdf_url|null, archivo_xml_url|null (Firebase Storage),
emitido_at|null, notificado_at|null, timestamps
```

---

## 6. Cargos dinámicos

Cada empresa define su catálogo. `Cargo` es un árbol (`parent_role` = herencia de capacidades, no línea de reporte).

```ts
interface Cargo {
  id; nombre; slug; parent_role: string | null;
  scope_role_template: 'zone_manager'|'branch_manager'|'member'|null; // grant sugerido
  elegible_encargado: boolean; estaciones_default?: string[];
}
```

| Cargo (ejemplo) | template | elegible_encargado | scope |
|---|---|---|---|
| supervisor | zone_manager | sí | zona |
| gerente | branch_manager | sí | sucursal |
| asistente | branch_manager | sí | sucursal |
| operario | member/null | no | — |

El `scope_role_template` es plantilla sugerida; la provisión del grant es explícita.

---

## 7. Estaciones y scheduling

Tres capas; el solape de turnos es **intencional** (cobertura escalonada + rotación).

1. **Demanda de cobertura** = `ConfiguracionTurnos` de la ubicación, resuelta por precedencia `range > month > default`. Plantilla anual + overrides por mes/semana/caso especial. Bloques `{estacion_id, day_of_week, start, end, cantidad}`; solapados **suman**.
2. **Presencia** (`presencias`): ventana del empleado. Para empresa se derivan de la configuración; para congregación, de `disponibilidad`. **Sin colación** (no se modela — en terreno no se cumple).
3. **Segmento** (`segmentos`): estación asignada por sub-intervalo. Rotación incluida.

### Algoritmo (Fase 4)
- **Tipo:** auto-borrador **greedy** + edición manual (no solver). Corre en **Cloud Function** (ambos casos).
- **Entrada:** demanda (ConfiguracionTurnos) + presencias/disponibilidad + `estacion_ids` + reglas.
- **Salida:** `segmentos` en `draft`.
- **Buckets de chequeo:** 30 min. Cobertura por bucket: Σ segmentos activos por estación ≥ demanda.
- **Invariante dura:** segmentos de un mismo empleado no se solapan (`a.start < b.end && b.start < a.end`), ni entre sucursales.
- **Anti-saturación:** respetar `max_continuo_min`; tras estación `intensidad: alta`, rotar a una menor.
- **Convivencia:** `reglas_asignacion` con `is_strict` = **dura**.
- **Cobertura incumplible:** se marca **hueco visible**, no se inventa gente (restricción dura).

### Publicación, calendario y solicitudes
- `draft → published`. Editar un publicado genera nueva versión + **notificación** a los empleados afectados.
- El empleado **ve su calendario** (requiere usuario provisionado). El calendario se carga con **una lectura puntual al abrir la vista**, no con listener en tiempo real (§9).
- **Excepciones = `solicitudes`** con estados. El empleado solicita (licencia médica / feriado legal / emergencia). El **encargado de sucursal** aprueba/rechaza y, al aprobar, **define el reemplazo** (quién y cuándo). No hay recálculo automático: se alerta y se reasigna a mano.

### Caso congregación
Un empleado = un solo segmento = toda su presencia en una estación. El modelo colapsa al simple.

---

## 8. Facturación (MercadoPago + OpenFactura) — **por empresa**

> **Cada empresa es una entidad tributaria independiente ante el SII** (RUT propio). La suscripción, el cobro y el DTE son **por empresa**, no por cliente. El cliente solo administra (y puede pagar).

### Modelo de cobro
- **Una suscripción por empresa** = un `preapproval` de MercadoPago sobre un `preapproval_plan` por tier, monto fijo **neto** en CLP (`auto_recurring`).
- MercadoPago **no factura por uso**: el tier es un **gate** que se enforcea vía `entitlements` (servidor), no metering.
- **Pagador:** puede ser el cliente (una tarjeta financia varias empresas), pero el **DTE se emite al RUT de la empresa**.
- **Checkout:** redirect al `init_point`. **Sin proración** (cambios aplican el próximo ciclo).

### Emisión de DTE — **dual y opcional** (preferencia del super_admin)
Proveedor de DTE abstracto con dos modos. Default global configurable (`dte_provider_default`), con override por documento. Cada cobro exitoso crea un `documentos_tributarios` en estado `pendiente`.

- **`openfactura` (automático):** al recibir el webhook `subscription_authorized_payment`, una Cloud Function emite el DTE vía **API de OpenFactura** a los datos tributarios de la empresa (`rut`, `razon_social`, `giro`, `direccion`), guarda folio + PDF/XML en Storage → `emitido` → notifica → `notificado`.
- **`sii_manual` (gratuito):** el documento queda `pendiente`. El super_admin emite en el **portal MIPYME del SII**, sube el **PDF + XML** por una vista admin; al subir → `emitido` → **notifica al cliente y a la empresa** → `notificado`.

> El XML debe entregarse al cliente, no solo el PDF visual. El portal gratuito del SII tiene límites de elegibilidad/volumen: confirmar con contador.

### Tiers (por empresa, gatillados por dotación). Precios **netos** (+IVA).
| Tier | Empleados activos* | Precio neto/mes | Notas / Features |
|---|---|---|---|
| Basic | ~25 | $10.000 | **7 días de prueba**; turnos, personal, zonas |
| Pro | ~100 | $30.000 | + algoritmo, reglas, exportaciones |
| Business | +300 | $100.000 | + roles finos, SSO, API |

\* Umbrales de dotación referenciales; ajustables.

- `type: congregacion` → `facturable: false`, gratis, **creada manualmente por super_admin** (no self-serve).
- Límites **por empresa** (sin pooling). Enforcement = **hard block** en `create` de empleados/sucursales (Security Rules).

### Impago (dunning)
`past_due` → acceso en **solo lectura** + avisos recurrentes de pago hasta regularizar.

### Economía (referencia)
- **Costo fijo según modo DTE:** en `sii_manual` ≈ **$0** (ideal con pocos clientes). En `openfactura`: Plan Pyme $360.000/año + IVA (~$30.000/mes neto, 1 razón social propia, DTE ilimitados) + firma (~$1.000/mes). Firebase ~$0 con lectura única.
- **Costo variable por empresa:** comisión MercadoPago **~3,44%** (2,89% + IVA) del bruto; DTE $0 marginal.
- **Contribución por empresa:** Basic ~$9.591 · Pro ~$28.772 · Business ~$95.908.
- **OpenFactura se paga solo** con ~1 cliente Pro o ~3 Basic; antes de eso, conviene `sii_manual`.
- El IVA cobrado se remite al SII (no es ingreso). Confirmar tratamiento con contador.

---

## 9. Requisitos técnicos y seguridad

### Reglas de oro
1. **Aislamiento por tenant:** toda query filtra por `cliente_id`/`company_id`; nada cross-tenant.
2. **Acceso intra-empresa por `grants`** (zona/sucursal), no por `empresa_id` solo.
3. **Seguridad en servidor:** Security Rules reflejan grants + `entitlements`. El guard de Vue es UX.
4. **Lecturas puntuales:** el calendario y vistas similares usan **lectura única (`getDocs`) al abrir**, NO listeners en tiempo real, para acotar el costo de Firestore. Usar listeners solo donde el tiempo real sea imprescindible.
5. **Cada empresa = entidad tributaria independiente**; el DTE va a su RUT.
6. Soft delete + timestamps; navegación por `name`; un `contacto` por persona.

### Security Rules (lineamientos)
- Resolver grant que cubra el doc (por `company_id`/`zone_id`/`ubicacion_id`).
- Validar `entitlements` de la empresa en `create` de `empleados`/`ubicaciones`.
- Webhooks MercadoPago: validar firma `x-signature` + **idempotencia** (eventos duplicados).

### §9-bis — Bootstrap del primer super_admin

Cuando la plataforma no tiene ningún usuario creado (`config/setup` no existe o `initialized != true`), las Security Rules abren temporalmente tres puertas de escritura para el usuario autenticado en Firebase Auth:

| Colección | Permiso especial |
|---|---|
| `config/{docId}` | `write` si `sistemaNoInicializado()` |
| `usuarios/{userId}` | `create` si `uid == userId` y `sistemaNoInicializado()` |
| `contactos/{contactoId}` | `create` si `sistemaNoInicializado()` |

La función helper en las Rules es:
```js
function sistemaNoInicializado() {
  let setupDoc = get(/databases/$(database)/documents/config/setup);
  return !setupDoc.exists || setupDoc.data.initialized != true;
}
```

**Flujo de registro** (`sessionStore.registerFirstSuperAdmin`):
1. `createUserWithEmailAndPassword` → Firebase Auth autentica al usuario.
2. `setDoc(contactos/newId)` → permitido porque `sistemaNoInicializado() == true`.
3. `setDoc(usuarios/authUid)` con `system_role: 'super_admin'` → permitido (uid == userId + no inicializado).
4. `setDoc(config/setup, { initialized: true })` → cierra todas las puertas de bootstrap.
5. `login()` automático → `isSuperAdmin()` ya puede resolverse normalmente.

Una vez que `config/setup.initialized == true`, `sistemaNoInicializado()` devuelve `false` y estas puertas quedan cerradas permanentemente. La pantalla de login (`LoginView.vue`) lee `config/setup` sin autenticar (la regla `allow read: if true` en `config`) para decidir si mostrar el formulario de setup inicial o el de login normal.

---

## 10. Plan de trabajo (por fases)

**Fase 0 — Fundaciones** ✅ *Completa*: colección `clientes`; `empresas.cliente_id`; `src/auth/permissions.ts`.

**Fase 1 — Autorización + cuentas** ✅ *Completa*: `grants` + `puedeAcceder()`; refactor `beforeEach`; Security Rules base; bootstrap del primer super_admin (ver §9-bis). Pendiente diferido a Fase 3: provisión de usuario desde empleado (`crear_acceso` / "Invitar") — se implementará junto al catálogo de cargos.

**Fase 2 — Routing por scope** ✅ *Completa*: prefijos `sucursales/`, `zonas/`; `ZonaLayout` + `views/zona/*`; `AppShell.vue`.

**Fase 3 — Cargos dinámicos** ✅ *Completa*: extender `Cargo`; UI catálogo; provisión de grant desde cargo.

**Fase 4 — Estaciones + scheduling**: `Estacion` (intensidad/max_continuo); demanda desde `ConfiguracionTurnos`; `presencias`, `segmentos`; refactor `asignaciones`; **algoritmo greedy en Cloud Function**; `solicitudes` con estados + reemplazo; calendario con lectura única + notificaciones.

**Fase 5 — Facturación (por empresa)**: datos tributarios en `empresa`; `preapproval_plan` por tier (Basic con 7 días de prueba → `trialing`); checkout `init_point`; webhooks (`subscription_preapproval`, `subscription_authorized_payment`); **emisión DTE dual** (OpenFactura API automático **o** SII manual con upload de PDF/XML a Storage + notificación), seleccionable por `dte_provider_default`; colección `documentos_tributarios`; `entitlements` + hard block; dunning solo-lectura.

**Fase 6 — Multiempresa UX**: `ClienteLayout`, selector de empresa, default si hay una sola.

---

## 11. Glosario

- **Cliente/Cuenta:** administrador (login) de una o más empresas. No se factura aquí.
- **Empresa:** tenant + entidad tributaria (RUT propio) + suscripción. **Se factura aquí.**
- **Contacto:** identidad canónica de la persona.
- **Empleado / Usuario:** facetas opcionales del contacto.
- **Grant:** `(usuario, rol, scope)`.
- **Cargo:** puesto contractual (negocio). **Estación:** competencia operativa (scheduling).
- **ConfiguracionTurnos:** plantilla de demanda de cobertura (default/month/range).
- **Presencia:** ventana de un empleado en el local. **Segmento:** estación asignada por sub-intervalo.
- **Solicitud:** excepción (licencia/feriado/emergencia) con estados y reemplazo.

## 12. Instrucciones Adicionales

- Usa al final de cada cambio "flatpak-spawn --host npx tsc --noEmit 2>&1" para probar 0 errores.
- Siempre deja un registro en este archivo del avance de cada fase en la seccion "13. Registro de Avance"

## 13. Registro de Avance

### Fase 0 — Fundaciones ✅ (2026-06-19)
- Modelos creados con `FirestoreDataConverter`: `Cliente`, `Empresa`, `Contacto`, `Usuario`, `Grant`, `Sesion`, `Empleado`, `Zona`, `Ubicacion`, `Estacion`, `Contrato`, `Asignacion`, `Excepcion`, `ReglaAsignacion`.
- `src/auth/permissions.ts`: mapa `rol → permisos[]` completo.
- Colección `clientes` y campo `cliente_id` en `empresas`.

### Fase 1 — Autorización + cuentas ✅ (2026-06-19)
- `src/auth/access.ts`: `puedeAcceder()` y `can()` con resolución jerárquica de scope.
- `src/stores/grantStore.ts`: carga de grants al login, resolución de slugs empresa/sucursal.
- `src/router/index.ts`: guard `beforeEach` con RBAC — verifica `requiresAuth`, `requiresSuperAdmin`, `requiresCompany`, `requiresUbicacion`.
- `firestore.rules`: Security Rules base desplegadas. Bootstrap del primer super_admin implementado vía `sistemaNoInicializado()` (ver §9-bis).
- `src/stores/sessionStore.ts`: `registerFirstSuperAdmin()` con flujo de bootstrap; `login()` con carga de contacto, empresa y grants; `validateSession()` para rehidratación desde localStorage.
- `src/views/LoginView.vue`: formulario dual — setup inicial (primer super_admin) o login normal, controlado por `checkIfFirstSetup()`.
- **Decisión:** provisión de cuentas desde empleado (`crear_acceso` / "Invitar") diferida a Fase 3.

### Fase 2 — Routing por scope ✅ (2026-06-20)
- Ruta de sucursal cambiada a `/:companySlug/sucursales/:ubicacionSlug` (el param name `ubicacionSlug` no cambió — los links por nombre de ruta son transparentes).
- Nueva ruta `/:companySlug/zonas/:zonaSlug` con `ZonaLayout` + `views/zona/ZonaDashboardView.vue`.
- Guard `beforeEach` extendido con bloque `requiresZona`: resuelve `zonaSlug → id` vía `grantStore.resolverZonaId()` o lectura puntual `resolverYRegistrarZona()`, verifica acceso `zone` scope.
- `src/models/Zona.ts`: campo `slug` agregado al modelo y converter.
- `src/stores/zonaStore.ts`: función `slugify` + slug en `createZona` + `resolverZonaSlug(slug)`.
- `src/stores/grantStore.ts`: `zonaSlugToId`, `registrarZonaSlug()`, `resolverZonaId()`, limpieza en `limpiarGrants()`.
- `src/stores/sessionStore.ts`: campo `activeZonaId` agregado (reset en logout).
- `src/layouts/AppShell.vue`: shell visual unificado (sidebar + topbar móvil + bottombar + offcanvas perfil). Props: `navItems`, `bottomItems?`, `routeParams`, `contextLabel`, `pageTitle`, `perfilRouteName`, `perfilRouteParams`, `isActive`. Slots: `#sidebar-top`, `#sidebar-footer-top`, `#topbar-left`. Evento: `@logout`.
- `EmpresaLayout.vue` y `SucursalLayout.vue` refactorizados para usar `AppShell` — solo conservan `<script setup>` con la lógica propia.
- `ZonaLayout.vue`: nuevo layout para el scope zona, usa `AppShell`, carga `zonaStore.listarZonas()` y establece `activeZonaId`.

### Fase 3 — Cargos dinámicos ✅ (2026-06-20)
- `src/models/Role.ts`: campos `scope_role_template: ScopeRoleTemplate`, `elegible_encargado: boolean`, `estaciones_default: string[]` agregados al modelo + `roleToFirestore`/`roleFromFirestore`. Tipo `ScopeRoleTemplate` exportado.
- `src/stores/empresaStore.ts`: `addWorkRole()` y `updateWorkRole()` actualizados para recibir y persistir los nuevos campos.
- `src/views/empresa/AjustesRolesView.vue`: formulario de creación y edición extendido con selector `scope_role_template` y checkbox `elegible_encargado`.
- `src/views/sucursal/PersonalView.vue`: sección "Acceso al sistema" agregada en el panel de detalle del empleado. Busca usuario existente por `contact_id`, muestra estado y grants actuales, o formulario de invitación con selector de rol y contraseña temporal. Crea usuario en Firebase Auth (app secundaria), doc `usuarios`, y grant con scope automático según rol elegido. `revocarAcceso()` suspende el usuario y revoca todos sus grants de la empresa.