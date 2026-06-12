// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC0BmaznBnndak-buCDGz6AMtXXBhe62eM",
  authDomain: "programa-predicacion.firebaseapp.com",
  projectId: "programa-predicacion",
  storageBucket: "programa-predicacion.firebasestorage.app",
  messagingSenderId: "795539829994",
  appId: "1:795539829994:web:dac2c03744dde3f6f65393",
  measurementId: "G-G3WL2164MG"
};

// Inicializar Firebase
export const firebaseApp = initializeApp(firebaseConfig);

// Exportar instancias de los servicios para usarlas en la app
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);
export const functions = getFunctions(firebaseApp, 'southamerica-west1'); // O la región de tu preferencia
