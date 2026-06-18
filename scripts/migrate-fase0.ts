/**
 * Migración Fase 0 — Crear colección `clientes` y propagar `cliente_id`.
 *
 * Qué hace:
 *   1. Por cada empresa sin `cliente_id`: crea un doc en `clientes` (plan 'free')
 *      y escribe `cliente_id` en el doc de la empresa.
 *   2. Por cada usuario de empresa sin `cliente_id`: lo propaga desde su empresa.
 *   3. Los usuarios super_admin quedan con `cliente_id = null` (correcto por diseño).
 *
 * Idempotencia: antes de crear el cliente verifica que no exista otro con el mismo slug.
 *
 * Reversión: ejecutar con flag --rollback
 *   Lee migrate-fase0-rollback.json y borra los docs de `clientes` creados en la última corrida.
 *
 * Uso:
 *   npx tsx scripts/migrate-fase0.ts
 *   npx tsx scripts/migrate-fase0.ts --rollback
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';

// ── Configuración ──────────────────────────────────────────────────────────────
// Ruta al archivo de credenciales de Firebase Admin SDK.
// Descárgalo desde: Firebase Console → Configuración del proyecto → Cuentas de servicio.
const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT || './serviceAccount.json';
const ROLLBACK_FILE = './migrate-fase0-rollback.json';

const isRollback = process.argv.includes('--rollback');

// ── Inicializar Admin SDK ──────────────────────────────────────────────────────
if (!existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(`❌ No se encontró el archivo de credenciales en: ${SERVICE_ACCOUNT_PATH}`);
  console.error('   Descárgalo desde Firebase Console → Configuración → Cuentas de servicio.');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ── Tipos mínimos para el script ───────────────────────────────────────────────
interface EmpresaDoc {
  id: string;
  slug?: string;
  contact_id?: string;
  cliente_id?: string | null;
}

interface UsuarioDoc {
  id: string;
  empresa_id?: string | null;
  system_role?: string;
  cliente_id?: string | null;
}

interface RollbackData {
  clientes_creados: string[];
}

// ── Función principal ──────────────────────────────────────────────────────────
async function migrate() {
  console.log('🚀 Iniciando migración Fase 0 — clientes + cliente_id\n');

  const createdClienteIds: string[] = [];

  // 1. Leer todas las empresas
  const empresasSnap = await db.collection('empresas').where('deletedAt', '==', null).get();
  const empresas: EmpresaDoc[] = empresasSnap.docs.map(d => ({ id: d.id, ...d.data() } as EmpresaDoc));

  console.log(`📋 Empresas encontradas: ${empresas.length}`);

  // Mapa empresa_id → cliente_id para usar en el paso de usuarios
  const empresaToClienteId = new Map<string, string>();

  for (const empresa of empresas) {
    if (empresa.cliente_id) {
      // Ya migrada: solo registrar el cliente_id para propagar a usuarios
      empresaToClienteId.set(empresa.id, empresa.cliente_id);
      console.log(`  ✅ Empresa "${empresa.slug}" ya tiene cliente_id=${empresa.cliente_id} (skip)`);
      continue;
    }

    const slug = empresa.slug || empresa.id;

    // Verificar idempotencia: ¿ya existe un cliente con este slug?
    const existingSnap = await db.collection('clientes').where('slug', '==', slug).limit(1).get();

    let clienteId: string;

    if (!existingSnap.empty) {
      clienteId = existingSnap.docs[0].id;
      console.log(`  ⚠️  Empresa "${slug}": cliente ya existe con id=${clienteId}, reutilizando.`);
    } else {
      clienteId = randomUUID();
      const now = Timestamp.now();
      await db.collection('clientes').doc(clienteId).set({
        contact_id: empresa.contact_id || '',
        slug,
        plan: 'free',
        subscription_status: 'trialing',
        entitlements: {
          max_empleados: 15,
          max_sucursales: 1,
          multiempresa: false,
          features: [],
        },
        stripe_customer_id: null,
        active: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
      createdClienteIds.push(clienteId);
      console.log(`  ✨ Empresa "${slug}": cliente creado con id=${clienteId}`);
    }

    // Propagar cliente_id a la empresa
    await db.collection('empresas').doc(empresa.id).update({
      cliente_id: clienteId,
      updatedAt: Timestamp.now(),
    });
    empresaToClienteId.set(empresa.id, clienteId);
    console.log(`     → empresa "${slug}" actualizada con cliente_id=${clienteId}`);
  }

  // 2. Propagar cliente_id a los usuarios
  console.log('\n👥 Propagando cliente_id a usuarios...');
  const usuariosSnap = await db.collection('usuarios').where('deletedAt', '==', null).get();
  const usuarios: UsuarioDoc[] = usuariosSnap.docs.map(d => ({ id: d.id, ...d.data() } as UsuarioDoc));

  let usuariosActualizados = 0;
  let usuariosSkipped = 0;

  for (const usuario of usuarios) {
    if (usuario.system_role === 'super_admin') {
      // super_admin siempre tiene cliente_id = null por diseño
      if (usuario.cliente_id !== null && usuario.cliente_id !== undefined) {
        await db.collection('usuarios').doc(usuario.id).update({ cliente_id: null, updatedAt: Timestamp.now() });
        console.log(`  🔧 super_admin ${usuario.id}: cliente_id forzado a null`);
        usuariosActualizados++;
      }
      continue;
    }

    if (usuario.cliente_id) {
      usuariosSkipped++;
      continue;
    }

    if (!usuario.empresa_id) {
      console.log(`  ⚠️  Usuario ${usuario.id} sin empresa_id y sin cliente_id — skip`);
      continue;
    }

    const clienteId = empresaToClienteId.get(usuario.empresa_id);
    if (!clienteId) {
      console.log(`  ⚠️  No se encontró cliente para empresa_id=${usuario.empresa_id} (usuario ${usuario.id})`);
      continue;
    }

    await db.collection('usuarios').doc(usuario.id).update({
      cliente_id: clienteId,
      updatedAt: Timestamp.now(),
    });
    usuariosActualizados++;
  }

  console.log(`  ✅ Usuarios actualizados: ${usuariosActualizados}, ya migrados: ${usuariosSkipped}`);

  // 3. Guardar archivo de rollback
  if (createdClienteIds.length > 0) {
    const rollbackData: RollbackData = { clientes_creados: createdClienteIds };
    writeFileSync(ROLLBACK_FILE, JSON.stringify(rollbackData, null, 2));
    console.log(`\n📄 Archivo de rollback guardado en ${ROLLBACK_FILE}`);
    console.log(`   Clientes creados en esta corrida: ${createdClienteIds.length}`);
  } else {
    console.log('\nℹ️  No se crearon clientes nuevos (todo ya estaba migrado).');
  }

  console.log('\n✅ Migración Fase 0 completada.');
}

// ── Función de rollback ────────────────────────────────────────────────────────
async function rollback() {
  console.log('⏪ Iniciando rollback de Fase 0...\n');

  if (!existsSync(ROLLBACK_FILE)) {
    console.error(`❌ No se encontró ${ROLLBACK_FILE}. Ejecuta la migración primero.`);
    process.exit(1);
  }

  const rollbackData: RollbackData = JSON.parse(readFileSync(ROLLBACK_FILE, 'utf8'));
  const ids = rollbackData.clientes_creados || [];

  if (ids.length === 0) {
    console.log('ℹ️  No hay clientes que revertir.');
    return;
  }

  console.log(`🗑️  Eliminando ${ids.length} clientes creados en la última corrida...`);

  for (const clienteId of ids) {
    // Quitar cliente_id de empresas que apunten a este cliente
    const empresasSnap = await db.collection('empresas').where('cliente_id', '==', clienteId).get();
    for (const empresaDoc of empresasSnap.docs) {
      await empresaDoc.ref.update({ cliente_id: null, updatedAt: Timestamp.now() });
      console.log(`  → empresa ${empresaDoc.id}: cliente_id limpiado`);
    }

    // Quitar cliente_id de usuarios
    const usuariosSnap = await db.collection('usuarios').where('cliente_id', '==', clienteId).get();
    for (const usuarioDoc of usuariosSnap.docs) {
      await usuarioDoc.ref.update({ cliente_id: null, updatedAt: Timestamp.now() });
      console.log(`  → usuario ${usuarioDoc.id}: cliente_id limpiado`);
    }

    // Borrar el doc de cliente
    await db.collection('clientes').doc(clienteId).delete();
    console.log(`  🗑️  cliente ${clienteId} eliminado`);
  }

  console.log('\n✅ Rollback completado.');
}

// ── Entry point ────────────────────────────────────────────────────────────────
(isRollback ? rollback() : migrate()).catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
