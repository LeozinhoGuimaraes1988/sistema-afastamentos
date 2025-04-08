import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCnYLc1JzcqA6NYEvgBpQh0g-9N7mbyhcE',
  authDomain: 'gestaoafastamentos.firebaseapp.com',
  projectId: 'gestaoafastamentos',
  storageBucket: 'gestaoafastamentos.appspot.com',
  messagingSenderId: '659167029343',
  appId: '1:659167029343:web:6cac0a85279d270edd13ea',
  measurementId: 'G-XST36V402C',
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app); // Inicialize o módulo de autenticação

if (typeof window !== 'undefined') {
  window.firebaseAuth = auth;
}

export { db, auth }; // Exporte o auth para usá-lo no login e registro
