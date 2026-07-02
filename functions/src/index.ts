import { setGlobalOptions } from "firebase-functions";
import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

admin.initializeApp();
setGlobalOptions({ maxInstances: 10 });

const db = admin.firestore();

// ─── Types ────────────────────────────────────────────────────────────────────

interface Requerimiento {
  estacion_id: string | null;
  cantidad: number;
}

interface Turno {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  requerimientos: Requerimiento[];
}

interface ConfiguracionTurnos {
  id: string;
  scope: "default" | "month" | "range";
  month?: string | null;
  date_start?: string | null;
  date_end?: string | null;
  turnos: Turno[];
}

interface Estacion {
  id: string;
  intensidad: "alta" | "media" | "baja";
  max_continuo_min: number | null;
}

interface VentanaDisponibilidad {
  day_of_week: string;
  start: string;
  end: string;
}

type ReglaType = "juntos" | "nunca_juntos";

interface Regla {
  person_uno_id: string;
  person_dos_id: string;
  is_strict: boolean;
  type: ReglaType;
}

// El registro de una asignación a escribir en Firestore
interface AsignacionToWrite {
  empresa_id: string;
  ubicacion_id: string;
  empleado_id: string;
  date: string;
  estacion_id: string | null;
  start: string;
  end: string;
  status: "sugerido";
}

export interface HuecoReporte {
  date: string;
  turno_start: string;
  turno_end: string;
  estacion_id: string | null;
  requerido: number;
  asignado: number;
}

// ─── Helpers de tiempo ────────────────────────────────────────────────────────

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function dateToSpanishDay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return DIAS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

function seProlapan(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}

interface Intervalo { start: number; end: number; }

function restarIntervalos(ventana: Intervalo, ausencias: Intervalo[]): Intervalo[] {
  const cortes = ausencias
    .map((a) => ({ start: Math.max(a.start, ventana.start), end: Math.min(a.end, ventana.end) }))
    .filter((a) => a.end > a.start)
    .sort((a, b) => a.start - b.start);
  const libres: Intervalo[] = [];
  let cursor = ventana.start;
  for (const a of cortes) {
    if (a.start > cursor) libres.push({ start: cursor, end: a.start });
    cursor = Math.max(cursor, a.end);
  }
  if (cursor < ventana.end) libres.push({ start: cursor, end: ventana.end });
  return libres;
}

// Seleccionar configuración activa: precedencia range > month > default
function resolverConfigActiva(configuraciones: ConfiguracionTurnos[], fecha: string): ConfiguracionTurnos | null {
  const activas = configuraciones.filter((c) => {
    if (c.scope === "range" && c.date_start && c.date_end)
      return fecha >= c.date_start && fecha <= c.date_end;
    if (c.scope === "month" && c.month) return fecha.startsWith(c.month);
    return c.scope === "default";
  });
  const porScope: Record<string, number> = { range: 3, month: 2, default: 1 };
  activas.sort((a, b) => (porScope[b.scope] ?? 0) - (porScope[a.scope] ?? 0));
  return activas[0] ?? null;
}

// ─── generarAsignaciones — greedy por rango, escribe a 'asignaciones' ─────────

interface GenerarAsignacionesInput {
  empresa_id: string;
  ubicacion_id: string;
  week_start: string;
  dias?: number;
}

interface GenerarAsignacionesOutput {
  semana: string;
  dias_procesados: number;
  asignaciones_creadas: number;
  huecos: HuecoReporte[];
  logs: string[];
}

export const generarAsignaciones = onCall<
  GenerarAsignacionesInput,
  Promise<GenerarAsignacionesOutput>
>({ region: "southamerica-west1", timeoutSeconds: 120 }, async (request) => {
  const logs: string[] = [];
  const log = (msg: string) => { logs.push(msg); console.log(msg); };
  const logWarn = (msg: string) => { logs.push(`[WARN] ${msg}`); console.warn(msg); };

  try {
    const { empresa_id, ubicacion_id, week_start } = request.data;
    const dias = Math.min(request.data.dias ?? 28, 56);

    if (!empresa_id || !ubicacion_id || !week_start) {
      throw new HttpsError("invalid-argument", "Faltan parámetros: empresa_id, ubicacion_id, week_start.");
    }

    log(`generarAsignaciones iniciado — empresa=${empresa_id} ubicacion=${ubicacion_id} week_start=${week_start} dias=${dias}`);

    const fechas = Array.from({ length: dias }, (_, i) => addDays(week_start, i));
    const week_end = fechas[fechas.length - 1];

    // 1. Cargar ubicación y empresa
    const [ubicacionSnap, empresaSnap] = await Promise.all([
      db.collection("ubicaciones").doc(ubicacion_id).get(),
      db.collection("empresas").doc(empresa_id).get(),
    ]);
    if (!ubicacionSnap.exists) throw new HttpsError("not-found", "Ubicación no encontrada.");
    const ubicacionData = ubicacionSnap.data()!;
    const configuraciones: ConfiguracionTurnos[] = ubicacionData.configuraciones ?? [];
    const managerIdUbic: string | null = ubicacionData.manager_id ?? null;
    const esCongregacion = (empresaSnap.data()?.type ?? "empresa") === "congregacion";

    log(`Tipo de tenant: ${esCongregacion ? "congregacion" : "empresa"}`);

    // 2. Cargar estaciones (solo empresa)
    const estacionesMap = new Map<string, Estacion>();
    if (!esCongregacion) {
      const estSnap = await db.collection("estaciones")
        .where("empresa_id", "==", empresa_id).where("active", "==", true).get();
      estSnap.docs.forEach((d) => {
        const e = d.data();
        estacionesMap.set(d.id, { id: d.id, intensidad: e.intensidad ?? "media", max_continuo_min: e.max_continuo_min ?? null });
      });
      log(`Estaciones cargadas: ${estacionesMap.size}`);
    }

    // 3. Cargar empleados con contrato activo en la sucursal o encargado de sucursal
    const empSnap = await db.collection("empleados")
      .where("company_id", "==", empresa_id).where("active", "==", true).where("deletedAt", "==", null).get();
    const empleadosDocs = empSnap.docs.filter((d) => {
      const contratos: any[] = d.data().contratos ?? [];
      return contratos.some((c) => c?.active && c?.ubicacion_id === ubicacion_id) || d.id === managerIdUbic;
    });

    if (empleadosDocs.length === 0) {
      logWarn("No hay empleados con contrato activo en esta sucursal.");
      return { semana: week_start, dias_procesados: 0, asignaciones_creadas: 0, huecos: [], logs };
    }
    log(`Empleados en sucursal: ${empleadosDocs.length}`);

    const empleadoIds = empleadosDocs.map((d) => d.id);

    // Límite de horas por empleado
    const limiteMinutosPorEmpleado = new Map<string, number>();
    empleadosDocs.forEach((d) => {
      const contratos: any[] = d.data().contratos ?? [];
      const c = contratos.find((c: any) => c?.active && c?.ubicacion_id === ubicacion_id);
      limiteMinutosPorEmpleado.set(d.id, (c?.limite_horas ?? 0) > 0 ? (c.limite_horas as number) * 60 : 0);
    });

    // 4. Cargar excepciones del rango
    const ausenciasPorEmpleadoFecha = new Map<string, Intervalo[]>();
    for (let i = 0; i < empleadoIds.length; i += 30) {
      const lote = empleadoIds.slice(i, i + 30);
      const excSnap = await db.collection("excepciones").where("employee_id", "in", lote).get();
      excSnap.docs.forEach((d) => {
        const x = d.data();
        if (x.active === false || x.deletedAt != null) return;
        if (!x.date || x.date < week_start || x.date > week_end) return;
        if (!x.time_start || !x.time_end) return;
        const iv = { start: toMinutes(x.time_start), end: toMinutes(x.time_end) };
        if (iv.end <= iv.start) return;
        const key = `${x.employee_id}_${x.date}`;
        const arr = ausenciasPorEmpleadoFecha.get(key) ?? [];
        arr.push(iv);
        ausenciasPorEmpleadoFecha.set(key, arr);
      });
    }
    log(`Excepciones cargadas: ${ausenciasPorEmpleadoFecha.size} combinaciones empleado-fecha`);

    // 5. Cargar reglas de asignación
    const reglasMap = new Map<string, Regla[]>();
    if (!esCongregacion && empleadoIds.length > 0) {
      const allReglas: Regla[] = [];
      const vistos = new Set<string>();
      for (let i = 0; i < empleadoIds.length; i += 30) {
        const chunk = empleadoIds.slice(i, i + 30);
        const [r1, r2] = await Promise.all([
          db.collection("reglas_asignacion").where("person_uno_id", "in", chunk).get(),
          db.collection("reglas_asignacion").where("person_dos_id", "in", chunk).get(),
        ]);
        for (const d of [...r1.docs, ...r2.docs]) {
          if (vistos.has(d.id)) continue;
          vistos.add(d.id);
          const data = d.data();
          if (data.deletedAt != null) continue;
          allReglas.push(data as Regla);
        }
      }
      empleadoIds.forEach((eid) => {
        reglasMap.set(eid, allReglas.filter((r) => r.person_uno_id === eid || r.person_dos_id === eid));
      });
      log(`Reglas cargadas: ${allReglas.length}`);
    }

    // 6. Acumulador de equidad: inicializar con asignaciones publicadas ya existentes
    const minutosAsignadosSemana = new Map<string, number>();
    empleadoIds.forEach((id) => minutosAsignadosSemana.set(id, 0));
    {
      const pubSnap = await db.collection("asignaciones")
        .where("ubicacion_id", "==", ubicacion_id)
        .where("date", ">=", week_start)
        .where("date", "<=", week_end)
        .where("status", "==", "publicado")
        .where("deletedAt", "==", null)
        .get();
      pubSnap.docs.forEach((d) => {
        const a = d.data();
        if (!a.empleado_id || !a.start || !a.end) return;
        const min = toMinutes(a.end) - toMinutes(a.start);
        minutosAsignadosSemana.set(a.empleado_id, (minutosAsignadosSemana.get(a.empleado_id) ?? 0) + min);
      });
      log(`Minutos publicados pre-cargados para ${pubSnap.docs.length} asignaciones`);
    }

    // 7. Procesar cada fecha
    const allHuecos: HuecoReporte[] = [];
    let totalCreadas = 0;
    let diasProcesados = 0;
    const now = admin.firestore.FieldValue.serverTimestamp();
    const BATCH_SIZE = 499;

    for (const fecha of fechas) {
      const diaEsp = dateToSpanishDay(fecha);
      const config = resolverConfigActiva(configuraciones, fecha);
      if (!config) { log(`[${fecha}] Sin configuración de turnos activa`); continue; }

      const turnosDelDia = config.turnos.filter((t) => !(t as any).deletedAt && t.day_of_week === diaEsp);
      if (turnosDelDia.length === 0) { continue; }

      log(`[${fecha}] ${diaEsp} — ${turnosDelDia.length} turno(s) a procesar`);

      // Borrar sugeridos previos de este día (idempotencia — D3)
      const delSnap = await db.collection("asignaciones")
        .where("ubicacion_id", "==", ubicacion_id)
        .where("date", "==", fecha)
        .where("status", "==", "sugerido")
        .get();
      const sugeridosPrevios = delSnap.docs.filter((d) => !d.data().deletedAt);
      if (sugeridosPrevios.length > 0) {
        log(`[${fecha}] Eliminando ${sugeridosPrevios.length} sugerido(s) previos`);
        for (let i = 0; i < sugeridosPrevios.length; i += BATCH_SIZE) {
          const b = db.batch();
          sugeridosPrevios.slice(i, i + BATCH_SIZE).forEach((d) => {
            b.update(d.ref, { active: false, deletedAt: now, updatedAt: now });
          });
          await b.commit();
        }
      }

      // Calcular oferta del día (disponibilidad − excepciones)
      const ventanasPorEmpleado = new Map<string, Intervalo[]>();
      empleadosDocs.forEach((doc) => {
        const e = doc.data();
        const ventanas: VentanaDisponibilidad[] = e.disponibilidad?.ventanas ?? [];
        const delDia = ventanas
          .filter((v) => v.day_of_week === diaEsp && v.start && v.end)
          .map((v) => ({ start: toMinutes(v.start), end: toMinutes(v.end) }))
          .filter((iv) => iv.end > iv.start);
        if (delDia.length === 0) return;
        const ausencias = ausenciasPorEmpleadoFecha.get(`${doc.id}_${fecha}`) ?? [];
        const libres: Intervalo[] = [];
        for (const v of delDia) libres.push(...restarIntervalos(v, ausencias));
        if (libres.length > 0) ventanasPorEmpleado.set(doc.id, libres);
      });

      if (ventanasPorEmpleado.size === 0) {
        logWarn(`[${fecha}] Sin disponibilidad efectiva`);
        continue;
      }
      log(`[${fecha}] ${ventanasPorEmpleado.size} empleados con disponibilidad`);

      // Convertir oferta a lista de ventanas planas para lookup rápido
      interface OfertaPlana { empleado_id: string; start: number; end: number; }
      const oferta: OfertaPlana[] = [];
      ventanasPorEmpleado.forEach((ivs, empId) => {
        ivs.forEach((iv) => oferta.push({ empleado_id: empId, start: iv.start, end: iv.end }));
      });

      // Estado greedy por empleado dentro del día
      interface EstadoEmp { asignaciones: AsignacionToWrite[]; minutosAlta: number; }
      const estadoEmp = new Map<string, EstadoEmp>();
      empleadoIds.forEach((id) => estadoEmp.set(id, { asignaciones: [], minutosAlta: 0 }));

      const asignacionesDelDia: AsignacionToWrite[] = [];
      const huecosDelDia: HuecoReporte[] = [];

      // D4 — tracker de empleados ya asignados en cada turno del día (por solapamiento)
      // Un empleado no puede aparecer dos veces en el mismo turno ni en turnos que se solapen.

      if (esCongregacion) {
        // ── Greedy congregación ────────────────────────────────────────────────
        // Un voluntario cubre el turno completo (sin sub-buckets).
        // D4: no se asigna si ya tiene una asignación solapada ese día.

        for (const turno of turnosDelDia) {
          const tStartMin = toMinutes(turno.start_time);
          const tEndMin = toMinutes(turno.end_time);
          const durMin = tEndMin - tStartMin;

          for (const req of turno.requerimientos) {
            if ((req.cantidad ?? 0) <= 0) continue;

            // a. Disponibles para el turno completo
            const disponibles = oferta
              .filter((o) => o.start <= tStartMin && o.end >= tEndMin)
              .map((o) => o.empleado_id);

            // b. D4: excluir si tiene asignación solapada en este día
            const sinSolape = disponibles.filter((eid) => {
              return !estadoEmp.get(eid)!.asignaciones.some((a) =>
                seProlapan(a.start, a.end, turno.start_time, turno.end_time)
              );
            });

            // c. Equidad: menos minutos en semana, tiebreaker aleatorio
            const order = sinSolape.map((eid) => ({
              eid,
              min: minutosAsignadosSemana.get(eid) ?? 0,
              r: Math.random(),
            }));
            order.sort((a, b) => a.min !== b.min ? a.min - b.min : a.r - b.r);
            const asignados = order.slice(0, req.cantidad).map((x) => x.eid);

            if (asignados.length < req.cantidad) {
              logWarn(`[${fecha}] HUECO turno ${turno.start_time}–${turno.end_time}: necesita ${req.cantidad}, asignados ${asignados.length}`);
              huecosDelDia.push({ date: fecha, turno_start: turno.start_time, turno_end: turno.end_time, estacion_id: null, requerido: req.cantidad, asignado: asignados.length });
            } else {
              log(`[${fecha}] Turno ${turno.start_time}–${turno.end_time}: ${asignados.length} voluntarios asignados`);
            }

            for (const eid of asignados) {
              const a: AsignacionToWrite = {
                empresa_id, ubicacion_id, empleado_id: eid, date: fecha,
                estacion_id: null, start: turno.start_time, end: turno.end_time, status: "sugerido",
              };
              estadoEmp.get(eid)!.asignaciones.push(a);
              asignacionesDelDia.push(a);
              minutosAsignadosSemana.set(eid, (minutosAsignadosSemana.get(eid) ?? 0) + durMin);
            }
          }
        }

      } else {
        // ── Greedy empresa ─────────────────────────────────────────────────────
        // Una asignación = un empleado en el turno completo (start→end del turno).
        // D4: no repetir en el mismo turno (strict) ni en turnos solapados.
        // Anti-saturación y reglas hard se mantienen.

        const limiteMinutosAcumHoy = new Map<string, number>();
        empleadoIds.forEach((id) => limiteMinutosAcumHoy.set(id, 0));

        for (const turno of turnosDelDia) {
          const tStartMin = toMinutes(turno.start_time);
          const tEndMin = toMinutes(turno.end_time);
          const durMin = tEndMin - tStartMin;

          for (const req of turno.requerimientos) {
            if ((req.cantidad ?? 0) <= 0) continue;

            const estacion = req.estacion_id ? estacionesMap.get(req.estacion_id) : null;
            if (req.estacion_id && !estacion) {
              logWarn(`[${fecha}] estacion_id ${req.estacion_id} no encontrada en catálogo`);
              continue;
            }

            // a. Calificados para esta estación y con disponibilidad
            const disponibles = oferta
              .filter((o) => {
                if (o.start > tStartMin || o.end < tEndMin) return false; // no cubre el turno
                if (req.estacion_id) {
                  const empData = empleadosDocs.find((d) => d.id === o.empleado_id)?.data();
                  const estIds: string[] = empData?.estacion_ids ?? [];
                  if (!estIds.includes(req.estacion_id)) return false;
                }
                return true;
              })
              .map((o) => o.empleado_id);

            // b. D4: excluir empleados ya asignados a un turno solapado este día
            const sinSolape = disponibles.filter((eid) =>
              !estadoEmp.get(eid)!.asignaciones.some((a) =>
                seProlapan(a.start, a.end, turno.start_time, turno.end_time)
              )
            );

            // c. Límite de horas semanal
            const sinExcederLimite = sinSolape.filter((eid) => {
              const limMin = limiteMinutosPorEmpleado.get(eid) ?? 0;
              if (limMin === 0) return true;
              return (minutosAsignadosSemana.get(eid) ?? 0) + durMin <= limMin;
            });

            // d. Anti-saturación (estaciones con max_continuo_min)
            const sinSaturacion = sinExcederLimite.filter((eid) => {
              if (!estacion?.max_continuo_min) return true;
              return estadoEmp.get(eid)!.minutosAlta < estacion.max_continuo_min;
            });

            // e. Reglas hard nunca_juntos
            const candidatos = sinSaturacion.filter((eid) => {
              const reglas = reglasMap.get(eid) ?? [];
              for (const regla of reglas) {
                if (!regla.is_strict || regla.type !== "nunca_juntos") continue;
                const otro = regla.person_uno_id === eid ? regla.person_dos_id : regla.person_uno_id;
                const otroEst = estadoEmp.get(otro);
                if (otroEst?.asignaciones.some((a) =>
                  seProlapan(a.start, a.end, turno.start_time, turno.end_time)
                )) return false;
              }
              return true;
            });

            if (candidatos.length === 0) {
              logWarn(`[${fecha}] Sin candidatos para ${turno.start_time}–${turno.end_time} est=${req.estacion_id ?? "general"}`);
            }

            // f. Equidad: menos minutos semanales primero, tiebreaker aleatorio
            const order = candidatos.map((eid) => ({
              eid,
              min: minutosAsignadosSemana.get(eid) ?? 0,
              r: Math.random(),
            }));
            order.sort((a, b) => a.min !== b.min ? a.min - b.min : a.r - b.r);
            const asignados = order.slice(0, req.cantidad).map((x) => x.eid);

            if (asignados.length < req.cantidad) {
              logWarn(`[${fecha}] HUECO ${turno.start_time}–${turno.end_time} est=${req.estacion_id ?? "general"}: necesita ${req.cantidad}, asignados ${asignados.length}`);
              huecosDelDia.push({ date: fecha, turno_start: turno.start_time, turno_end: turno.end_time, estacion_id: req.estacion_id, requerido: req.cantidad, asignado: asignados.length });
            } else {
              log(`[${fecha}] Turno ${turno.start_time}–${turno.end_time} est=${req.estacion_id}: ${asignados.length} asignados`);
            }

            for (const eid of asignados) {
              const a: AsignacionToWrite = {
                empresa_id, ubicacion_id, empleado_id: eid, date: fecha,
                estacion_id: req.estacion_id, start: turno.start_time, end: turno.end_time, status: "sugerido",
              };
              const est = estadoEmp.get(eid)!;
              est.asignaciones.push(a);
              asignacionesDelDia.push(a);
              minutosAsignadosSemana.set(eid, (minutosAsignadosSemana.get(eid) ?? 0) + durMin);
              if (estacion?.intensidad === "alta") {
                est.minutosAlta += durMin;
              } else {
                est.minutosAlta = 0;
              }
            }
          }
        }
      }

      // 8. Escribir asignaciones del día en lotes
      if (asignacionesDelDia.length > 0) {
        for (let i = 0; i < asignacionesDelDia.length; i += BATCH_SIZE) {
          const b = db.batch();
          asignacionesDelDia.slice(i, i + BATCH_SIZE).forEach((a) => {
            b.set(db.collection("asignaciones").doc(), {
              ...a, active: true, createdAt: now, updatedAt: now, deletedAt: null,
            });
          });
          await b.commit();
        }
        log(`[${fecha}] ${asignacionesDelDia.length} asignaciones escritas`);
      }

      allHuecos.push(...huecosDelDia);
      totalCreadas += asignacionesDelDia.length;
      diasProcesados++;
    }

    log(`Completado — ${diasProcesados} días procesados, ${totalCreadas} asignaciones creadas, ${allHuecos.length} hueco(s)`);
    return { semana: week_start, dias_procesados: diasProcesados, asignaciones_creadas: totalCreadas, huecos: allHuecos, logs };

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logs.push(`[ERROR] ${msg}`);
    console.error("generarAsignaciones error:", err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", msg);
  }
});

// ─── Facturación — MercadoPago ────────────────────────────────────────────────

const PLAN_PRECIOS_NETO: Record<string, number> = {
  basic: 10000,
  pro: 30000,
  business: 100000,
};

const PLAN_ENTITLEMENTS: Record<string, { max_empleados: number; max_sucursales: number; features: string[] }> = {
  basic:    { max_empleados: 25,  max_sucursales: 3,  features: [] },
  pro:      { max_empleados: 100, max_sucursales: 10, features: ["algoritmo", "reglas", "exportaciones"] },
  business: { max_empleados: -1,  max_sucursales: -1, features: ["algoritmo", "reglas", "exportaciones", "roles_finos", "sso", "api"] },
};

export const crearSuscripcion = onCall<
  { empresa_id: string; plan: string },
  Promise<{ init_point: string }>
>({ region: "southamerica-west1" }, async (request) => {
  const { empresa_id, plan } = request.data;

  if (!empresa_id || !plan || !PLAN_PRECIOS_NETO[plan]) {
    throw new HttpsError("invalid-argument", "empresa_id y plan son requeridos.");
  }

  const empresaSnap = await db.collection("empresas").doc(empresa_id).get();
  if (!empresaSnap.exists) throw new HttpsError("not-found", "Empresa no encontrada.");
  const empresa = empresaSnap.data()!;

  if (!empresa.facturable) {
    throw new HttpsError("failed-precondition", "Esta empresa no es facturable.");
  }

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_ACCESS_TOKEN) throw new HttpsError("internal", "MercadoPago no configurado.");

  const montoNeto = PLAN_PRECIOS_NETO[plan];
  const iva = Math.round(montoNeto * 0.19);
  const montoTotal = montoNeto + iva;

  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + 7);

  const backUrl = process.env.APP_BASE_URL ?? "https://nexturn.app";

  const body = {
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: montoTotal,
      currency_id: "CLP",
      free_trial: { frequency: 7, frequency_type: "days" },
    },
    back_url: `${backUrl}/${empresa.slug}/facturacion`,
    payer_email: empresa.mp_payer_email ?? null,
    reason: `Nexturn ${plan.charAt(0).toUpperCase() + plan.slice(1)} — ${empresa.razon_social ?? empresa.slug}`,
    external_reference: empresa_id,
  };

  const mpRes = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!mpRes.ok) {
    const err = await mpRes.text();
    throw new HttpsError("internal", `MercadoPago error: ${err}`);
  }

  const mpData = await mpRes.json() as { id: string; init_point: string };

  const now = admin.firestore.FieldValue.serverTimestamp();
  await db.collection("empresas").doc(empresa_id).update({
    plan, mp_preapproval_id: mpData.id, subscription_status: "trialing",
    entitlements: PLAN_ENTITLEMENTS[plan],
    trial_ends_at: admin.firestore.Timestamp.fromDate(trialEnds),
    updatedAt: now,
  });

  return { init_point: mpData.init_point };
});

export const cancelarSuscripcion = onCall<
  { empresa_id: string },
  Promise<{ ok: boolean }>
>({ region: "southamerica-west1" }, async (request) => {
  const { empresa_id } = request.data;
  if (!empresa_id) throw new HttpsError("invalid-argument", "empresa_id requerido.");

  const empresaSnap = await db.collection("empresas").doc(empresa_id).get();
  if (!empresaSnap.exists) throw new HttpsError("not-found", "Empresa no encontrada.");
  const empresa = empresaSnap.data()!;

  const preapprovalId = empresa.mp_preapproval_id;
  if (!preapprovalId) throw new HttpsError("failed-precondition", "No hay suscripción activa.");

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_ACCESS_TOKEN) throw new HttpsError("internal", "MercadoPago no configurado.");

  const res = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "cancelled" }),
  });

  if (!res.ok) throw new HttpsError("internal", `MercadoPago error: ${await res.text()}`);

  await db.collection("empresas").doc(empresa_id).update({
    subscription_status: "canceled",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true };
});

export const webhookMercadoPago = onRequest(
  { region: "southamerica-west1" },
  async (req, res) => {
    const xSignature = req.headers["x-signature"] as string | undefined;
    const xRequestId = req.headers["x-request-id"] as string | undefined;
    const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET;

    if (MP_WEBHOOK_SECRET) {
      if (!xSignature) { res.status(401).send("Firma requerida"); return; }
      const parts = xSignature.split(",");
      const ts = parts.find(p => p.startsWith("ts="))?.split("=")[1];
      const v1 = parts.find(p => p.startsWith("v1="))?.split("=")[1];
      const dataId: string | undefined =
        (typeof req.query["data.id"] === "string" ? req.query["data.id"] : undefined) ??
        (req.body?.data?.id as string | undefined);
      const manifest = `id:${dataId ?? ""};request-id:${xRequestId ?? ""};ts:${ts ?? ""};`;
      const expected = crypto.createHmac("sha256", MP_WEBHOOK_SECRET).update(manifest).digest("hex");
      if (v1 !== expected) { res.status(401).send("Firma inválida"); return; }
    }

    const topic = req.query.topic ?? req.body?.type;
    const resourceId = req.body?.data?.id ?? req.query.id;

    if (!topic || !resourceId) { res.status(400).send("topic e id son requeridos."); return; }

    const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
    if (!MP_ACCESS_TOKEN) { res.status(500).send("MP_ACCESS_TOKEN no configurado."); return; }

    try {
      if (topic === "subscription_preapproval" || topic === "preapproval") {
        await handlePreapprovalWebhook(resourceId as string, MP_ACCESS_TOKEN);
      } else if (topic === "subscription_authorized_payment" || topic === "authorized_payment") {
        await handlePagoAutorizadoWebhook(resourceId as string, MP_ACCESS_TOKEN);
      }
      res.status(200).send("OK");
    } catch (e) {
      console.error("Error procesando webhook MP:", e);
      res.status(500).send("Error interno");
    }
  }
);

async function handlePreapprovalWebhook(preapprovalId: string, token: string) {
  const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!mpRes.ok) return;
  const data = await mpRes.json() as { status: string; external_reference: string };
  const empresaId = data.external_reference;
  if (!empresaId) return;
  const statusMap: Record<string, string> = {
    authorized: "active", paused: "paused", cancelled: "canceled", pending: "pending",
  };
  await db.collection("empresas").doc(empresaId).update({
    subscription_status: statusMap[data.status] ?? data.status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function handlePagoAutorizadoWebhook(pagoId: string, token: string) {
  const existente = await db.collection("documentos_tributarios").where("payment_ref", "==", pagoId).limit(1).get();
  if (!existente.empty) return;

  const mpRes = await fetch(`https://api.mercadopago.com/authorized_payments/${pagoId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!mpRes.ok) return;

  const pago = await mpRes.json() as { preapproval_id: string; transaction_amount: number; date_approved: string };
  const empSnap = await db.collection("empresas").where("mp_preapproval_id", "==", pago.preapproval_id).limit(1).get();
  if (empSnap.empty) return;

  const empresaId = empSnap.docs[0].id;
  const empresa = empSnap.docs[0].data();
  const montoTotal = pago.transaction_amount;
  const montoNeto = Math.round(montoTotal / 1.19);
  const iva = montoTotal - montoNeto;
  const periodo = pago.date_approved.slice(0, 7);
  const dteProvider = empresa.dte_provider_default ?? "sii_manual";
  const now = admin.firestore.FieldValue.serverTimestamp();

  const docRef = db.collection("documentos_tributarios").doc();
  await docRef.set({
    empresa_id: empresaId, payment_ref: pagoId, periodo,
    tipo_dte: empresa.tipo_dte_default ?? "boleta",
    monto_neto: montoNeto, iva, monto_total: montoTotal,
    folio: null, origen: dteProvider, estado: "pendiente",
    archivo_pdf_url: null, archivo_xml_url: null,
    emitido_at: null, notificado_at: null, createdAt: now, updatedAt: now,
  });

  if (dteProvider === "openfactura") {
    await emitirDTEOpenFactura(docRef.id, empresaId, empresa, montoNeto, iva, montoTotal, periodo);
  }

  if (empresa.subscription_status !== "active") {
    await db.collection("empresas").doc(empresaId).update({ subscription_status: "active", updatedAt: now });
  }
}

async function emitirDTEOpenFactura(
  documentoId: string, empresaId: string, empresa: admin.firestore.DocumentData,
  montoNeto: number, iva: number, montoTotal: number, periodo: string
) {
  const OF_API_KEY = process.env.OPENFACTURA_API_KEY;
  if (!OF_API_KEY) { console.warn("OPENFACTURA_API_KEY no configurado, DTE queda pendiente."); return; }

  try {
    const body = {
      Encabezado: {
        IdDoc: { TipoDTE: 39 },
        Emisor: {
          RUTEmisor: process.env.EMISOR_RUT, RznSoc: process.env.EMISOR_RAZON_SOCIAL,
          GiroEmis: process.env.EMISOR_GIRO, DirOrigen: process.env.EMISOR_DIRECCION,
        },
        Receptor: { RUTRecep: empresa.rut, RznSocRecep: empresa.razon_social, GiroRecep: empresa.giro, DirRecep: empresa.direccion },
        Totales: { MntNeto: montoNeto, TasaIVA: 19, IVA: iva, MntTotal: montoTotal },
      },
      Detalle: [{ NroLinDet: 1, NmbItem: `Suscripción Nexturn ${empresa.plan ?? ""} — ${periodo}`, QtyItem: 1, PrcItem: montoNeto, MontoItem: montoNeto }],
    };

    const res = await fetch("https://api.haulmer.com/v2/dte/document", {
      method: "POST",
      headers: { "apikey": OF_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error("OpenFactura error:", await res.text());
      await db.collection("documentos_tributarios").doc(documentoId).update({
        estado: "error", updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return;
    }

    const result = await res.json() as { FOLIO: string | number; PDF: string; XML: string };
    await db.collection("documentos_tributarios").doc(documentoId).update({
      folio: String(result.FOLIO), archivo_pdf_url: result.PDF ?? null, archivo_xml_url: result.XML ?? null,
      estado: "emitido", emitido_at: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await notificarDTE(documentoId, empresaId);
  } catch (e) {
    console.error("Error emitiendo DTE OpenFactura:", e);
    await db.collection("documentos_tributarios").doc(documentoId).update({
      estado: "error", updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

export const notificarDTEEmitido = onCall<
  { documento_id: string },
  Promise<{ ok: boolean }>
>({ region: "southamerica-west1" }, async (request) => {
  const { documento_id } = request.data;
  if (!documento_id) throw new HttpsError("invalid-argument", "documento_id requerido.");

  const docSnap = await db.collection("documentos_tributarios").doc(documento_id).get();
  if (!docSnap.exists) throw new HttpsError("not-found", "Documento no encontrado.");

  await notificarDTE(documento_id, docSnap.data()!.empresa_id);
  await db.collection("documentos_tributarios").doc(documento_id).update({
    estado: "notificado", notificado_at: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true };
});

async function notificarDTE(documentoId: string, empresaId: string) {
  console.log(`DTE ${documentoId} emitido para empresa ${empresaId}. Notificación pendiente de integración de email.`);
}
