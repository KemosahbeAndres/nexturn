/**
 * Migración Login-Fix — marcador público config/setup.
 *
 * Contexto:
 *   El login y la pantalla inicial dejaron de usar queries de colección sobre
 *   'usuarios'/'contactos' (las Security Rules las niegan para preservar el
 *   aislamiento multi-tenant). checkIfFirstSetup() ahora lee un marcador público
 *   config/setup = { initialized: true } en vez de consultar 'usuarios'.
 *
 * Qué hace:
 *   - Si ya existe al menos un usuario super_admin, crea/asegura config/setup
 *     = { initialized: true } para que la pantalla de login NO muestre el registro
 *     del primer super_admin.
 *
 * Idempotencia: si config/setup ya tiene initialized:true, no hace nada.
 *
 * Reversión: --rollback  → borra config/setup (vuelve a estado "primer arranque").
 *   ⚠️ Solo usar en entornos sin super_admin; si hay super_admin y se borra,
 *      la pantalla volverá a ofrecer el registro inicial (pero checkIfFirstSetup
 *      lo recreará al registrar). Reversible y seguro.
 *
 * Uso:
 *   npx tsx scripts/migrate-login-fix.ts
 *   npx tsx scripts/migrate-login-fix.ts --rollback
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';

const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT || './serviceAccount.json';
const isRollback = process.argv.includes('--rollback');

if (!existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(`❌ No se encontró el archivo de credenciales en: ${SERVICE_ACCOUNT_PATH}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function migrate() {
  console.log('🚀 Migración Login-Fix — config/setup\n');

  // ¿Existe al menos un super_admin?
  const saSnap = await db
    .collection('usuarios')
    .where('system_role', '==', 'super_admin')
    .limit(1)
    .get();

  if (saSnap.empty) {
    console.log('ℹ️  No hay super_admin todavía. No se marca initialized (el sistema está en primer arranque).');
    return;
  }

  const setupRef = db.collection('config').doc('setup');
  const current = await setupRef.get();
  if (current.exists && current.data()?.initialized === true) {
    console.log('✅ config/setup ya está initialized:true — nada que hacer (idempotente).');
    return;
  }

  await setupRef.set({ initialized: true, updatedAt: Timestamp.now() }, { merge: true });
  console.log('✨ config/setup = { initialized: true } creado.');
  console.log('\n✅ Migración Login-Fix completada.');
}

async function rollback() {
  console.log('⏪ Rollback Login-Fix — borrando config/setup\n');
  const setupRef = db.collection('config').doc('setup');
  const current = await setupRef.get();
  if (!current.exists) {
    console.log('ℹ️  config/setup no existe — nada que revertir.');
    return;
  }
  await setupRef.delete();
  console.log('🗑️  config/setup eliminado.');
  console.log('\n✅ Rollback Login-Fix completado.');
}

(isRollback ? rollback() : migrate()).catch((err) => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
