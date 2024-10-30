import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '../firebase/config';

// const db = getFirestore(app);

// criando referência para a coleção 'servidores' no Firestore
const servidoresCollection = collection(db, 'servidores');

// função para adicionar servidores
export const addServidor = async (servidorData) => {
  try {
    // Evitar inserir servidor em duplicidade
    const servidorExistente = await getDocs(servidoresCollection);
    let servidorDuplicado = false;

    servidorExistente.forEach((doc) => {
      if (doc.data().matricula === servidorData.matricula) {
        console.log('Servidor já existe');
        servidorDuplicado = false;
      }
    });

    if (servidorDuplicado) {
      return null;
    }

    // Se não houver duplicidade, adicionar o novo servidor
    const docRef = await addDoc(servidoresCollection, servidorData);

    console.log('Servidor adicionado com sucesso!', docRef.id);
    return docRef; // retorna a referência do documento criado
  } catch (error) {
    console.error('Erro ao adicionar servidor: ', error);
    throw error; // relança o erro para ser tratado na camada superior
  }
};

// função para recuperar servidores
export const getServidores = async () => {
  const querySnapshot = await getDocs(servidoresCollection);
  const servidores = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  return servidores;
};

// função para excluir um servidor
export const deleteServidor = async (id) => {
  try {
    const servidorDoc = doc(db, 'servidores', id);
    await deleteDoc(servidorDoc);
    console.log('Servidor excluído com sucesso!');
  } catch (error) {
    console.error('Erro ao excluir servidor: ', error);
  }
};

// função para editar um servidor
export const updateServidor = async (id, updatedData) => {
  try {
    const servidorDoc = doc(db, 'servidores', id);
    await updateDoc(servidorDoc, updatedData);
    console.log('Servidor atualizado com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar servidor: ', error);
  }
};

/*
INÍCIO DE CÓDIGOS RELACIONADOS ÀS DATAS
*/

// função para verificar sobreposição de períodos
const verificarSobreposicao = async (servidorId, novoPeriodo, tipo) => {
  const servidorRef = doc(db, 'servidores', servidorId);
  const periodosCollection = collection(servidorRef, tipo);
  const querySnapshot = await getDocs(periodosCollection);

  for (const doc of querySnapshot.docs) {
    const periodo = doc.data();
    const inicioExistente = new Date(periodo.dataInicio);
    const fimExistente = new Date(periodo.dataFim);
    const inicioNovo = new Date(novoPeriodo.dataInicio);
    const fimNovo = new Date(novoPeriodo.dataFim);

    if (
      (inicioNovo >= inicioExistente && inicioNovo <= fimExistente) ||
      (fimNovo >= inicioExistente && fimNovo <= fimExistente) ||
      (inicioNovo <= inicioExistente && fimNovo >= fimExistente)
    ) {
      throw new Error('Há uma sobreposição de períodos para este servidor.');
    }
  }
};

export const fetchFerias = async (servidorId) => {
  try {
    const feriasRef = collection(db, 'servidores', servidorId, 'ferias');
    const snapshot = await getDocs(feriasRef);

    if (snapshot.empty) {
      console.log('Nenhum período de férias encontrado para este servidor.');
      return [];
    }

    const ferias = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return ferias;
  } catch (error) {
    console.error('Erro ao buscar períodos de férias:', error);
    return [];
  }
};

// função para adicionar período de férias
export const addFerias = async (servidorId, feriasData) => {
  try {
    // Certifique-se de que servidorId seja válido
    if (!servidorId) {
      throw new Error('ID do servidor inválido ou não fornecido.');
    }
    const servidorRef = doc(db, 'servidores', servidorId);

    // Verifica sobreposição de períodos
    await verificarSobreposicao(servidorId, feriasData, 'ferias');

    // Adiciona o período de férias no array de 'periodos'
    await updateDoc(servidorRef, {
      periodos: arrayUnion({
        tipo: 'ferias',
        ...feriasData,
      }),
    });

    console.log('Período de férias adicionado com sucesso!');
  } catch (error) {
    console.error('Erro ao adicionar período de férias: ', error);
  }
};

// função para validar a quantidade de dias de férias
// const validarDiasFerias = (dias) => {
//   const regrasValidas = [[30], [15, 15], [10, 20], [20, 10], [10, 10, 10]];
//   return regrasValidas.some(
//     (regra) => regra.reduce((acc, curr) => acc + curr, 0) === dias
//   );
// };

// função para adicionar e validar período de férias
export const addVerifyFerias = async (servidorId, feriasData) => {
  const { dias } = feriasData;
  // extraindo a propriedade 'dias' de 'feriasData'

  // validação das regras
  if (!validarDiasFerias(dias)) {
    // throw: Esse comando indica que você está lançando uma exceção.
    // new: Usado para criar uma nova instância de um objeto.
    throw new Error(
      'A divisão dos dias de férias é inválida. Por favor, tente novamente.'
    );
  }

  await verificarSobreposicao(servidorId, feriasData, 'ferias');

  try {
    const servidorRef = doc(db, 'servidores', servidorId);
    const feriasCollection = collection(servidorRef, 'ferias');
    await addDoc(feriasCollection, feriasData);
    console.log('Período de férias adicionado com sucesso!');
  } catch (error) {
    console.error('Erro ao adicionar período de férias: ', error);
  }
};

// Função para adicionar abono diretamente no array `periodos` do documento do servidor
export const addAbono = async (servidorId, abonos) => {
  try {
    const servidorRef = doc(db, 'servidores', servidorId);

    // Formata os abonos para incluir `tipo: 'abono'`
    const abonosFormatados = abonos.map((abono) => ({
      tipo: 'abono',
      data: abono.data,
    }));

    // Atualiza o array `periodos` no documento do servidor, mantendo períodos existentes
    await updateDoc(servidorRef, {
      periodos: arrayUnion(...abonosFormatados), // Adiciona cada abono ao array `periodos`
    });

    console.log('Abonos adicionados diretamente no array de períodos!');
  } catch (error) {
    console.error('Erro ao adicionar abonos:', error);
  }
};

export const addLicencaPremio = async (servidorId, licencaPremioData) => {
  try {
    const servidorRef = doc(db, 'servidores', servidorId);

    // Formata o objeto da licença-prêmio com o tipo correto
    const licencaPremio = {
      tipo: 'licenca-premio',
      dataInicio: licencaPremioData.dataInicio,
      dataFim: licencaPremioData.dataFim,
    };

    // Usa arrayUnion para adicionar o novo período sem sobrescrever
    await updateDoc(servidorRef, {
      periodos: arrayUnion(licencaPremio),
    });

    console.log('Licença-prêmio adicionada diretamente no array de períodos!');
  } catch (error) {
    console.error('Erro ao adicionar licença-prêmio:', error);
  }
};

// função para adicionar período de licença médica
export const addLicencaMedica = async (servidorId, licencaMedicaData) => {
  try {
    const licencaMedicaCollection = collection(
      doc(db, 'servidores', servidorId),
      'licencasMedicas'
    );
    await addDoc(licencaMedicaCollection, licencaMedicaData);
    console.log('Período de licença médica adicionado com sucesso');
  } catch (error) {
    console.error('Erro ao adicionar período de licença médica: ', error);
  }
};