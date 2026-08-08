import { collection, addDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Corrija a exportação para usar o nome correto
export const useAddPeriodo = () => {
  const addPeriodo = async (newPeriodo, servidorId) => {
    try {
      if (!servidorId) throw new Error('ID do servidor não fornecido.');

      const periodoCollectionRef = collection(
        db,
        'servidores',
        servidorId.toString(), // Converter para string se não for
        'periodos'
      );
      await addDoc(periodoCollectionRef, newPeriodo);
      console.log('Período adicionado com sucesso!');
    } catch (error) {
      console.log('Erro ao adicionar período: ', error);
    }
  };
  return { addPeriodo };
};
