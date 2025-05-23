import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';



// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app); // Inicialize o módulo de autenticação

if (typeof window !== 'undefined') {
  window.firebaseAuth = auth;
}

export { db, auth }; // Exporte o auth para usá-lo no login e registro
