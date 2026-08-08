import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// logService.js
export const registrarLog = async ({ usuario, acao, tipo, detalhes }) => {
  try {
    await addDoc(collection(db, 'logs'), {
      usuario: usuario?.displayName || usuario?.email || 'Usuário desconhecido',
      uid: usuario?.uid || '',
      tipo,
      acao,
      detalhes,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Erro ao registrar log:', error);
  }
};

export const logAlteracao = async (tipo, acao, detalhes, usuario) => {
  await registrarLog({
    usuario,
    tipo,
    acao,
    detalhes,
  });
};
