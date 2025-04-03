import admin from 'firebase-admin';
import serviceAccount from '../firebaseServiceAccountKey.json' assert { type: 'json' };

let db;
let auth;

export function initializeFirebase() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin inicializado');

    // Só define db e auth após inicialização
    db = admin.firestore();
    auth = admin.auth();
  }
}

// Exporta só depois de inicializar
export { db, auth };
