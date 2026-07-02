# PLAN — Refactor del modelo de asignaciones + Diagnóstico del algoritmo + Consola de logs + Fix del calendario

> Documento ejecutable para **Sonnet**. Cinco objetivos, en orden de dependencia:
> 1. **Refactor de modelo (grande):** eliminar la colección/modelo `segmentos`. La **`Asignacion` pasa a ser el turno efectivo de UN empleado en un día+horario** (absorbe lo que hoy es el segmento), **sin buckets de 30 min**. Estados **solo `sugerido` | `publicado`** (se eliminan `draft`, `aprobado`, `rechazado`).
> 2. **Regla dura nueva:** un empleado **NUNCA** se repite en el mismo turno (mismo día+horario), sin importar habilidades ni horas. Una persona no se divide.
> 3. **Regenerar sugerencias** debe **borrar las sugerencias previas** y producir un resultado **posiblemente distinto** (rotación de equidad), tanto en empresa como en congregación. Hoy falla en silencio y no borra lo anterior.
> 4. **Consola de logs en pantalla** (barra inferior desplegable) que muestre logs de cliente y de Cloud Functions, para que "regenerar falla y no dice por qué" deje de pasar.
> 5. **Fix del calendario** (no funciona).
>
> **Decisiones del usuario ya tomadas (no volver a preguntar):**
> - **D1:** `Asignacion` = persona + turno completo (con `empleado_id`, `estacion_id`, `date`, `start`, `end`, `status`). **Eliminar `segmentos`** (colección, modelo, store, todos los usos).
> - **D2:** Estados de asignación = **`'sugerido' | 'publicado'`** únicamente. Fuera `draft`, `aprobado`, `rechazado`.
> - **D3:** **Sin buckets de 30 min.** Una asignación = un empleado en el turno **completo** (`start`=turno.start_time, `end`=turno.end_time).
> - **D4:** Un empleado por turno como **máximo una vez** (regla dura). En empresa, si un turno pide varias estaciones a la misma hora, son **personas distintas**.
> - **D5:** Solo **gerente / encargado de la sucursal/zona / super_admin** editan una asignación **publicada**.
>
> **Reglas del proyecto (de `CLAUDE.md`) que se DEBEN respetar:**
> - Al final de **cada cambio**: `flatpak-spawn --host npx tsc --noEmit 2>&1` (frontend) y `cd functions && npx tsc --noEmit` (functions) → **0 errores**.
> - Soft delete (`active`+`deletedAt`) + timestamps en todo; navegación por `name`; lecturas puntuales (no listeners) en calendario.
> - Registrar el avance en §13 de `CLAUDE.md` al cerrar.
> - **Nota importante:** esta es una app en desarrollo sin datos de producción críticos → se permite **romper compatibilidad** del modelo viejo (no se requiere migración de datos de `segmentos` existentes; se pueden descartar). Confirmar con el usuario antes de borrar datos reales si los hubiera.

---

## 0. Modelo de datos objetivo (después del refactor)

```
Turno (ConfiguracionTurnos en ubicacion)  → DEMANDA: qué puestos cubrir, qué día y horario, cuántas personas.
Asignacion (colección 'asignaciones')     → RESULTADO: un empleado en un turno concreto (día+horario), con estación.
```

### `asignaciones` (nuevo esquema — reemplaza segmentos)
```
id,
empresa_id, ubicacion_id,
empleado_id,               ← NUEVO (antes solo en segmento)
date,                      ← YYYY-MM-DD
estacion_id: string|null,  ← NUEVO (null en congregación)
start, end,                ← NUEVO: horario del TURNO COMPLETO (HH:MM), sin buckets
status: 'sugerido'|'publicado',  ← SOLO estos dos
active, createdAt, updatedAt, deletedAt   ← soft delete + timestamps
```
Índice compuesto requerido: `(ubicacion_id, date)` y `(empleado_id, date)`.

> **Se elimina** el concepto de "asignación agrupadora por día" y el de "segmento". Ya no hay `tipo: 'estacion'|'descanso'` (los descansos existían solo por el troceo en buckets → desaparecen con D3).

**Invariante dura (D4):** para un mismo `(ubicacion_id, date, start, end)` no puede haber dos `asignaciones` activas con el mismo `empleado_id`. Y más fuerte aún: un empleado no puede tener **dos asignaciones que se solapen** el mismo día (ni siquiera en turnos distintos que se pisen).

---

## 1. TAREA 0 — Refactor del modelo (hacer PRIMERO; todo lo demás depende)

### 1.1 Modelos
- **`src/models/Asignacion.ts`:**
  - `AsignacionStatus = 'sugerido' | 'publicado'`.
  - Agregar campos: `empleado_id: string`, `estacion_id: string | null`, `start: string`, `end: string`, `active: boolean`.
  - Actualizar converter (to/from Firestore) con esos campos. `fromFirestore`: normalizar status legacy → `data.status === 'draft' || 'aprobado' ? 'sugerido' : data.status === 'published' ? 'publicado' : (data.status ?? 'sugerido')` (por si quedan docs viejos). Default `active: data.active ?? true`.
  - `get isPublished()` → `status === 'publicado'`.
- **`src/models/Segmento.ts`:** **ELIMINAR** el archivo.

### 1.2 Stores
- **`src/stores/segmentoStore.ts`:** **ELIMINAR**. Migrar su API útil a `asignacionStore`.
- **`src/stores/asignacionStore.ts`:** reescribir. Debe ofrecer (nombres sugeridos):
  - `cargarAsignacionesManager(ubicacionId, dateStart, dateEnd): Promise<Asignacion[]>` — lectura puntual `getDocs`, todos los estados, `deletedAt == null`.
  - `cargarAsignacionesEmpleado(empleadoId, dateStart, dateEnd): Promise<Asignacion[]>` — solo `status == 'publicado'`.
  - `publicarDia(ubicacionId, date)` — pasa todas las `sugerido` del día a `publicado`.
  - `softDeleteAsignacion(id)`.
  - `regenerarSugerencias(empresaId, ubicacionId, weekStart, dias)` — llama la CF `actualizarBorrador` (o renómbrala `generarAsignaciones`, ver §3) y **devuelve la respuesta con `logs`** para volcarla a la consola (no fire-and-forget silencioso; ver §4).
  - Quitar `aprobarSegmento`/`rechazarSegmento`/`publishSegmentos`.
- **Callers de `regenerarBorradorMes`** (fire-and-forget) en `AjustesDisponibilidadView.vue`, `AjustesExcepcionesView.vue`, `PersonalView.vue`: repuntar a la nueva función del `asignacionStore` (mismo comportamiento fire-and-forget, pero que ante error registre en `logStore.error`, no que lo trague).

### 1.3 Vistas
- **`src/views/sucursal/CalendarioView.vue`:** reescritura mayor (es quien más usa segmentos). Cambios:
  - Sustituir todo `segmento(s)`/`segmentoStore` por `asignacion(es)`/`asignacionStore`.
  - **Quitar toda la lógica de buckets:** `generarBuckets30`, `bucketsDeTurno`, `empleadosPorTurno` (colapso por buckets), `limpiarDuplicadosSugeridos` (ya no hay buckets que colapsar → simplificar a "una asignación por cupo"). Un cupo del turno = una asignación (una persona).
  - **Estados:** quitar botones/lógica de `aprobar`/`aprobarTodo`/`aprobarDesideSidebar`/`rechazar`. El flujo es: ver `sugerido` → editar/quitar/reasignar → **Publicar** (día o en bloque). Un `sugerido` se publica directo.
  - `claseSeg`/`labelStatus`/`claseChipStatus`: reducir a dos estados.
  - **Empresa (grilla semanal):** cada `req` del turno con `cantidad N` → N cupos; cada cupo muestra 1 asignación (empleado) o "sin asignar". Al asignar manual, se crea **una** asignación (no buckets).
  - **Congregación (grilla mensual):** cada turno pide `cantidad` voluntarios → N asignaciones con `estacion_id: null`, `start/end` = turno completo. `empleadosPorTurnoFecha` compara por **solape** (`a.start < turno.end_time && a.end > turno.start_time`), no igualdad estricta (ver §5 B2).
  - `abrirSidebarVacio`/`reasignar`/`agregarVoluntarioCong`/`quitarVoluntarioCong`: crear/editar **una** asignación por persona (sin buckets).
  - **Edición de publicados (D5):** permitir editar/reasignar una asignación `publicado` solo si `canManage` (ya es el caso) — no bloquear por estado, pero sí registrar que se editó un publicado (log). Para el empleado (no manager) es solo lectura.
- **`PersonalView.vue`, `AjustesDisponibilidadView.vue`, `AjustesExcepcionesView.vue`:** cambiar el import/uso de `segmentoStore.regenerarBorradorMes` por el equivalente de `asignacionStore`.

### 1.4 Security Rules e índices
- **`firestore.rules`:**
  - Bloque `segmentos` (línea ~204): **eliminar**.
  - Bloque `asignaciones` (línea ~172): actualizar. `read` = `tieneAccesoEmpresa`. `create/update/delete` (sugerido) = manager con permiso `schedule.write` sobre el scope. **Editar `publicado`** = solo `schedule.publish`/manager/super_admin (D5). Reflejar que ahora la asignación tiene `empleado_id`, etc.
- **`firestore.indexes.json`:**
  - Quitar los 2 índices de `segmentos`.
  - Asegurar en `asignaciones`: `(ubicacion_id ASC, date ASC)` y `(empleado_id ASC, date ASC)`.
  - Tras el refactor: `firebase deploy --only firestore:indexes` (pedir al usuario).

### 1.5 `tsc` 0 tras esta tarea (frontend). No seguir hasta que compile.

---

## 2. Estandarización de `draft` → `sugerido` (parte del refactor)

Grep de referencia (estado ANTES):
- `src/`: `CalendarioView.vue:999,1305,1670`, `Asignacion.ts:4,42`, `asignacionStore.ts:35,50`.
- `functions/src/index.ts`: `73,400,494,564,595,806,888,947`.

Acciones:
- **Frontend:** ningún `'draft'` debe quedar como estado de asignación válido. `AsignacionStatus` = `'sugerido'|'publicado'`. Los sitios que escribían `status: 'draft'` → `'sugerido'`. Los filtros `status === 'draft'` → `'sugerido'` (y al leer legacy, el converter normaliza).
- **Functions:** ídem, ver §3.
- **`asignacionStore.ts:35`** `asignacionesDraft` (filtra `status === 'draft'`) → renombrar a `asignacionesSugeridas` y filtrar `'sugerido'`. Revisar quién lo consume.

---

## 3. TAREA 1 — Reescribir el algoritmo en Cloud Functions

Archivo: [functions/src/index.ts](functions/src/index.ts).

### 3.1 Consolidar en UNA función
- `generarBorrador` (líneas ~215–626, por día, escribe segmentos `draft`): **CONFIRMADO código muerto** (nadie la llama; grep de `httpsCallable(functions, 'generarBorrador')` en `src/` = 0). **ELIMINAR** esta función y sus tipos exclusivos (`GenerarBorradorInput/Output`, `Presencia`, `SegmentoToWrite` si no se reusa).
- `actualizarBorrador` (líneas ~651–1210): es la que se usa. **Reescribir** para el nuevo modelo. Renombrar a **`generarAsignaciones`** (más claro) y actualizar el `httpsCallable` en el frontend (`segmentoStore`→`asignacionStore`, `CalendarioView`). Mantener región `southamerica-west1`, `timeoutSeconds: 120`.

### 3.2 Lógica nueva de `generarAsignaciones`
Entrada: `{ empresa_id, ubicacion_id, week_start, dias }`. Salida: `{ semana, dias_procesados, asignaciones_creadas, huecos, logs: string[] }`.

**Sin buckets. Una asignación = un empleado en el turno completo.** Por cada fecha del rango:
1. Resolver config activa y `turnosDelDia`. Si no hay → log y continuar.
2. **BORRAR las sugerencias previas del día** (D3 del usuario: "cuando presiono regenerar debe eliminar lo que sugirió"). Query `asignaciones where(ubicacion_id) where(date == fecha)`, filtrar en memoria `status === 'sugerido' && deletedAt == null`, soft-delete en batch. **NO tocar** las `publicado` (esas se respetan). Loguear cuántas se borraron.
3. Calcular oferta del día = `disponibilidad.ventanas − excepciones` (helper `restarIntervalos`, ya existe). Log del nº de empleados con oferta; si 0 → `logW` explicando (revisar disponibilidad/excepciones).
4. **Contador de equidad** `minutosAsignadosSemana`: inicializar con los minutos de las asignaciones **`publicado`** ya existentes del rango (para que la nueva sugerencia reparta distinto). Esto hace que **regenerar produzca un resultado diferente** al anterior cuando hay margen (requisito del usuario).
5. **Greedy por turno (no por bucket):**
   - Para cada `turno` y cada `requerimiento` (con su `cantidad`):
     - Candidatos = empleados cuya oferta **contiene el turno completo** (`oferta.start <= turno.start && oferta.end >= turno.end`).
     - **Filtro dura D4 — no repetir en el turno / no solapar:** excluir a quien **ya tiene una asignación ese día que se solapa con este turno** (`seProlapan(a.start,a.end,turno.start,turno.end)`). Esto cubre "un empleado no puede repetirse en el mismo turno" **y** "no dos turnos solapados". Se aplica **antes** que cualquier consideración de habilidades u horas (el usuario: "no importa que tenga las habilidades y no importan las horas").
     - **Empresa:** además, si `req.estacion_id`, el empleado debe tener esa estación en `estacion_ids` (habilidad) — pero esto va DESPUÉS del filtro D4. Reglas hard `nunca_juntos` (is_strict) se mantienen. Límite de horas semanales se mantiene **pero nunca puede hacer que una persona se repita** (D4 manda).
     - **Congregación:** sin estaciones, sin reglas de habilidad; solo D4 + reglas `nunca_juntos`.
     - **Orden por equidad:** menos `minutosAsignadosSemana` primero; tiebreaker: menos asignaciones ese día; **tiebreaker final aleatorio o rotатivo** para que regenerar dé variedad cuando hay empates (requisito "las siguientes sugerencias deben ser diferentes"). Documentar la elección (p.ej. `Math.random()` como último desempate, o rotar por un offset derivado de `Date.now()`).
     - Asignar hasta `cantidad`. Si faltan → **hueco** (log + reporte). **No inventar gente.**
     - Por cada asignado: crear objeto `Asignacion` `{ empresa_id, ubicacion_id, empleado_id, date, estacion_id, start: turno.start_time, end: turno.end_time, status: 'sugerido', active: true }`. Sumar `duracion` a `minutosAsignadosSemana[eid]`.
6. Escribir en batch (soft-delete de previas + insert de nuevas). Respetar límite 499 por batch.

### 3.3 Instrumentación (logs server-side)
Patrón:
```ts
const logs: string[] = [];
const log  = (m: string) => { logs.push(m); console.log(m); };
const logW = (m: string) => { logs.push(`WARN ${m}`); console.warn(m); };
const logE = (m: string) => { logs.push(`ERROR ${m}`); console.error(m); };
```
Loguear en cada etapa (cubre "regenerar falla y no dice por qué"):
- Entrada (`empresa_id`, `ubicacion_id`, `week_start`, `dias`, `esCongregacion`).
- Empleados cargados / con contrato en la sucursal / managerId.
- Estaciones activas (empresa).
- Por fecha: `diaEsp`, ¿config?, nº turnos, nº sugerencias previas borradas, nº empleados con oferta.
- Por turno/req: conteo de candidatos **tras cada filtro** (contiene-turno → sin-solape(D4) → habilidad(empresa) → reglas → final), asignados vs. requerido, huecos.
- **Envolver TODO el cuerpo en try/catch** y, ante excepción, `logE(err.message)` y **relanzar `HttpsError('internal', mensaje_con_causa)`** para que el cliente reciba una razón, nunca un fallo mudo. Devolver `logs` incluso en camino de error si es posible (o incluir el error en el `HttpsError` message).
- Resumen final: `dias_procesados`, `asignaciones_creadas`, `huecos.length`.

### 3.4 Deploy
`cd functions && npx tsc --noEmit` → 0 errores. Luego el usuario ejecuta `firebase deploy --only functions`. **Sin deploy, los cambios de Functions NO surten efecto.**

---

## 4. TAREA 2 — Store de logs + Consola web fija

### 4.1 `src/stores/logStore.ts` (Pinia)
```ts
export type LogLevel = 'debug'|'info'|'warn'|'error';
export type LogSource = 'client'|'fn';
export interface LogEntry { id:number; ts:number; level:LogLevel; source:LogSource; scope?:string; message:string; }
```
API: `entries` (buffer circular ~500), `log(level,message,opts?)`, azúcar `debug/info/warn/error`, `pushServerLogs(lines:string[], scope?)` (parsea prefijo `WARN `/`ERROR ` → level, source `'fn'`), `clear()`, `open`/`minimized` (persistente en el store), `unreadErrors` (computed para badge). **No** monkey-patch de `console`.

### 4.2 `src/components/LogConsole.vue`
- **Posición:** `fixed` abajo. Offset de sidebar **CONFIRMADO** (AppShell línea 5): `hidden md:flex md:w-44 lg:w-64`. La consola usa `left-0 md:left-44 lg:left-64 right-0`. En móvil, ancho completo.
- **Minimizada (barra de estado):** ~30px, icono terminal, contador, último mensaje truncado, badge rojo si `unreadErrors`, chevron ▲ para desplegar.
- **Desplegada (hacia arriba):** ~40vh, scroll, header con filtros (nivel + source), limpiar, copiar-todo, chevron ▼.
- Monospace, color por nivel, dark mode, auto-scroll al fondo solo si el usuario ya estaba abajo. z-index alto (bajo modales críticos).
- **Ocultar si no hay sesión** (`sessionStore.currentUser` null) — el login no tiene sidebar.
- Montar **una vez** en [src/App.vue](src/App.vue) tras `<RouterView />`.

### 4.3 Instrumentar cliente (CalendarioView + stores)
`logStore.*` (source `'client'`, scope `'calendario'`) en: `onMounted`, `cargar`/`cargarMes` (rango + nº resultados), `regenerarSugerencias` (al invocar y al recibir → `logStore.pushServerLogs(resp.data.logs, 'generarAsignaciones')` + resumen), `calcularDiagnostico`, y **todo `catch` → `logStore.error`**. Igual en el fire-and-forget del `asignacionStore` (capturar respuesta/errores y volcarlos, no tragarlos).

---

## 5. TAREA 3 — Fix del calendario

Con la consola viva (§4), **reproducir primero** "el calendario no funciona" y leer logs antes de corregir. Candidatos (verificar cuáles aplican tras el refactor):

- **B1 — Índice Firestore.** `cargarAsignacionesManager` usa `where(ubicacion_id)+where(date>=)+where(date<=)+where(deletedAt==null)` → índice compuesto `(ubicacion_id, date)`. Si falta → error mudo o spinner infinito. Asegurar índice + `firebase deploy --only firestore:indexes`. Loguear el error real del `getDocs`.
- **B2 — Match turno⇄asignación por solape, no igualdad.** Al mostrar quién cubre un turno, comparar `a.start < turno.end_time && a.end > turno.start_time`, no `===`. Con D3 (turno completo) suele coincidir exacto, pero si el turno se editó de horario, el solape evita que "desaparezcan" asignaciones válidas.
- **B3 — `estacion_id` consistente.** El cupo de empresa filtra por `a.estacion_id === req.estacion_id`. Verificar que el algoritmo escribe el mismo `estacion_id`. En congregación es `null` a ambos lados.
- **B4 — `activeUbicacionId` al montar.** Si no está seteado, el `watch` debe resolver; loguear si nunca llega (evita spinner infinito).
- **B5 — `resolverMiEmpleadoId`.** Para vista empleado; loguear si devuelve null (muestra "Necesitas cuenta activa").
- **B6 — Regenerar no borraba lo previo.** YA resuelto en §3.2 paso 2 (soft-delete de `sugerido` previas antes de reinsertar). Verificar en la práctica que al regenerar ya no se duplican asignaciones.

Corregir **solo** lo confirmado. Cada fix: `tsc` 0 + verificación manual.

---

## 6. Orden de ejecución (para Sonnet)

1. **§1 (Tarea 0) + §2:** refactor de modelo `Asignacion`, eliminar `Segmento`/`segmentoStore`, reescribir `asignacionStore`, actualizar rules/índices, repuntar callers. Reescribir `CalendarioView` sin buckets, dos estados. → `tsc` 0 frontend.
2. **§3 (Tarea 1):** reescribir el algoritmo (`generarAsignaciones`), eliminar `generarBorrador`, D4 como filtro duro, equidad con desempate variable, borrado de sugerencias previas, logs + try/catch con causa. → `cd functions && npx tsc --noEmit` 0. **Pedir `firebase deploy --only functions,firestore:indexes`.**
3. **§4 (Tarea 2):** `logStore` + `LogConsole` en App.vue + instrumentar cliente. → `tsc` 0.
4. **§5 (Tarea 3):** con la consola, reproducir, diagnosticar (B1–B6) y aplicar fixes confirmados. → `tsc` 0 + verificación manual.
5. **Cierre:** actualizar §13 de `CLAUDE.md` (nueva entrada con el refactor de modelo, archivos tocados, hallazgos). Actualizar también las secciones §5 (colecciones: quitar `segmentos`, redefinir `asignaciones`) y §7 (scheduling: quitar buckets/segmento/descanso) de `CLAUDE.md` para que sigan siendo fuente de verdad. Recordar deploy pendiente.

---

## 7. Criterios de aceptación

- [ ] No queda `segmentos` (colección/modelo/store/rules/índices/usos) en el repo. `grep -rn "segmento" src/ functions/` → solo comentarios históricos, si acaso.
- [ ] `AsignacionStatus` = `'sugerido' | 'publicado'`. No queda `'draft'`/`'aprobado'`/`'rechazado'` como estado activo en frontend ni functions.
- [ ] Una asignación = un empleado en el turno **completo** (sin buckets de 30 min).
- [ ] **Regla dura verificada:** al generar/asignar, un empleado nunca aparece dos veces en el mismo turno ni en turnos solapados el mismo día, aunque tenga la habilidad y aunque le sobren horas.
- [ ] Al pulsar **Regenerar sugerencias**: (a) borra las `sugerido` previas del rango, (b) **respeta** las `publicado`, (c) el resultado puede diferir del anterior (equidad con desempate variable), (d) la **consola muestra el rastro server-side** y, si falla, **la causa** (nunca fallo mudo).
- [ ] Consola inferior visible en todos los scopes con sesión, minimizada por defecto, desplegable hacia arriba, cubre del sidebar a la derecha (`md:left-44 lg:left-64`), dark mode, oculta en login.
- [ ] El calendario carga y muestra las asignaciones existentes; el bug reportado queda corregido y verificado manualmente.
- [ ] `npx tsc --noEmit` = 0 en frontend y functions.
- [ ] `CLAUDE.md` §5, §7 y §13 actualizados al nuevo modelo.

---

## 8. Notas y riesgos

- **Cambio de modelo con posible pérdida de datos:** las `segmentos` existentes se descartan (app en desarrollo). Si hubiera datos reales que conservar, **confirmar con el usuario** antes de borrar; una migración segmento→asignación sería: colapsar buckets del mismo (empleado,turno,fecha) en 1 asignación con start/end del turno. Por defecto NO migrar.
- **Deploy de Functions e índices es obligatorio** para que §3/§5 reflejen los cambios.
- Buffer de logs en memoria (se pierde al recargar); no persistir en Firestore.
- El desempate aleatorio de equidad debe ser **acotado** (solo entre empates reales) para no romper la prioridad por menos-horas.
- `publicarDia`: ahora publica `sugerido → publicado` directo (sin paso `aprobado`).
- Editar un `publicado` (D5): permitido solo a manager/super_admin; registrar en log que se modificó un publicado (para trazabilidad; notificación a empleados afectados queda como mejora futura, ya contemplada en CLAUDE.md §7).
