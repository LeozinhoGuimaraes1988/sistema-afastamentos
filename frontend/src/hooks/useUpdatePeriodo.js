import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/config';
import { logAlteracao } from '../services/logService';

export const useUpdatePeriodo = () => {
  const [showModal, setShowModal] = useState(false);
  const [currentPeriods, setCurrentPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  // Função para abrir o modal com os períodos
  const handleEdit = async (servidorId) => {
    try {
      const servidorRef = doc(db, 'servidores', servidorId);
      const servidorSnap = await getDoc(servidorRef);

      if (servidorSnap.exists()) {
        const periodos = servidorSnap.data().periodos || [];
        setCurrentPeriods(periodos);
        setShowModal(true);
      } else {
        console.log('Servidor não encontrado.');
      }
    } catch (error) {
      console.error('Erro ao buscar períodos: ', error);
    }
  };

  // Função para salvar as edições do período
  const handleSave = async (
    servidorId,
    updatePeriods,
    nomeServidor,
    setShowModal
  ) => {
    try {
      const servidorRef = doc(db, 'servidores', servidorId);
      const servidorSnap = await getDoc(servidorRef);

      if (servidorSnap.exists()) {
        const oldPeriods = servidorSnap.data().periodos || [];

        const sanitizedPeriods = updatePeriods.map((periodo) => ({
          ...periodo,
          dataInicio: periodo.dataInicio || '',
          dataFim: periodo.dataFim || '',
        }));

        await updateDoc(servidorRef, { periodos: sanitizedPeriods });

        // Geração dos detalhes do log
        const detalhes = sanitizedPeriods
          .map((novo, index) => {
            const antigo = oldPeriods[index];
            const dataAntigaInicio = formatarData(antigo?.dataInicio);
            const dataAntigaFim = formatarData(antigo?.dataFim);
            const dataNovaInicio = formatarData(novo?.dataInicio);
            const dataNovaFim = formatarData(novo?.dataFim);

            if (
              dataAntigaInicio !== dataNovaInicio ||
              dataAntigaFim !== dataNovaFim
            ) {
              return `Período alterado de ${dataAntigaInicio} a ${dataAntigaFim} para ${dataNovaInicio} a ${dataNovaFim}`;
            }
            return null;
          })
          .filter(Boolean)
          .join(' | ');

        // Obtém o usuário atual
        const auth = getAuth();
        const user = auth.currentUser;
        await user?.getIdToken(true); // Garante claims atualizadas

        await logAlteracao('férias', 'atualizou', detalhes, user);

        setShowModal(false);
        console.log('Período atualizado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar período: ', error);
    }
  };

  // Função auxiliar para formatar datas em DD/MM/AAAA
  const formatarData = (data) => {
    if (!data) return '';

    // Se a data vier como string no formato 'YYYY-MM-DD'
    if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
      const [ano, mes, dia] = data.split('-');
      return `${dia}/${mes}/${ano}`;
    }

    // Se for Timestamp ou Date
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR');
  };

  const selectPeriodToEdit = (periodoId) => {
    const periodToEdit = currentPeriods.find(
      (periodo) => periodo.id === periodoId
    );
    setSelectedPeriod(periodToEdit);
  };

  return {
    showModal,
    currentPeriods,
    selectedPeriod,
    handleEdit,
    handleSave,
    selectPeriodToEdit,
    setShowModal,
  };
};
