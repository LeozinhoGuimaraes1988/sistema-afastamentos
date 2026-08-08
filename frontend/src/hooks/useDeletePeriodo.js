import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useDeletePeriodo = () => {
  const deletePeriodo = async (periodoId, servidorId) => {
    try {
      const periodoRef = doc(
        db,
        'servidores',
        servidorId,
        'periodos',
        periodoId
      );
      await deleteDoc(periodoRef);
      console.log('Periodo deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar periodo:', error);
    }
  };
  return { deletePeriodo };
};
