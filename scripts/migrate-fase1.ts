/**
 * Migración Fase 1 — Crear grants iniciales y poblar company_ids en usuarios.
 *
 * Qué hace:
 *   1. Por cada usuario con empresa_id (no super_admin): crea un grant company_admin
 *      sobre esa empresa si no existe ya uno.
 *   2. Actualiza el campo company_ids[] en cada usuario con los IDs de empresa donde tiene grant.
 *   3. Añade estado: 'activo' a todos los usuarios que no tengan el campo.
 *   4. Los super_admin quedan sin grants (acceso global por system_role).
 *
 * Idempotencia: verifica grants existentes por (user_id, scope_id) antes de crear.
 *
 * Reversión: ejecutar con flag --rollback
 *   Lee migrate-fase1-rollback.json y elimina los grants creados en la última corrida.
 *
 * Uso:
 *   npx tsx scripts/migrate-fase1.ts
 *   npx tsx scripts/migrate-fase1.ts --rollback
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';

// ── Configuración ──────────────────────────────────────────────────────────────
const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT || './serviceAccount.json';
const ROLLBACK_FILE = './migrate-fase1-rollback.json';
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
interface UsuarioDoc {
  id: string;
  empresa_id?: string | null;
  cliente_id?: string | null;
  system_role?: string;
  estado?: string;
  company_ids?: string[];
}

interface EmpresaDoc {
  id: string;
  cliente_id?: string | null;
  slug?: string;
}

interface RollbackData {
  grants_creados: string[];
}

// ── Función principal ──────────────────────────────────────────────────────────
async function migrate() {
  console.log('🚀 Iniciando migración Fase 1 — grants + company_ids\n');

  const createdGrantIds: string[] = [];

  // 1. Leer todos los usuarios
  const usuariosSnap = await db.collection('usuarios').where('deletedAt', '==', null).get();
  const usuarios: UsuarioDoc[] = usuariosSnap.docs.map(d => ({ id: d.id, ...d.data() } as UsuarioDoc));
  console.log(`📋 Usuarios encontrados: ${usuarios.length}`);

  // Cache de empresas para no releer
  const empresaCache = new Map<string, EmpresaDoc>();

  async function getEmpresa(empresaId: string): Promise<EmpresaDoc | null> {
    if (empresaCache.has(empresaId)) return empresaCache.get(empresaId)!;
    const snap = await db.collection('empresas').doc(empresaId).get();
    if (!snap.exists) return null;
    const empresa = { id: snap.id, ...snap.data() } as EmpresaDoc;
    empresaCache.set(empresaId, empresa);
    return empresa;
  }

  for (const usuario of usuarios) {
    // super_admin: solo asegurar estado y company_ids vacíos
    if (usuario.system_role === 'super_admin') {
      const updates: Record<string, unknown> = { updatedAt: Timestamp.now() };
      if (!usuario.estado) updates.estado = 'activo';
      if (!usuario.company_ids) updates.company_ids = [];
      await db.collection('usuarios').doc(usuario.id).update(updates);
      console.log(`  ✅ super_admin ${usuario.id}: estado/company_ids asegurados`);
      continue;
    }

    if (!usuario.empresa_id) {
      console.log(`  ⚠️  Usuario ${usuario.id} sin empresa_id — skip grants`);
      const updates: Record<string, unknown> = { updatedAt: Timestamp.now() };
      if (!usuario.estado) updates.estado = 'activo';
      if (!usuario.company_ids) updates.company_ids = [];
      await db.collection('usuarios').doc(usuario.id).update(updates);
      continue;
    }

    const empresa = await getEmpresa(usuario.empresa_id);
    if (!empresa) {
      console.log(`  ⚠️  Empresa ${usuario.empresa_id} no encontrada para usuario ${usuario.id}`);
      continue;
    }

    const clienteId = usuario.cliente_id || empresa.cliente_id || '';

    // Verificar idempotencia: ¿ya existe un grant activo para este usuario+empresa?
    const existingSnap = await db.collection('grants')
      .where('user_id', '==', usuario.id)
      .where('scope_id', '==', usuario.empresa_id)
      .where('scope_type', '==', 'company')
      .where('deletedAt', '==', null)
      .limit(1)
      .get();

    let grantId: string;

    if (!existingSnap.empty) {
      grantId = existingSnap.docs[0].id;
      console.log(`  ✅ Usuario ${usuario.id}: grant ya existe (${grantId}), skip`);
    } else {
      grantId = randomUUID();
      const now = Timestamp.now();
      await db.collection('grants').doc(grantId).set({
        user_id: usuario.id,
        cliente_id: clienteId,
        company_id: usuario.empresa_id,
        scope_type: 'company',
        scope_id: usuario.empresa_id,
        role: 'company_admin',
        active: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
      createdGrantIds.push(grantId);
      console.log(`  ✨ Usuario ${usuario.id}: grant company_admin creado para empresa ${empresa.slug ?? usuario.empresa_id}`);
    }

    // Actualizar company_ids + estado en el usuario
    const currentCompanyIds: string[] = usuario.company_ids ?? [];
    const updatedCompanyIds = currentCompanyIds.includes(usuario.empresa_id)
      ? currentCompanyIds
      : [...currentCompanyIds, usuario.empresa_id];

    const updates: Record<string, unknown> = {
      company_ids: updatedCompanyIds,
      updatedAt: Timestamp.now(),
    };
    if (!usuario.estado) updates.estado = 'activo';

    await db.collection('usuarios').doc(usuario.id).update(updates);
    console.log(`     → company_ids y estado actualizados para usuario ${usuario.id}`);
  }

  // 2. Guardar rollback
  if (createdGrantIds.length > 0) {
    const rollbackData: RollbackData = { grants_creados: createdGrantIds };
    writeFileSync(ROLLBACK_FILE, JSON.stringify(rollbackData, null, 2));
    console.log(`\n📄 Rollback guardado en ${ROLLBACK_FILE} (${createdGrantIds.length} grants)`);
  } else {
    console.log('\nℹ️  No se crearon grants nuevos (todo ya estaba migrado).');
  }

  console.log('\n✅ Migración Fase 1 completada.');
}

// ── Función de rollback ────────────────────────────────────────────────────────
async function rollback() {
  console.log('⏪ Iniciando rollback de Fase 1...\n');

  if (!existsSync(ROLLBACK_FILE)) {
    console.error(`❌ No se encontró ${ROLLBACK_FILE}. Ejecuta la migración primero.`);
    process.exit(1);
  }

  const rollbackData: RollbackData = JSON.parse(readFileSync(ROLLBACK_FILE, 'utf8'));
  const ids = rollbackData.grants_creados || [];

  if (ids.length === 0) {
    console.log('ℹ️  No hay grants que revertir.');
    return;
  }

  console.log(`🗑️  Eliminando ${ids.length} grants...\n`);

  for (const grantId of ids) {
    const grantSnap = await db.collection('grants').doc(grantId).get();
    if (!grantSnap.exists) {
      console.log(`  ⚠️  Grant ${grantId} no existe, skip`);
      continue;
    }

    const grantData = grantSnap.data()!;
    const userId = grantData.user_id as string;
    const companyId = grantData.scope_id as string;

    // Quitar company_id del array en el usuario
    const usuarioSnap = await db.collection('usuarios').doc(userId).get();
    if (usuarioSnap.exists) {
      const currentIds: string[] = usuarioSnap.data()!.company_ids ?? [];
      await db.collection('usuarios').doc(userId).update({
        company_ids: currentIds.filter((id: string) => id !== companyId),
        updatedAt: Timestamp.now(),
      });
      console.log(`  → company_id ${companyId} quitado del usuario ${userId}`);
    }

    // Eliminar el grant
    await db.collection('grants').doc(grantId).delete();
    console.log(`  🗑️  Grant ${grantId} eliminado`);
  }

  console.log('\n✅ Rollback Fase 1 completado.');
}

// ── Entry point ────────────────────────────────────────────────────────────────
(isRollback ? rollback() : migrate()).catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
