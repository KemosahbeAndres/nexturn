import { defineStore } from 'pinia';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { Disponibilidad, VentanaDisponibilidad } from '../models/Empleado';

// Orden canónico de días, para mantener `days` ordenado de forma estable.
const DIAS_ORDEN = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// `days` se deriva siempre de las ventanas: días únicos con al menos una ventana.
function diasDesdeVentanas(ventanas: VentanaDisponibilidad[]): string[] {
  const set = new Set(ventanas.map(v => v.day_of_week));
  return DIAS_ORDEN.filter(d => set.has(d));
}

// La disponibilidad es un objeto embebido en el documento del empleado.
// Este store provee helpers para escribir/borrar ese campo sin reimplementar
// la lógica de lectura (que ya gestiona empleadoStore con useCollection).
export const useDisponibilidadStore = defineStore('disponibilidad', () => {

  async function setDisponibilidad(empleadoId: string, data: Omit<Disponibilidad, 'id' | 'days' | 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    const ventanas = data.ventanas ?? [];
    const disponibilidad: Disponibilidad = {
      id: crypto.randomUUID(),
      ventanas,
      days: diasDesdeVentanas(ventanas),
      monthly_frequency: data.monthly_frequency,
      weekly_frequency: data.weekly_frequency,
      special_rule: data.special_rule,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    const docRef = doc(db, 'empleados', empleadoId);
    await updateDoc(docRef, {
      disponibilidad: {
        ...disponibilidad,
        createdAt: Timestamp.fromDate(disponibilidad.createdAt!),
        updatedAt: Timestamp.now(),
        deletedAt: null,
      },
      updatedAt: Timestamp.now(),
    });
  }

  async function updateDisponibilidad(empleadoId: string, data: Partial<Omit<Disponibilidad, 'id' | 'days' | 'createdAt' | 'deletedAt'>>) {
    const docRef = doc(db, 'empleados', empleadoId);
    const patch: Record<string, any> = { updatedAt: Timestamp.now() };
    for (const [key, value] of Object.entries(data)) {
      patch[`disponibilidad.${key}`] = value;
    }
    // Si cambian las ventanas, recomputar `days` para mantener la UI consistente.
    if (data.ventanas) {
      patch['disponibilidad.days'] = diasDesdeVentanas(data.ventanas);
    }
    patch['disponibilidad.updatedAt'] = Timestamp.now();
    await updateDoc(docRef, patch);
  }

  async function clearDisponibilidad(empleadoId: string) {
    const docRef = doc(db, 'empleados', empleadoId);
    await updateDoc(docRef, { disponibilidad: null, updatedAt: Timestamp.now() });
  }

  return {
    setDisponibilidad,
    updateDisponibilidad,
    clearDisponibilidad,
  };
});
