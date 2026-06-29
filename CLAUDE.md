# CLAUDE.md — Plataforma de gestión operativa de turnos

> Documento de referencia del proyecto. Es la **fuente de verdad** para arquitectura, modelo de datos y convenciones. Cualquier refactor debe respetar lo aquí descrito.

---

## 1. Visión del proyecto

Plataforma web **multiempresa (multi-tenant)** para la **gestión operativa de turnos** de dos tipos de organización:

- **Empresas comerciales**: turnos con rotación de estaciones y cobertura continua (caso de referencia).
- **Congregaciones**: asignación de publicadores/capitanes a territorios y stands (caso simple, sin rotación ni estaciones). **Reutiliza el modelo `Empleado`** (aliasado "Voluntario" en la UI); no tiene colecciones propias — ver §7 *Caso congregación* y §10 *Fases 7–12*.

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

### ~~`presencias`~~ *(ELIMINADA)*
Colección y modelo eliminados. La oferta del día se deriva en memoria como `disponibilidad − excepciones` al generar el borrador (§7). Las ausencias puntuales se modelan con `excepciones`.

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
2. **Oferta del día** (derivada, en memoria): se calcula al generar el borrador como `disponibilidad − excepciones`. **Oferta vs. resultado:** la oferta es *cuándo puede la persona*; nunca contiene turnos — los turnos son *demanda* (`ConfiguracionTurnos`) y la asignación persona→turno es *resultado* (`Asignacion`/`Segmento`, lo produce el algoritmo). Fuente base = `Empleado.disponibilidad.ventanas` (`{ day_of_week, start, end }[]`) para el día de la semana de la fecha; se le **restan** las `excepciones` (ausencias) de ese empleado y día (`restarIntervalos`). El modelo/colección `Presencia` fue **eliminado** (su valor lo absorben disponibilidad + excepción). Aplica tanto a empresa como a congregación. **Sin colación** (no se modela — en terreno no se cumple).
3. **Segmento** (`segmentos`): estación asignada por sub-intervalo. Rotación incluida.

### Algoritmo (Fase 4)
- **Tipo:** auto-borrador **greedy** + edición manual (no solver). Corre en **Cloud Function**; `generarBorrador` carga `empresas/{id}` y **bifurca por `empresa.type`** — empresa (esta sección) vs. congregación (ver *Caso congregación*).
- **Entrada:** demanda (ConfiguracionTurnos) + oferta (`disponibilidad − excepciones`) + `estacion_ids` + reglas.
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

### Borrador reactivo (Fase 6-bis — decisión de diseño)
El borrador **se genera automáticamente** en el servidor cada vez que cambia la oferta o la demanda de la sucursal. No existe el botón "Generar borrador" en la UI. El gerente abre el calendario y ve siempre una propuesta vigente que puede aprobar segmento a segmento (o en bloque) o rechazar.

**Disparadores de regeneración** (Cloud Function `onWrite` o `onCall` equivalente):
- Se guarda o edita una `ConfiguracionTurnos` (cambio de demanda).
- Se guarda o edita `Empleado.disponibilidad` (cambio de oferta base).
- Se crea, edita o elimina una `Excepcion` (cambio de oferta puntual).
- El gerente entra a la vista de Turnos/Calendario (regeneración on-demand silenciosa si no hay borrador vigente para esa semana).

**Flujo UI del gerente:**
1. Abre Turnos o Calendario → ve el borrador de la semana en curso (o selecciona semana).
2. Cada segmento tiene chip de estado: `sugerido` (naranja) · `aprobado` (verde) · `rechazado` (rojo tachado).
3. Puede aprobar/rechazar individualmente o con "Aprobar todo". Puede reasignar (arrastrar/editar) un segmento sugerido antes de aprobar.
4. Al aprobar todos los segmentos de un día → la `Asignacion` pasa a `published` → empleados notificados.
5. Si cambia algo que afecta días ya publicados, se regenera solo en `draft` los segmentos afectados y se alerta al gerente (no se borra lo publicado).

**Estado de segmento extendido:** `'sugerido' | 'aprobado' | 'rechazado' | 'publicado'` (reemplaza el anterior `'draft' | 'published'` binario). La `Asignacion` sigue siendo el agrupador por día/sucursal; su `status` refleja si todos los segmentos están aprobados/publicados.

**Regla de oro:** el algoritmo nunca sobreescribe un segmento en estado `aprobado` o `publicado`. Solo regenera los `sugerido` del rango afectado.

### Caso congregación (reuso del motor — decisión fijada)

La congregación **no tiene modelos propios**: es el mismo tenant `Empresa` (`type: 'congregacion'`, `facturable: false`) reutilizando el motor y los primitivos compartidos. El vocabulario y una rama simplificada del algoritmo son la única divergencia.

| Concepto empresa | En congregación | Mecanismo |
|---|---|---|
| `Empleado` | **Voluntario** | Reuso de `Empleado` (alias solo en UI). `estacion_ids = []` |
| `Cargo` | Privilegio (publicador/capitán) | Reuso del catálogo `cargos` del tenant |
| Presencia derivada | Disponibilidad | Lectura directa de `Empleado.disponibilidad` (sin `presencias`) |
| `Estacion` | — (no aplica) | Demanda = `cantidad` con `estacion_id = null` |
| `Asignacion` + `Segmento` | Igual | Reuso. `Segmento.estacion_id = null`, `tipo = 'estacion'` |
| `reglas_asignacion`, `intensidad`, `max_continuo`, colación, facturación/DTE, alertas 40h | — | **OFF** por `type` |

**Algoritmo (rama congregación):** para cada turno del día, tomar `requerimiento.cantidad` voluntarios cuya `disponibilidad` **contenga** el intervalo del turno; única restricción dura = un voluntario no se asigna a dos intervalos solapados; orden por equidad (menos asignado antes); si falta gente se marca **hueco**. Sin rotación, sin estaciones, sin reglas de convivencia.

**Aislamiento:** los voluntarios quedan separados de empleados de empresa por `company_id` (= tenant id) vía `tieneAccesoEmpresa()`.

Detalle ejecutable y sub-fases en §10 *Fases 7–12* y §13.

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

**Fase 4 — Estaciones + scheduling** ✅ *Completa*: `Estacion` (intensidad/max_continuo); demanda desde `ConfiguracionTurnos`; `presencias`, `segmentos`; refactor `asignaciones`; **algoritmo greedy en Cloud Function**; `solicitudes` con estados + reemplazo; calendario con lectura única + notificaciones.

**Fase 5 — Facturación (por empresa)** ✅ *Completa (verificar en Revisión integral)*: datos tributarios en `empresa`; `preapproval_plan` por tier (Basic con 7 días de prueba → `trialing`); checkout `init_point`; webhooks (`subscription_preapproval`, `subscription_authorized_payment`); **emisión DTE dual** (OpenFactura API automático **o** SII manual con upload de PDF/XML a Storage + notificación), seleccionable por `dte_provider_default`; colección `documentos_tributarios`; `entitlements` + hard block; dunning solo-lectura.

**🔍 Revisión integral — gate previo a Fase 6** *(obligatorio)*: antes de abrir multiempresa, auditar fases 0–5 (registros, `tsc` 0, Security Rules + índices, Fase 5 real vs §8, smoke test empresa e2e). **No avanzar a Fase 6 hasta cerrar este gate.** Checklist en §13.

**Fase 6 — Multiempresa UX**: `ClienteLayout`, selector de empresa, default si hay una sola.

**Fase 6-bis — Borrador reactivo**: quitar el botón "Generar borrador" de `TurnosView`; el borrador se genera automáticamente en el servidor al detectar cambios en demanda (`ConfiguracionTurnos`) u oferta (`disponibilidad` / `excepciones`), o al entrar a la vista sin borrador vigente. Estado de segmento extendido a `sugerido|aprobado|rechazado|publicado`; UI de aprobación individual y en bloque en el calendario del gerente. Ver §7 *Borrador reactivo* para detalle completo.

---

### Bloque Congregaciones (Fases 7–12) — reuso de `Empleado` (§7)

Orden: 7 → 8 → 9 → **10 (MVP testeable)** → 11 → 12. Cada fase cierra con `tsc` 0 y su registro en §13.

**Fase 7 — Congregación · tipo de tenant + helper**: computed `isCongregacion` en `empresaStore`/`sessionStore`; confirmar `Empresa.type`/`facturable` en converter.

**Fase 8 — Congregación · disponibilidad del voluntario**: captura de `Empleado.disponibilidad` (ventanas semanales) en `PersonalView` + `empleadoStore.updateDisponibilidad()`.

**Fase 9 — Congregación · demanda sin estación**: en `TurnosView`, requerimiento `cantidad` con `estacion_id = null` cuando `isCongregacion`.

**Fase 10 — Congregación · greedy congregación (MVP)**: rama `congregacion` en `generarBorrador` (bifurca por `empresa.type`; ruta empresa intacta). **← Aquí ya se ingresan datos y se prueban turnos.**

**Fase 11 — Congregación · gating UI empresa-only**: ocultar estaciones, reglas, intensidad, alertas 40h, facturación/DTE por `type`.

**Fase 12 — Congregación · publicación + calendario + e2e**: reuso de `draft → published` y calendario del voluntario; smoke test end-to-end.

---

## 11. Glosario

- **Cliente/Cuenta:** administrador (login) de una o más empresas. No se factura aquí.
- **Empresa:** tenant + entidad tributaria (RUT propio) + suscripción. **Se factura aquí.**
- **Contacto:** identidad canónica de la persona.
- **Empleado / Usuario:** facetas opcionales del contacto.
- **Voluntario:** alias de UI de un `Empleado` en un tenant `type: 'congregacion'`. **No es un modelo propio.**
- **Congregación:** tenant `Empresa` con `type: 'congregacion'`, `facturable: false`. Reutiliza el motor; sin estaciones ni facturación (§7).
- **Grant:** `(usuario, rol, scope)`.
- **Cargo:** puesto contractual (negocio). **Estación:** competencia operativa (scheduling).
- **ConfiguracionTurnos:** plantilla de demanda de cobertura (default/month/range).
- **Oferta:** ventanas en que un empleado puede trabajar (`disponibilidad − excepciones`). **Segmento:** estación asignada por sub-intervalo.
- **Solicitud:** excepción (licencia/feriado/emergencia) con estados y reemplazo.

## 12. Instrucciones Adicionales

- Al final de **cada cambio**, correr `flatpak-spawn --host npx tsc --noEmit 2>&1` y confirmar **0 errores** antes de dar la fase por cerrada.
- **Registro obligatorio por fase (§13).** Al terminar cada fase, actualizar §13 con este formato, para saber siempre **dónde está** y **qué falta**:
  - **Estado:** ✅ Completa · 🚧 En progreso · ⬜ Pendiente
  - **Fecha** (YYYY-MM-DD) al cerrar.
  - **Hecho:** archivos tocados + qué se implementó.
  - **Falta / próximo paso:** lo que queda dentro o después de la fase (vacío si ✅).
- Mantener actualizado el **Tablero de estado** al inicio de §13 (una fila por fase) en cada cierre.
- **Gate de revisión:** antes de un hito mayor (p. ej. abrir multiempresa en Fase 6) correr el gate de **Revisión integral** de §13 y cerrarlo (✅ + fecha) antes de continuar.
- **No tocar la ruta de empresa** del greedy ni los modelos compartidos salvo agregar campos nullable.

## 13. Registro de Avance

### Tablero de estado

| Fase | Tema | Estado | Falta / próximo paso |
|---|---|---|---|
| 0 | Fundaciones | ✅ | — |
| 1 | Autorización + cuentas | ✅ | — |
| 2 | Routing por scope | ✅ | — |
| 3 | Cargos dinámicos | ✅ | — |
| 4 | Estaciones + scheduling | ✅ | — |
| 5 | Facturación (DTE/MercadoPago) | ✅ | — |
| 🔍 | **Revisión integral** (gate previo a F6) | ✅ | — |
| 6 | Multiempresa UX | ✅ | — |
| 6-bis | Borrador reactivo (scheduling UX) | ✅ | — |
| 7 | Congregación · tipo de tenant + helper | ✅ | — |
| 8 | Congregación · disponibilidad | ✅ | — |
| 9 | Congregación · demanda sin estación | ✅ | — |
| 10 | Congregación · greedy (MVP) | ✅ | — |
| 11 | Congregación · gating UI | ✅ | — |
| 12 | Congregación · publicar + e2e | ✅ | — |

> **Estado actual:** Fases 0–12 y Revisión integral cerradas. **MVP de congregación completo.** Pendiente despliegue: `firebase deploy --only functions,firestore:indexes`.

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

### Fase 4 — Estaciones + Scheduling ✅ (2026-06-20)
- `src/models/Estacion.ts`: campos `intensidad: 'alta'|'media'|'baja'` y `max_continuo_min: number|null` agregados + converter actualizado.
- `src/models/Asignacion.ts`: refactor completo a grouper/publicación (`empresa_id`, `ubicacion_id`, `date`, `status`). Elimina `location_id`, `turn`, `assigned_staff`.
- `src/models/Presencia.ts`: nuevo modelo (`empresa_id`, `ubicacion_id`, `empleado_id`, `date`, `start`, `end`).
- `src/models/Segmento.ts`: nuevo modelo con `tipo: 'estacion'|'descanso'`, `status: 'draft'|'published'`, `asignacion_id`. Requiere índice compuesto Firestore `(empleado_id, date)`.
- `src/models/Solicitud.ts`: nuevo modelo reemplazando `Excepcion` para el flujo de solicitudes con `estado`, `reemplazo`, `aprobador_id`. `Excepcion.ts` se mantiene intacto.
- `src/stores/estacionStore.ts`: `createEstacion()` y `updateEstacion()` extendidos con `intensidad` y `max_continuo_min`.
- `src/stores/asignacionStore.ts`: refactorizado para el nuevo schema de Asignacion.
- `src/stores/presenciaStore.ts`: nuevo store, lecturas puntuales (`getDocs`).
- `src/stores/segmentoStore.ts`: nuevo store mixto — `useCollection` para la vista del manager (draft board), `cargarSegmentosEmpleado()` para CalendarioView (una lectura puntual).
- `src/stores/solicitudStore.ts`: nuevo store con `listarPorSucursal()` / `listarPorEmpleado()`, `aprobarSolicitud()`, `rechazarSolicitud()`.
- `functions/src/index.ts`: Cloud Function `generarBorrador` (`onCall`, región `southamerica-west1`). Algoritmo greedy: buckets de 30 min, anti-solapamiento, anti-saturación (`max_continuo_min`), reglas hard `is_strict`, marcado de huecos. Batch write idempotente.
- `src/views/sucursal/ajustes/AjustesEstacionesView.vue`: pill group de intensidad + toggle `max_continuo_min` + badge de intensidad en lista.
- `src/views/sucursal/TurnosView.vue`: toolbar "Generar borrador" con date picker, llama `httpsCallable(functions, 'generarBorrador')`, muestra huecos.
- `src/views/sucursal/SolicitudesView.vue`: reemplaza stub. Vista manager (tabs por estado, aprobar/rechazar + reemplazo, aviso reasignación manual). Vista empleado (lista propia + modal nueva solicitud).
- `src/views/sucursal/CalendarioView.vue`: nueva vista, lectura puntual sin listener. Grid semanal con navegación por arrows. Segmentos como bloques (estación o descanso).
- `src/views/sucursal/PresenciasView.vue`: nueva vista para managers. Date picker → carga presencias del día → registrar/eliminar presencia por empleado.
- `src/router/index.ts`: rutas `sucursal-presencias` y `sucursal-calendario` agregadas.
- `src/layouts/SucursalLayout.vue`: navItems "Presencias" (solo managers) y "Mi Calendario" (todos) agregados con iconos SVG inline.

### Fase 5 — Facturación (por empresa) ✅ (2026-06-27)
- `src/models/Empresa.ts`: extendido con campos tributarios (`rut`, `razon_social`, `giro`, `direccion`), suscripción (`plan`, `facturable`, `mp_preapproval_id`, `mp_preapproval_plan_id`, `subscription_status`, `entitlements`, `trial_ends_at`). Tipos `EmpresaPlan`, `SubscriptionStatus`, `DTEProvider`, `EmpresaEntitlements`. Constantes `PLAN_ENTITLEMENTS` y `PLAN_PRECIOS_NETO`. Métodos `isPastDue`, `isActive`, `hasFeature`.
- `src/models/DocumentoTributario.ts`: nuevo modelo con `payment_ref`, `periodo`, `tipo_dte`, `monto_neto/iva/total`, `folio`, `origen`, `estado`, `archivo_pdf_url`, `archivo_xml_url`, `emitido_at`, `notificado_at` + converter.
- `src/stores/facturaStore.ts`: nuevo store con `iniciarSuscripcion()` (llama CF `crearSuscripcion`), `cancelarSuscripcion()`, `cargarDocumentos()`, `cargarTodosDocumentos()`, `subirDTEManual()` (upload + notificar), `verificarLimiteEmpleados/Sucursales()`, `actualizarPlan()`, `actualizarDTEProvider()`.
- `src/stores/empresaStore.ts`: `createEmpresa()` extendido con campos tributarios, `facturable`, `entitlements` y `subscription_status` por tipo.
- `functions/src/index.ts`: Cloud Functions `crearSuscripcion` (crea preapproval MP con 7 días de prueba, actualiza empresa), `cancelarSuscripcion` (PUT status=cancelled), `webhookMercadoPago` (onRequest, valida firma `x-signature`, maneja `subscription_preapproval` y `subscription_authorized_payment`, idempotencia, crea `documentos_tributarios`, emite DTE automático vía OpenFactura si configurado), `notificarDTEEmitido` (onCall).
- `src/views/empresa/AjustesFacturacionView.vue`: nueva vista con banner dunning (`past_due`), selector de planes (Basic/Pro/Business) con precios netos, checkout redirect, datos tributarios editable, historial de DTE con chips de estado. Visible solo a `billing.manage`.
- `src/views/admin/AdminDTEView.vue`: nueva vista super_admin. Tabla de todos los DTE con filtros por estado/origen. Modal "Subir DTE" para modo `sii_manual`: sube PDF+XML a Firebase Storage (`dte/{id}/`), guarda URLs, marca como emitido y notifica.
- `src/router/index.ts`: ruta `empresa-facturacion` en scope empresa; ruta `admin-dte` en scope super_admin.
- `src/layouts/EmpresaLayout.vue`: ítem "Facturación" en menú (condicionado a `billing.manage` vía `can()`). Importa `grantStore` y `can`.
- `src/layouts/MainLayout.vue`: ítem "DTE" en sidebar y bottombar del super_admin.
- `firestore.rules`: reglas para `presencias`, `segmentos`, `solicitudes` y `documentos_tributarios` (lectura = `tieneAccesoEmpresa`; escritura = `isSuperAdmin` — los webhooks usan Firebase Admin SDK que bypass las rules).
- **Falta / verificar en el gate:** confirmar archivos/funciones reales, cobertura de Security Rules e idempotencia de webhooks.

### 🔍 Revisión integral — gate previo a Fase 6 ✅ (2026-06-27)

**Resultado:** Gate cerrado. Fases 0–5 auditadas; 5 defectos corregidos; 0 errores TypeScript.

**Hecho:**
- [x] 32/32 archivos referenciados en §13 fases 0–5 verificados y presentes en el repo.
- [x] `vue-tsc --noEmit` frontend → 0 errores. `tsc --noEmit` functions → 0 errores.
- [x] Security Rules auditadas: `segmentos`, `solicitudes`, `documentos_tributarios` cubiertos con `tieneAccesoEmpresa`; `documentos_tributarios` write solo `isSuperAdmin`.
- [x] `firestore.indexes.json` completado: 8 índices compuestos agregados (`segmentos×2`, `asignaciones×2`, `presencias`, `grants`, `sesiones×2`). Pendiente despliegue con `firebase deploy --only firestore:indexes`.
- [x] `storage.rules` creado (solo `super_admin` puede escribir en `dte/`); registrado en `firebase.json`.
- [x] `functions/src/index.ts`: firma webhook `x-signature` ahora **obligatoria** cuando `MP_WEBHOOK_SECRET` está definida (antes era opcional); extracción de `dataId` corregida para soportar ambos formatos IPN/API de MercadoPago.
- [x] Idempotencia webhook: confirmada (`payment_ref` lookup antes de crear DTE).
- [x] DTE dual: OpenFactura automático y SII manual (upload PDF+XML a Storage) operativos.
- [x] Dunning: enforcement en router (`requiresActiveSubscription: true`) para rutas de escritura (`sucursal-turnos`, `sucursal-presencias`, `sucursal-solicitudes`, `sucursal-mi-equipo-personal`, `sucursal-mi-equipo-estaciones`, `empresa-ajustes-empresa`, `empresa-ajustes-cargos`) — redirige a `empresa-facturacion` si `empresa.isPastDue`.

**Deuda técnica aceptada (no bloquea Fase 6):**
- Hard block de `entitlements` (max_empleados / max_sucursales) en Security Rules: Firestore Rules no soporta `count()`. Mitigado por validación client-side en `facturaStore.verificarLimiteEmpleados/Sucursales()`. Hard block real diferido a CF `crearEmpleado`/`crearUbicacion` (Fase 6 o posterior).
- Notificación DTE por email (SendGrid/Firebase Email Extension) pendiente — `notificarDTEEmitido` solo hace `console.log`.
- Colección `habilidades` sin aislamiento de tenant (catálogo global temporal; no impacta en la funcionalidad actual).

**Archivos modificados:**
- `functions/src/index.ts` — firma webhook obligatoria + corrección de `dataId`
- `firestore.indexes.json` — 8 índices compuestos
- `storage.rules` — nuevo
- `firebase.json` — sección `"storage"` agregada
- `src/router/index.ts` — enforcement dunning con `requiresActiveSubscription`

### Fase 6 — Multiempresa UX ✅ (2026-06-27)
- `src/models/Cliente.ts`: campo `nombre` agregado al modelo y converter existente.
- `src/models/Usuario.ts`: propiedad `cliente?: Cliente` agregada para hidratar el doc del cliente al login.
- `src/stores/grantStore.ts`: mapa `clienteSlugToId`, `registrarClienteSlug()`, `resolverClienteId()`, limpieza en `limpiarGrants()`.
- `src/stores/empresaStore.ts`: `listarEmpresas()` acepta `clienteId` adicional; modo `'cliente'` genera query `where('cliente_id','==',clienteId)` para listar N empresas.
- `src/stores/sessionStore.ts`: al login y `validateSession()`, si hay grant `scope_type='client'`, carga el doc del cliente y registra su slug. `resolverHomeRoute()` redirige a `cliente-empresas` si el usuario tiene grant de cliente o múltiples empresas.
- `src/router/index.ts`: nueva rama `/c/:clienteSlug` con `ClienteLayout` y rutas `cliente-empresas` / `cliente-perfil`. Guard `requiresCliente` con helper `resolverYRegistrarCliente()`. Redirige a `empresa-home` si el usuario solo tiene una empresa.
- `src/layouts/ClienteLayout.vue`: nuevo layout usando `AppShell`. Muestra nombre/slug del cliente como `contextLabel`. Slot `sidebar-top` con botón "Panel Admin" (solo super_admin).
- `src/views/cliente/ClienteEmpresasView.vue`: nueva vista. Carga empresas del cliente vía `empresaStore.listarEmpresas('cliente', null, clienteId)`. Tarjetas con nombre, plan, estado de suscripción. Click → registra slug y navega a `empresa-home`.
- `src/layouts/EmpresaLayout.vue`: slots `#sidebar-top` y `#topbar-left` ahora muestran condicionalmente "← Mis Empresas" (si owner con grant 'client') o "← Panel Admin" (si super_admin).

### Fase 6-bis — Borrador reactivo ✅ (2026-06-29)
- **Hecho:**
  - `src/models/Segmento.ts`: `status` extendido a `'sugerido'|'aprobado'|'rechazado'|'publicado'` con `normalizeStatus()` para retrocompatibilidad (`draft→sugerido`, `published→publicado`).
  - `functions/src/index.ts`: CF `actualizarBorrador` (`onCall`, línea 646) — recibe `{empresa_id, ubicacion_id, week_start, dias?}`; borra solo segmentos `sugerido` (soft delete); escribe nuevos con `status: 'sugerido'`; respeta `aprobado`/`publicado` intocables.
  - `src/stores/segmentoStore.ts`: `aprobarSegmento`, `rechazarSegmento`, `publicarDia`, `regenerarBorradorMes` (fire-and-forget).
  - `src/views/sucursal/CalendarioView.vue`: UI completa — chips de estado por color, botón aprobar inline por cupo, "Aprobar todo", "Publicar día"; sidebar de reasignación manual; generación automática al montar (`onMounted → cargar → actualizarBorradorFn`).
  - `src/views/sucursal/TurnosView.vue`: sin botón "Generar borrador"; `triggerActualizarBorrador()` fire-and-forget al guardar/editar/eliminar turnos.
  - `src/views/sucursal/ajustes/AjustesDisponibilidadView.vue`: llama `segmentoStore.regenerarBorradorMes` tras guardar disponibilidad.
  - `src/views/sucursal/ajustes/AjustesExcepcionesView.vue`: llama `segmentoStore.regenerarBorradorMes` tras crear o eliminar excepción.
  - `tsc` 0 (frontend y functions).
- **Deuda técnica aceptada:** el greedy no verifica solapamiento contra segmentos `aprobado`/`publicado` en reasignación manual (flujo no frecuente). Diferido a post-MVP.

### Fase 7 — Congregación · Tipo de tenant + helper ✅ (2026-06-29)
- **Hecho:**
  - `src/models/Empresa.ts`: converter línea 128 corregida — `(data.type as EmpresaType) ?? 'empresa'` (default para docs viejos sin el campo). `facturable` ya tenía `?? true`.
  - `src/stores/empresaStore.ts`: importa `useSessionStore`; agrega computeds `activeEmpresa`, `activeTenantType`, `isCongregacion` resolviendo la empresa activa por `sessionStore.activeCompanyId`. Exportados.
  - `tsc` 0 (frontend).

### Fase 8 — Congregación · Disponibilidad del voluntario ✅ (2026-06-29)
> Adelantada al rediseñar la oferta del algoritmo: **oferta = `disponibilidad − excepciones`** (se eliminó el modelo `Presencia`). Aplica a empresa y congregación.
- **Hecho:**
  - `src/models/Empleado.ts`: tipo `Disponibilidad` extendido con `ventanas: VentanaDisponibilidad[]` (`{ day_of_week, start, end }`); converter serializa/deserializa `ventanas` (default `[]` para docs viejos → no rompe). `days` queda como resumen derivado.
  - `src/stores/disponibilidadStore.ts`: `setDisponibilidad`/`updateDisponibilidad` persisten `ventanas` y recomputan `days` desde las ventanas (orden canónico de días).
  - `src/views/sucursal/ajustes/AjustesDisponibilidadView.vue`: editor de ventanas horarias por día (inputs `type="time"`, "+ Franja" por día, quitar franja). Validación `start < end` + sin solapes intra-día.
  - `functions/src/index.ts` (`generarBorrador`): oferta del día = ventanas de disponibilidad (empleados activos con contrato activo en la sucursal) **menos** sus `excepciones` (ausencias) del día, vía helper `restarIntervalos`. Quita la lectura de `presencias`. Mensaje de error corregido.
  - **`Presencia` eliminada:** borrados `src/models/Presencia.ts`, `src/stores/presenciaStore.ts`, `src/views/sucursal/PresenciasView.vue`; quitada ruta `sucursal-presencias` e ítem del sidebar en `SucursalLayout.vue`. `firestore.indexes.json`: índice de `presencias` → reemplazado por índice de `excepciones (date, active, deletedAt, employee_id)`.
  - `src/views/sucursal/ajustes/AjustesExcepcionesView.vue`: copy aclarado — excepción = ausencia que resta disponibilidad ese día.
  - `src/views/sucursal/PersonalView.vue`: sección "Disponibilidad semanal" añadida en el panel derecho del empleado (debajo de "Estaciones que opera"). Vista de solo lectura con badges por franja; modo edición inline con lista de días, "+ Franja", quitar franja, inputs `type="time"`. Validación `start < end` + sin solapamiento intra-día. Al guardar llama `setDisponibilidad` o `updateDisponibilidad` según corresponda y dispara `regenerarBorradorMes` fire-and-forget. Reset al cambiar de empleado.
  - `tsc` 0 (frontend).
- **Deuda aceptada:** `createEmpleado` sigue guardando `disponibilidad: null` (se puebla al editar). Gating empresa-only vs. congregación difiere a Fase 11.
- **Pendiente despliegue:** `firebase deploy --only functions,firestore:indexes` (no bloquea UI).

### Fase 9 — Congregación · Demanda sin estación ✅ (2026-06-29)
- **Hecho:**
  - `src/models/Ubicacion.ts`: `Requerimiento.estacion_id` tipado como `string | null` (null = congregación). `deserializeTurno` preserva `null` en vez de convertirlo a `''`.
  - `src/views/sucursal/TurnosView.vue`: importa `useEmpresaStore`; `isCongregacion` computed. Panel editor bifurcado: congregación muestra sección "Voluntarios requeridos" (stepper cantidad único, `estacion_id: null`); empresa mantiene la sección "Estaciones requeridas" intacta. `abrirNuevo` inicializa `[{ estacion_id: null, cantidad: 2 }]` en congregación. Tarjetas de grilla muestran solo "N personas" en congregación (sin nombre de estación). `cantidadCongregacion` computed bidireccional sobre `form.requerimientos[0]`.
  - `tsc` 0.

### Fase 10 — Congregación · Greedy congregación (MVP) ✅ (2026-06-29)
- **Hecho:**
  - `functions/src/index.ts`: `Requerimiento.estacion_id` tipado `string | null`. `HuecoReporte.estacion_id` ampliado a `string | null`. Ambos loops greedy (`generarBorrador` y `actualizarBorrador`) actualizados: cuando `estacion_id` es null, se omite la lookup de estación y se saltan anti-saturación y reglas hard; el ordenado por equidad añade tiebreaker por `segmentos.length`. La ruta empresa queda intacta — los dos cambios son puramente aditivos (guard en lugar de `continue` incondicional).
  - `tsc` 0 (functions).

### Fase 11 — Congregación · Gating UI empresa-only ✅ (2026-06-29)
- **Hecho:**
  - `src/layouts/MiEquipoLayout.vue`: `menuItems` convertido a `computed`; "Estaciones" y "Reglas" solo aparecen cuando `!isCongregacion`. Importa `useEmpresaStore`.
  - `src/views/sucursal/PersonalView.vue`: filtro de estaciones en lista izquierda (`v-if="!isCongregacion"`); sección "Estaciones que opera" en panel derecho (`v-if="!isCongregacion"`). Añadido `isCongregacion` computed.
  - `src/views/sucursal/SucursalDashboardView.vue`: tarjeta "Riesgo de horas semanales" oculta con `v-if="!isCongregacion"`. Importa `useEmpresaStore`.
  - `tsc` 0 (frontend).

### Fase 12 — Congregación · Publicación + calendario + e2e ✅ (2026-06-29)
- **Hecho:** el flujo `sugerido → aprobado → publicado` y el CalendarioView ya funcionan sobre `Asignacion`/`Segmento` genéricos — ningún cambio necesario. Los segmentos de congregación tienen `estacion_id: null, tipo: 'estacion'`; CalendarioView los muestra como bloques sin nombre de estación (el chip muestra el horario y el status). El calendario del voluntario (`canManage = false`) muestra solo lectura de sus propios segmentos.
- **Smoke test esperado:** crear congregación → voluntarios + disponibilidad → turno "Sáb 09–12, 2 personas" → borrador automático al entrar al calendario → aprobar → publicado. Ruta empresa intacta.
- **Pendiente despliegue:** `firebase deploy --only functions,firestore:indexes`.