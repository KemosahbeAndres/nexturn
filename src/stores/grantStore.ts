import { defineStore } from 'pinia';
import { ref } from 'vue';
import { collection, getDocs, query, where, doc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Grant, grantConverter } from '../models/Grant';
import { puedeAcceder, can } from '../auth/access';
import type { AccessContext } from '../auth/access';
import type { Permission, ScopeType } from '../auth/permissions';

export const useGrantStore = defineStore('grant', () => {
  // Lectura puntual al login — NO listener (§9 CLAUDE.md: acotar costo de Firestore)
  const grants = ref<Grant[]>([]);

  // Mapa slug→id para resolver URL params sin lecturas adicionales en el guard
  const empresaSlugToId = ref<Record<string, string>>({});
  const ubicacionSlugToId = ref<Record<string, { id: string; zone_id: string | null }>>({});
  const zonaSlugToId = ref<Record<string, string>>({});

  async function cargarGrants(userId: string): Promise<void> {
    const snap = await getDocs(
      query(
        collection(db, 'grants').withConverter(grantConverter),
        where('user_id', '==', userId),
        where('active', '==', true),
        where('deletedAt', '==', null)
      )
    );
    grants.value = snap.docs.map(d => d.data());
  }

  function registrarEmpresaSlug(slug: string, id: string): void {
    empresaSlugToId.value[slug] = id;
  }

  function registrarUbicacionSlug(slug: string, id: string, zoneId: string | null): void {
    ubicacionSlugToId.value[slug] = { id, zone_id: zoneId };
  }

  function registrarZonaSlug(slug: string, id: string): void {
    zonaSlugToId.value[slug] = id;
  }

  function resolverZonaId(slug: string): string | null {
    return zonaSlugToId.value[slug] ?? null;
  }

  function resolverEmpresaId(slug: string): string | null {
    return empresaSlugToId.value[slug] ?? null;
  }

  function resolverUbicacion(slug: string): { id: string; zone_id: string | null } | null {
    return ubicacionSlugToId.value[slug] ?? null;
  }

  function limpiarGrants(): void {
    grants.value = [];
    empresaSlugToId.value = {};
    ubicacionSlugToId.value = {};
    zonaSlugToId.value = {};
  }

  // Wrappers que reciben usuario desde fuera (evita dependencia circular con sessionStore)
  function puedeAccederScope(
    user: InstanceType<typeof import('../models/Usuario').Usuario>,
    scopeType: ScopeType,
    scopeId: string,
    ctx?: AccessContext
  ): boolean {
    return puedeAcceder(user, grants.value, scopeType, scopeId, ctx);
  }

  function canDo(
    user: InstanceType<typeof import('../models/Usuario').Usuario>,
    permission: Permission,
    scopeType: ScopeType,
    scopeId: string,
    ctx?: AccessContext
  ): boolean {
    return can(user, grants.value, permission, scopeType, scopeId, ctx);
  }

  // Crear un grant nuevo (usado por UI de invitación / provisionamiento — Fase 3)
  async function crearGrant(data: Omit<Grant, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<string> {
    const grantsRef = collection(db, 'grants').withConverter(grantConverter);
    const newRef = doc(grantsRef);
    const newGrant = new Grant(
      newRef.id,
      data.user_id,
      data.cliente_id,
      data.company_id,
      data.scope_type,
      data.scope_id,
      data.role,
      true
    );
    await setDoc(newRef, newGrant);

    // Actualizar company_ids denormalizado en el doc del usuario (requerido por Security Rules)
    if (data.company_id) {
      await _appendCompanyId(data.user_id, data.company_id);
    }

    // Reflejar en memoria si es el usuario actual
    grants.value.push(newGrant);
    return newRef.id;
  }

  // Revocar un grant (soft delete)
  async function revocarGrant(grantId: string, userId: string, companyId: string | null): Promise<void> {
    await updateDoc(doc(db, 'grants', grantId), {
      active: false,
      deletedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Si no quedan grants activos para esa empresa, quitar de company_ids
    if (companyId) {
      const quedanGrants = grants.value.some(
        g => g.company_id === companyId && g.active && g.id !== grantId
      );
      if (!quedanGrants) {
        await _removeCompanyId(userId, companyId);
      }
    }

    grants.value = grants.value.filter(g => g.id !== grantId);
  }

  return {
    grants,
    empresaSlugToId,
    ubicacionSlugToId,
    zonaSlugToId,
    cargarGrants,
    limpiarGrants,
    registrarEmpresaSlug,
    registrarUbicacionSlug,
    registrarZonaSlug,
    resolverEmpresaId,
    resolverUbicacion,
    resolverZonaId,
    puedeAccederScope,
    canDo,
    crearGrant,
    revocarGrant,
  };
});

// ── Helpers privados ────────────────────────────────────────────────────────────

async function _appendCompanyId(userId: string, companyId: string): Promise<void> {
  // Leer el array actual y añadir si no está — operación no atómica pero aceptable aquí;
  // en Fase 5 se hará vía Cloud Function con FieldValue.arrayUnion para garantizar atomicidad.
  const { getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'usuarios', userId));
  if (!snap.exists()) return;
  const current: string[] = snap.data().company_ids ?? [];
  if (current.includes(companyId)) return;
  await updateDoc(doc(db, 'usuarios', userId), {
    company_ids: [...current, companyId],
    updatedAt: Timestamp.now(),
  });
}

async function _removeCompanyId(userId: string, companyId: string): Promise<void> {
  const { getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'usuarios', userId));
  if (!snap.exists()) return;
  const current: string[] = snap.data().company_ids ?? [];
  await updateDoc(doc(db, 'usuarios', userId), {
    company_ids: current.filter(id => id !== companyId),
    updatedAt: Timestamp.now(),
  });
}
