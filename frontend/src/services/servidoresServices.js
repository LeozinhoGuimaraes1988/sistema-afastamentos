import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

// 🔁 Função principal de paginação
export const getServidoresPaginado = async (
  limitePorPagina = 5,
  ultimoDoc = null
) => {
  try {
    const servidoresRef = collection(db, 'servidores');
    let queryServidores;

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
    const servidoresUnicos = new Map();

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const matricula = data.matricula;

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

// ✅ Função para adicionar servidor com períodos de férias
export const adicionarServidor = async (dados, servidorId) => {
  const ref = collection(db, 'servidores');

  const periodosFormatados = dados.periodos.map((p) => ({
    dataInicio: Timestamp.fromDate(new Date(p.dataInicio)),
    dataFim: Timestamp.fromDate(new Date(p.dataFim)),
  }));

  const servidor = {
    nome: dados.nome,
    matricula: dados.matricula,
    cargo: dados.cargo,
    lotacao: dados.lotacao,
    servidorId,
    periodos: periodosFormatados,
  };

  const docRef = await addDoc(ref, servidor);
  return docRef.id;
};
