import { ref, computed, watch } from 'vue';
import type { Ref } from 'vue';
import type { Empresa } from '../models/Empresa';

const PAGE_SIZE = 5;

export function useOrgTable(source: Ref<Empresa[] | null | undefined>) {
  const search = ref('');
  const page = ref(1);

  const filtered = computed(() => {
    const q = search.value.trim().toLowerCase();
    const list = source.value ?? [];
    if (!q) return list;
    return list.filter(e => {
      const name  = (e.contacto?.first_name ?? '').toLowerCase();
      const razon = (e.contacto?.last_name  ?? '').toLowerCase();
      const email = (e.contacto?.email      ?? '').toLowerCase();
      const rut   = (e.contacto?.rut        ?? '').toLowerCase();
      const slug  = (e.slug                 ?? '').toLowerCase();
      return name.includes(q) || razon.includes(q) || email.includes(q) || rut.includes(q) || slug.includes(q);
    });
  });

  // Resetear página al buscar
  watch(search, () => { page.value = 1; });

  const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)));

  const paginated = computed(() => {
    const start = (page.value - 1) * PAGE_SIZE;
    return filtered.value.slice(start, start + PAGE_SIZE);
  });

  function prev() { if (page.value > 1) page.value--; }
  function next() { if (page.value < totalPages.value) page.value++; }
  function goTo(n: number) { page.value = Math.min(Math.max(1, n), totalPages.value); }

  return { search, page, totalPages, filtered, paginated, prev, next, goTo };
}
