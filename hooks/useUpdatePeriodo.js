import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useState } from 'react';
import { db } from '../firebase/config';

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
  const handleSave = async (servidorId, updatePeriods) => {
    try {
      const servidorRef = doc(db, 'servidores', servidorId);
      const servidorSnap = await getDoc(servidorRef);

      if (servidorSnap.exists()) {
        // Certifique-se de que os períodos não têm arrays aninhados
        const sanitizedPeriods = updatePeriods.map((periodo) => ({
          ...periodo,
          // Remova qualquer campo que possa conter arrays aninhados ou outros dados inválidos
          dataInicio: periodo.dataInicio || '',
          dataFim: periodo.dataFim || '',
        }));

        await updateDoc(servidorRef, { periodos: sanitizedPeriods });
        setShowModal(false);
        console.log('Período atualizado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar período: ', error);
    }
  };

  // Função para selecionar um período para edição
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
