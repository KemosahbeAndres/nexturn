import { defineStore } from 'pinia';
import { useCollection } from 'vuefire';
import { collection, doc, setDoc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase'; // Ajusta a la ruta de tu instancia
import { Contacto, contactoConverter } from '../models/Contacto';

export const useContactoStore = defineStore('contacto', () => {
  const contactosRef = collection(db, 'contactos').withConverter(contactoConverter);
  const contactosQuery = query(contactosRef, where('deletedAt', '==', null));
  const contactos = useCollection(contactosQuery);

  // CREATE
  async function createContacto(data: Omit<Contacto, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    const docRef = doc(contactosRef);
    const newContacto = new Contacto(
      docRef.id,
      data.first_name,
      data.last_name,
      data.rut,
      data.email,
      data.phone,
      data.address,
      data.is_company,
      data.active
    );
    
    await setDoc(docRef, newContacto);
    return docRef.id;
  }

  // UPDATE
  async function updateContacto(id: string, updateData: Partial<Omit<Contacto, 'id' | 'createdAt' | 'deletedAt'>>) {
    const docRef = doc(contactosRef, id);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: Timestamp.now()
    });
  }

  // SOFT DELETE
  async function softDeleteContacto(id: string) {
    const docRef = doc(contactosRef, id);
    await updateDoc(docRef, {
      active: false,
      deletedAt: Timestamp.now()
    });
  }

  return { contactos, createContacto, updateContacto, softDeleteContacto };
});