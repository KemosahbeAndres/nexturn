import { setGlobalOptions } from "firebase-functions";
import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

admin.initializeApp();
setGlobalOptions({ maxInstances: 10 });

const db = admin.firestore();

// ─── Types (espejo de los modelos del frontend) ───────────────────────────────

interface Requerimiento {
  estacion_id: string;
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

interface Presencia {
  id: string;
  empleado_id: string;
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

interface SegmentoToWrite {
  empresa_id: string;
  ubicacion_id: string;
  empleado_id: string;
  date: string;
  estacion_id: string | null;
  tipo: "estacion" | "descanso";
  start: string;
  end: string;
  asignacion_id: string;
  status: "draft";
}

export interface HuecoReporte {
  date: string;
  bucket_start: string;
  bucket_end: string;
  estacion_id: string;
  requerido: number;
  asignado: number;
}

interface GenerarBorradorInput {
  empresa_id: string;
  ubicacion_id: string;
  date: string;
  configuracion_id: string;
}

interface GenerarBorradorOutput {
  asignacion_id: string;
  segmentos_creados: number;
  huecos: HuecoReporte[];
}

// ─── Helpers de tiempo ────────────────────────────────────────────────────────

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function generarBuckets(
  start: string,
  end: string,
  duracionMin = 30
): Array<{ start: string; end: string }> {
  const buckets: Array<{ start: string; end: string }> = [];
  let cur = toMinutes(start);
  let fin = toMinutes(end);
  if (fin <= cur) fin += 24 * 60;
  while (cur < fin) {
    const next = Math.min(cur + duracionMin, fin);
    buckets.push({ start: fromMinutes(cur), end: fromMinutes(next) });
    cur = next;
  }
  return buckets;
}

const DIAS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function dateToSpanishDay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return DIAS[date.getUTCDay()];
}

function seProlapan(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return (
    toMinutes(aStart) < toMinutes(bEnd) &&
    toMinutes(bStart) < toMinutes(aEnd)
  );
}

// ─── Selección de ConfiguracionTurnos activa ──────────────────────────────────

function resolverConfigActiva(
  configuraciones: ConfiguracionTurnos[],
  configuracionId: string,
  date: string
): ConfiguracionTurnos | null {
  const porId = configuraciones.find((c) => c.id === configuracionId);
  if (porId) return porId;

  // Fallback: precedencia range > month > default
  const activas = configuraciones.filter((c) => {
    if (c.scope === "range" && c.date_start && c.date_end) {
      return date >= c.date_start && date <= c.date_end;
    }
    if (c.scope === "month" && c.month) {
      return date.startsWith(c.month);
    }
    return c.scope === "default";
  });

  const porScope: Record<string, number> = { range: 3, month: 2, default: 1 };
  activas.sort((a, b) => (porScope[b.scope] ?? 0) - (porScope[a.scope] ?? 0));
  return activas[0] ?? null;
}

// ─── Cloud Function ───────────────────────────────────────────────────────────

export const generarBorrador = onCall<
  GenerarBorradorInput,
  Promise<GenerarBorradorOutput>
>({ region: "southamerica-west1" }, async (request) => {
  const { empresa_id, ubicacion_id, date, configuracion_id } = request.data;

  if (!empresa_id || !ubicacion_id || !date || !configuracion_id) {
    throw new HttpsError("invalid-argument", "Faltan parámetros requeridos.");
  }

  // 1. Cargar Ubicacion y extraer ConfiguracionTurnos
  const ubicacionSnap = await db
    .collection("ubicaciones")
    .doc(ubicacion_id)
    .get();
  if (!ubicacionSnap.exists) {
    throw new HttpsError("not-found", "Ubicación no encontrada.");
  }
  const ubicacionData = ubicacionSnap.data()!;
  const configuraciones: ConfiguracionTurnos[] =
    ubicacionData.configuraciones ?? [];
  const config = resolverConfigActiva(configuraciones, configuracion_id, date);
  if (!config) {
    throw new HttpsError(
      "not-found",
      "No se encontró configuración de turnos válida."
    );
  }

  // 2. Filtrar Turnos por día de semana
  const diaEsp = dateToSpanishDay(date);
  const turnosDelDia = config.turnos.filter(
    (t) => t.day_of_week === diaEsp
  );
  if (turnosDelDia.length === 0) {
    throw new HttpsError(
      "failed-precondition",
      `No hay turnos configurados para ${diaEsp}.`
    );
  }

  // 3. Cargar estaciones de la empresa
  const estacionesSnap = await db
    .collection("estaciones")
    .where("empresa_id", "==", empresa_id)
    .where("active", "==", true)
    .get();
  const estacionesMap = new Map<string, Estacion>();
  estacionesSnap.docs.forEach((d) => {
    const e = d.data();
    estacionesMap.set(d.id, {
      id: d.id,
      intensidad: e.intensidad ?? "media",
      max_continuo_min: e.max_continuo_min ?? null,
    });
  });

  // 4. Cargar presencias del día
  const presenciasSnap = await db
    .collection("presencias")
    .where("ubicacion_id", "==", ubicacion_id)
    .where("date", "==", date)
    .where("deletedAt", "==", null)
    .get();
  const presencias: Presencia[] = presenciasSnap.docs.map((d) => {
    const p = d.data();
    return {
      id: d.id,
      empleado_id: p.empleado_id,
      start: p.start,
      end: p.end,
    };
  });

  if (presencias.length === 0) {
    throw new HttpsError(
      "failed-precondition",
      "No hay presencias registradas para esta fecha. Registra la disponibilidad del equipo primero."
    );
  }

  const empleadoIds = [...new Set(presencias.map((p) => p.empleado_id))];

  // 5. Cargar reglas de asignación relevantes
  const reglasMap = new Map<string, Regla[]>();
  if (empleadoIds.length > 0) {
    const chunkSize = 30; // Firestore 'in' limit
    const allReglas: Regla[] = [];
    for (let i = 0; i < empleadoIds.length; i += chunkSize) {
      const chunk = empleadoIds.slice(i, i + chunkSize);
      const [r1, r2] = await Promise.all([
        db
          .collection("reglas_asignacion")
          .where("person_uno_id", "in", chunk)
          .where("deletedAt", "==", null)
          .get(),
        db
          .collection("reglas_asignacion")
          .where("person_dos_id", "in", chunk)
          .where("deletedAt", "==", null)
          .get(),
      ]);
      r1.docs.forEach((d) => allReglas.push(d.data() as Regla));
      r2.docs.forEach((d) => allReglas.push(d.data() as Regla));
    }
    empleadoIds.forEach((eid) => {
      reglasMap.set(
        eid,
        allReglas.filter(
          (r) => r.person_uno_id === eid || r.person_dos_id === eid
        )
      );
    });
  }

  // 6. Borrar borradores previos para esta (ubicacion_id, date)
  const borradorPrevioSnap = await db
    .collection("asignaciones")
    .where("ubicacion_id", "==", ubicacion_id)
    .where("date", "==", date)
    .where("status", "==", "draft")
    .get();

  if (!borradorPrevioSnap.empty) {
    const deleteBatch = db.batch();
    borradorPrevioSnap.docs.forEach((d) => {
      deleteBatch.update(d.ref, {
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await deleteBatch.commit();

    for (const aid of borradorPrevioSnap.docs.map((d) => d.id)) {
      const segsSnap = await db
        .collection("segmentos")
        .where("asignacion_id", "==", aid)
        .get();
      if (!segsSnap.empty) {
        const segBatch = db.batch();
        segsSnap.docs.forEach((d) => {
          segBatch.update(d.ref, {
            deletedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });
        await segBatch.commit();
      }
    }
  }

  // 7. Algoritmo greedy
  type EstadoEmpleado = {
    minConsecutivosEnAlta: number;
    segmentos: SegmentoToWrite[];
  };

  const estadosEmpleado = new Map<string, EstadoEmpleado>();
  empleadoIds.forEach((eid) => {
    estadosEmpleado.set(eid, { minConsecutivosEnAlta: 0, segmentos: [] });
  });

  const huecos: HuecoReporte[] = [];
  const segmentosAccumulados: SegmentoToWrite[] = [];

  for (const turno of turnosDelDia) {
    for (const req of turno.requerimientos) {
      const estacion = estacionesMap.get(req.estacion_id);
      if (!estacion) continue;

      const buckets = generarBuckets(turno.start_time, turno.end_time);

      for (const bucket of buckets) {
        // a. Empleados dentro de su ventana de presencia
        const disponibles = presencias
          .filter(
            (p) =>
              toMinutes(p.start) <= toMinutes(bucket.start) &&
              toMinutes(p.end) >= toMinutes(bucket.end)
          )
          .map((p) => p.empleado_id);

        // b. Excluir empleados con segmento solapado
        const sinSolape = disponibles.filter((eid) => {
          const estado = estadosEmpleado.get(eid)!;
          return !estado.segmentos.some((s) =>
            seProlapan(s.start, s.end, bucket.start, bucket.end)
          );
        });

        // c. Anti-saturación: si exceden max_continuo_min, insertar descanso y excluir
        const sinSaturation = sinSolape.filter((eid) => {
          const estado = estadosEmpleado.get(eid)!;
          if (
            estacion.max_continuo_min !== null &&
            estado.minConsecutivosEnAlta >= estacion.max_continuo_min
          ) {
            const yaDescansa = estado.segmentos.some(
              (s) =>
                s.tipo === "descanso" &&
                seProlapan(s.start, s.end, bucket.start, bucket.end)
            );
            if (!yaDescansa) {
              const descanso: SegmentoToWrite = {
                empresa_id,
                ubicacion_id,
                empleado_id: eid,
                date,
                estacion_id: null,
                tipo: "descanso",
                start: bucket.start,
                end: bucket.end,
                asignacion_id: "",
                status: "draft",
              };
              estado.segmentos.push(descanso);
              segmentosAccumulados.push(descanso);
              estado.minConsecutivosEnAlta = 0;
            }
            return false;
          }
          return true;
        });

        // d. Aplicar reglas hard (is_strict === true, nunca_juntos)
        const candidatos = sinSaturation.filter((eid) => {
          const reglas = reglasMap.get(eid) ?? [];
          for (const regla of reglas) {
            if (!regla.is_strict || regla.type !== "nunca_juntos") continue;
            const otro =
              regla.person_uno_id === eid
                ? regla.person_dos_id
                : regla.person_uno_id;
            const otroEstado = estadosEmpleado.get(otro);
            if (
              otroEstado?.segmentos.some(
                (s) =>
                  s.tipo === "estacion" &&
                  seProlapan(s.start, s.end, bucket.start, bucket.end)
              )
            ) {
              return false;
            }
          }
          return true;
        });

        // e. Ordenar por menor fatiga
        candidatos.sort((a, b) => {
          const fa = estadosEmpleado.get(a)?.minConsecutivosEnAlta ?? 0;
          const fb = estadosEmpleado.get(b)?.minConsecutivosEnAlta ?? 0;
          return fa - fb;
        });

        // f. Asignar hasta `cantidad`
        const asignados = candidatos.slice(0, req.cantidad);

        if (asignados.length < req.cantidad) {
          huecos.push({
            date,
            bucket_start: bucket.start,
            bucket_end: bucket.end,
            estacion_id: req.estacion_id,
            requerido: req.cantidad,
            asignado: asignados.length,
          });
        }

        for (const eid of asignados) {
          const seg: SegmentoToWrite = {
            empresa_id,
            ubicacion_id,
            empleado_id: eid,
            date,
            estacion_id: req.estacion_id,
            tipo: "estacion",
            start: bucket.start,
            end: bucket.end,
            asignacion_id: "",
            status: "draft",
          };
          const estado = estadosEmpleado.get(eid)!;
          estado.segmentos.push(seg);
          segmentosAccumulados.push(seg);

          if (estacion.intensidad === "alta") {
            estado.minConsecutivosEnAlta += 30;
          } else {
            estado.minConsecutivosEnAlta = 0;
          }
        }
      }
    }
  }

  // 8. Batch write: Asignacion + Segmentos
  const asignacionRef = db.collection("asignaciones").doc();
  const asignacionId = asignacionRef.id;
  segmentosAccumulados.forEach((s) => {
    s.asignacion_id = asignacionId;
  });

  const now = admin.firestore.FieldValue.serverTimestamp();
  const BATCH_SIZE = 499;

  const mainBatch = db.batch();
  mainBatch.set(asignacionRef, {
    empresa_id,
    ubicacion_id,
    date,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });

  let currentBatch = mainBatch;
  let opCount = 1;

  for (const seg of segmentosAccumulados) {
    if (opCount >= BATCH_SIZE) {
      await currentBatch.commit();
      currentBatch = db.batch();
      opCount = 0;
    }
    const segRef = db.collection("segmentos").doc();
    currentBatch.set(segRef, {
      ...seg,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
    opCount++;
  }
  await currentBatch.commit();

  return {
    asignacion_id: asignacionId,
    segmentos_creados: segmentosAccumulados.length,
    huecos,
  };
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

// Crea un preapproval (suscripción) en MercadoPago y guarda el init_point
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

  // Calcular trial end (7 días)
  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + 7);

  const backUrl = process.env.APP_BASE_URL ?? "https://nexturn.app";

  const body = {
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: montoTotal,
      currency_id: "CLP",
      free_trial: {
        frequency: 7,
        frequency_type: "days",
      },
    },
    back_url: `${backUrl}/${empresa.slug}/facturacion`,
    payer_email: empresa.mp_payer_email ?? null,
    reason: `Nexturn ${plan.charAt(0).toUpperCase() + plan.slice(1)} — ${empresa.razon_social ?? empresa.slug}`,
    external_reference: empresa_id,
  };

  const mpRes = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!mpRes.ok) {
    const err = await mpRes.text();
    throw new HttpsError("internal", `MercadoPago error: ${err}`);
  }

  const mpData = await mpRes.json() as { id: string; init_point: string };

  const now = admin.firestore.FieldValue.serverTimestamp();
  await db.collection("empresas").doc(empresa_id).update({
    plan,
    mp_preapproval_id: mpData.id,
    subscription_status: "trialing",
    entitlements: PLAN_ENTITLEMENTS[plan],
    trial_ends_at: admin.firestore.Timestamp.fromDate(trialEnds),
    updatedAt: now,
  });

  return { init_point: mpData.init_point };
});

// Cancela la suscripción activa de una empresa
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
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "cancelled" }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new HttpsError("internal", `MercadoPago error: ${err}`);
  }

  await db.collection("empresas").doc(empresa_id).update({
    subscription_status: "canceled",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true };
});

// Webhook de MercadoPago — recibe notificaciones de pago y suscripción
export const webhookMercadoPago = onRequest(
  { region: "southamerica-west1" },
  async (req, res) => {
    // Validar firma x-signature para prevenir spoofing
    const xSignature = req.headers["x-signature"] as string | undefined;
    const xRequestId = req.headers["x-request-id"] as string | undefined;
    const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET;

    if (MP_WEBHOOK_SECRET && xSignature) {
      const parts = xSignature.split(",");
      const ts = parts.find(p => p.startsWith("ts="))?.split("=")[1];
      const v1 = parts.find(p => p.startsWith("v1="))?.split("=")[1];
      const dataId = (req.query.data?.toString() && typeof req.query["data.id"] === "string")
        ? req.query["data.id"]
        : req.body?.data?.id;
      const manifest = `id:${dataId ?? ""};request-id:${xRequestId ?? ""};ts:${ts ?? ""};`;
      const expected = crypto.createHmac("sha256", MP_WEBHOOK_SECRET).update(manifest).digest("hex");
      if (v1 !== expected) {
        res.status(401).send("Firma inválida");
        return;
      }
    }

    const topic = req.query.topic ?? req.body?.type;
    const resourceId = req.body?.data?.id ?? req.query.id;

    if (!topic || !resourceId) {
      res.status(400).send("topic e id son requeridos.");
      return;
    }

    const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
    if (!MP_ACCESS_TOKEN) {
      res.status(500).send("MP_ACCESS_TOKEN no configurado.");
      return;
    }

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
    authorized: "active",
    paused: "paused",
    cancelled: "canceled",
    pending: "pending",
  };
  const newStatus = statusMap[data.status] ?? data.status;

  await db.collection("empresas").doc(empresaId).update({
    subscription_status: newStatus,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function handlePagoAutorizadoWebhook(pagoId: string, token: string) {
  // Idempotencia: verificar si ya procesamos este pago
  const existente = await db.collection("documentos_tributarios")
    .where("payment_ref", "==", pagoId)
    .limit(1)
    .get();
  if (!existente.empty) return; // Ya procesado

  const mpRes = await fetch(`https://api.mercadopago.com/authorized_payments/${pagoId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!mpRes.ok) return;

  const pago = await mpRes.json() as {
    preapproval_id: string;
    transaction_amount: number;
    date_approved: string;
  };

  // Buscar empresa por preapproval_id
  const empSnap = await db.collection("empresas")
    .where("mp_preapproval_id", "==", pago.preapproval_id)
    .limit(1)
    .get();
  if (empSnap.empty) return;

  const empresaId = empSnap.docs[0].id;
  const empresa = empSnap.docs[0].data();

  const montoTotal = pago.transaction_amount;
  const montoNeto = Math.round(montoTotal / 1.19);
  const iva = montoTotal - montoNeto;
  const periodo = pago.date_approved.slice(0, 7); // YYYY-MM

  // Determinar proveedor DTE configurado
  const dteProvider = empresa.dte_provider_default ?? "sii_manual";

  const now = admin.firestore.FieldValue.serverTimestamp();
  const docRef = db.collection("documentos_tributarios").doc();
  await docRef.set({
    empresa_id: empresaId,
    payment_ref: pagoId,
    periodo,
    tipo_dte: empresa.tipo_dte_default ?? "boleta",
    monto_neto: montoNeto,
    iva,
    monto_total: montoTotal,
    folio: null,
    origen: dteProvider,
    estado: "pendiente",
    archivo_pdf_url: null,
    archivo_xml_url: null,
    emitido_at: null,
    notificado_at: null,
    createdAt: now,
    updatedAt: now,
  });

  // Si el proveedor es OpenFactura, emitir automáticamente
  if (dteProvider === "openfactura") {
    await emitirDTEOpenFactura(docRef.id, empresaId, empresa, montoNeto, iva, montoTotal, periodo);
  }

  // Marcar empresa como activa si estaba en past_due o trialing
  if (empresa.subscription_status !== "active") {
    await db.collection("empresas").doc(empresaId).update({
      subscription_status: "active",
      updatedAt: now,
    });
  }
}

async function emitirDTEOpenFactura(
  documentoId: string,
  empresaId: string,
  empresa: admin.firestore.DocumentData,
  montoNeto: number,
  iva: number,
  montoTotal: number,
  periodo: string
) {
  const OF_API_KEY = process.env.OPENFACTURA_API_KEY;
  if (!OF_API_KEY) {
    console.warn("OPENFACTURA_API_KEY no configurado, DTE queda pendiente.");
    return;
  }

  try {
    const body = {
      Encabezado: {
        IdDoc: { TipoDTE: 39 },
        Emisor: {
          RUTEmisor: process.env.EMISOR_RUT,
          RznSoc: process.env.EMISOR_RAZON_SOCIAL,
          GiroEmis: process.env.EMISOR_GIRO,
          DirOrigen: process.env.EMISOR_DIRECCION,
        },
        Receptor: {
          RUTRecep: empresa.rut,
          RznSocRecep: empresa.razon_social,
          GiroRecep: empresa.giro,
          DirRecep: empresa.direccion,
        },
        Totales: { MntNeto: montoNeto, TasaIVA: 19, IVA: iva, MntTotal: montoTotal },
      },
      Detalle: [{
        NroLinDet: 1,
        NmbItem: `Suscripción Nexturn ${empresa.plan ?? ""} — ${periodo}`,
        QtyItem: 1,
        PrcItem: montoNeto,
        MontoItem: montoNeto,
      }],
    };

    const res = await fetch("https://api.haulmer.com/v2/dte/document", {
      method: "POST",
      headers: {
        "apikey": OF_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error("OpenFactura error:", await res.text());
      await db.collection("documentos_tributarios").doc(documentoId).update({
        estado: "error",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return;
    }

    const result = await res.json() as { FOLIO: string | number; PDF: string; XML: string };

    await db.collection("documentos_tributarios").doc(documentoId).update({
      folio: String(result.FOLIO),
      archivo_pdf_url: result.PDF ?? null,
      archivo_xml_url: result.XML ?? null,
      estado: "emitido",
      emitido_at: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notificar al cliente/empresa
    await notificarDTE(documentoId, empresaId);

  } catch (e) {
    console.error("Error emitiendo DTE OpenFactura:", e);
    await db.collection("documentos_tributarios").doc(documentoId).update({
      estado: "error",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

// Notifica al cliente y empresa que su DTE fue emitido
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
    estado: "notificado",
    notificado_at: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true };
});

async function notificarDTE(documentoId: string, empresaId: string) {
  // Por ahora registra en consola. Integrar SendGrid/Firebase Email Extension aquí.
  console.log(`DTE ${documentoId} emitido para empresa ${empresaId}. Notificación pendiente de integración de email.`);
}
