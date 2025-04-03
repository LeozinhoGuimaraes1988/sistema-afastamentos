import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Função principal de paginação
export const getServidoresPaginado = async (
  limitePorPagina = 5,
  ultimoDoc = null
) => {
  try {
    const servidoresRef = collection(db, 'servidores');
    let queryServidores;

    // Mantemos orderBy('nome') para garantir consistência na ordem
    if (ultimoDoc) {
      queryServidores = query(
        servidoresRef,
        orderBy('nome'),
        startAfter(ultimoDoc),
        limit(limitePorPagina * 5)
      );
    } else {
      queryServidores = query(
        servidoresRef,
        orderBy('nome'),
        limit(limitePorPagina * 5)
      );
    }

    const snapshot = await getDocs(queryServidores);

    // Remove duplicatas usando matrícula como chave única
    const servidoresUnicos = new Map();

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const matricula = data.matricula;

      // Só adiciona se a matrícula não existir ou se for um registro mais recente
      if (
        !servidoresUnicos.has(matricula) ||
        servidoresUnicos.get(matricula).nome.localeCompare(data.nome, 'pt-BR') >
          0
      ) {
        servidoresUnicos.set(matricula, {
          id: doc.id,
          ...data,
        });
      }
    });

    // Converte o Map para array e ordena corretamente
    const servidores = Array.from(servidoresUnicos.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome, 'pt-BR', {
        sensitivity: 'base',
        ignorePunctuation: true,
      })
    );

    return {
      servidores,
      ultimoDocumentoDaPagina: snapshot.docs[snapshot.docs.length - 1],
      temMais: snapshot.size === limitePorPagina * 5,
    };
  } catch (error) {
    console.error('Erro ao buscar servidores:', error);
    throw error;
  }
};
