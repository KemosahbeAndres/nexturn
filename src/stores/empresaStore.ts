import { defineStore } from 'pinia';
import { useCollection } from 'vuefire';
import { collection, doc, setDoc, updateDoc, query, where, Timestamp, getDoc, documentId } from 'firebase/firestore';
import { ref, computed, watch } from 'vue';
import { db } from '../firebase';
import { Empresa, empresaConverter, PLAN_ENTITLEMENTS } from '../models/Empresa';
import type { EmpresaType, EmpresaPlan } from '../models/Empresa';
import { contactoConverter } from '../models/Contacto';
import { Role, roleToFirestore } from '../models/Role';
import type { ScopeRoleTemplate } from '../models/Role';
import { useSessionStore } from './sessionStore';

export const useEmpresaStore = defineStore('empresa', () => {
  const sessionStore = useSessionStore();
  const empresasRef = collection(db, 'empresas').withConverter(empresaConverter);

  const queryParams = ref<{ role: string | null; empresaId: string | null; clienteId: string | null }>({ role: null, empresaId: null, clienteId: null });

  function listarEmpresas(role: string, empresaId?: string | null, clienteId?: string | null) {
    queryParams.value = { role, empresaId: empresaId || null, clienteId: clienteId || null };
  }

  const empresasQuery = computed(() => {
    if (!queryParams.value.role) return null;
    let q = query(empresasRef, where('deletedAt', '==', null));

    if (queryParams.value.role === 'super_admin') {
      return q;
    }

    // Modo cliente: listar todas las empresas del cliente
    if (queryParams.value.clienteId) {
      return query(q, where('cliente_id', '==', queryParams.value.clienteId));
    }

    // Modo empresa individual
    if (!queryParams.value.empresaId) return null;
    q = query(q, where(documentId(), '==', queryParams.value.empresaId));
    return q;
  });

  const empresas = useCollection(empresasQuery);

  // Computed helpers para filtrar por tipo
  const empresasTipo = computed(() =>
    (empresas.value ?? []).filter(e => e.type === 'empresa')
  );
  const congregaciones = computed(() =>
    (empresas.value ?? []).filter(e => e.type === 'congregacion')
  );

  // Empresa activa y helpers de tipo para ramificar UI y algoritmo
  const activeEmpresa = computed(() =>
    (empresas.value ?? []).find(e => e.id === sessionStore.activeCompanyId) ?? null
  );
  const activeTenantType = computed(() => activeEmpresa.value?.type ?? null);
  const isCongregacion = computed(() => activeEmpresa.value?.type === 'congregacion');

  watch(empresas, async (nuevasEmpresas) => {
    if (!nuevasEmpresas) return;
    for (const emp of nuevasEmpresas) {
      if (!emp.contacto && emp.contact_id) {
        const contactRef = doc(db, 'contactos', emp.contact_id).withConverter(contactoConverter);
        const snap = await getDoc(contactRef);
        emp.contacto = snap.exists() ? snap.data() : { first_name: 'Desconocido', last_name: '' } as any;
      }
    }
  }, { deep: true });

  async function createEmpresa(data: {
    active: boolean;
    contact_id: string;
    type: EmpresaType;
    cargos: Role[];
    slug: string;
    cliente_id?: string | null;
    rut?: string | null;
    razon_social?: string | null;
    giro?: string | null;
    direccion?: string | null;
    plan?: EmpresaPlan | null;
  }) {
    const docRef = doc(empresasRef);
    const facturable = data.type !== 'congregacion';
    const plan = data.type === 'congregacion' ? null : (data.plan ?? null);
    const entitlements = plan ? PLAN_ENTITLEMENTS[plan] : { max_empleados: 25, max_sucursales: 3, features: [] };

    const newEmpresa = new Empresa(
      docRef.id,
      data.active,
      data.contact_id,
      data.type,
      data.cargos,
      data.slug,
      new Date(),
      new Date(),
      null,
      data.cliente_id ?? null,
      data.rut ?? null,
      data.razon_social ?? null,
      data.giro ?? null,
      data.direccion ?? null,
      plan,
      facturable,
      null,
      null,
      facturable ? 'pending' : 'active',
      entitlements,
      null,
    );
    await setDoc(docRef, newEmpresa);
    return docRef.id;
  }

  async function updateEmpresa(id: string, updateData: Partial<Omit<Empresa, 'id' | 'createdAt' | 'contacto'>>) {
    const docRef = doc(db, 'empresas', id);
    const payload: Record<string, unknown> = { ...updateData, updatedAt: Timestamp.now() };
    if (payload.cargos) {
      payload.cargos = (payload.cargos as Role[]).map(roleToFirestore);
    }
    await updateDoc(docRef, payload);
  }

  async function softDeleteEmpresa(id: string) {
    const docRef = doc(db, 'empresas', id);
    await updateDoc(docRef, { active: false, deletedAt: Timestamp.now() });
  }

  // Gestión de roles de trabajo (solo admin/super_admin)
  async function addWorkRole(empresaId: string, data: {
    nombre: string;
    slug: string;
    parent_role?: string | null;
    scope_role_template?: ScopeRoleTemplate;
    elegible_encargado?: boolean;
    estaciones_default?: string[];
  }) {
    const empresa = empresas.value?.find(e => e.id === empresaId);
    if (!empresa) return;
    if (empresa.cargos.some(r => r.slug === data.slug)) {
      throw new Error(`Ya existe un rol con el slug "${data.slug}".`);
    }
    const parentId = data.parent_role ?? null;
    if (parentId && !empresa.cargos.some(r => r.id === parentId)) {
      throw new Error('El rol padre no existe en esta empresa.');
    }
    const newRole = new Role(
      crypto.randomUUID(),
      data.nombre,
      data.slug,
      parentId,
      data.scope_role_template ?? null,
      data.elegible_encargado ?? false,
      data.estaciones_default ?? []
    );
    await updateEmpresa(empresaId, { cargos: [...empresa.cargos, newRole] });
  }

  async function removeWorkRole(empresaId: string, roleId: string) {
    const empresa = empresas.value?.find(e => e.id === empresaId);
    if (!empresa) return;
    const role = empresa.cargos.find(r => r.id === roleId);
    if (!role) return;

    const hasChildren = empresa.cargos.some(r => r.parent_role === roleId);
    if (hasChildren) {
      throw new Error(`No se puede eliminar el rol "${role.nombre}" porque otros roles dependen de él en la jerarquía.`);
    }

    await updateEmpresa(empresaId, { cargos: empresa.cargos.filter(r => r.id !== roleId) });
  }

  async function updateWorkRole(empresaId: string, roleId: string, data: {
    nombre: string;
    slug: string;
    parent_role: string | null;
    scope_role_template: ScopeRoleTemplate;
    elegible_encargado: boolean;
    estaciones_default: string[];
  }) {
    const empresa = empresas.value?.find(e => e.id === empresaId);
    if (!empresa) return;
    const slugConflict = empresa.cargos.some(r => r.slug === data.slug && r.id !== roleId);
    if (slugConflict) throw new Error(`Ya existe un rol con el slug "${data.slug}".`);
    if (data.parent_role && !empresa.cargos.some(r => r.id === data.parent_role)) {
      throw new Error('El rol padre no existe en esta empresa.');
    }
    const updatedRoles = empresa.cargos.map(r =>
      r.id === roleId
        ? new Role(r.id, data.nombre, data.slug, data.parent_role, data.scope_role_template, data.elegible_encargado, data.estaciones_default, r.createdAt, new Date(), r.deletedAt)
        : r
    );
    await updateEmpresa(empresaId, { cargos: updatedRoles });
  }

  return {
    empresas,
    empresasTipo,
    congregaciones,
    activeEmpresa,
    activeTenantType,
    isCongregacion,
    listarEmpresas,
    createEmpresa,
    updateEmpresa,
    softDeleteEmpresa,
    addWorkRole,
    updateWorkRole,
    removeWorkRole,
  };
});
