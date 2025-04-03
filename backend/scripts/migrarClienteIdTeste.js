// scripts/migrarTodosServidores.js
import admin from 'firebase-admin';
import { initializeFirebase } from '../services/firebaseService.js';

initializeFirebase();

const db = admin.firestore();
const servidorIdDefault = 'servidor_unidade_1';

async function migrarTodosServidores() {
  try {
    const snapshot = await db.collection('servidores').get();

    if (snapshot.empty) {
      console.log('⚠️ Nenhum servidor encontrado.');
      return;
    }

    let atualizados = 0;

    const batch = db.batch();

    snapshot.docs.forEach((doc) => {
      const dados = doc.data();

      if (!dados.servidorId) {
        const ref = doc.ref;
        batch.update(ref, { servidorId: servidorIdDefault });
        atualizados++;
      }
    });

    await batch.commit();

    console.log(
      `✅ Migração concluída: ${atualizados} servidores atualizados com "servidorId".`
    );
  } catch (error) {
    console.error('❌ Erro ao migrar:', error);
  }
}

migrarTodosServidores();
