import { defineStore } from 'pinia';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { Disponibilidad } from '../models/Empleado';

// La disponibilidad es un objeto embebido en el documento del empleado.
// Este store provee helpers para escribir/borrar ese campo sin reimplementar
// la lógica de lectura (que ya gestiona empleadoStore con useCollection).
export const useDisponibilidadStore = defineStore('disponibilidad', () => {

  async function setDisponibilidad(empleadoId: string, data: Omit<Disponibilidad, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    const disponibilidad: Disponibilidad = {
      id: crypto.randomUUID(),
      days: data.days,
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

  async function updateDisponibilidad(empleadoId: string, data: Partial<Omit<Disponibilidad, 'id' | 'createdAt' | 'deletedAt'>>) {
    const docRef = doc(db, 'empleados', empleadoId);
    const patch: Record<string, any> = { updatedAt: Timestamp.now() };
    for (const [key, value] of Object.entries(data)) {
      patch[`disponibilidad.${key}`] = value;
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
